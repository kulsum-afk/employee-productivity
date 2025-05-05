require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Usermodel = require("./models/users");
const Taskmodel = require("./models/tasks");
const multer = require("multer");
const path = require("path");
const nodemailer = require("nodemailer");

const app = express();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Specify folder for uploads
  },
  filename: (req, file, cb) => {
    const email = req.body.email
      ? req.body.email.replace(/[^a-zA-Z0-9]/g, "")
      : "default"; // Sanitize email
    cb(null, `${email}.jpg`); // Save file as email.jpg
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 50 },
});

app.use(express.json());
app.use(cors());
app.use(express.static("uploads"));
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL,
    pass: process.env.GPASS,
  },
});

// Register route to handle image upload and user registration
app.post("/register", upload.single("image"), async (req, res) => {
  const {
    email,
    username,
    password,
    department,
    semester,
    subjects,
    description,
    role,
  } = req.body;
  const image = req.file ? req.file.path : null;

  if (
    !email ||
    !username ||
    !password ||
    !department ||
    !semester ||
    !subjects ||
    !description
  ) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  try {
    const user = await Usermodel.findOne({ email });
    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await Usermodel.create({
        email,
        username,
        password: hashedPassword,
        department,
        semester,
        subjects,
        description,
        role,
        image,
      });
      res.json({
        success: true,
        message: "User registered successfully",
        user: newUser,
      });
    } else {
      res.json({ success: false, message: "User already exists" });
    }
  } catch (err) {
    console.error("Error during registration:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// Employee list route (authentication required)
app.get("/employees", authenticateToken, async (req, res) => {
  try {
    const employees = await Usermodel.find(
      {},
      "email username department role subjects semester description"
    );
    res.json({ success: true, employees });
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// Login route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await Usermodel.findOne({ email });
    if (user) {
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (passwordMatch) {
        const accessToken = generateAccessToken(user);
        res.json({ accessToken });
      } else {
        res.json({ success: false, message: "Incorrect password" });
      }
    } else {
      res.json({ success: false, message: "User not found" });
    }
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// Dashboard route (authentication required)
app.get("/dashboard", authenticateToken, async (req, res) => {
  try {
    const email = req.user.email;
    const user = await Usermodel.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const allTasks = await Taskmodel.find().sort({ deadline: -1 });

    res.json({
      success: true,
      userInfo: {
        username: user.username,
        email: user.email,
        department: user.department,
        semester: user.semester,
        subjects: user.subjects,
        description: user.description,
        role: user.role,
      },
      tasks: allTasks,
    });
  } catch (error) {
    console.error("Error fetching user data or tasks:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// Task creation route (authentication required)
app.post("/task", authenticateToken, async (req, res) => {
  const { taskdata, assignedby, assignedto, deadline, status } = req.body;
  const email = req.user.email;

  try {
    if (assignedby !== email) {
      return res
        .status(403)
        .json({ message: "Not authorized to create this task" });
    }

    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate)) {
      return res.status(400).json({ message: "Invalid deadline format" });
    }

    // Create tasks for each assignedto if multiple employees are specified
    const assignedToArray = Array.isArray(assignedto)
      ? assignedto
      : [assignedto];
    const createdTasks = [];

    for (const employee of assignedToArray) {
      const newTask = await Taskmodel.create({
        taskdata,
        assignedby,
        assignedto: employee,
        deadline: deadlineDate,
        status,
      });
      createdTasks.push(newTask);

      // Send email to the assigned employee
      const mailOptions = {
        from: "kumaradarshh5@gmail.com",
        to: employee, // Assuming assignedto contains email addresses
        subject: "New Task Assigned",
        text: `Hello,\n\nYou have been assigned a new task: "${taskdata}".\nBy: "${assignedby}"\nDeadline: ${deadlineDate.toLocaleDateString()}.\n\nBest regards,\nTask Management Team,`
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending email:", error);
        } else {
          console.log("Email sent:", info.response);
        }
      });
    }

    res
      .status(201)
      .json({ message: "Tasks created successfully", tasks: createdTasks });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Task update route (authentication required)
app.put("/task/:id", authenticateToken, async (req, res) => {
  const taskId = req.params.id;
  const { taskdata, assignedby, assignedto, deadline, status } = req.body;
  const email = req.user.email;

  try {
    const task = await Taskmodel.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const deadlineDate = deadline ? new Date(deadline) : task.deadline;

    if (deadline && isNaN(deadlineDate)) {
      return res.status(400).json({ message: "Invalid deadline format" });
    }

    task.taskdata = taskdata || task.taskdata;
    task.assignedby = assignedby || task.assignedby;
    task.assignedto = assignedto || task.assignedto;
    task.deadline = deadlineDate;
    task.status = status || task.status;

    await task.save();
    res.json({ message: "Task updated successfully", task });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Task deletion route (authentication required)
app.delete("/task/:id", authenticateToken, async (req, res) => {
  const taskId = req.params.id;
  const email = req.user.email;

  try {
    const task = await Taskmodel.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    await Taskmodel.findByIdAndDelete(taskId);
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// JWT utility functions
function generateAccessToken(user) {
  const payload = {
    id: user._id,
    email: user.email,
  };
  const secret = process.env.ACCESS_TOKEN_SECRET;

  return jwt.sign(payload, secret);
}

function verifyAccessToken(token) {
  const secret = process.env.ACCESS_TOKEN_SECRET;

  try {
    const decoded = jwt.verify(token, secret);
    return { success: true, data: decoded };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.sendStatus(401);
  }

  const result = verifyAccessToken(token);
  if (!result.success) {
    return res.sendStatus(403);
  }

  req.user = result.data;
  next();
}

// Connect to MongoDB and start the server
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(3000, () => {
      console.log("Server is online...");
    });
  })
  .catch((err) => console.error(err));
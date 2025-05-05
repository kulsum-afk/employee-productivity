const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  taskdata: String,
  assignedby: String,
  assignedto: String, // Array of assigned users
  deadline: Date,
  createdAt: {
    type: Date,
    default: new Date(),
  },
  status: { type: String, default: "Pending" }, // Pending/Done
});

module.exports = mongoose.model("Task", TaskSchema);

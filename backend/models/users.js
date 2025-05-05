const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  department: String,
  semester: String,
  subjects: [String],
  description: String,
  role: { type: String, enum: ["admin", "user"], default: "user" },
});

const Usermodel = mongoose.model("User", UserSchema);
module.exports = Usermodel;

import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, required: true },

  verified: { type: Boolean, default: false },
  avatar: { type: String },
  profilePicture: { type: String },

  otp: { type: String },
  otpExpires: { type: Date }
}, { timestamps: true });

export default mongoose.model("User", userSchema);

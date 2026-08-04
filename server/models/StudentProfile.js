import mongoose from "mongoose";

const studentProfileSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    unique: true 
  },
  grade: { type: String, required: true },
  stream: { type: String, required: true },
  interests: [{ type: String }],
  strongSubjects: [{ type: String }],
  age: { type: Number, required: true },
  location: { type: String, required: true },
  tenthPercent: { type: Number, required: true },
  twelfthPercent: { type: Number }, // optional
  budgetRange: { type: String, required: true },
  studyMode: { type: String, required: true },
  preferredStudyLocation: { type: String, required: true },
  openToScholarshipOrLoan: { type: String, enum: ["Yes", "No"], required: true },
  competitiveExams: [{ type: String }],
  careerGoals: { type: String },
  hobbies: [{ type: String }],
  profileCompleted: { type: Boolean, default: false },
  avatar: { type: String },
  profilePicture: { type: String },
  embedding: { type: [Number] } 
}, { timestamps: true });

export default mongoose.model("StudentProfile", studentProfileSchema);

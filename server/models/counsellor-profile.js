import mongoose from "mongoose"

const counsellorProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    professionalTitle: {
      type: String,
      default: "",
    },

    specialization: {
      type: String,
      required: true,
    },

    expertise: [
      {
        type: String,
        trim: true,
      },
    ],

    experience: {
      type: Number,
      default: 0,
    },

    qualifications: [
      {
        degree: String,
        institution: String,
        year: Number,
      },
    ],

    languages: [
      {
        type: String,
        trim: true,
      },
    ],

    location: {
      type: String,
      default: "",
    },

    phoneNumber: {
      type: String,
      default: "",
    },

    bio: {
      type: String,
      default: "",
    },

    verified: {
      type: Boolean,
      default: false,
    },

    profileCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
)

export default mongoose.model("CounsellorProfile", counsellorProfileSchema)

import mongoose from "mongoose"

const serviceSchema = new mongoose.Schema(
  {
    counsellorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    topics: {
      type: [String],
      default: [],
    },
    mode: {
      type: String,
      enum: ["video", "voice"],
      default: "video",
    },
    duration: {
      type: Number,
      default: 45,
    },
    price: {
      type: Number,
      default: 0,
    },
    status: {
      type: Boolean,
      default: true,
    },
    bookings: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
)

export default mongoose.model("Service", serviceSchema)

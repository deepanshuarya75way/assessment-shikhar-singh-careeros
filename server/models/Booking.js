import mongoose from "mongoose"

const serviceSnapshotSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
    },
    mode: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
)

const bookingSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    counsellorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
      index: true,
    },
    scheduledDate: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, "scheduledDate must be in YYYY-MM-DD format"],
      index: true,
    },
    startTime: {
      type: String,
      required: true,
      trim: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "startTime must be in HH:MM 24-hour format"],
    },
    endTime: {
      type: String,
      required: true,
      trim: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "endTime must be in HH:MM 24-hour format"],
    },
    serviceSnapshot: {
      type: serviceSnapshotSchema,
      required: true,
    },
    studentMessage: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: "",
    },
    status: {
      type: String,
      enum: ["PENDING_PAYMENT", "CONFIRMED", "COMPLETED", "CANCELLED", "EXPIRED", "NO_SHOW"],
      default: "PENDING_PAYMENT",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      default: "PENDING",
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    razorpayOrderId: {
      type: String,
      trim: true,
      index: true,
      default: null,
    },
    razorpayPaymentId: {
      type: String,
      trim: true,
      default: null,
    },
    razorpaySignature: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

bookingSchema.index({ studentId: 1, createdAt: -1 })
bookingSchema.index({ counsellorId: 1, status: 1, scheduledDate: 1 })
bookingSchema.index({ paymentStatus: 1, expiresAt: 1 })
bookingSchema.index({ razorpayOrderId: 1 }, { sparse: true })

bookingSchema.index(
  { counsellorId: 1, scheduledDate: 1, startTime: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["PENDING_PAYMENT", "CONFIRMED"] },
      paymentStatus: { $in: ["PENDING", "PAID"] },
    },
  }
)

bookingSchema.index({ counsellorId: 1, scheduledDate: 1, paymentStatus: 1, expiresAt: 1 })


export default mongoose.model("Booking", bookingSchema)





import crypto from "crypto"
import Razorpay from "razorpay"
import Booking from "../models/Booking.js"
import Service from "../models/Service.js"
import { createPendingBooking } from "./booking.service.js"

const buildError = (message, statusCode = 400) => {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

const getRazorpayClient = () => {
  const key_id = process.env.RAZORPAY_KEY_ID
  const key_secret = process.env.RAZORPAY_KEY_SECRET

  if (!key_id || !key_secret) {
    throw buildError("Razorpay credentials are not configured", 500)
  }

  return new Razorpay({ key_id, key_secret })
}

const toMinorUnits = (amount) => Math.round(Number(amount) * 100)

const buildExpectedSignature = ({ razorpayOrderId, razorpayPaymentId }) => {
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keySecret) {
    throw buildError("Razorpay credentials are not configured", 500)
  }

  return crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex")
}

export const createBookingPaymentOrder = async ({
  bookingId,
  serviceId,
  studentId,
  scheduledDate,
  scheduledTime,
  studentMessage,
  now = new Date(),
}) => {
  let booking = null

  if (bookingId) {
    booking = await Booking.findById(bookingId).lean()
    if (!booking) {
      throw buildError("Booking not found", 404)
    }

    if (booking.status !== "PENDING_PAYMENT" || booking.paymentStatus !== "PENDING") {
      throw buildError("Booking is no longer payable", 409)
    }
  } else {
    booking = await createPendingBooking({
      serviceId,
      studentId,
      scheduledDate,
      startTime: scheduledTime,
      studentMessage,
      now,
    })
  }

  const razorpay = getRazorpayClient()
  const amount = toMinorUnits(booking.serviceSnapshot?.price ?? 0)

  const order = await razorpay.orders.create({
    amount,
    currency: "INR",
    receipt: `booking_${booking._id}`,
    notes: {
      bookingId: String(booking._id),
      serviceId: String(booking.serviceId),
      studentId: String(booking.studentId),
    },
  })

  await Booking.findByIdAndUpdate(booking._id, {
    $set: {
      razorpayOrderId: order.id,
    },
  })

  return {
    bookingId: String(booking._id),
    amount,
    currency: order.currency,
    orderId: order.id,
    serviceSnapshot: booking.serviceSnapshot,
    scheduledDate: booking.scheduledDate,
    startTime: booking.startTime,
    endTime: booking.endTime,
  }
}

export const verifyAndConfirmBookingPayment = async ({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) => {
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw buildError("Missing Razorpay verification fields", 400)
  }

  const booking = await Booking.findOne({ razorpayOrderId })
  if (!booking) {
    throw buildError("Booking not found for this payment", 404)
  }

  if (booking.status !== "PENDING_PAYMENT" || booking.paymentStatus !== "PENDING") {
    throw buildError("Booking is no longer payable", 409)
  }

  if (booking.expiresAt && new Date(booking.expiresAt).getTime() <= Date.now()) {
    await Booking.findByIdAndUpdate(booking._id, {
      $set: {
        status: "EXPIRED",
        paymentStatus: "FAILED",
      },
    })

    throw buildError("Booking has expired", 409)
  }

  const expectedSignature = buildExpectedSignature({ razorpayOrderId, razorpayPaymentId })

  if (expectedSignature !== razorpaySignature) {
    await Booking.findByIdAndUpdate(booking._id, {
      $set: {
        paymentStatus: "FAILED",
        status: "CANCELLED",
        razorpayPaymentId,
        razorpaySignature,
      },
    })

    throw buildError("Invalid payment signature", 400)
  }

  if (booking.paymentStatus === "PAID" && booking.status === "CONFIRMED") {
    return {
      bookingId: String(booking._id),
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      booking: booking.toObject(),
    }
  }

  const updatedBooking = await Booking.findByIdAndUpdate(booking._id, {
    $set: {
      status: "CONFIRMED",
      paymentStatus: "PAID",
      razorpayPaymentId,
      razorpaySignature,
    },
  }, { new: true })

  await Service.updateOne(
    { _id: updatedBooking.serviceId },
    { $inc: { bookings: 1 } }
  )

  return {
    bookingId: String(updatedBooking._id),
    status: "CONFIRMED",
    paymentStatus: "PAID",
    booking: updatedBooking.toObject(),
  }
}

export const markBookingPaymentFailed = async ({ bookingId }) => {
  if (!bookingId) {
    throw buildError("Missing bookingId", 400)
  }

  const booking = await Booking.findById(bookingId).lean()
  if (!booking) {
    throw buildError("Booking not found", 404)
  }

  if (booking.status === "CONFIRMED" || booking.paymentStatus === "PAID") {
    return {
      bookingId: String(booking._id),
      status: booking.status,
      paymentStatus: booking.paymentStatus,
    }
  }

  await Booking.findByIdAndUpdate(booking._id, {
    $set: {
      status: "CANCELLED",
      paymentStatus: "FAILED",
    },
  })

  return {
    bookingId: String(booking._id),
    status: "CANCELLED",
    paymentStatus: "FAILED",
  }
}

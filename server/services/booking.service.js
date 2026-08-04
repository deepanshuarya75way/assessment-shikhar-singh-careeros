import mongoose from "mongoose"
import Booking from "../models/Booking.js"
import Service from "../models/Service.js"
import CounsellorAvailability from "../models/CounsellorAvailability.js"
import { getAvailableSlots } from "./bookingAvailability.service.js"

const BOOKING_EXPIRES_IN_MINUTES = 10

const timeToMinutes = (value) => {
  if (typeof value !== "string") return null

  const [hours, minutes] = value.split(":").map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null

  return hours * 60 + minutes
}

const minutesToTime = (minutes) => {
  const safeMinutes = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60)
  const hours = Math.floor(safeMinutes / 60)
  const mins = safeMinutes % 60

  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`
}

const buildServiceSnapshot = (service) => ({
  title: service.title,
  duration: service.duration,
  mode: service.mode,
  price: service.price,
})

const buildError = (message, statusCode = 400) => {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

const buildConflictError = (message) => buildError(message, 409)

const getBookingBufferMinutes = (availability) => {
  const bufferMinutes = Number(availability?.bookingRules?.bufferMinutes ?? 15)
  return Number.isFinite(bufferMinutes) && bufferMinutes >= 0 ? bufferMinutes : 0
}

export const releasePendingBooking = async ({ bookingId, reason = "CANCELLED" }) => {
  if (!mongoose.isValidObjectId(bookingId)) {
    throw buildError("Invalid bookingId", 400)
  }

  const booking = await Booking.findById(bookingId)
  if (!booking) {
    throw buildError("Booking not found", 404)
  }

  if (booking.status !== "PENDING_PAYMENT") {
    return {
      bookingId: String(booking._id),
      status: booking.status,
      paymentStatus: booking.paymentStatus,
    }
  }

  booking.status = reason === "EXPIRED" ? "EXPIRED" : "CANCELLED"
  booking.paymentStatus = "FAILED"
  await booking.save()

  return {
    bookingId: String(booking._id),
    status: booking.status,
    paymentStatus: booking.paymentStatus,
  }
}

const getTimeRange = (startTime, durationMinutes) => {
  const startMinutes = timeToMinutes(startTime)
  if (startMinutes === null) {
    return null
  }

  const endMinutes = startMinutes + Number(durationMinutes)
  return {
    startMinutes,
    endMinutes,
    startTime,
    endTime: minutesToTime(endMinutes),
  }
}

const getBufferedRange = ({ startMinutes, endMinutes }, bufferMinutes) => ({
  startTime: minutesToTime(Math.max(0, startMinutes - bufferMinutes)),
  endTime: minutesToTime(Math.min(24 * 60 - 1, endMinutes + bufferMinutes)),
})

const hasValidTimeWindow = (startTime, endTime) => {
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = timeToMinutes(endTime)

  return startMinutes !== null && endMinutes !== null && startMinutes < endMinutes
}

const validateBookingPayload = ({ studentId, serviceId, scheduledDate, startTime }) => {
  if (!mongoose.isValidObjectId(studentId)) {
    throw buildError("Invalid studentId", 400)
  }

  if (!mongoose.isValidObjectId(serviceId)) {
    throw buildError("Invalid serviceId", 400)
  }

  if (typeof scheduledDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate)) {
    throw buildError("scheduledDate must be in YYYY-MM-DD format", 400)
  }

  if (typeof startTime !== "string" || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(startTime)) {
    throw buildError("startTime must be in HH:MM 24-hour format", 400)
  }
}

const getCounsellorAvailability = async (service) => {
  const availability = await CounsellorAvailability.findOne({ counsellorId: service.counsellorId }).lean()
  if (!availability) {
    throw buildError("Counsellor availability profile not found", 404)
  }

  return { availability }
}

const findOverlappingBooking = async ({ counsellorId, scheduledDate, startTime, endTime, now = new Date() }) =>
  Booking.findOne({
    counsellorId,
    scheduledDate,
    status: { $in: ["PENDING_PAYMENT", "CONFIRMED"] },
    paymentStatus: { $in: ["PENDING", "PAID"] },
    $or: [{ status: "CONFIRMED" }, { expiresAt: { $gt: now } }],
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  }).lean()

export async function createPendingBooking({
  studentId,
  serviceId,
  scheduledDate,
  startTime,
  studentMessage = "",
  now = new Date(),
}) {
  validateBookingPayload({ studentId, serviceId, scheduledDate, startTime })

  const service = await Service.findById(serviceId).lean()
  if (!service) {
    throw buildError("Service not found", 404)
  }

  const { availability } = await getCounsellorAvailability(service)

  const serviceDuration = Number(service.duration)
  if (!Number.isFinite(serviceDuration) || serviceDuration <= 0) {
    throw buildError("Service duration is invalid", 400)
  }

  const requestedRange = getTimeRange(startTime, serviceDuration)
  if (!requestedRange || !hasValidTimeWindow(requestedRange.startTime, requestedRange.endTime)) {
    throw buildError("Requested booking window is invalid", 400)
  }

  const bufferMinutes = getBookingBufferMinutes(availability)
  const bufferedRange = getBufferedRange(requestedRange, bufferMinutes)

  const availableSlots = await getAvailableSlots({
    serviceId,
    counsellorId: service.counsellorId,
    availability,
    serviceDuration,
    date: scheduledDate,
    now,
    timezone: availability.timezone || "Asia/Kolkata",
  })

  if (!availableSlots.includes(startTime)) {
    throw buildConflictError("Selected slot is no longer available")
  }

  const overlappingBooking = await findOverlappingBooking({
    counsellorId: service.counsellorId,
    scheduledDate,
    startTime: bufferedRange.startTime,
    endTime: bufferedRange.endTime,
    now,
  })

  if (overlappingBooking) {
    throw buildConflictError("Selected slot overlaps with an existing booking")
  }

  const expiresAt = new Date(now instanceof Date ? now.getTime() : Date.now())
  expiresAt.setMinutes(expiresAt.getMinutes() + BOOKING_EXPIRES_IN_MINUTES)

  return Booking.create({
    studentId,
    counsellorId: service.counsellorId,
    serviceId,
    scheduledDate,
    startTime,
    endTime: requestedRange.endTime,
    serviceSnapshot: buildServiceSnapshot(service),
    studentMessage: typeof studentMessage === "string" ? studentMessage.trim() : "",
    status: "PENDING_PAYMENT",
    paymentStatus: "PENDING",
    expiresAt,
  })
}

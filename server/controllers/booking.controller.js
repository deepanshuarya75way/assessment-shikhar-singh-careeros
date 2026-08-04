import { createPendingBooking, releasePendingBooking } from "../services/booking.service.js"

const createErrorResponse = (res, statusCode, message) =>
  res.status(statusCode).json({ success: false, message })

export const createBooking = async (req, res) => {
  try {
    const { serviceId, studentId, scheduledDate, scheduledTime, studentMessage } = req.body

    const booking = await createPendingBooking({
      serviceId,
      studentId,
      scheduledDate,
      startTime: scheduledTime,
      studentMessage,
    })

    return res.status(201).json({
      success: true,
      data: {
        bookingId: String(booking._id),
        amount: booking.serviceSnapshot?.price ?? 0,
        serviceSnapshot: booking.serviceSnapshot,
        scheduledDate: booking.scheduledDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
      },
    })
  } catch (error) {
    return createErrorResponse(
      res,
      error.statusCode || error.status || 500,
      error.message || "Failed to create booking"
    )
  }
}

export const releaseBooking = async (req, res) => {
  try {
    const { bookingId, reason } = req.body

    const payload = await releasePendingBooking({ bookingId, reason })

    return res.status(200).json({ success: true, data: payload })
  } catch (error) {
    return createErrorResponse(
      res,
      error.statusCode || error.status || 500,
      error.message || "Failed to release booking"
    )
  }
}
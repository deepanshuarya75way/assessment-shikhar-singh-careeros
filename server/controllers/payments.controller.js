import {
  createBookingPaymentOrder,
  verifyAndConfirmBookingPayment,
} from "../services/payment.service.js"

const createErrorResponse = (res, statusCode, message) =>
  res.status(statusCode).json({ success: false, message })

export const createOrder = async (req, res) => {
  try {
    const {
      bookingId,
      serviceId,
      studentId,
      scheduledDate,
      scheduledTime,
      studentMessage,
    } = req.body

    const payload = await createBookingPaymentOrder({
      bookingId,
      serviceId,
      studentId,
      scheduledDate,
      scheduledTime,
      studentMessage,
    })

    return res.status(201).json({
      success: true,
      ...payload,
    })
  } catch (error) {
    return createErrorResponse(
      res,
      error.statusCode || error.status || 500,
      error.message || "Failed to create payment order"
    )
  }
}

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

    const result = await verifyAndConfirmBookingPayment({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    })

    return res.status(200).json({
      success: true,
      ...result,
    })
  } catch (error) {
    return createErrorResponse(
      res,
      error.statusCode || error.status || 500,
      error.message || "Failed to verify payment"
    )
  }
}

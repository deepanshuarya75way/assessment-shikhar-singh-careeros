import Booking from "../models/Booking.js"

const CLEANUP_INTERVAL_MS = 60 * 1000

let cleanupTimer = null
let isRunning = false

const buildError = (message, statusCode = 500) => {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

export const expirePendingBookings = async (now = new Date()) => {
  const currentTime = now instanceof Date ? now : new Date(now)

  if (Number.isNaN(currentTime.getTime())) {
    throw buildError("Invalid cleanup timestamp")
  }

  const result = await Booking.updateMany(
    {
      status: "PENDING_PAYMENT",
      expiresAt: { $lt: currentTime },
    },
    {
      $set: {
        status: "EXPIRED",
        paymentStatus: "FAILED",
      },
    }
  )

  return {
    matchedCount: result.matchedCount ?? result.n ?? 0,
    modifiedCount: result.modifiedCount ?? result.nModified ?? 0,
  }
}

export const runBookingExpiryCleanup = async () => {
  if (isRunning) return null

  isRunning = true
  try {
    return await expirePendingBookings()
  } finally {
    isRunning = false
  }
}

export const startBookingExpiryCleanupService = () => {
  if (cleanupTimer) return cleanupTimer

  cleanupTimer = setInterval(() => {
    runBookingExpiryCleanup().catch((error) => {
      console.error("Booking expiry cleanup failed:", error)
    })
  }, CLEANUP_INTERVAL_MS)

  cleanupTimer.unref?.()

  runBookingExpiryCleanup().catch((error) => {
    console.error("Initial booking expiry cleanup failed:", error)
  })

  return cleanupTimer
}

export const stopBookingExpiryCleanupService = () => {
  if (!cleanupTimer) return

  clearInterval(cleanupTimer)
  cleanupTimer = null
}

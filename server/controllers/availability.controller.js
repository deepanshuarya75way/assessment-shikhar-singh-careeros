import mongoose from "mongoose"
import User from "../models/user.js"
import CounsellorAvailability from "../models/CounsellorAvailability.js"
import CounsellorProfile from "../models/counsellor-profile.js"
import {
  validateWeeklyDayPayload,
  validateBookingRulesPayload,
  validateDateOverridePayload,
  validateCopySchedulePayload,
  validateTimezonePayload,
  isValidObjectId,
} from "../middleware/availabilityValidation.js"
import {
  getAvailableDates,
  getAvailableSlots,
  getServiceAvailability,
} from "../services/bookingAvailability.service.js"

const WEEKDAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]

const getValidatedCounsellorUser = async (counsellorId) => {
  if (!isValidObjectId(counsellorId)) {
    const error = new Error("Invalid counsellorId")
    error.statusCode = 400
    throw error
  }

  const user = await User.findById(counsellorId).lean()
  if (!user) {
    const error = new Error("Counsellor user not found")
    error.statusCode = 404
    throw error
  }

  const profile = await CounsellorProfile.findOne({ userId: counsellorId }).lean()
  if (!profile) {
    const error = new Error("Counsellor profile not found")
    error.statusCode = 404
    throw error
  }

  return { user, profile }
}

const getAvailabilityDoc = async (counsellorId) => {
  await getValidatedCounsellorUser(counsellorId)

  const availability = await CounsellorAvailability.findOne({
    counsellorId: new mongoose.Types.ObjectId(counsellorId),
  }).lean()

  if (!availability) {
    return null
  }

  return availability
}

const ensureAvailabilityRecord = async (counsellorId) => {
  await getValidatedCounsellorUser(counsellorId)

  const existing = await CounsellorAvailability.findOne({
    counsellorId: new mongoose.Types.ObjectId(counsellorId),
  })
  if (existing) return existing

  const created = await CounsellorAvailability.create({
    counsellorId: new mongoose.Types.ObjectId(counsellorId),
    timezone: "Asia/Kolkata",
    weeklySchedule: {
      monday: { enabled: true, periods: [] },
      tuesday: { enabled: true, periods: [] },
      wednesday: { enabled: true, periods: [] },
      thursday: { enabled: true, periods: [] },
      friday: { enabled: true, periods: [] },
      saturday: { enabled: true, periods: [] },
      sunday: { enabled: true, periods: [] },
    },
  })

  return created
}

const createErrorResponse = (res, statusCode, message) =>
  res.status(statusCode).json({ success: false, message })

export const getAvailability = async (req, res) => {
  try {
    const { counsellorId } = req.params

    try {
      await getValidatedCounsellorUser(counsellorId)
    } catch (error) {
      return createErrorResponse(res, error.statusCode || 400, error.message || "Invalid counsellorId")
    }

    const availability = await getAvailabilityDoc(counsellorId)
    if (!availability) {
      const seededAvailability = await ensureAvailabilityRecord(counsellorId)
      return res.status(200).json({
        success: true,
        data: seededAvailability,
      })
    }

    return res.status(200).json({
      success: true,
      data: availability,
    })
  } catch (error) {
    return createErrorResponse(res, 500, error.message || "Failed to fetch availability")
  }
}

export const updateTimezone = async (req, res) => {
  try {
    const { counsellorId } = req.params
    const { timezone } = req.body

    try {
      await getValidatedCounsellorUser(counsellorId)
    } catch (error) {
      return createErrorResponse(res, error.statusCode || 400, error.message || "Invalid counsellorId")
    }

    validateTimezonePayload({ timezone })

    const availability = await ensureAvailabilityRecord(counsellorId)
    availability.timezone = timezone
    await availability.save()

    return res.status(200).json({
      success: true,
      message: "Timezone updated successfully",
      data: availability,
    })
  } catch (error) {
    return createErrorResponse(res, error.statusCode || 500, error.message || "Failed to update timezone")
  }
}

export const updateWeeklySchedule = async (req, res) => {
  try {
    const { counsellorId } = req.params
    const { weeklySchedule } = req.body

    try {
      await getValidatedCounsellorUser(counsellorId)
    } catch (error) {
      return createErrorResponse(res, error.statusCode || 400, error.message || "Invalid counsellorId")
    }

    if (!weeklySchedule || typeof weeklySchedule !== "object") {
      return createErrorResponse(res, 400, "weeklySchedule must be an object")
    }

    const availability = await ensureAvailabilityRecord(counsellorId)

    for (const day of WEEKDAY_KEYS) {
      if (!weeklySchedule[day]) continue

      validateWeeklyDayPayload(day, weeklySchedule[day])
      availability.weeklySchedule[day] = {
        enabled: weeklySchedule[day].enabled,
        periods: weeklySchedule[day].periods,
      }
    }

    await availability.save()

    return res.status(200).json({
      success: true,
      message: "Weekly schedule updated successfully",
      data: availability,
    })
  } catch (error) {
    return createErrorResponse(res, error.statusCode || 500, error.message || "Failed to update weekly schedule")
  }
}

export const toggleWeekday = async (req, res) => {
  try {
    const { counsellorId, weekday } = req.params

    try {
      await getValidatedCounsellorUser(counsellorId)
    } catch (error) {
      return createErrorResponse(res, error.statusCode || 400, error.message || "Invalid counsellorId")
    }

    if (!WEEKDAY_KEYS.includes(weekday)) {
      return createErrorResponse(res, 400, "Invalid weekday")
    }

    const availability = await ensureAvailabilityRecord(counsellorId)
    const { enabled } = req.body

    if (typeof enabled !== "boolean") {
      return createErrorResponse(res, 400, "enabled must be a boolean")
    }

    availability.weeklySchedule[weekday].enabled = enabled
    await availability.save()

    return res.status(200).json({
      success: true,
      message: `Weekday ${weekday} updated successfully`,
      data: availability,
    })
  } catch (error) {
    return createErrorResponse(res, 500, error.message || "Failed to update weekday")
  }
}

export const addOrUpdatePeriod = async (req, res) => {
  try {
    const { counsellorId, weekday, periodId } = req.params
    const { start, end } = req.body

    try {
      await getValidatedCounsellorUser(counsellorId)
    } catch (error) {
      return createErrorResponse(res, error.statusCode || 400, error.message || "Invalid counsellorId")
    }

    if (!WEEKDAY_KEYS.includes(weekday)) {
      return createErrorResponse(res, 400, "Invalid weekday")
    }

    const availability = await ensureAvailabilityRecord(counsellorId)
    const targetDay = availability.weeklySchedule[weekday]

    if (!targetDay.enabled) {
      return createErrorResponse(res, 400, "This weekday is disabled. Enable it before adding periods")
    }

    if (!start || !end) {
      return createErrorResponse(res, 400, "start and end are required")
    }

    const newPeriod = { start, end }
    const periods = [...(targetDay.periods || [])]

    if (periodId) {
      const index = periods.findIndex((period) => period._id?.toString() === periodId)
      if (index === -1) {
        return createErrorResponse(res, 404, "Period not found")
      }
      periods[index] = newPeriod
    } else {
      periods.push(newPeriod)
    }

    validateWeeklyDayPayload(weekday, { enabled: true, periods })

    targetDay.periods = periods
    await availability.save()

    return res.status(200).json({
      success: true,
      message: periodId ? "Period updated successfully" : "Period added successfully",
      data: availability,
    })
  } catch (error) {
    return createErrorResponse(res, error.statusCode || 500, error.message || "Failed to manage time period")
  }
}

export const deletePeriod = async (req, res) => {
  try {
    const { counsellorId, weekday, periodId } = req.params

    try {
      await getValidatedCounsellorUser(counsellorId)
    } catch (error) {
      return createErrorResponse(res, error.statusCode || 400, error.message || "Invalid counsellorId")
    }

    if (!WEEKDAY_KEYS.includes(weekday)) {
      return createErrorResponse(res, 400, "Invalid weekday")
    }

    const availability = await ensureAvailabilityRecord(counsellorId)
    const currentPeriods = availability.weeklySchedule[weekday]?.periods || []
    const filteredPeriods = currentPeriods.filter((period) => period._id?.toString() !== periodId)

    if (filteredPeriods.length === currentPeriods.length) {
      return createErrorResponse(res, 404, "Period not found")
    }

    availability.weeklySchedule[weekday].periods = filteredPeriods
    await availability.save()

    return res.status(200).json({
      success: true,
      message: "Period deleted successfully",
      data: availability,
    })
  } catch (error) {
    return createErrorResponse(res, 500, error.message || "Failed to delete period")
  }
}

export const copySchedule = async (req, res) => {
  try {
    const { counsellorId } = req.params
    const payload = req.body

    try {
      await getValidatedCounsellorUser(counsellorId)
    } catch (error) {
      return createErrorResponse(res, error.statusCode || 400, error.message || "Invalid counsellorId")
    }

    validateCopySchedulePayload(payload)

    const availability = await ensureAvailabilityRecord(counsellorId)

    const sourceDaySchedule = availability.weeklySchedule[payload.sourceDay]
    if (!sourceDaySchedule) {
      return createErrorResponse(res, 404, "Source day schedule not found")
    }

    for (const targetDay of payload.targetDays) {
      const targetSchedule = availability.weeklySchedule[targetDay]

      if (payload.overwriteExisting) {
        targetSchedule.enabled = sourceDaySchedule.enabled
        targetSchedule.periods = [...sourceDaySchedule.periods]
      } else if (targetSchedule.periods.length > 0) {
        return createErrorResponse(res, 409, `${targetDay} already has periods configured`)
      } else {
        targetSchedule.enabled = sourceDaySchedule.enabled
        targetSchedule.periods = [...sourceDaySchedule.periods]
      }
    }

    await availability.save()

    return res.status(200).json({
      success: true,
      message: "Schedule copied successfully",
      data: availability,
    })
  } catch (error) {
    return createErrorResponse(res, error.statusCode || 500, error.message || "Failed to copy schedule")
  }
}

export const addOrUpdateDateOverride = async (req, res) => {
  try {
    const { counsellorId, overrideId } = req.params
    const payload = req.body

    try {
      await getValidatedCounsellorProfile(counsellorId)
    } catch (error) {
      return createErrorResponse(res, error.statusCode || 400, error.message || "Invalid counsellorId")
    }

    validateDateOverridePayload(payload)

    const availability = await ensureAvailabilityRecord(counsellorId)
    const dateValue = new Date(payload.date)

    if (overrideId) {
      const index = availability.dateOverrides.findIndex((override) => override._id?.toString() === overrideId)
      if (index === -1) {
        return createErrorResponse(res, 404, "Date override not found")
      }

      availability.dateOverrides[index] = {
        ...availability.dateOverrides[index],
        ...payload,
        date: dateValue,
      }
    } else {
      availability.dateOverrides.push({
        date: dateValue,
        unavailable: payload.unavailable,
        reason: payload.reason,
        periods: payload.periods || [],
      })
    }

    await availability.save()

    return res.status(200).json({
      success: true,
      message: overrideId ? "Date override updated successfully" : "Date override added successfully",
      data: availability,
    })
  } catch (error) {
    return createErrorResponse(res, error.statusCode || 500, error.message || "Failed to save date override")
  }
}

export const deleteDateOverride = async (req, res) => {
  try {
    const { counsellorId, overrideId } = req.params

    try {
      await getValidatedCounsellorProfile(counsellorId)
    } catch (error) {
      return createErrorResponse(res, error.statusCode || 400, error.message || "Invalid counsellorId")
    }

    const availability = await ensureAvailabilityRecord(counsellorId)
    const originalSize = availability.dateOverrides.length
    availability.dateOverrides = availability.dateOverrides.filter((override) => override._id?.toString() !== overrideId)

    if (availability.dateOverrides.length === originalSize) {
      return createErrorResponse(res, 404, "Date override not found")
    }

    await availability.save()

    return res.status(200).json({
      success: true,
      message: "Date override deleted successfully",
      data: availability,
    })
  } catch (error) {
    return createErrorResponse(res, 500, error.message || "Failed to delete date override")
  }
}

export const updateBookingRules = async (req, res) => {
  try {
    const { counsellorId } = req.params
    const payload = req.body

    try {
      await getValidatedCounsellorUser(counsellorId)
    } catch (error) {
      return createErrorResponse(res, error.statusCode || 400, error.message || "Invalid counsellorId")
    }

    validateBookingRulesPayload(payload)

    const availability = await ensureAvailabilityRecord(counsellorId)
    availability.bookingRules = {
      ...availability.bookingRules.toObject(),
      ...payload,
    }

    await availability.save()

    return res.status(200).json({
      success: true,
      message: "Booking rules updated successfully",
      data: availability,
    })
  } catch (error) {
    return createErrorResponse(res, error.statusCode || 500, error.message || "Failed to update booking rules")
  }
}

export const getAvailableDatesController = async (req, res) => {
  try {
    const { serviceId } = req.params

    if (!isValidObjectId(serviceId)) {
      return createErrorResponse(res, 400, "Invalid serviceId")
    }

    const availabilityData = await getServiceAvailability({ serviceId })
    if (!availabilityData?.service) {
      return createErrorResponse(res, 404, "Service not found")
    }

    if (!availabilityData?.counsellorId || !availabilityData?.availability) {
      return createErrorResponse(res, 404, "Counsellor availability profile not found for this service")
    }

    const dates = await getAvailableDates({
      serviceId,
      counsellorId: availabilityData.counsellorId || availabilityData.service.counsellorId,
      availability: availabilityData.availability,
      serviceDuration: availabilityData.service.duration,
      now: new Date(),
      timezone: availabilityData.availability.timezone || "Asia/Kolkata",
    })

    res.set("Cache-Control", "no-store")
    return res.status(200).json({ success: true, dates })
  } catch (error) {
    return createErrorResponse(res, 500, error.message || "Failed to generate available dates")
  }
}

export const getAvailableSlotsController = async (req, res) => {
  try {
    const { serviceId } = req.params
    const { date } = req.query

    if (!isValidObjectId(serviceId)) {
      return createErrorResponse(res, 400, "Invalid serviceId")
    }

    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return createErrorResponse(res, 400, "date must be in YYYY-MM-DD format")
    }

    const availabilityData = await getServiceAvailability({ serviceId })
    if (!availabilityData?.service) {
      return createErrorResponse(res, 404, "Service not found")
    }

    if (!availabilityData?.counsellorId || !availabilityData?.availability) {
      return createErrorResponse(res, 404, "Counsellor availability profile not found for this service")
    }

    const slots = await getAvailableSlots({
      serviceId,
      counsellorId: availabilityData.counsellorId || availabilityData.service.counsellorId,
      availability: availabilityData.availability,
      serviceDuration: availabilityData.service.duration,
      date,
      now: new Date(),
      timezone: availabilityData.availability.timezone || "Asia/Kolkata",
    })

    res.set("Cache-Control", "no-store")
    return res.status(200).json({ success: true, slots })
  } catch (error) {
    return createErrorResponse(res, 500, error.message || "Failed to generate available slots")
  }
}

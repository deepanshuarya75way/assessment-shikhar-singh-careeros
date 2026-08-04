import mongoose from "mongoose"
import Booking from "../models/Booking.js"
import Service from "../models/Service.js"
import CounsellorAvailability from "../models/CounsellorAvailability.js"

const WEEKDAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]

const WEEKDAY_LOOKUP = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 0,
}

const DEFAULT_AVAILABILITY = {
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
  dateOverrides: [],
  bookingRules: {},
}

const timeToMinutes = (value) => {
  if (typeof value !== "string") return null
  const [hours, minutes] = value.split(":").map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
  return hours * 60 + minutes
}

const formatMinutes = (minutes) => {
  const safeMinutes = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60)
  const hours = Math.floor(safeMinutes / 60)
  const mins = safeMinutes % 60
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`
}

const normalizeDateString = (value) => {
  if (!value) return null
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10)
  }
  return null
}

const parseDateString = (value) => {
  const normalized = normalizeDateString(value)
  if (!normalized) return null
  const [year, month, day] = normalized.split("-").map(Number)
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
}

const formatDateInTimezone = (dateValue, timeZone) => {
  if (!dateValue) return null
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return null

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })

  const parts = formatter.formatToParts(date)
  const partMap = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${partMap.year}-${partMap.month}-${partMap.day}`
}

const getWeekdayKey = (dateValue, timeZone) => {
  const date = parseDateString(dateValue)
  if (!date) return null

  const formatter = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone,
  })

  const weekday = formatter.format(date).toLowerCase()
  return Object.keys(WEEKDAY_LOOKUP).find((key) => key === weekday) || null
}

const ensureAvailabilityRecord = async (counsellorId) => {
  const existing = await CounsellorAvailability.findOne({ counsellorId }).lean()
  if (existing) return existing

  const created = await CounsellorAvailability.create({
    counsellorId: new mongoose.Types.ObjectId(counsellorId),
    ...DEFAULT_AVAILABILITY,
  })

  return created.toObject({ virtuals: true })
}

const getApplicablePeriods = (availability, dateString) => {
  const overrides = Array.isArray(availability?.dateOverrides) ? availability.dateOverrides : []
  const targetDateString = normalizeDateString(dateString)

  const matchingOverride = overrides.find((override) => {
    const overrideDate = formatDateInTimezone(override.date, availability?.timezone || "Asia/Kolkata")
    return overrideDate === targetDateString
  })

  if (matchingOverride?.unavailable) {
    return []
  }

  if (matchingOverride?.periods?.length) {
    return matchingOverride.periods
  }

  const weekdayKey = getWeekdayKey(targetDateString, availability?.timezone || "Asia/Kolkata")
  if (!weekdayKey) return []

  const daySchedule = availability?.weeklySchedule?.[weekdayKey]
  if (!daySchedule?.enabled) return []

  return Array.isArray(daySchedule.periods) ? daySchedule.periods : []
}

const getBookingRules = (availability) => ({
  bufferMinutes: Number(availability?.bookingRules?.bufferMinutes ?? 15),
  minimumNoticeHours: Number(availability?.bookingRules?.minimumNoticeHours ?? 2),
  bookingWindowDays: Number(availability?.bookingRules?.bookingWindowDays ?? 30),
})

export const generateSlotsForDate = ({
  date,
  serviceDuration,
  bufferMinutes,
  periods,
  now = new Date(),
  minimumNoticeHours = 0,
  timezone = "Asia/Kolkata",
  bookedSlots = [],
}) => {
  const slotInterval = Number(serviceDuration) + Number(bufferMinutes)
  const normalizedDate = normalizeDateString(date)
  if (!normalizedDate) return []

  const seed = new Date(now)
  const noticeThreshold = new Date(seed.getTime() + minimumNoticeHours * 60 * 60 * 1000)
  const slots = []

  for (const period of periods || []) {
    const startMinutes = timeToMinutes(period.start)
    const endMinutes = timeToMinutes(period.end)
    if (startMinutes === null || endMinutes === null || startMinutes >= endMinutes) continue

    let cursor = startMinutes
    while (cursor + Number(serviceDuration) <= endMinutes) {
      const timeLabel = formatMinutes(cursor)
      const slotDate = new Date(`${normalizedDate}T${timeLabel}:00`)
      const slotStart = new Date(slotDate)
      if (slotStart > noticeThreshold && !bookedSlots.includes(timeLabel)) {
        slots.push(timeLabel)
      }
      cursor += slotInterval
    }
  }

  return slots
}

const getBookedSlotsForDate = async ({ serviceId, counsellorId, date, now = new Date() }) => {
  const normalizedDate = normalizeDateString(date);

  const query = {
    scheduledDate: normalizedDate,
    status: { $in: ["PENDING_PAYMENT", "CONFIRMED"] },
    paymentStatus: { $in: ["PENDING", "PAID"] },
    $or: [{ status: "CONFIRMED" }, { expiresAt: { $gt: now } }],
  }

  if (serviceId) query.serviceId = serviceId
  if (counsellorId) query.counsellorId = counsellorId

  const docs = await Booking.find(query).select("startTime").lean()

  return docs.map((doc) => doc.startTime).filter(Boolean)
};

export const getAvailableDates = async ({
  serviceId,
  counsellorId,
  availability,
  serviceDuration,
  now = new Date(),
  timezone = "Asia/Kolkata",
}) => {
  const rules = getBookingRules(availability)
  const normalizedToday = formatDateInTimezone(now, timezone) || new Date().toISOString().slice(0, 10)
  const dates = []

  for (let offset = 0; offset < rules.bookingWindowDays; offset += 1) {
    const currentDate = new Date(`${normalizedToday}T12:00:00Z`)
    currentDate.setUTCDate(currentDate.getUTCDate() + offset)
    const dateString = formatDateInTimezone(currentDate, timezone)
    const periods = getApplicablePeriods(availability, dateString)
    const bookedSlots = await getBookedSlotsForDate({ serviceId, counsellorId, date: dateString, now })
    const slots = generateSlotsForDate({
      date: dateString,
      serviceDuration,
      bufferMinutes: rules.bufferMinutes,
      periods,
      now,
      minimumNoticeHours: rules.minimumNoticeHours,
      timezone,
      bookedSlots,
    })

    if (slots.length > 0) {
      dates.push(dateString)
    }
  }

  return dates
}

export const getAvailableSlots = async ({
  serviceId,
  counsellorId,
  availability,
  serviceDuration,
  date,
  now = new Date(),
  timezone = "Asia/Kolkata",
}) => {
  const normalizedDate = normalizeDateString(date)
  if (!normalizedDate) return []

  const rules = getBookingRules(availability)
  const periods = getApplicablePeriods(availability, normalizedDate)
  const bookedSlots = await getBookedSlotsForDate({ serviceId, counsellorId, date: normalizedDate, now })

  return generateSlotsForDate({
    date: normalizedDate,
    serviceDuration,
    bufferMinutes: rules.bufferMinutes,
    periods,
    now,
    minimumNoticeHours: rules.minimumNoticeHours,
    timezone,
    bookedSlots,
  })
}

export const getServiceAvailability = async ({ serviceId }) => {
  if (!mongoose.Types.ObjectId.isValid(serviceId)) {
    throw new Error("Invalid service id")
  }

  const service = await Service.findById(serviceId).lean()
  if (!service) {
    return null
  }

  const availability = await ensureAvailabilityRecord(service.counsellorId.toString())

  return {
    service,
    availability,
    counsellorId: service.counsellorId.toString(),
  }
}

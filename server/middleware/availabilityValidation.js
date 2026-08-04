const WEEKDAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]

const timezonePattern = /^(UTC|[A-Za-z_]+\/[A-Za-z_]+(?:\/[A-Za-z_]+)?)$/

export const isValidWeekday = (value) => WEEKDAY_KEYS.includes(value)

export const isValidTimezone = (value) => typeof value === "string" && timezonePattern.test(value)

export const buildAvailabilityError = (message, statusCode = 400) => ({
  statusCode,
  message,
})

export const validateWeeklyDayPayload = (weekday, body = {}) => {
  if (!isValidWeekday(weekday)) {
    throw buildAvailabilityError("Invalid weekday value")
  }

  const { enabled, periods } = body

  if (typeof enabled !== "boolean") {
    throw buildAvailabilityError("enabled must be a boolean")
  }

  if (!Array.isArray(periods)) {
    throw buildAvailabilityError("periods must be an array")
  }

  for (const period of periods) {
    if (!period || typeof period.start !== "string" || typeof period.end !== "string") {
      throw buildAvailabilityError("Each period must contain start and end strings")
    }

    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(period.start)) {
      throw buildAvailabilityError("Period start must be in HH:MM 24-hour format")
    }

    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(period.end)) {
      throw buildAvailabilityError("Period end must be in HH:MM 24-hour format")
    }

    const startMinutes = Number(period.start.split(":")[0]) * 60 + Number(period.start.split(":")[1])
    const endMinutes = Number(period.end.split(":")[0]) * 60 + Number(period.end.split(":")[1])

    if (startMinutes >= endMinutes) {
      throw buildAvailabilityError("Period start time must be earlier than end time")
    }
  }

  for (let i = 0; i < periods.length; i += 1) {
    for (let j = i + 1; j < periods.length; j += 1) {
      const current = periods[i]
      const next = periods[j]

      const currentStart = Number(current.start.split(":")[0]) * 60 + Number(current.start.split(":")[1])
      const currentEnd = Number(current.end.split(":")[0]) * 60 + Number(current.end.split(":")[1])
      const nextStart = Number(next.start.split(":")[0]) * 60 + Number(next.start.split(":")[1])
      const nextEnd = Number(next.end.split(":")[0]) * 60 + Number(next.end.split(":")[1])

      if (currentStart < nextEnd && nextStart < currentEnd) {
        throw buildAvailabilityError("Time periods cannot overlap")
      }
    }
  }
}

export const validateBookingRulesPayload = (payload = {}) => {
  const allowedModes = ["instant", "approval"]

  if (typeof payload.bufferMinutes !== "number" || payload.bufferMinutes < 0) {
    throw buildAvailabilityError("bufferMinutes must be a non-negative number")
  }

  if (typeof payload.minimumNoticeHours !== "number" || payload.minimumNoticeHours < 0) {
    throw buildAvailabilityError("minimumNoticeHours must be a non-negative number")
  }

  if (typeof payload.bookingWindowDays !== "number" || payload.bookingWindowDays < 1) {
    throw buildAvailabilityError("bookingWindowDays must be a positive number")
  }

  if (typeof payload.cancellationNoticeHours !== "number" || payload.cancellationNoticeHours < 0) {
    throw buildAvailabilityError("cancellationNoticeHours must be a non-negative number")
  }

  if (typeof payload.allowRescheduling !== "boolean") {
    throw buildAvailabilityError("allowRescheduling must be a boolean")
  }

  if (!allowedModes.includes(payload.bookingMode)) {
    throw buildAvailabilityError("bookingMode must be either 'instant' or 'approval'")
  }
}

export const validateDateOverridePayload = (payload = {}) => {
  if (!payload.date || Number.isNaN(new Date(payload.date).getTime())) {
    throw buildAvailabilityError("date must be a valid ISO date string")
  }

  if (typeof payload.unavailable !== "boolean") {
    throw buildAvailabilityError("unavailable must be a boolean")
  }

  if (payload.periods && !Array.isArray(payload.periods)) {
    throw buildAvailabilityError("periods must be an array")
  }

  if (Array.isArray(payload.periods)) {
    for (const period of payload.periods) {
      if (!period || typeof period.start !== "string" || typeof period.end !== "string") {
        throw buildAvailabilityError("Each override period must contain start and end strings")
      }
    }
  }
}

export const validateCopySchedulePayload = (payload = {}) => {
  if (!payload.sourceDay || !WEEKDAY_KEYS.includes(payload.sourceDay)) {
    throw buildAvailabilityError("sourceDay must be a valid weekday")
  }

  if (!Array.isArray(payload.targetDays) || payload.targetDays.length === 0) {
    throw buildAvailabilityError("targetDays must be a non-empty array of weekdays")
  }

  for (const day of payload.targetDays) {
    if (!WEEKDAY_KEYS.includes(day)) {
      throw buildAvailabilityError("targetDays contains an invalid weekday value")
    }
  }

  if (typeof payload.overwriteExisting !== "boolean") {
    throw buildAvailabilityError("overwriteExisting must be a boolean")
  }
}

export const validateTimezonePayload = (payload = {}) => {
  if (!payload.timezone || !isValidTimezone(payload.timezone)) {
    throw buildAvailabilityError("timezone must be an IANA timezone string such as Asia/Kolkata")
  }
}

export const isValidObjectId = (value) => /^[0-9a-fA-F]{24}$/.test(value)

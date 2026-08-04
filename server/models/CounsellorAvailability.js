import mongoose from "mongoose"

const timePeriodSchema = new mongoose.Schema(
  {
    start: {
      type: String,
      required: true,
      trim: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Start time must be in HH:MM 24-hour format"],
    },
    end: {
      type: String,
      required: true,
      trim: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "End time must be in HH:MM 24-hour format"],
    },
  }
)

const dayScheduleSchema = new mongoose.Schema(
  {
    enabled: {
      type: Boolean,
      default: true,
    },
    periods: {
      type: [timePeriodSchema],
      default: [],
    },
  },
  { _id: false }
)

const dateOverrideSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    unavailable: {
      type: Boolean,
      default: false,
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    periods: {
      type: [timePeriodSchema],
      default: [],
    },
  }
)

const bookingRulesSchema = new mongoose.Schema(
  {
    bufferMinutes: {
      type: Number,
      min: 0,
      max: 240,
      default: 15,
    },
    minimumNoticeHours: {
      type: Number,
      min: 0,
      max: 720,
      default: 2,
    },
    bookingWindowDays: {
      type: Number,
      min: 1,
      max: 365,
      default: 30,
    },
    cancellationNoticeHours: {
      type: Number,
      min: 0,
      max: 720,
      default: 4,
    },
    allowRescheduling: {
      type: Boolean,
      default: true,
    },
    bookingMode: {
      type: String,
      enum: ["instant", "approval"],
      default: "instant",
    },
  },
  { _id: false }
)

function timeToMinutes(value) {
  if (!value || typeof value !== "string") {
    return null
  }

  const [hours, minutes] = value.split(":").map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null

  return hours * 60 + minutes
}

function hasTimeOverlap(periods) {
  const normalized = periods
    .map((period) => ({
      start: timeToMinutes(period.start),
      end: timeToMinutes(period.end),
    }))
    .filter((period) => period.start !== null && period.end !== null)

  for (let i = 0; i < normalized.length; i += 1) {
    for (let j = i + 1; j < normalized.length; j += 1) {
      const current = normalized[i]
      const next = normalized[j]

      if (current.start < next.end && next.start < current.end) {
        return true
      }
    }
  }

  return false
}

function validatePeriods(periods) {
  if (!Array.isArray(periods)) {
    throw new Error("Periods must be an array")
  }

  for (const period of periods) {
    const startMinutes = timeToMinutes(period.start)
    const endMinutes = timeToMinutes(period.end)

    if (startMinutes === null || endMinutes === null) {
      throw new Error("Each period must use HH:MM 24-hour format")
    }

    if (startMinutes >= endMinutes) {
      throw new Error("Period start time must be earlier than end time")
    }
  }

  if (hasTimeOverlap(periods)) {
    throw new Error("Time periods cannot overlap")
  }
}

const counsellorAvailabilitySchema = new mongoose.Schema(
  {
    counsellorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CounsellorProfile",
      required: true,
      unique: true,
      index: true,
    },
    timezone: {
      type: String,
      default: "Asia/Kolkata",
      trim: true,
    },
    weeklySchedule: {
      monday: { type: dayScheduleSchema, default: () => ({ enabled: true, periods: [] }) },
      tuesday: { type: dayScheduleSchema, default: () => ({ enabled: true, periods: [] }) },
      wednesday: { type: dayScheduleSchema, default: () => ({ enabled: true, periods: [] }) },
      thursday: { type: dayScheduleSchema, default: () => ({ enabled: true, periods: [] }) },
      friday: { type: dayScheduleSchema, default: () => ({ enabled: true, periods: [] }) },
      saturday: { type: dayScheduleSchema, default: () => ({ enabled: true, periods: [] }) },
      sunday: { type: dayScheduleSchema, default: () => ({ enabled: true, periods: [] }) },
    },
    dateOverrides: {
      type: [dateOverrideSchema],
      default: [],
    },
    bookingRules: {
      type: bookingRulesSchema,
      default: () => ({}),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

counsellorAvailabilitySchema.pre("validate", function validateAvailabilityDoc(next) {
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

  for (const day of days) {
    const daySchedule = this.weeklySchedule?.[day]
    if (!daySchedule) continue

    if (daySchedule.enabled && Array.isArray(daySchedule.periods)) {
      try {
        validatePeriods(daySchedule.periods)
      } catch (error) {
        return next(error)
      }
    }
  }

  for (const override of this.dateOverrides || []) {
    if (override.unavailable) continue
    if (!Array.isArray(override.periods) || override.periods.length === 0) {
      continue
    }

    try {
      validatePeriods(override.periods)
    } catch (error) {
      return next(error)
    }
  }

  next()
})

const CounsellorAvailability = mongoose.model(
  "CounsellorAvailability",
  counsellorAvailabilitySchema
)

export default CounsellorAvailability

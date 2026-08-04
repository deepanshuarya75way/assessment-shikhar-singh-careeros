import { useEffect, useMemo, useState } from "react"
import { useLocation } from "react-router-dom"
import { Copy, Plus, Trash2, X, Check, Clock3 } from "lucide-react"
import Navbar from "../components/Navbar"

const API_BASE_URL = import.meta.env.VITE_API_URL || ""

const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
const WEEKDAY_LABELS = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
}
const TIMEZONE_OPTIONS = [
  { value: "Asia/Kolkata", label: "(GMT+5:30) India Standard Time" },
  { value: "America/Los_Angeles", label: "(GMT-8:00) Pacific Standard Time" },
  { value: "UTC", label: "(GMT+0:00) Greenwich Mean Time" },
]

const timeOptions = (() => {
  const options = []
  for (let hour = 0; hour < 24; hour += 1) {
    for (let minute = 0; minute < 60; minute += 15) {
      const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
      const display = new Date(`2024-01-01T${value}:00`).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })
      options.push({ value, label: display })
    }
  }
  return options
})()

const initialWeeklyAvailability = [
  {
    day: "Monday",
    enabled: true,
    periods: [
      { start: "09:00", end: "13:00" },
      { start: "14:00", end: "18:00" },
    ],
  },
  {
    day: "Tuesday",
    enabled: true,
    periods: [{ start: "10:00", end: "18:00" }],
  },
  {
    day: "Wednesday",
    enabled: false,
    periods: [],
  },
  {
    day: "Thursday",
    enabled: true,
    periods: [
      { start: "09:30", end: "13:30" },
      { start: "15:00", end: "17:30" },
    ],
  },
  {
    day: "Friday",
    enabled: true,
    periods: [{ start: "10:00", end: "16:00" }],
  },
  {
    day: "Saturday",
    enabled: true,
    periods: [{ start: "11:00", end: "14:00" }],
  },
  {
    day: "Sunday",
    enabled: true,
    periods: [{ start: "12:00", end: "16:00" }],
  },
]

const specialDates = [
  { date: "10 Aug", label: "Unavailable" },
  { date: "15 Aug", label: "Unavailable" },
  { date: "20 Aug", label: "2:00 PM - 6:00 PM" },
]

const timeToDisplay = (value) => {
  if (!value) return ""
  return new Date(`2024-01-01T${value}:00`).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
}

const mapWeeklyScheduleToState = (weeklySchedule = {}) =>
  DAY_ORDER.map((dayKey) => ({
    day: WEEKDAY_LABELS[dayKey],
    enabled: Boolean(weeklySchedule[dayKey]?.enabled),
    periods: (weeklySchedule[dayKey]?.periods || []).map((slot) => ({ start: slot.start, end: slot.end })),
  }))

const buildWeeklySchedulePayload = (weeklyAvailability) =>
  weeklyAvailability.reduce((schedule, item) => {
    const dayKey = Object.entries(WEEKDAY_LABELS).find(([, label]) => label === item.day)?.[0]
    if (!dayKey) return schedule

    schedule[dayKey] = {
      enabled: Boolean(item.enabled),
      periods: (item.periods || []).map((slot) => ({ start: slot.start, end: slot.end })),
    }
    return schedule
  }, {})

const parseTimeToMinutes = (value) => {
  if (!value) return null
  const [hour, minute] = value.split(":").map(Number)
  return hour * 60 + minute
}

const validateSlots = (slots) => {
  const errors = {}
  const normalizedSlots = slots.map((slot, index) => ({ index, ...slot }))

  normalizedSlots.forEach((slot) => {
    if (!slot.start || !slot.end) {
      errors[slot.index] = "Choose both start and end times."
      return
    }

    if (parseTimeToMinutes(slot.start) >= parseTimeToMinutes(slot.end)) {
      errors[slot.index] = "End time must be later than the start time."
    }
  })

  normalizedSlots.forEach((slot, index) => {
    const slotStart = parseTimeToMinutes(slot.start)
    const slotEnd = parseTimeToMinutes(slot.end)

    if (slotStart === null || slotEnd === null) return

    for (let compareIndex = index + 1; compareIndex < normalizedSlots.length; compareIndex += 1) {
      const compareSlot = normalizedSlots[compareIndex]
      const compareStart = parseTimeToMinutes(compareSlot.start)
      const compareEnd = parseTimeToMinutes(compareSlot.end)

      if (compareStart === null || compareEnd === null) continue

      const overlaps = slotStart < compareEnd && compareStart < slotEnd
      if (overlaps) {
        errors[slot.index] = "Time slots cannot overlap."
        errors[compareSlot.index] = "Time slots cannot overlap."
      }
    }
  })

  return errors
}

const CounsellorAvailabilityPage = () => {
  const location = useLocation();

  const [user] = useState(() => {
    return (
      location.state?.user ||
      JSON.parse(localStorage.getItem("user")) ||
      null
    );
  });

  const [availabilityCounsellorId, setAvailabilityCounsellorId] = useState(null)
  const [availabilityError, setAvailabilityError] = useState(null)
  const [timezone, setTimezone] = useState("Asia/Kolkata")
  const [instantBooking, setInstantBooking] = useState(true)
  const [requestApproval, setRequestApproval] = useState(false)
  const [weeklyAvailability, setWeeklyAvailability] = useState(initialWeeklyAvailability)
  const [bookingRules, setBookingRules] = useState({
    bufferMinutes: 15,
    minimumNoticeHours: 2,
    bookingWindowDays: 30,
    cancellationNoticeHours: 4,
    allowRescheduling: true,
    bookingMode: "instant",
  })
  const [drawerDay, setDrawerDay] = useState(null)
  const [drawerSlots, setDrawerSlots] = useState([])
  const [drawerErrors, setDrawerErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const resolveAvailabilityCounsellorId = async () => {
    if (!user?._id) {
      console.error("Availability resolution failed: missing user id")
      return null
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/counsellor-profile/${user._id}`)
      if (!response.ok) {
        const errorText = await response.text()
        console.error("Availability resolution failed: counsellor profile lookup returned an error", {
          status: response.status,
          detail: errorText,
        })
        return null
      }

      const profile = await response.json()
      if (!profile?.userId) {
        console.error("Availability resolution failed: counsellor profile did not include a user id", profile)
        return null
      }

      return profile.userId
    } catch (error) {
      console.error("Availability resolution failed: unable to resolve counsellor profile id", error)
      return null
    }
  }

  const fetchAvailability = async () => {
    const resolvedCounsellorId = await resolveAvailabilityCounsellorId()
    if (!resolvedCounsellorId) {
      setAvailabilityCounsellorId(null)
      setAvailabilityError("Unable to load availability because the counsellor profile could not be resolved.")
      setIsLoading(false)
      return
    }

    setAvailabilityCounsellorId(resolvedCounsellorId)
    setAvailabilityError(null)
    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/availability/counsellor/${resolvedCounsellorId}`)
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load availability")
      }

      const availability = result.data || {}
      const nextWeeklyAvailability = mapWeeklyScheduleToState(availability.weeklySchedule)
      const nextBookingRules = {
        bufferMinutes: availability.bookingRules?.bufferMinutes ?? 15,
        minimumNoticeHours: availability.bookingRules?.minimumNoticeHours ?? 2,
        bookingWindowDays: availability.bookingRules?.bookingWindowDays ?? 30,
        cancellationNoticeHours: availability.bookingRules?.cancellationNoticeHours ?? 4,
        allowRescheduling: availability.bookingRules?.allowRescheduling ?? true,
        bookingMode: availability.bookingRules?.bookingMode ?? "instant",
      }

      setTimezone(availability.timezone || "Asia/Kolkata")
      setWeeklyAvailability(nextWeeklyAvailability)
      setBookingRules(nextBookingRules)
      setInstantBooking(nextBookingRules.bookingMode === "instant")
      setRequestApproval(nextBookingRules.bookingMode === "approval")
    } catch (error) {
      console.error("Failed to load counsellor availability", error)
      setAvailabilityError(error.message || "Failed to load counsellor availability")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAvailability()
  }, [user?._id])

  const saveBookingRules = async (nextBookingRules) => {
    if (!availabilityCounsellorId) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/availability/counsellor/${availabilityCounsellorId}/booking-rules`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nextBookingRules),
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to update booking rules")
      }

      setBookingRules(nextBookingRules)
      setInstantBooking(nextBookingRules.bookingMode === "instant")
      setRequestApproval(nextBookingRules.bookingMode === "approval")
    } catch (error) {
      console.error("Failed to save booking rules", error)
    }
  }

  const openDrawer = (day) => {
    const dayEntry = weeklyAvailability.find((entry) => entry.day === day)
    setDrawerDay(day)
    setDrawerSlots(dayEntry?.periods?.map((slot) => ({ ...slot })) || [])
    setDrawerErrors({})
  }

  const toggleDayAvailability = async (day) => {
    if (!availabilityCounsellorId) return

    const normalizedDay = day.toLowerCase()
    const nextEnabled = !weeklyAvailability.find((entry) => entry.day === day)?.enabled

    try {
      const response = await fetch(`${API_BASE_URL}/api/availability/counsellor/${availabilityCounsellorId}/weekday/${normalizedDay}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enabled: nextEnabled }),
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to update weekday availability")
      }

      setWeeklyAvailability(mapWeeklyScheduleToState(result.data.weeklySchedule))
    } catch (error) {
      console.error("Failed to toggle daily availability", error)
    }
  }

  const closeDrawer = () => {
    setDrawerDay(null)
    setDrawerSlots([])
    setDrawerErrors({})
  }

  const updateSlot = (index, field, value) => {
    setDrawerSlots((prev) => prev.map((slot, slotIndex) => (slotIndex === index ? { ...slot, [field]: value } : slot)))
  }

  const addSlot = () => {
    setDrawerSlots((prev) => [...prev, { start: "09:00", end: "13:00" }])
  }

  const removeSlot = (index) => {
    setDrawerSlots((prev) => prev.filter((_, slotIndex) => slotIndex !== index))
  }

  const saveHours = async () => {
    const errors = validateSlots(drawerSlots)
    setDrawerErrors(errors)

    if (Object.keys(errors).length > 0 || !availabilityCounsellorId) return

    const normalizedSlots = drawerSlots.filter((slot) => slot.start && slot.end)
    const nextAvailability = weeklyAvailability.map((entry) => {
      if (entry.day !== drawerDay) return entry

      return {
        ...entry,
        enabled: normalizedSlots.length > 0,
        periods: normalizedSlots,
      }
    })

    const payload = buildWeeklySchedulePayload(nextAvailability)

    setIsSaving(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/availability/counsellor/${availabilityCounsellorId}/weekly-schedule`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ weeklySchedule: payload }),
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to save availability")
      }

      setWeeklyAvailability(mapWeeklyScheduleToState(result.data.weeklySchedule))
    } catch (error) {
      console.error("Failed to save availability", error)
    } finally {
      setIsSaving(false)
      closeDrawer()
    }
  }

  const handleTimezoneChange = async (value) => {
    if (!availabilityCounsellorId) return

    setTimezone(value)

    try {
      const response = await fetch(`${API_BASE_URL}/api/availability/counsellor/${availabilityCounsellorId}/timezone`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ timezone: value }),
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to save timezone")
      }

      setTimezone(result.data.timezone)
    } catch (error) {
      console.error("Failed to update timezone", error)
    }
  }

  const validationResult = useMemo(() => validateSlots(drawerSlots), [drawerSlots])
  const saveDisabled = drawerSlots.length === 0 || Object.keys(validationResult).length > 0

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Navbar user={user} />

      <main className="max-w-5xl mx-auto px-4 pb-10 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm mb-4">
          <div className="px-5 py-4">
            <h1 className="text-[32px] font-bold text-slate-900">Availability</h1>
            <p className="text-sm text-slate-500 mt-1">Manage when students can book any of your counselling services.</p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm mb-4">
          <div className="px-5 py-4 text-sm text-slate-600">
            This availability is shared across all your counselling services — bookings for any service will block the same time slots.
          </div>
        </section>

        {availabilityError ? (
          <section className="rounded-2xl border border-red-200 bg-red-50 shadow-sm mb-4">
            <div className="px-5 py-4 text-sm font-medium text-red-700">{availabilityError}</div>
          </section>
        ) : null}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm mb-4">
          <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm text-slate-500">Set your timezone and weekly working hours for all services.</div>
              {isLoading ? <div className="mt-1 text-xs font-semibold text-blue-700">Loading saved availability…</div> : null}
            </div>
            <div className="w-full sm:w-[320px]">
              <label className="sr-only">Timezone</label>
              <select
                value={timezone}
                onChange={(e) => handleTimezoneChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
              >
                {TIMEZONE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm mb-4">
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <h2 className="text-[22px] font-bold text-slate-900">Weekly Availability</h2>
              <p className="text-sm text-slate-500 mt-1">Working periods, breaks, and unavailable time are shared across every service.</p>
            </div>
            <button className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <Copy className="w-4 h-4" />
              Copy schedule
            </button>
          </div>

          <div className="border-t border-slate-200 px-5 py-3">
            <div className="grid grid-cols-1 gap-3 text-sm font-semibold text-slate-600 md:grid-cols-[1fr_1.2fr_0.8fr]">
              <div>Day</div>
              <div>Availability</div>
              <div className="text-right">Action</div>
            </div>

            {weeklyAvailability.map((item) => (
              <div key={item.day} className="grid grid-cols-1 gap-3 items-center border-t border-slate-100 py-3 text-sm md:grid-cols-[1fr_1.2fr_0.9fr]">
                <div className="font-semibold text-slate-700">{item.day}</div>
                <div>
                  {item.enabled ? (
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Available</span>
                      {item.periods.map((slot, index) => (
                        <span key={`${item.day}-${index}`} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {timeToDisplay(slot.start)} – {timeToDisplay(slot.end)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">Unavailable</span>
                  )}
                </div>
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => toggleDayAvailability(item.day)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 ${item.enabled ? "bg-blue-600" : "bg-slate-300"
                      }`}
                    aria-label={`Toggle ${item.day} availability`}
                  >
                    <span
                      className={`absolute h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${item.enabled ? "translate-x-6" : "translate-x-1"
                        }`}
                    />
                  </button>
                  <button
                    onClick={() => openDrawer(item.day)}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Hours
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm mb-4">
          <div className="px-5 py-4">
            <h2 className="text-[22px] font-bold text-slate-900">Special Dates / Date Overrides</h2>
            <p className="text-sm text-slate-500 mt-1">Mark exceptions or create custom availability for a specific date.</p>
          </div>
          <div className="border-t border-slate-200 px-5 py-3">
            {specialDates.map((item, index) => (
              <div key={`${item.date}-${index}`} className="grid grid-cols-[1fr_1fr_0.6fr] gap-3 items-center border-t border-slate-100 py-3 text-sm first:border-t-0 first:pt-0">
                <div className="font-semibold text-slate-700">{item.date}</div>
                <div className="text-slate-600">{item.label}</div>
                <div className="flex justify-end text-slate-500">
                  <button className="rounded-lg p-1.5 hover:bg-slate-100">
                    <Clock3 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            <button className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50">
              <span className="text-lg leading-none">+</span>
              Add Date Override
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm mb-4">
          <div className="px-5 py-4">
            <h2 className="text-[22px] font-bold text-slate-900">Booking Rules</h2>
            <p className="text-sm text-slate-500 mt-1">These rules apply to all services and protect your shared calendar.</p>
          </div>
          <div className="border-t border-slate-200 px-5 py-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label className="space-y-2 text-sm text-slate-700">
                <span className="font-semibold">Buffer Between Sessions</span>
                <select
                  value={bookingRules.bufferMinutes}
                  onChange={(e) =>
                    saveBookingRules({
                      ...bookingRules,
                      bufferMinutes: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                </select>
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                <span className="font-semibold">Minimum Booking Notice</span>
                <select
                  value={bookingRules.minimumNoticeHours}
                  onChange={(e) =>
                    saveBookingRules({
                      ...bookingRules,
                      minimumNoticeHours: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                >
                  <option value={2}>2 hours</option>
                  <option value={4}>4 hours</option>
                  <option value={24}>1 day</option>
                </select>
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                <span className="font-semibold">Booking Window</span>
                <select
                  value={bookingRules.bookingWindowDays}
                  onChange={(e) =>
                    saveBookingRules({
                      ...bookingRules,
                      bookingWindowDays: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                >
                  <option value={30}>Up to 30 days ahead</option>
                  <option value={14}>Up to 14 days ahead</option>
                  <option value={60}>Up to 60 days ahead</option>
                </select>
              </label>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Cancellation Notice Settings
              <div className="mt-1 text-slate-500">{bookingRules.cancellationNoticeHours} hours before session</div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm mb-4">
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <h2 className="text-[22px] font-bold text-slate-900">Rescheduling Settings</h2>
              <p className="text-sm text-slate-500 mt-1">Allow students to request a new time within your rules.</p>
            </div>
            <button
              onClick={() =>
                saveBookingRules({
                  ...bookingRules,
                  bookingMode: instantBooking ? "approval" : "instant",
                })
              }
              className={`rounded-full p-2 transition ${instantBooking ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"}`}
            >
              <Check className="w-6 h-6" />
            </button>
          </div>

          <div className="border-t border-slate-200 px-5 py-4 flex flex-col gap-4">
            <div className="flex items-center justify-between rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
              <span className="inline-flex items-center gap-2">
                <Check className="w-4 h-4" />
                Instant Booking
              </span>
              <span className="text-xs text-blue-700">Enabled</span>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <div className="font-semibold text-slate-800">Request Approval</div>
              <div className="mt-1">Students can ask for approval before booking if you prefer manual review.</div>
            </div>
            <button
              onClick={() =>
                saveBookingRules({
                  ...bookingRules,
                  bookingMode: requestApproval ? "instant" : "approval",
                })
              }
              className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold ${requestApproval ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}
            >
              {requestApproval ? "Request Approval Enabled" : "Request Approval"}
            </button>
          </div>
        </section>
      </main>

      {drawerDay && (
        <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-[2px]">
          <div className="absolute inset-y-0 right-0 w-full max-w-xl transform transition-transform duration-300 ease-out bg-white shadow-2xl border-l border-slate-200 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{drawerDay} Availability</h3>
                <p className="text-sm text-slate-500 mt-1">Edit this day’s working windows in a single place.</p>
              </div>
              <button
                onClick={closeDrawer}
                className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-800 mb-3">Working Hours</div>
                <div className="space-y-3">
                  {drawerSlots.map((slot, index) => {
                    const slotError = drawerErrors[index]

                    return (
                      <div key={`${drawerDay}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 grid gap-3 sm:grid-cols-2">
                            <label className="space-y-2 text-sm text-slate-700">
                              <span className="font-semibold">Start Time</span>
                              <select
                                value={slot.start}
                                onChange={(e) => updateSlot(index, "start", e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                              >
                                {timeOptions.map((option) => (
                                  <option key={`${option.value}-${index}-start`} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="space-y-2 text-sm text-slate-700">
                              <span className="font-semibold">End Time</span>
                              <select
                                value={slot.end}
                                onChange={(e) => updateSlot(index, "end", e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                              >
                                {timeOptions.map((option) => (
                                  <option key={`${option.value}-${index}-end`} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>

                          <button
                            onClick={() => removeSlot(index)}
                            className="rounded-full bg-red-50 p-2 text-red-600 hover:bg-red-100"
                            aria-label="Delete slot"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {slotError && <p className="mt-2 text-xs font-semibold text-red-600">{slotError}</p>}
                      </div>
                    )
                  })}

                  <button
                    onClick={addSlot}
                    className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    <Plus className="w-4 h-4" />
                    Add Another Time Slot
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-800 mb-3">Working Periods</div>
                <p className="text-xs text-slate-500">Use the slot editor above to define one or more working windows for the selected day. The backend validates that periods do not overlap.</p>
              </div>
            </div>

            <div className="border-t border-slate-200 px-5 py-4 bg-white flex gap-3 justify-end">
              <button
                onClick={closeDrawer}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={saveHours}
                disabled={saveDisabled || isSaving}
                className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-200 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {isSaving ? "Saving…" : "Save Hours"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CounsellorAvailabilityPage

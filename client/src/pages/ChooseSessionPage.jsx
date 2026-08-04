
"use client"

import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import Navbar from "../components/Navbar"
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  Clock,
  Flame,
  Globe,
  Lock,
  Phone,
  Video,
} from "lucide-react"

const API_URL = import.meta.env.VITE_API_URL

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

function formatDateKey(dateObj) {
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, "0")
  const day = String(dateObj.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function to12Hour(time24) {
  const [h, m] = time24.split(":").map(Number)
  const period = h >= 12 ? "PM" : "AM"
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`
}

function addMinutes(time24, minutesToAdd) {
  const [h, m] = time24.split(":").map(Number)
  const total = h * 60 + m + minutesToAdd
  const newH = Math.floor((total % (24 * 60)) / 60)
  const newM = total % 60
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`
}

const Pill = ({ children }) => (
  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
    {children}
  </span>
)

const SummaryRow = ({ label, value }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-gray-500">{label}</span>
    <span className="font-semibold text-gray-900">{value}</span>
  </div>
)

const ChooseSessionPage = () => {
  const { counsellorId, serviceId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const user = location.state?.user || JSON.parse(localStorage.getItem("user")) || null

  const [counsellor, setCounsellor] = useState(null)
  const [service, setService] = useState(null)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [error, setError] = useState(null)
  const [availableDates, setAvailableDates] = useState([])
  const [availableSlots, setAvailableSlots] = useState([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsError, setSlotsError] = useState(null)

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const [step, setStep] = useState("date") // "date" | "time"
  const [selectedDateObj, setSelectedDateObj] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)

  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    document.body.appendChild(script)
    return () => {
      document.body.removeChild(script)
    }
  }, [])

  useEffect(() => {
    if (!user) {
      navigate("/")
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        setAvailableDates([])
        setAvailableSlots([])
        setSelectedDateObj(null)
        setSelectedTime(null)

        const [serviceRes, profileRes] = await Promise.all([
          fetch(`${API_URL}/api/services/${serviceId}`, { cache: "no-store" }),
          fetch(`${API_URL}/api/users/counsellor-profile/${counsellorId}`, { cache: "no-store" }),
        ])

        if (!serviceRes.ok) throw new Error("Session not found")
        if (!profileRes.ok) throw new Error("Counsellor not found")

        const [serviceData, profileData] = await Promise.all([
          serviceRes.json(),
          profileRes.json(),
        ])

        setService(serviceData)
        setCounsellor(profileData)

        const datesRes = await fetch(`${API_URL}/api/services/${serviceId}/available-dates`, { cache: "no-store" })
        if (!datesRes.ok) throw new Error("Unable to load available dates")

        const datesData = await datesRes.json()
        setAvailableDates(datesData.dates || [])
      } catch (err) {
        console.error(err)
        setError(err.message || "Failed to load session")
      } finally {
        setLoading(false)
      }
    }

    if (counsellorId && serviceId) fetchData()
  }, [counsellorId, serviceId, user, navigate])

  const modeLabel = service?.mode === "voice" ? "Voice Call" : "Video Call"
  const ModeIcon = service?.mode === "voice" ? Phone : Video

  // ---------- Calendar helpers ----------
  const year = today.getFullYear()
  const month = today.getMonth()
  const monthLabel = `${MONTH_NAMES[month]} ${year}`

  const calendarCells = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells = Array(firstDay).fill(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    return cells
  }, [year, month])

  const isPastDay = (day) => {
    const d = new Date(year, month, day)
    d.setHours(0, 0, 0, 0)
    return d < today
  }

  const isSelectedDay = (day) =>
    selectedDateObj &&
    selectedDateObj.getDate() === day &&
    selectedDateObj.getMonth() === month &&
    selectedDateObj.getFullYear() === year

  const availableDateSet = useMemo(() => new Set(availableDates || []), [availableDates])

  const isAvailableDay = (day) => {
    if (isPastDay(day)) return false
    const candidate = new Date(year, month, day)
    return availableDateSet.has(formatDateKey(candidate))
  }

  const handleSelectDate = async (day) => {
    if (!isAvailableDay(day)) return

    const d = new Date(year, month, day)

    setSelectedDateObj(d)
    setSelectedTime(null)
    setStep("time")

    await loadAvailableSlotsForDate(d)
  }

  const handleFastestOption = async () => {
    if (!availableDates.length) return

    const firstDateKey = availableDates[0]
    const d = new Date(`${firstDateKey}T12:00:00`)

    setSelectedDateObj(d)
    setSelectedTime(null)
    setStep("time")

    await loadAvailableSlotsForDate(d)
  }

  const dateLabel = selectedDateObj
    ? `${selectedDateObj.getDate()} ${MONTH_NAMES[selectedDateObj.getMonth()]}`
    : null

  const sessionEndsAt =
    selectedTime && service?.duration
      ? to12Hour(addMinutes(selectedTime, Number(service.duration)))
      : null

  const readyToContinue = Boolean(selectedDateObj && selectedTime)

  const loadAvailableSlotsForDate = async (dateObj, { clearError = true } = {}) => {
    if (!dateObj) return []

    const dateKey = formatDateKey(dateObj)
    setAvailableSlots([])
    if (clearError) setSlotsError(null)
    setSlotsLoading(true)

    try {
      const slotsRes = await fetch(`${API_URL}/api/services/${serviceId}/available-slots?date=${dateKey}`, { cache: "no-store" })
      if (!slotsRes.ok) throw new Error("Unable to load available slots")

      const slotsData = await slotsRes.json()
      const nextSlots = slotsData.slots || []
      setAvailableSlots(nextSlots)
      return nextSlots
    } catch (err) {
      console.error(err)
      setSlotsError(err.message || "Unable to load available slots")
      return []
    } finally {
      setSlotsLoading(false)
    }
  }

  // ---------- Booking / payment (existing backend, unchanged) ----------
  const handleContinueToBook = async () => {
    if (!service || !user || !readyToContinue) return

    setBooking(true)
    try {
      const bookingRes = await fetch(`${API_URL}/api/bookings/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          studentId: user._id,
          scheduledDate: formatDateKey(selectedDateObj),
          scheduledTime: selectedTime,
          studentMessage: "",
        }),
      })

      const bookingData = await bookingRes.json()
      if (!bookingRes.ok || !bookingData.success) {
        if (bookingRes.status === 409) {
          setSelectedTime(null)
          await loadAvailableSlotsForDate(selectedDateObj, { clearError: false })
          setSlotsError("This slot was just booked by another student.")
          return
        }

        throw new Error(bookingData.message || bookingData.error || "Failed to reserve your session")
      }

      const orderRes = await fetch(`${API_URL}/api/payments/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: bookingData.data.bookingId,
        }),
      })

      const orderData = await orderRes.json()
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.message || orderData.error || "Failed to create payment order")
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_YourTestKeyHere",
        amount: orderData.amount,
        currency: orderData.currency,
        name: "CareerOS",
        description: service.title,
        order_id: orderData.orderId,
        handler: async (response) => {
          const verifyRes = await fetch(`${API_URL}/api/payments/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          })

          const verifyData = await verifyRes.json()
          if (verifyRes.ok && verifyData.success) {
            await loadAvailableSlotsForDate(selectedDateObj)
            navigate("/my-sessions", {
              state: {
                user,
                bookingSuccess: true,
                booking: verifyData.booking,
                sessionTitle: service.title,
                counsellorName: counsellor?.fullName,
              },
            })
          } else {
            await fetch(`${API_URL}/api/bookings/release`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ bookingId: bookingData.data.bookingId, reason: "CANCELLED" }),
            })
            await loadAvailableSlotsForDate(selectedDateObj)
            alert("Payment verification failed. Please contact support.")
          }
        },
        modal: {
          ondismiss: async () => {
            await fetch(`${API_URL}/api/bookings/release`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ bookingId: bookingData.data.bookingId, reason: "CANCELLED" }),
            })
            await loadAvailableSlotsForDate(selectedDateObj)
          },
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: { color: "#2563eb" },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (err) {
      console.error(err)
      if (err?.message === "This slot was just booked by another student.") {
        await loadAvailableSlotsForDate(selectedDateObj, { clearError: false })
        setSlotsError("This slot was just booked by another student.")
      } else {
        alert(err.message || "Unable to start booking. Please try again.")
      }
    } finally {
      setBooking(false)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-gray-900 font-sans pb-16">
      <Navbar user={user} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <button
          onClick={() =>
            navigate(`/counsellor/${counsellorId}/sessions`, { state: { user } })
          }
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>
            Consult Counsellors <span className="text-gray-300 mx-1">›</span>{" "}
            {counsellor?.fullName || "Counsellor"}{" "}
            <span className="text-gray-300 mx-1">›</span>{" "}
            <span className="text-gray-800 font-medium">Choose Session</span>
          </span>
        </button>

        {loading && (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
            <p className="text-sm text-gray-500 mt-4 font-medium">Loading session details...</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <p className="text-red-700 font-semibold text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && service && counsellor && (
          <>
            {/* Compact counsellor header */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-4 sm:p-5 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                {counsellor.avatar ? (
                  <img
                    src={counsellor.avatar}
                    alt={counsellor.fullName}
                    className="w-11 h-11 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center font-bold text-sm">
                    {counsellor.fullName?.charAt(0)?.toUpperCase() || "C"}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-base font-bold text-gray-900">{counsellor.fullName}</h1>
                    {counsellor.verified && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {counsellor.professionalTitle || counsellor.specialization}
                    {counsellor.experience ? ` • ${counsellor.experience} years experience` : ""}
                  </p>
                </div>
              </div>
              {counsellor.specialization && (
                <span className="self-start sm:self-auto text-[11px] font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                  {counsellor.specialization}
                </span>
              )}
            </div>

            <div className="mb-5">
              <h2 className="text-xl font-bold text-gray-900">You selected a session</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Review the details below before proceeding to pick your time slot.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
              {/* Date / Time picker + Booking summary */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm">
                  {/* Stepper header */}
                  <div className="flex items-center gap-3 px-5 sm:px-6 pt-5 pb-4">
                    <button
                      onClick={() => setStep("date")}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      {selectedDateObj ? (
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </span>
                      ) : (
                        <span
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            step === "date" ? "border-blue-600 text-blue-600" : "border-gray-300 text-gray-400"
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                        </span>
                      )}
                      <span
                        className={`text-sm ${
                          step === "date" ? "font-bold text-gray-900" : "font-medium text-gray-500"
                        }`}
                      >
                        Choose Date
                      </span>
                    </button>

                    <div className={`flex-1 h-px ${selectedDateObj ? "bg-blue-200" : "bg-gray-200"}`} />

                    <button
                      onClick={() => selectedDateObj && setStep("time")}
                      disabled={!selectedDateObj}
                      className="flex items-center gap-2 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                          step === "time"
                            ? "bg-blue-600 text-white"
                            : "border-2 border-gray-300 text-gray-400"
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                      </span>
                      <span
                        className={`text-sm ${
                          step === "time" ? "font-bold text-gray-900" : "font-medium text-gray-500"
                        }`}
                      >
                        Choose Time
                      </span>
                    </button>
                  </div>

                  <div className="border-t border-gray-100" />

                  {/* Step: Choose Date */}
                  {step === "date" && (
                    <div className="p-5 sm:p-6">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-bold text-gray-900">Choose Date</p>
                        <p className="text-xs font-semibold text-gray-500">{monthLabel}</p>
                      </div>

                      <div className="grid grid-cols-7 gap-y-2 text-center">
                        {WEEKDAYS.map((d) => (
                          <div key={d} className="text-[11px] font-bold text-gray-400 py-1">
                            {d}
                          </div>
                        ))}
                        {calendarCells.map((day, i) =>
                          day === null ? (
                            <div key={`pad-${i}`} />
                          ) : (
                            <button
                              key={day}
                              disabled={!isAvailableDay(day)}
                              onClick={() => handleSelectDate(day)}
                              className={`mx-auto w-9 h-9 rounded-full text-sm flex items-center justify-center transition-colors ${
                                !isAvailableDay(day)
                                  ? "text-gray-300 cursor-not-allowed"
                                  : isSelectedDay(day)
                                  ? "bg-blue-600 text-white font-bold cursor-pointer"
                                  : "text-gray-700 font-medium hover:bg-gray-100 cursor-pointer"
                              }`}
                            >
                              {day}
                            </button>
                          )
                        )}
                      </div>

                      {availableDates.length > 0 && (
                        <button
                          onClick={handleFastestOption}
                          className="w-full mt-5 flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                          <div className="text-left">
                            <p className="text-xs font-bold text-gray-700">Next Available</p>
                            <p className="text-sm text-gray-500 mt-0.5">
                              {availableDates[0]}
                            </p>
                          </div>
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 shrink-0">
                            Fastest option
                          </span>
                        </button>
                      )}

                      <div className="flex items-center justify-between mt-3 bg-white border border-gray-100 rounded-xl px-4 py-3">
                        <p className="text-xs text-gray-500">
                          Times shown in your local timezone
                        </p>
                        <p className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5" />
                          Asia/Kolkata
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Step: Choose Time */}
                  {step === "time" && selectedDateObj && (
                    <div className="p-5 sm:p-6">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-bold text-gray-900">Choose Time</p>
                        <p className="text-xs font-semibold text-gray-500">
                          {monthLabel} • {selectedDateObj.getDate()} selected
                        </p>
                      </div>

                      {slotsLoading && (
                        <div className="text-sm text-gray-500 py-6 text-center">
                          Loading available slots...
                        </div>
                      )}

                      {!slotsLoading && slotsError && (
                        <p className="text-sm text-red-600 py-6 text-center">{slotsError}</p>
                      )}

                      {!slotsLoading && !slotsError && availableSlots.length === 0 && (
                        <p className="text-sm text-gray-500 py-6 text-center">
                          No slots left for this day — pick another date.
                        </p>
                      )}

                      {!slotsLoading && !slotsError && availableSlots.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                          {availableSlots.map((t) => (
                            <button
                              key={t}
                              onClick={() => setSelectedTime(t)}
                              className={`text-sm font-medium py-2 rounded-lg border transition-colors cursor-pointer ${
                                selectedTime === t
                                  ? "bg-blue-600 border-blue-600 text-white"
                                  : "border-gray-200 text-gray-700 hover:border-blue-300"
                              }`}
                            >
                              {to12Hour(t)}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-3 bg-white border border-gray-100 rounded-xl px-4 py-3">
                        <p className="text-xs text-gray-500">
                          Times shown in your local timezone
                        </p>
                        <p className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5" />
                          Asia/Kolkata
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Booking Summary */}
                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 sm:p-6 mt-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-bold text-gray-900">Booking Summary</p>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                        readyToContinue ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {readyToContinue ? "Ready to continue" : "Select date & time"}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    <SummaryRow label="Selected Date" value={dateLabel || "—"} />
                    <SummaryRow label="Selected Time" value={selectedTime ? to12Hour(selectedTime) : "—"} />
                    <SummaryRow label="Session Duration" value={`${service.duration} min`} />
                    <SummaryRow label="Session Ends At" value={sessionEndsAt || "—"} />
                    <div className="flex items-center justify-between pt-2.5 border-t border-gray-100">
                      <span className="text-sm text-gray-600 font-medium">Price</span>
                      <span className="text-lg font-bold text-gray-900">₹{service.price}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleContinueToBook}
                    disabled={!readyToContinue || booking}
                    className="w-full mt-5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm py-3 rounded-xl shadow-sm shadow-blue-200 cursor-pointer transition-colors inline-flex items-center justify-center gap-2"
                  >
                    {booking ? "Reserving your session..." : "Continue"}
                    {!booking && <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Session info sidebar */}
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 sm:p-6 h-fit lg:sticky lg:top-6">
                <h3 className="text-lg font-bold text-gray-900 mb-1.5">{service.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">{service.description}</p>

                <div className="flex flex-wrap gap-2 mb-5">
                  <Pill>{service.category}</Pill>
                  <Pill>
                    <ModeIcon className="w-3 h-3" />
                    {modeLabel}
                  </Pill>
                  {service.topics?.map((topic) => <Pill key={topic}>{topic}</Pill>)}
                </div>

                <div className="grid grid-cols-2 gap-4 pb-5 border-b border-gray-100">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Duration
                    </p>
                    <p className="text-sm font-semibold text-gray-900">{service.duration} min</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Mode
                    </p>
                    <p className="text-sm font-semibold text-gray-900">{modeLabel}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Category
                    </p>
                    <p className="text-sm font-semibold text-gray-900">{service.category}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Popularity
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {service.bookings || 0} bookings
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-5">
                  <p className="text-sm text-gray-700">
                    Price{" "}
                    <span className="text-2xl font-bold text-blue-600">₹{service.price}</span>{" "}
                    <span className="text-xs text-gray-400">/session</span>
                  </p>
                </div>
                <span className="inline-flex items-center mt-2 text-[11px] font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                  Secure checkout next
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ChooseSessionPage
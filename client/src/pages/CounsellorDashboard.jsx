


"use client"

import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { ArrowRight, Bell, CalendarDays, CircleDollarSign, Clock3, Phone, Users, Video } from "lucide-react"
import CounsellorProfilePopup from "./CounsellorProfilePopup"
import Navbar from "../components/Navbar"

const CounsellorDashboard = ({ onLogout }) => {
  const location = useLocation()
  const navigate = useNavigate()

  const [user, setUser] = useState(() => {
    return location.state?.user || JSON.parse(localStorage.getItem("user")) || null
  })

  const [showProfilePopup, setShowProfilePopup] = useState(false)
  const [profileCompleted, setProfileCompleted] = useState(false)
  const [userProfile, setUserProfile] = useState(null)
  const [activeTab, setActiveTab] = useState("overview")

  const [appointments, setAppointments] = useState([])
  const [loadingAppointments, setLoadingAppointments] = useState(false)
  const [earnings, setEarnings] = useState({ total: 0, thisMonth: 0, pending: 0 })
  const [showCreateService, setShowCreateService] = useState(false)
  const [serviceDraft, setServiceDraft] = useState({
    title: "Career Discovery Session",
    category: "Career Counselling",
    description: "A focused one-on-one session to help students clarify career direction, strengths, and next steps.",
    topics: ["Career Clarity", "Self Assessment", "Goal Mapping"],
    mode: "video",
    duration: 45,
    price: 399,
    status: true,
  })
  const [serviceCards, setServiceCards] = useState([
    {
      id: 1,
      title: "Career Discovery Session",
      category: "Career Counselling",
      description: "A focused session to clarify interests, strengths, and the right career direction.",
      topics: ["Career Clarity", "Self Assessment"],
      mode: "video",
      duration: 45,
      price: 399,
      bookings: 32,
      status: true,
    },
    {
      id: 2,
      title: "College Selection Consultation",
      category: "College Guidance",
      description: "Compare colleges, courses, and admission pathways with a practical decision framework.",
      topics: ["College Fit", "Admissions"],
      mode: "video",
      duration: 60,
      price: 599,
      bookings: 21,
      status: true,
    },
    {
      id: 3,
      title: "Quick Career Doubt",
      category: "Career Counselling",
      description: "A short, high-intent session for quick clarity on a specific career question.",
      topics: ["Fast Advice", "Decision Support"],
      mode: "voice",
      duration: 20,
      price: 199,
      bookings: 54,
      status: true,
    },
  ])

  // ✅ REAL messages state (no mock data)
  const [messages, setMessages] = useState([])



  /* ---------------- PROFILE CHECK ---------------- */
  useEffect(() => {
    if (!user || !user._id || user.role !== "counselor") return

    const checkProfileCompletion = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/counsellor-profile/${user._id}`)
        if (!response.ok) {
          setShowProfilePopup(true)
          return
        }

        const profile = await response.json()
        if (profile?.profileCompleted) {
          setUserProfile(profile)
          setProfileCompleted(true)
        } else {
          setShowProfilePopup(true)
        }
      } catch (err) {
        console.error(err)
        setShowProfilePopup(true)
      }
    }

    checkProfileCompletion()
  }, [user])

  useEffect(() => {
    const requestedTab = new URLSearchParams(location.search).get("tab")
    const supportedTabs = ["overview", "appointments", "messages", "profile", "services", "calendar"]

    if (requestedTab && supportedTabs.includes(requestedTab)) {
      setActiveTab(requestedTab)
    }
  }, [location.search])

  /* ---------------- APPOINTMENTS ---------------- */
  useEffect(() => {
    if (user?._id && profileCompleted) {
      fetchAppointments()
    }
  }, [user?._id, profileCompleted])

  const fetchAppointments = async () => {
    setLoadingAppointments(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/appointments/counsellor/${user._id}`)
      if (res.ok) {
        const data = await res.json()
        setAppointments(data)

        const total = data.filter((a) => a.paymentStatus === "paid").reduce((s, a) => s + (a.amount || 0), 0)
        const pending = data.filter((a) => a.status === "confirmed").length

        setEarnings({
          total,
          thisMonth: total,
          pending,
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingAppointments(false)
    }
  }

  const handleProfileComplete = (profileData) => {
    setUserProfile(profileData)
    setProfileCompleted(true)
    setShowProfilePopup(false)
    const updatedUser = { ...user, profileCompleted: true }
    localStorage.setItem("user", JSON.stringify(updatedUser))
    setUser(updatedUser)
  }

  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/appointments/${appointmentId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        fetchAppointments()
      }
    } catch (err) {
      console.error(err)
    }
  }

  /* ---------------- UNREAD COUNT ---------------- */
  const unreadCount = messages.filter((m) => m.unread).length

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getStatusBadge = (status) => {
    const badges = {
      confirmed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      completed: "bg-blue-100 text-blue-800",
      cancelled: "bg-red-100 text-red-800",
    }
    return badges[status] || badges.pending
  }

  const dashboardFeatures = [
    {
      title: "Student Consultations",
      description: "Manage your upcoming and past consultation sessions",
      icon: "👥",
      count: `${appointments.filter((a) => a.status === "confirmed").length} Active`,
      gradient: "from-blue-500 to-blue-600",
    },
    {
      title: "Career Assessments",
      description: "Review and provide feedback on student assessments",
      icon: "📊",
      count: "8 Pending",
      gradient: "from-green-500 to-green-600",
    },
    {
      title: "Resource Library",
      description: "Access and share career guidance resources",
      icon: "📚",
      count: "45 Resources",
      gradient: "from-purple-500 to-purple-600",
    },
    {
      title: "Analytics & Reports",
      description: "Track your counseling impact and student progress",
      icon: "📈",
      count: "View Reports",
      gradient: "from-orange-500 to-orange-600",
    },
  ]

  const MessagingTab = ({ messages, navigate }) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Recent Messages</h2>
        <button
          onClick={() => navigate("/messages")}
          className="text-xs font-bold text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors"
        >
          View All Inbox
        </button>
      </div>

      {messages.length === 0 ? (
        <div className="bg-gray-50 rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm mx-auto flex items-center justify-center">
            <MessageCircle className="text-gray-300 w-8 h-8" />
          </div>
          <p className="text-sm text-gray-500 font-medium">
            No messages yet. They'll appear here when students reach out.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {messages.slice(0, 5).map((msg) => (
            <div
              key={msg.id}
              onClick={() =>
                navigate("/messages", {
                  state: { preSelectedChat: { userId: msg.studentId, name: "Student", role: "student" } },
                })
              }
              className="group bg-white p-4 rounded-2xl border border-gray-100 hover:border-blue-100 hover:shadow-sm transition-all cursor-pointer flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-lg">👨‍🎓</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm font-bold text-gray-900">New Message Request</span>
                  <span className="text-[10px] font-medium text-gray-400">{msg.timestamp}</span>
                </div>
                <p className="text-xs text-gray-500 truncate">{msg.message}</p>
              </div>
              {msg.unread && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview": {
        const nextSession = appointments.find((appointment) => appointment.status === "confirmed") || appointments[0]
        const todayCount = appointments.filter((appointment) => appointment.status === "confirmed").length
        const statCards = [
          { label: "Today's Sessions", value: `${appointments.length || 0}`, icon: <Users className="w-5 h-5" /> },
          { label: "Upcoming Sessions", value: `${todayCount}`, icon: <CalendarDays className="w-5 h-5" /> },
          { label: "This Month", value: `₹${earnings.thisMonth || 0}`, icon: <CircleDollarSign className="w-5 h-5" /> },
          { label: "Average Rating", value: "4.9", icon: <Bell className="w-5 h-5" /> },
          { label: "Revenue", value: `₹${earnings.total || 0}`, icon: <CircleDollarSign className="w-5 h-5" /> },
        ]

        const pendingActions = [
          { title: "2 reschedule requests", description: "Review time changes before noon" },
          { title: "5 unread messages", description: "Students waiting for replies" },
          { title: "Profile completion at 82%", description: "Add qualifications and languages" },
          { title: "3 reviews awaiting response", description: "Reply to recent feedback" },
        ]

        return (
          <div className="space-y-6">
            <div className="rounded-[28px] bg-white border border-gray-200 shadow-sm p-6 lg:p-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Available Today</p>
                  <h2 className="mt-2 text-3xl font-bold text-gray-900">
                    Good Morning, {user?.name || "Dr. Ananya Sharma"}
                  </h2>
                  <p className="mt-3 max-w-3xl text-sm text-gray-600">
                    Your counselling day is organized around the next session, pending actions, and today's schedule so you can move quickly between student conversations.
                  </p>
                </div>
                <div className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                  Online until 6:00 PM
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
              {statCards.map((card, index) => (
                <div key={index} className="rounded-2xl bg-white border border-gray-200 shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <div className="rounded-xl bg-blue-50 p-2 text-blue-600">{card.icon}</div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                      <div className="text-xs text-gray-500">{card.label}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
              <div className="rounded-[28px] bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 text-white p-6 shadow-lg shadow-blue-200/70">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                      Next Session
                    </span>
                    <h3 className="mt-4 text-3xl font-bold">{nextSession?.studentName || "Aarav Mehta"}</h3>
                    <p className="mt-1 text-blue-100">Career Discovery Session</p>
                  </div>
                  <div className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold">Starts in 25 min</div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                  <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-3">
                    <div className="text-xs text-blue-100">Date</div>
                    <div className="mt-1 text-sm font-semibold">{formatDate(nextSession?.date || new Date())}</div>
                  </div>
                  <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-3">
                    <div className="text-xs text-blue-100">Start Time</div>
                    <div className="mt-1 text-sm font-semibold">{nextSession?.time || "09:00 AM"}</div>
                  </div>
                  <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-3">
                    <div className="text-xs text-blue-100">Duration</div>
                    <div className="mt-1 text-sm font-semibold">45 min</div>
                  </div>
                  <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-3">
                    <div className="text-xs text-blue-100">Mode</div>
                    <div className="mt-1 flex items-center gap-2 text-sm font-semibold">
                      {nextSession?.sessionType === "video" ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                      {nextSession?.sessionType === "video" ? "Video Call" : "Voice Call"}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button className="rounded-xl bg-white text-blue-700 px-4 py-2 text-sm font-semibold shadow-sm hover:bg-blue-50 transition-colors">
                    View Student
                  </button>
                  <button className="rounded-xl bg-white/12 text-white px-4 py-2 text-sm font-semibold border border-white/20 hover:bg-white/20 transition-colors">
                    Message
                  </button>
                  <button className="rounded-xl bg-white text-blue-700 px-4 py-2 text-sm font-semibold shadow-sm hover:bg-blue-50 transition-colors">
                    Join Session
                  </button>
                </div>
              </div>

              <div className="rounded-[28px] bg-white border border-gray-200 shadow-sm p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Pending Actions</h3>
                  <button className="rounded-full bg-gray-100 p-2 text-gray-600">
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  {pendingActions.map((item) => (
                    <div key={item.title} className="flex items-start gap-3 rounded-2xl bg-gray-50 p-3">
                      <div className="mt-1 rounded-lg bg-white p-2 text-blue-600 shadow-sm">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{item.title}</div>
                        <div className="text-xs text-gray-500">{item.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
              <div className="rounded-[28px] bg-white border border-gray-200 shadow-sm p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Today's Schedule</h3>
                    <p className="text-sm text-gray-500">Chronological appointments for the day</p>
                  </div>
                  <button className="text-sm font-semibold text-blue-600">View All</button>
                </div>

                <div className="mt-5 space-y-3">
                  {appointments.length > 0 ? (
                    appointments.slice(0, 4).map((appointment) => (
                      <div key={appointment._id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
                            <Users className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{appointment.studentName}</div>
                            <div className="text-xs text-gray-500">{appointment.message || "Career counselling session"}</div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                          <span>{appointment.time}</span>
                          <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                            {appointment.sessionType === "video" ? "Video" : "Phone"}
                          </span>
                          <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
                            {appointment.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
                      No student appointments yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-[28px] bg-white border border-gray-200 shadow-sm p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">This Week</h3>
                      <p className="text-sm text-gray-500">Session density preview</p>
                    </div>
                    <div className="rounded-full bg-gray-100 p-2 text-gray-600">
                      <CalendarDays className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-7 gap-2 text-center">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                      <div key={day} className="rounded-2xl border border-gray-200 px-2 py-3 text-xs font-semibold text-gray-600">
                        <div>{day}</div>
                        <div className={`mt-2 mx-auto h-2 w-2 rounded-full ${index < 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] bg-white border border-gray-200 shadow-sm p-5">
                  <h3 className="text-lg font-bold text-gray-900">Booking Logic</h3>
                  <div className="mt-4 space-y-3 text-sm text-gray-600">
                    <p>One shared availability calendar applies to all services.</p>
                    <p>Booked time and buffer periods block every service automatically.</p>
                    <p>Students can choose different durations and modes, but appointments never overlap.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

      case "appointments":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Student Appointments</h3>
                <p className="text-gray-600">Manage your counselling sessions</p>
              </div>
              <button
                onClick={fetchAppointments}
                className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
              >
                🔄 Refresh
              </button>
            </div>

            {loadingAppointments ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : appointments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {appointments.map((appointment) => (
                  <div
                    key={appointment._id}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
                  >
                    {/* Student Header */}
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            <span className="text-2xl">👨‍🎓</span>
                          </div>
                          <div>
                            <h4 className="font-bold">{appointment.studentName}</h4>
                            <p className="text-sm text-blue-100">{appointment.studentEmail}</p>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(appointment.status)}`}
                        >
                          {appointment.status?.charAt(0).toUpperCase() + appointment.status?.slice(1)}
                        </span>
                      </div>
                    </div>

                    {/* Appointment Details */}
                    <div className="p-6">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-blue-600">📅</span>
                          <span className="text-gray-700">{formatDate(appointment.date)}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-blue-600">🕐</span>
                          <span className="text-gray-700">{appointment.time}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-blue-600">{appointment.sessionType === "video" ? "🎥" : "📞"}</span>
                          <span className="text-gray-700 capitalize">{appointment.sessionType} Call</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-green-600">💰</span>
                          <span className="font-semibold text-green-700">₹{appointment.amount}</span>
                        </div>
                      </div>

                      {appointment.message && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-500 mb-1">Student's Message:</p>
                          <p className="text-sm text-gray-700">{appointment.message}</p>
                        </div>
                      )}

                      {/* Payment Status */}
                      <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center space-x-2">
                          <span className="text-green-600">✅</span>
                          <span className="text-sm font-medium text-green-700">
                            Payment: {appointment.paymentStatus === "paid" ? "Received" : appointment.paymentStatus}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {appointment.status === "confirmed" && (
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <button
                            onClick={() => updateAppointmentStatus(appointment._id, "completed")}
                            className="py-2 px-4 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                          >
                            ✓ Complete
                          </button>
                          <button
                            onClick={() => updateAppointmentStatus(appointment._id, "cancelled")}
                            className="py-2 px-4 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                          >
                            ✕ Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <div className="text-5xl mb-4">📅</div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">No Appointments Yet</h4>
                <p className="text-gray-600">When students book sessions with you, they'll appear here.</p>
              </div>
            )}
          </div>
        )

      case "messages":
        return <MessagingTab messages={messages} navigate={navigate} />

      case "services":
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-[24px] border border-gray-200 shadow-sm p-6 sm:p-7">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-3xl font-bold text-gray-900">My Services</h3>
                  <p className="text-gray-600 mt-1">Manage the counselling sessions students can book with you</p>
                </div>
                <button
                  onClick={() => setShowCreateService(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-full font-semibold text-sm shadow-sm shadow-blue-200 transition-colors"
                >
                  + Create Service
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {serviceCards.map((service) => (
                <div key={service.id} className="bg-white rounded-[24px] border border-gray-200 shadow-sm p-5 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-5">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      {service.category}
                    </span>
                    <button className="rounded-full bg-gray-100 p-2 text-gray-500">✎</button>
                  </div>

                  <div className="text-2xl font-bold text-gray-900 leading-tight mb-3">{service.title}</div>
                  <p className="text-sm text-gray-600 leading-6 mb-6">{service.description}</p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {service.topics.map((topic) => (
                      <span key={topic} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                        {topic}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-auto">
                    <div className="rounded-2xl bg-gray-100 px-3 py-3">
                      <div className="text-xs text-gray-500">Mode</div>
                      <div className="mt-1 text-sm font-semibold text-gray-800 capitalize">{service.mode === "video" ? "Video Call" : "Voice Call"}</div>
                    </div>
                    <div className="rounded-2xl bg-gray-100 px-3 py-3">
                      <div className="text-xs text-gray-500">Duration</div>
                      <div className="mt-1 text-sm font-semibold text-gray-800">{service.duration} minutes</div>
                    </div>
                    <div className="rounded-2xl bg-gray-100 px-3 py-3">
                      <div className="text-xs text-gray-500">Price</div>
                      <div className="mt-1 text-sm font-semibold text-gray-800">₹{service.price}</div>
                    </div>
                    <div className="rounded-2xl bg-gray-100 px-3 py-3">
                      <div className="text-xs text-gray-500">Bookings</div>
                      <div className="mt-1 text-sm font-semibold text-gray-800">{service.bookings}</div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center gap-4 text-sm font-medium">
                    <span className="flex items-center gap-2 text-green-600">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      Active
                    </span>
                    <span className="text-gray-500">Edit</span>
                    <span className="text-gray-500">Archive</span>
                  </div>
                </div>
              ))}
            </div>

            {showCreateService && (
              <div className="fixed inset-0 z-50 bg-gray-900/35 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="w-full max-w-6xl rounded-[24px] bg-white shadow-2xl overflow-hidden">
                  <div className="bg-white border-b border-gray-200 px-6 py-5 flex items-center justify-between">
                    <div>
                      <h4 className="text-2xl font-bold text-gray-900">Create Service</h4>
                      <p className="text-sm text-gray-500 mt-1">Design a new counselling service students can book from your profile.</p>
                    </div>
                    <button
                      onClick={() => setShowCreateService(false)}
                      className="rounded-full bg-gray-100 text-gray-600 px-3 py-2 text-sm font-semibold"
                    >
                      Close
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-0">
                    <div className="p-6 border-r border-gray-200">
                      <div className="space-y-6">
                        <div>
                          <div className="text-sm font-semibold text-gray-900 mb-2">Service Details</div>
                          <p className="text-sm text-gray-500">Define what students can book. Availability is managed separately.</p>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Service Title</label>
                          <input
                            value={serviceDraft.title}
                            onChange={(e) => setServiceDraft((prev) => ({ ...prev, title: e.target.value }))}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                          <select
                            value={serviceDraft.category}
                            onChange={(e) => setServiceDraft((prev) => ({ ...prev, category: e.target.value }))}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                          >
                            <option>Career Counselling</option>
                            <option>College Guidance</option>
                            <option>Psychometric Review</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                          <textarea
                            rows={4}
                            value={serviceDraft.description}
                            onChange={(e) => setServiceDraft((prev) => ({ ...prev, description: e.target.value }))}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-semibold text-gray-700">Topics Covered</label>
                            <button className="text-sm font-semibold text-blue-600">+ Add</button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {serviceDraft.topics.map((topic) => (
                              <span key={topic} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                {topic}
                              </span>
                            ))}
                          </div>
                          <input
                            className="mt-3 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                            placeholder="Add a topic"
                          />
                        </div>

                        <div>
                          <div className="text-sm font-semibold text-gray-700 mb-2">Session Mode</div>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() => setServiceDraft((prev) => ({ ...prev, mode: "video" }))}
                              className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                                serviceDraft.mode === "video" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              Video Call
                            </button>
                            <button
                              onClick={() => setServiceDraft((prev) => ({ ...prev, mode: "voice" }))}
                              className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                                serviceDraft.mode === "voice" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              Voice Call
                            </button>
                          </div>
                        </div>

                        <div>
                          <div className="text-sm font-semibold text-gray-700 mb-2">Duration</div>
                          <div className="grid grid-cols-4 gap-2">
                            {[20, 30, 45, 60, 90, 120].map((minutes) => (
                              <button
                                key={minutes}
                                onClick={() => setServiceDraft((prev) => ({ ...prev, duration: minutes }))}
                                className={`rounded-full border px-3 py-2 text-sm font-medium ${
                                  serviceDraft.duration === minutes
                                    ? "border-blue-600 bg-blue-600 text-white"
                                    : "border-gray-200 text-gray-600"
                                }`}
                              >
                                {minutes} min
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Price</label>
                          <div className="relative">
                            <span className="absolute left-4 top-3 text-gray-500">₹</span>
                            <input
                              type="number"
                              value={serviceDraft.price}
                              onChange={(e) => setServiceDraft((prev) => ({ ...prev, price: Number(e.target.value) }))}
                              className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-8 pr-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="rounded-2xl bg-gray-50 p-4 flex items-center justify-between">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">Service Status</div>
                            <div className="text-sm text-gray-500">Active services are visible to students immediately.</div>
                          </div>
                          <button
                            onClick={() => setServiceDraft((prev) => ({ ...prev, status: !prev.status }))}
                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                              serviceDraft.status ? "bg-blue-600" : "bg-gray-300"
                            }`}
                          >
                            <span
                              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                                serviceDraft.status ? "translate-x-6" : "translate-x-1"
                              }`}
                            />
                          </button>
                        </div>

                        <div className="flex gap-3">
                          <button className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700">
                            Save Draft
                          </button>
                          <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
                            Create Service
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-gray-50">
                      <div className="mb-4">
                        <div className="text-lg font-bold text-gray-900">Live Preview</div>
                        <div className="text-sm text-gray-500">How this service will appear to students.</div>
                      </div>

                      <div className="rounded-[24px] bg-gradient-to-br from-blue-600 to-blue-500 p-5 text-white shadow-lg">
                        <div className="flex items-center justify-between text-sm font-semibold">
                          <span>{serviceDraft.category}</span>
                          <span>{serviceDraft.duration} min</span>
                        </div>
                        <h5 className="mt-4 text-2xl font-bold">{serviceDraft.title}</h5>
                        <p className="mt-3 text-sm text-blue-100 leading-6">{serviceDraft.description}</p>
                        <div className="mt-5 flex items-center justify-between">
                          <span className="inline-flex items-center gap-2 text-sm font-semibold">
                            {serviceDraft.mode === "video" ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                            {serviceDraft.mode === "video" ? "Video Call" : "Voice Call"}
                          </span>
                          <span className="text-lg font-bold">₹{serviceDraft.price}</span>
                        </div>
                      </div>

                      <div className="mt-5 rounded-2xl bg-white p-4 border border-gray-200">
                        <div className="flex flex-wrap gap-2">
                          {serviceDraft.topics.map((topic) => (
                            <span key={topic} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                              {topic}
                            </span>
                          ))}
                        </div>
                        <div className="mt-4 flex items-center justify-between text-sm">
                          <span className="text-gray-600">Status</span>
                          <span className="flex items-center gap-2 font-semibold text-green-600">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            Active
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      case "calendar":
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Calendar</h3>
              <p className="text-gray-600 mb-6">Plan and review your counselling schedule.</p>
              <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
                Calendar view will be added here for your upcoming counselling sessions.
              </div>
            </div>
          </div>
        )

      case "profile":
        return (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Your Profile</h3>
            {profileCompleted && userProfile ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                    <h4 className="font-bold text-blue-900 mb-3">Personal Information</h4>
                    <p className="text-sm text-blue-700 mb-1">
                      <strong>Name:</strong> {userProfile.fullName}
                    </p>
                    <p className="text-sm text-blue-700 mb-1">
                      <strong>Location:</strong> {userProfile.location}
                    </p>
                    <p className="text-sm text-blue-700">
                      <strong>Phone:</strong> {userProfile.phoneNumber}
                    </p>
                  </div>
                  <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                    <h4 className="font-bold text-green-900 mb-3">Professional Details</h4>
                    <p className="text-sm text-green-700 mb-1">
                      <strong>Specialization:</strong> {userProfile.specialization}
                    </p>
                    <p className="text-sm text-green-700 mb-1">
                      <strong>Experience:</strong> {userProfile.experience} years
                    </p>
                    <p className="text-sm text-green-700">
                      <strong>Fee:</strong> ₹{userProfile.consultationFee}/session
                    </p>
                  </div>
                </div>
                <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
                  <h4 className="font-bold text-purple-900 mb-3">Expertise Areas</h4>
                  <div className="flex flex-wrap gap-2">
                    {userProfile.expertise?.map((area, index) => (
                      <span key={index} className="bg-purple-200 text-purple-800 px-3 py-1 rounded-full text-sm">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Complete your profile to start helping students</p>
                <button
                  onClick={() => setShowProfilePopup(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium"
                >
                  Complete Profile
                </button>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={onLogout} />

      {/* Profile Status Banner */}
      {profileCompleted ? (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mx-4 mt-4 rounded-r-lg">
          <div className="flex items-center">
            <span className="text-green-400 text-xl">✅</span>
            <p className="ml-3 text-sm text-green-700 font-medium">Profile completed! You're ready to help students.</p>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mx-4 mt-4 rounded-r-lg">
          <div className="flex items-center">
            <span className="text-yellow-400 text-xl">⚠️</span>
            <div className="ml-3">
              <p className="text-sm text-yellow-700 font-medium">
                Complete your profile to start accepting consultations.
              </p>
              <button
                onClick={() => setShowProfilePopup(true)}
                className="mt-2 text-yellow-800 underline hover:text-yellow-900"
              >
                Complete Profile Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{renderTabContent()}</main>

      {/* Profile Popup */}
      {showProfilePopup && (
        <CounsellorProfilePopup
          user={user}
          onComplete={handleProfileComplete}
          onClose={() => setShowProfilePopup(false)}
        />
      )}
    </div>
  )
}

export default CounsellorDashboard

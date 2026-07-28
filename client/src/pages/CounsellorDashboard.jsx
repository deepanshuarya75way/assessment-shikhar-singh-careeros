


"use client"

import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Grid, MessageSquare } from "react-feather"
import CounsellorProfilePopup from "./CounsellorProfilePopup"

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
      case "overview":
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Bookings</p>
                    <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">👨‍🎓</span>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">This Month</p>
                    <p className="text-2xl font-bold text-gray-900">₹{earnings.thisMonth}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">💰</span>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Earnings</p>
                    <p className="text-2xl font-bold text-gray-900">₹{earnings.total}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">💵</span>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Upcoming</p>
                    <p className="text-2xl font-bold text-gray-900">{earnings.pending}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📅</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {dashboardFeatures.map((feature, index) => (
                <div
                  key={index}
                  className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 ${
                    !profileCompleted ? "opacity-75" : ""
                  }`}
                  onClick={() => {
                    if (!profileCompleted) {
                      alert("Please complete your profile first!")
                      setShowProfilePopup(true)
                      return
                    }
                    if (feature.title === "Student Consultations") {
                      setActiveTab("appointments")
                    }
                  }}
                >
                  <div className="p-6">
                    <div
                      className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 mx-auto`}
                    >
                      <span className="text-3xl">{feature.icon}</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">{feature.title}</h3>
                    <p className="text-gray-600 text-sm text-center leading-relaxed mb-4">{feature.description}</p>
                    <div className="text-center">
                      <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                        {feature.count}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

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
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">👨‍🏫</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">CareerOS</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setActiveTab("overview")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-600 text-white text-sm font-semibold shadow-sm shadow-purple-200 hover:bg-purple-700 transition-all duration-200"
              >
                <Grid className="w-4 h-4" />
                Dashboard
              </button>

              <button
               onClick={() => navigate("/messages")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-gray-900 text-sm font-semibold border border-gray-200 shadow-sm hover:bg-gray-50 transition-all duration-200"
              >
                <MessageSquare className="w-4 h-4" />
                Messages
              </button>

              <button
                onClick={() => {
                  localStorage.removeItem("user")
                  setUser(null)
                  navigate("/")
                  if (onLogout) onLogout()
                }}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center text-white font-semibold hover:shadow-lg transition-shadow"
              >
                {user?.email?.charAt(0).toUpperCase() || "C"}
              </button>
            </div>
          </div>
        </div>
      </header>

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: "overview", name: "Overview", icon: "📊" },
              {
                id: "appointments",
                name: "Appointments",
                icon: "📅",
                badge: appointments.filter((a) => a.status === "confirmed").length,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-purple-500 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span>{tab.icon}</span>
                {tab.name}
                {tab.badge > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-2 py-1">{tab.badge}</span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

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

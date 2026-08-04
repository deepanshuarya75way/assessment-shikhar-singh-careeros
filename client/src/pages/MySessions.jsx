"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"

const MySessions = ({ onLogout }) => {
  const navigate = useNavigate()
  const [user] = useState(() => JSON.parse(localStorage.getItem("user")) || null)
  const [bookedSessions, setBookedSessions] = useState([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [showAvatarMenu, setShowAvatarMenu] = useState(false)
  const [avatarImage, setAvatarImage] = useState(() => localStorage.getItem("userAvatar") || null)

  useEffect(() => {
    const handleAvatarUpdate = () => {
      setAvatarImage(localStorage.getItem("userAvatar"))
    }
    window.addEventListener("userAvatarUpdated", handleAvatarUpdate)
    window.addEventListener("storage", handleAvatarUpdate)
    return () => {
      window.removeEventListener("userAvatarUpdated", handleAvatarUpdate)
      window.removeEventListener("storage", handleAvatarUpdate)
    }
  }, [])

  useEffect(() => {
    if (!user?._id) {
      navigate("/")
      return
    }
    fetchBookedSessions()
  }, [user?._id])

  const fetchBookedSessions = async () => {
    setLoadingSessions(true)
    try {
      const apiUrl = import.meta.env.VITE_API_URL || ""
      const response = await fetch(`${apiUrl}/api/appointments/student/${user._id}`)
      if (response.ok) {
        const data = await response.json()
        setBookedSessions(data)
      }
    } catch (error) {
      console.error("Error fetching booked sessions:", error)
      setBookedSessions([])
    } finally {
      setLoadingSessions(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("userAvatar")
    navigate("/")
    if (onLogout) onLogout()
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
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
      confirmed: "bg-green-100 text-green-800 border-green-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      completed: "bg-blue-100 text-blue-800 border-blue-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
    }
    return badges[status?.toLowerCase()] || badges.pending
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Navbar user={user} onLogout={onLogout} />

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
              <span>📅</span> My Booked Sessions
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              View and track all your scheduled career counselling appointments
            </p>
          </div>

          <button
            onClick={() => navigate("/consult-counsellor", { state: { user } })}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <span>👨‍🏫</span>
            <span>Book New Session</span>
          </button>
        </div>

        {loadingSessions ? (
          <div className="flex justify-center items-center py-20 bg-white rounded-2xl shadow-sm border border-gray-200/80">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : bookedSessions.length > 0 ? (
          <div className="grid gap-4">
            {bookedSessions.map((session, index) => (
              <div
                key={session._id || index}
                className="bg-white rounded-2xl border border-gray-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center shrink-0">
                    <span className="text-2xl">👨‍🏫</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      {session.counsellorName || session.counsellorId?.name || "Counsellor Session"}
                    </h3>
                    <p className="text-sm text-gray-600 font-medium mt-0.5">
                      📅 {formatDate(session.date)} &nbsp;•&nbsp; ⏰ {session.time}
                    </p>
                    {session.topic && (
                      <p className="text-xs text-gray-500 mt-1">Topic: {session.topic}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${getStatusBadge(
                      session.status
                    )}`}
                  >
                    {session.status || "pending"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-12 text-center">
            <div className="text-5xl mb-4">📅</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Sessions Booked Yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto text-sm">
              Schedule one-on-one sessions with expert career counsellors to get tailored advice for your future.
            </p>
            <button
              onClick={() => navigate("/consult-counsellor", { state: { user } })}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all cursor-pointer"
            >
              <span>👨‍🏫</span>
              <span>Find & Book a Counsellor</span>
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

export default MySessions

"use client"

import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Briefcase, LayoutGrid, MessageSquare, CalendarDays, ClipboardList, HandCoins, CalendarRange } from "lucide-react"
import AvatarMenu from "../pages/AvatarMenu"

const Navbar = ({ user: propUser, onLogout, onAuthToggle, isSignUp }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(() => {
    return propUser || JSON.parse(localStorage.getItem("user")) || null
  })

  useEffect(() => {
    if (propUser) {
      setUser(propUser)
    }
  }, [propUser])

  const [showAvatarMenu, setShowAvatarMenu] = useState(false)
  const [avatarImage, setAvatarImage] = useState(() => {
    return localStorage.getItem("userAvatar") || user?.avatar || user?.profilePicture || null
  })

  useEffect(() => {
    const handleAvatarUpdate = () => {
      const stored = localStorage.getItem("userAvatar")
      if (stored) setAvatarImage(stored)
    }
    window.addEventListener("userAvatarUpdated", handleAvatarUpdate)
    window.addEventListener("storage", handleAvatarUpdate)
    return () => {
      window.removeEventListener("userAvatarUpdated", handleAvatarUpdate)
      window.removeEventListener("storage", handleAvatarUpdate)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("userAvatar")
    setUser(null)
    setAvatarImage(null)
    if (onLogout) {
      onLogout()
    } else {
      navigate("/")
    }
  }

  const isCounsellor = user?.role === "counselor" || user?.role === "counsellor"
  const dashboardPath = isCounsellor ? "/counselor-dashboard" : "/student-dashboard"
  const isCounsellorWorkspace = isCounsellor && ["/counselor-dashboard", "/counsellor-services", "/counsellor-availability"].includes(location.pathname)

  const counsellorActions = [
    {
      label: "Appointments",
      icon: HandCoins,
      path: "/counselor-dashboard?tab=appointments",
    },
    {
      label: "Services",
      icon: ClipboardList,
      path: "/counsellor-services",
    },
    {
      label: "Availability",
      icon: CalendarRange,
      path: "/counsellor-availability",
    },
    {
      label: "Calendar",
      icon: CalendarDays,
      path: "/counselor-dashboard?tab=calendar",
    },
  ]

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      {/* Floating Navbar Card strictly matching Image 1 & 2 */}
      <header className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-3.5 px-6 my-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-200 shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 leading-tight">CareerOS</h1>
            <p className="text-[11px] text-gray-400 font-medium">Career planning dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {(!user || onAuthToggle) ? (
            <button
              onClick={onAuthToggle}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full font-semibold text-xs flex items-center gap-2 shadow-sm shadow-blue-200 cursor-pointer transition-colors"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate(dashboardPath)}
                className="bg-blue-600 text-white px-4 py-2 rounded-full font-semibold text-xs flex items-center gap-2 shadow-sm shadow-blue-200 cursor-pointer"
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Dashboard</span>
              </button>

              {isCounsellorWorkspace &&
                counsellorActions.map((action) => {
                  const Icon = action.icon
                  return (
                    <button
                      key={action.label}
                      onClick={() => navigate(action.path)}
                      className="text-gray-600 hover:text-gray-900 font-semibold text-xs flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-100/70 transition-colors cursor-pointer"
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{action.label}</span>
                    </button>
                  )
                })}

              <button
                onClick={() => navigate("/messages")}
                className="text-gray-600 hover:text-gray-900 font-semibold text-xs flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-100/70 transition-colors cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Messages</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowAvatarMenu(!showAvatarMenu)}
                  className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center font-bold text-xs text-gray-800 hover:shadow-md transition-shadow cursor-pointer overflow-hidden border border-gray-200 shrink-0"
                >
                  {avatarImage ? (
                    <img src={avatarImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span>{user?.name ? user.name.slice(0, 2).toUpperCase() : user?.email?.charAt(0).toUpperCase() || "U"}</span>
                  )}
                </button>

                <AvatarMenu
                  isOpen={showAvatarMenu}
                  onClose={() => setShowAvatarMenu(false)}
                  onNavigateToProfile={() => {
                    setShowAvatarMenu(false)
                    navigate("/profile")
                  }}
                  onLogout={handleLogout}
                  user={user}
                />
              </div>
            </>
          )}
        </div>
      </header>
    </div>
  )
}

export default Navbar

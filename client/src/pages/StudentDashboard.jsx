
"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Grid, MessageSquare } from "react-feather"
import AvatarMenu from "./AvatarMenu"
import ProfileCompletionPopup from "./ProfileCompletionPopup"
import CollegeCard from "../components/CollegeCard"
import RecommendationSkeleton from "../components/RecommendationSkeleton"

const StudentDashboard = ({ onLogout }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(() => {
    return JSON.parse(localStorage.getItem("user")) || null
  })

  const [showProfilePopup, setShowProfilePopup] = useState(false)
  const [profileCompleted, setProfileCompleted] = useState(() => {
    const storedUser = JSON.parse(localStorage.getItem("user")) || {}
    return storedUser.profileCompleted || false
  })
  const [userProfile, setUserProfile] = useState(null)
  const [showAvatarMenu, setShowAvatarMenu] = useState(false)
  const [avatarImage, setAvatarImage] = useState(() => {
    return localStorage.getItem("userAvatar") || null
  })

  const [recommendations, setRecommendations] = useState([])
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)
  const [recommendationError, setRecommendationError] = useState(null)
  const [totalEligible, setTotalEligible] = useState(0)
  const [savedColleges, setSavedColleges] = useState([])

  const [bookedSessions, setBookedSessions] = useState([])
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [activeTab, setActiveTab] = useState("features")

  useEffect(() => {
    if (user?._id && !profileCompleted) {
      checkProfileStatus()
    }
  }, [user?._id])

  useEffect(() => {
    if (user?._id && profileCompleted) {
      fetchRecommendations()
      fetchSavedColleges()
    }
  }, [user?._id, profileCompleted])

  useEffect(() => {
    if (user?._id) {
      fetchBookedSessions()
    }
  }, [user?._id])

  useEffect(() => {
    if (location.state?.appointmentBooked) {
      alert("Your appointment has been booked successfully!")
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const checkProfileStatus = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/profile/${user._id}`)
      if (response.ok) {
        const profile = await response.json()
        setUserProfile(profile)
        setProfileCompleted(true)
        const updatedUser = { ...user, profileCompleted: true }
        localStorage.setItem("user", JSON.stringify(updatedUser))
        setUser(updatedUser)
      }
    } catch (error) {
      console.error("Error checking profile status:", error)
    }
  }

  const fetchRecommendations = async () => {
    setLoadingRecommendations(true)
    setRecommendationError(null)

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/recommendations/${user._id}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch recommendations")
      }

      const data = await response.json()

      setRecommendations(data.recommended || [])
      setTotalEligible(data.totalEligible || 0)
    } catch (error) {
      console.error("Error fetching recommendations:", error)
      setRecommendationError(error.message)
      setRecommendations([])
    } finally {
      setLoadingRecommendations(false)
    }
  }

  const fetchSavedColleges = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/recommendations/saved/${user._id}`)
      if (response.ok) {
        const data = await response.json()
        setSavedColleges(data.savedColleges.map((c) => c.itemId._id))
      }
    } catch (error) {
      console.error("Error fetching saved colleges:", error)
    }
  }

  const fetchBookedSessions = async () => {
    setLoadingSessions(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/appointments/student/${user._id}`)
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

  const handleProfileComplete = (profileData) => {
    setUserProfile(profileData)
    setProfileCompleted(true)
    setShowProfilePopup(false)
    const updatedUser = { ...user, profileCompleted: true }
    localStorage.setItem("user", JSON.stringify(updatedUser))
    setUser(updatedUser)
  }

  const handleAvatarUpdate = (imageUrl) => {
    setAvatarImage(imageUrl)
    localStorage.setItem("userAvatar", imageUrl)
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("userAvatar")
    setUser(null)
    setAvatarImage(null)
    navigate("/")
    if (onLogout) onLogout()
  }

  const handleSaveCollege = async (college) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/recommendations/save/${user._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemType: "College",
          itemId: college._id,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.isSaved) {
          setSavedColleges((prev) => [...prev, college._id])
        } else {
          setSavedColleges((prev) => prev.filter((id) => id !== college._id))
        }
      }
    } catch (error) {
      console.error("Error saving college:", error)
    }
  }

  const handleApplyCollege = (college) => {
    console.log("Applied to college:", college.name)
  }

  const features = [
    {
      title: "Explore Colleges",
      description: "Discover colleges that match your interests and academic profile",
      icon: "🏫",
      gradient: "from-blue-500 to-blue-600",
      hoverGradient: "from-blue-600 to-blue-700",
    },
    {
      title: "Generate Career Roadmap",
      description: "Get personalized career guidance based on your profile and goals",
      icon: "🗺",
      gradient: "from-green-500 to-green-600",
      hoverGradient: "from-green-600 to-green-700",
    },
    {
      title: "Still Confused?",
      description: "Take our comprehensive assessment to find your perfect career path",
      icon: "🤔",
      gradient: "from-yellow-500 to-orange-500",
      hoverGradient: "from-yellow-600 to-orange-600",
    },
    {
      title: "Consult Counsellor",
      description: "Get expert advice from professional career counsellors",
      icon: "👨‍🏫",
      gradient: "from-pink-500 to-pink-600",
      hoverGradient: "from-pink-600 to-pink-700",
    },
    {
      title: "ATS Resume Builder",
      description: "Create professional, ATS-compliant resumes tailored to your career goals",
      icon: "📄",
      gradient: "from-red-500 to-red-600",
      hoverGradient: "from-red-600 to-red-700",
    },
    {
      title: "AR Campus Visualizer",
      description: "Experience virtual campus tours and explore college facilities in AR",
      icon: "🥽",
      gradient: "from-cyan-500 to-cyan-600",
      hoverGradient: "from-cyan-600 to-cyan-700",
    },
  ]

  const handleFeatureClick = (featureTitle) => {
    if (!profileCompleted) {
      alert("Please complete your profile first to access this feature!")
      setShowProfilePopup(true)
      return
    }
    if (featureTitle === "Explore Colleges") navigate("/explore-colleges")
    if (featureTitle === "Generate Career Roadmap") navigate("/career-roadmap-form")
    if (featureTitle === "Consult Counsellor") navigate("/consult-counsellor", { state: { user } })
    if (featureTitle === "Still Confused?") navigate("/psychometric-test", { state: { user } })
    if (featureTitle === "ATS Resume Builder") navigate("/resume-builder")
    if (featureTitle === "AR Campus Visualizer") navigate("/ar-campus-visualizer")
  }

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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">🎓</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">CareerOS</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold shadow-sm shadow-blue-200 hover:bg-blue-700 transition-all duration-200"
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

              <div className="relative">
                <button
                  onClick={() => setShowAvatarMenu(!showAvatarMenu)}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
                >
                  {avatarImage ? (
                    <img src={avatarImage || "/placeholder.svg"} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span>{user?.email?.charAt(0).toUpperCase() || "U"}</span>
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
            </div>
          </div>
        </div>
      </header>

      {profileCompleted ? (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mx-4 mt-4 rounded-r-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-green-400 text-xl">✅</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700 font-medium">
                Profile completed! You're all set to explore your career options.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mx-4 mt-4 rounded-r-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-yellow-400 text-xl">⚠</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700 font-medium">
                Complete your profile to unlock all features and get personalized recommendations.
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
            <button
              onClick={() => setActiveTab("features")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "features"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              🎯 Features
            </button>
            <button
              onClick={() => setActiveTab("sessions")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === "sessions"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              📅 My Sessions
              {bookedSessions.length > 0 && (
                <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {bookedSessions.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "features" && (
          <>
            <div className="mb-12 text-center">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Your Career Journey Starts Here</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Explore colleges, get career guidance, and plan your future with our comprehensive tools designed just
                for students like you.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 ${
                    !profileCompleted ? "opacity-75" : ""
                  }`}
                  onClick={() => handleFeatureClick(feature.title)}
                >
                  <div className="p-6">
                    <div
                      className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 mx-auto transform transition-transform duration-200 hover:scale-110`}
                    >
                      <span className="text-3xl">{feature.icon}</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">{feature.title}</h3>
                    <p className="text-gray-600 text-sm text-center leading-relaxed">{feature.description}</p>
                  </div>
                  <div className="px-6 pb-6">
                    <button
                      className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                        profileCompleted
                          ? `bg-gradient-to-r ${feature.gradient} hover:${feature.hoverGradient} text-white shadow-md hover:shadow-lg`
                          : "bg-gray-100 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      {profileCompleted ? "Get Started" : "Complete Profile First"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {profileCompleted && (
              <div className="mt-16">
                <div className="mb-8">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h3 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                        <span>🎯</span>
                        AI-Powered Recommendations
                      </h3>
                      <p className="text-gray-600">
                        Personalized college recommendations powered by our ML engine
                        {totalEligible > 0 && (
                          <span className="ml-2 text-sm text-blue-600 font-medium">
                            ({totalEligible} colleges match your eligibility)
                          </span>
                        )}
                      </p>
                    </div>

                    <button
                      onClick={fetchRecommendations}
                      disabled={loadingRecommendations}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                    >
                      <span className={loadingRecommendations ? "animate-spin" : ""}>🔄</span>
                      Refresh
                    </button>
                  </div>

                  <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-full border border-cyan-100">
                    <span className="text-cyan-600">🧠</span>
                    <span className="text-sm text-cyan-700 font-medium">
                      Powered by 7-factor ML scoring with explainable AI
                    </span>
                  </div>
                </div>

                {recommendationError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
                    <div className="flex items-start gap-3">
                      <span className="text-red-500 text-xl">⚠️</span>
                      <div>
                        <h4 className="font-semibold text-red-800">Error Loading Recommendations</h4>
                        <p className="text-red-600 text-sm mt-1">{recommendationError}</p>
                        <button
                          onClick={fetchRecommendations}
                          className="mt-3 text-sm text-red-700 underline hover:text-red-800"
                        >
                          Try again
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {loadingRecommendations ? (
                  <RecommendationSkeleton />
                ) : recommendations.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recommendations.map((item, index) => (
                      <CollegeCard
                        key={item.college._id || index}
                        college={item.college}
                        score={item.score}
                        rank={item.rank}
                        reasons={item.reasons}
                        features={item.features}
                        userId={user._id}
                        onSave={handleSaveCollege}
                        onApply={handleApplyCollege}
                        isSaved={savedColleges.includes(item.college._id)}
                      />
                    ))}
                  </div>
                ) : (
                  !recommendationError && (
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                      <div className="text-5xl mb-4">🎓</div>
                      <h4 className="text-xl font-bold text-gray-900 mb-2">No Recommendations Yet</h4>
                      <p className="text-gray-600 mb-6">
                        Complete your profile to get personalized college recommendations
                      </p>
                      <button
                        onClick={() => setShowProfilePopup(true)}
                        className="inline-block px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                      >
                        Update Profile
                      </button>
                    </div>
                  )
                )}
              </div>
            )}
          </>
        )}

        {activeTab === "sessions" && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900">My Booked Sessions</h3>

            {loadingSessions ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : bookedSessions.length > 0 ? (
              <div className="grid gap-4">
                {bookedSessions.map((session, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-md p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xl">👨‍🏫</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{session.counsellorName || "Counsellor"}</h4>
                        <p className="text-sm text-gray-600">
                          {formatDate(session.date)} at {session.time}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(session.status)}`}>
                      {session.status || "pending"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <div className="text-5xl mb-4">📅</div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">No Sessions Booked</h4>
                <p className="text-gray-600 mb-6">Book a session with a counsellor to get personalized guidance</p>
                <button
                  onClick={() => navigate("/consult-counsellor", { state: { user } })}
                  className="inline-block px-6 py-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white font-semibold rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all duration-200"
                >
                  Book a Session
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {showProfilePopup && (
        <ProfileCompletionPopup
          user={user}
          onClose={() => setShowProfilePopup(false)}
          onComplete={handleProfileComplete}
        />
      )}
    </div>
  )
}

export default StudentDashboard

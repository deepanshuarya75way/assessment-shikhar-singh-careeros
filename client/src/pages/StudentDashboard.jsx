"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import {
  Briefcase,
  LayoutGrid,
  MessageSquare,
  ArrowRight,
  GraduationCap,
  GitFork,
  Compass,
  BookOpen,
  FileText,
  Camera,
} from "lucide-react"
import AvatarMenu from "./AvatarMenu"
import ProfileCompletionPopup from "./ProfileCompletionPopup"
import Navbar from "../components/Navbar"

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

  useEffect(() => {
    if (user?._id && !profileCompleted) {
      checkProfileStatus()
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

  const handleProfileComplete = (profileData) => {
    setUserProfile(profileData)
    setProfileCompleted(true)
    setShowProfilePopup(false)
    const updatedUser = { ...user, profileCompleted: true }
    localStorage.setItem("user", JSON.stringify(updatedUser))
    setUser(updatedUser)
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

  const handleFeatureClick = (featureTitle) => {
    if (!profileCompleted) {
      alert("Please complete your profile first to access this feature!")
      setShowProfilePopup(true)
      return
    }
    if (featureTitle === "Explore Colleges") navigate("/explore-colleges")
    if (featureTitle === "Generate Career Roadmap") navigate("/career-roadmap")
    if (featureTitle === "Consult Counsellor") navigate("/consult-counsellor", { state: { user } })
    if (featureTitle === "Still Confused?") navigate("/psychometric-test", { state: { user } })
    if (featureTitle === "ATS Resume Builder") navigate("/resume-builder")
    if (featureTitle === "AR Campus Visualizer") navigate("/ar-campus-visualizer")
    if (featureTitle === "Career Insights") navigate("/psychometric-reports-list")
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 font-sans pb-16">
      <Navbar user={user} onLogout={onLogout} />

      {/* Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Profile Warning Notification if incomplete */}
        {!profileCompleted && (
          <div className="bg-amber-50 border border-amber-200 p-4 mb-6 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-amber-500 text-xl">⚠️</span>
              <p className="text-sm text-amber-800 font-medium">
                Complete your student profile to unlock all AI recommendations and career planning tools.
              </p>
            </div>
            <button
              onClick={() => setShowProfilePopup(true)}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shrink-0 cursor-pointer shadow-sm"
            >
              Complete Now
            </button>
          </div>
        )}

        {/* Hero Introductory Section strictly matching Image 3 */}
        <div className="bg-gradient-to-b from-blue-50/80 via-sky-50/30 to-transparent rounded-3xl p-8 sm:p-12 mb-10 border border-blue-100/50 shadow-sm">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-3">
            Your Career Journey Starts Here
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-3xl font-medium leading-relaxed">
            Explore colleges, get career guidance, and plan your future with our comprehensive tools designed just for students like you.
          </p>
        </div>

        {/* Asymmetric Hero Cards Layout strictly matching Image 1 */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-12">

          {/* Card 1: Explore Colleges (Large Featured Gradient Card) */}
          <div
            onClick={() => handleFeatureClick("Explore Colleges")}
            className="md:col-span-7 bg-gradient-to-br from-blue-600 via-blue-500 to-sky-400 text-white rounded-3xl p-8 sm:p-10 relative overflow-hidden flex flex-col justify-between shadow-lg shadow-blue-500/10 min-h-[320px] cursor-pointer group transition-all duration-300 hover:shadow-xl hover:scale-[1.005]"
          >
            <div>
              <span className="bg-white/20 backdrop-blur-md text-white text-xs font-semibold px-4 py-1.5 rounded-full inline-block mb-5 border border-white/20">
                Featured discovery
              </span>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
                Explore Colleges
              </h3>
              <p className="text-blue-100 text-sm max-w-md font-medium leading-relaxed">
                Discover colleges that match your interests and academic profile
              </p>
            </div>

            <div className="mt-8 flex items-center">
              <button className="bg-white text-blue-600 hover:bg-blue-50 font-bold px-6 py-2.5 rounded-full text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer group-hover:px-7">
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>

            {/* Background Watermark Icon */}
            <GraduationCap className="w-64 h-64 absolute -bottom-12 -right-12 text-white/10 pointer-events-none" />
          </div>

          {/* Card 2: Generate Career Roadmap */}
          <div
            onClick={() => handleFeatureClick("Generate Career Roadmap")}
            className="md:col-span-5 bg-white rounded-3xl border border-gray-200/80 p-8 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[320px] cursor-pointer group"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 border border-blue-100/50">
                <GitFork className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                Generate Career Roadmap
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-6 font-medium">
                Get personalized career guidance based on your profile and goals
              </p>
            </div>

            <div className="flex items-center text-blue-600 hover:text-blue-700 font-bold text-sm gap-1.5 transition-all mt-auto">
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* Card 3: Still Confused? */}
          <div
            onClick={() => handleFeatureClick("Still Confused?")}
            className="md:col-span-7 bg-blue-50/60 border border-blue-100 rounded-3xl p-8 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[220px] cursor-pointer group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Still Confused?</h3>
              <p className="text-gray-600 text-sm font-medium leading-relaxed max-w-md mb-6">
                Take our comprehensive assessment to find your perfect career path
              </p>
            </div>

            <button className="bg-white border-2 border-blue-500 text-blue-600 hover:bg-blue-50 font-bold px-5 py-2 rounded-xl text-sm transition-all w-fit shadow-sm cursor-pointer">
              Get Started
            </button>
          </div>

          {/* Card 4: Career Insights */}
          <div
            onClick={() => handleFeatureClick("Career Insights")}
            className="md:col-span-5 bg-white rounded-3xl border border-gray-200/80 p-8 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[220px] cursor-pointer group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 border border-blue-100/50">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                Career Insights
              </h3>
              <p className="text-gray-500 text-sm font-medium leading-relaxed mb-6">
                Explore trends, salaries, and future-ready roles tailored to your interests
              </p>
            </div>

            <div className="flex items-center text-blue-600 hover:text-blue-700 font-bold text-sm gap-1.5 transition-all mt-auto">
              <span>View Insights</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

        </div>

        {/* Core Career Tools Section strictly matching Image 2 */}
        <div className="mb-16">
          <div className="mb-6">
            <h3 className="text-2xl font-extrabold text-gray-900 mb-1">Core career tools</h3>
            <p className="text-sm text-gray-500 max-w-xl font-medium">
              Three focused experiences to help students get guidance, build stronger resumes, and explore campuses in AR.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Consult Counsellor Card */}
            <div
              onClick={() => handleFeatureClick("Consult Counsellor")}
              className="bg-white rounded-3xl border border-gray-200/80 p-7 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between h-full cursor-pointer group min-h-[240px]"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 border border-blue-100/50">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  Consult Counsellor
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed font-medium mb-6">
                  Get expert advice from professional career counsellors
                </p>
              </div>

              <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-full transition-all w-fit shadow-sm shadow-blue-200 cursor-pointer">
                Get Started
              </button>
            </div>

            {/* ATS Resume Builder Card */}
            <div
              onClick={() => handleFeatureClick("ATS Resume Builder")}
              className="bg-white rounded-3xl border border-gray-200/80 p-7 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between h-full cursor-pointer group min-h-[240px] relative overflow-hidden"
            >
              {/* Corner Decorative Accent */}
              <div className="w-24 h-24 bg-blue-50/70 rounded-2xl absolute -top-4 -right-4 -z-0 pointer-events-none" />

              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 border border-blue-100/50">
                  <FileText className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  ATS Resume Builder
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed font-medium mb-6">
                  Create professional, ATS-compliant resumes tailored to your career goals
                </p>
              </div>

              <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-full transition-all w-fit shadow-sm shadow-blue-200 relative z-10 cursor-pointer">
                Get Started
              </button>
            </div>

            {/* AR Campus Visualizer Card */}
            <div
              onClick={() => handleFeatureClick("AR Campus Visualizer")}
              className="bg-[#0a2540] text-white rounded-3xl p-7 shadow-md hover:shadow-lg transition-all duration-300 flex flex-col justify-between h-full cursor-pointer group min-h-[240px] relative overflow-hidden"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center mb-5 border border-white/10">
                  <Camera className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">
                  AR Campus Visualizer
                </h4>
                <p className="text-xs text-blue-200/80 leading-relaxed font-medium mb-6">
                  Experience virtual campus tours and explore college facilities in AR
                </p>
              </div>

              <button className="bg-white text-gray-900 hover:bg-blue-50 font-semibold text-xs px-5 py-2.5 rounded-full transition-all w-fit shadow-sm cursor-pointer">
                Get Started
              </button>
            </div>

          </div>
        </div>

      </div>

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

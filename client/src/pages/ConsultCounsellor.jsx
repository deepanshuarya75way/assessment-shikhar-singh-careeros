"use client"

import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import {
  Search,
  MessageSquare,
  User,
  UserPlus,
  Clock,
  Globe,
  CheckCircle2,
  SlidersHorizontal,
  MapPin,
} from "lucide-react"

const getHighestQualification = (qualifications) => {
  if (!qualifications?.length) return null
  if (typeof qualifications === "string") return qualifications
  const sorted = [...qualifications].sort((a, b) => (b.year || 0) - (a.year || 0))
  const top = sorted[0]
  if (!top) return null
  const parts = [top.degree, top.institution].filter(Boolean)
  return parts.length ? parts.join(" • ") : null
}

const getCounsellorUserId = (counsellor) =>
  typeof counsellor.userId === "object" ? counsellor.userId?._id : counsellor.userId

const ConsultCounsellor = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const user = location.state?.user || JSON.parse(localStorage.getItem("user")) || null

  const [counsellors, setCounsellors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSpecialization, setSelectedSpecialization] = useState("")
  const [selectedExperience, setSelectedExperience] = useState("")
  const [selectedLanguage, setSelectedLanguage] = useState("")
  const [selectedPrice, setSelectedPrice] = useState("")
  const [selectedSession, setSelectedSession] = useState("")
  
  // Quick Filters
  const [quickFilters, setQuickFilters] = useState({
    availableToday: false,
    onlineSessions: false,
    verified: false,
    duration: "",
  })

  const [followedCounsellors, setFollowedCounsellors] = useState(new Set())

  useEffect(() => {
    const fetchCounsellors = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/counsellors/all`)

        if (!response.ok) {
          throw new Error("Failed to fetch counsellors")
        }

        const data = await response.json()
        setCounsellors(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error("Error fetching counsellors:", err)
        setError(err.message)
        setCounsellors([])
      } finally {
        setLoading(false)
      }
    }

    fetchCounsellors()
  }, [])

  const specializations = Array.from(new Set(counsellors.map((c) => c.specialization).filter(Boolean)))

  const allLanguages = Array.from(
    new Set(counsellors.flatMap((c) => (Array.isArray(c.languages) ? c.languages : [])).filter(Boolean))
  )

  const filteredCounsellors = counsellors.filter((counsellor) => {
    const searchLower = searchTerm.toLowerCase()
    const expertiseText = (counsellor.expertise || []).join(" ").toLowerCase()

    const matchesSearch =
      searchTerm === "" ||
      counsellor.fullName?.toLowerCase().includes(searchLower) ||
      counsellor.specialization?.toLowerCase().includes(searchLower) ||
      counsellor.professionalTitle?.toLowerCase().includes(searchLower) ||
      counsellor.bio?.toLowerCase().includes(searchLower) ||
      counsellor.location?.toLowerCase().includes(searchLower) ||
      expertiseText.includes(searchLower)

    const matchesSpecialization =
      selectedSpecialization === "" || counsellor.specialization === selectedSpecialization

    const matchesExp =
      selectedExperience === "" || (counsellor.experience && counsellor.experience >= parseInt(selectedExperience))

    const matchesLang =
      selectedLanguage === "" ||
      (Array.isArray(counsellor.languages) && counsellor.languages.includes(selectedLanguage))

    const matchesPrice =
      selectedPrice === "" ||
      (counsellor.consultationFee != null && counsellor.consultationFee <= parseInt(selectedPrice))

    const matchesSession =
      selectedSession === "" ||
      (counsellor.sessionDuration != null && counsellor.sessionDuration === parseInt(selectedSession))

    const matchesVerified = !quickFilters.verified || counsellor.verified === true

    const matchesDuration =
      !quickFilters.duration ||
      (counsellor.sessionDuration != null &&
        counsellor.sessionDuration === parseInt(quickFilters.duration))

    return (
      matchesSearch &&
      matchesSpecialization &&
      matchesExp &&
      matchesLang &&
      matchesPrice &&
      matchesSession &&
      matchesVerified &&
      matchesDuration
    )
  })

  const handleViewSessions = (counsellorUserId) => {
    navigate(`/counsellor/${counsellorUserId}/sessions`, { state: { user } })
  }

  const handleFollow = (counsellorUserId) => {
    setFollowedCounsellors((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(counsellorUserId)) {
        newSet.delete(counsellorUserId)
      } else {
        newSet.add(counsellorUserId)
      }
      return newSet
    })
  }

  const handleMessage = (counsellorUserId, counsellorName) => {
    navigate("/messages", {
      state: {
        user,
        preSelectedChat: {
          userId: counsellorUserId,
          name: counsellorName,
          role: "counselor",
        },
      },
    })
  }

  const handleViewProfile = (counsellorUserId) => {
    navigate(`/counsellor-profile/${counsellorUserId}`, { state: { user } })
  }

  const toggleQuickFilter = (key) => {
    setQuickFilters((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleQuickFilterDuration = (dur) => {
    setQuickFilters((prev) => ({
      ...prev,
      duration: prev.duration === dur ? "" : dur,
    }))
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-3xl border border-gray-200 shadow-sm max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 text-sm mb-6">Please login to access this page.</p>
          <button
            onClick={() => navigate("/")}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 font-sans pb-16">
      <Navbar user={user} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="my-6">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Find the right counsellor for every student journey
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1 max-w-3xl">
            Search by name or specialization, then refine by experience, qualifications, language, price, and session preferences.
          </p>
        </div>

        {/* Filters Card strictly matching uploaded UI */}
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs mb-8">
          {/* Search Bar */}
          <div className="mb-4">
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Search</label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name or specialisation"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50/80 border border-gray-200/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Filter Options Row 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Specialization */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Specialization</label>
              <select
                value={selectedSpecialization}
                onChange={(e) => setSelectedSpecialization(e.target.value)}
                className="w-full bg-gray-50/80 border border-gray-200/80 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
              >
                <option value="">All</option>
                {specializations.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>

            {/* Experience */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Experience</label>
              <select
                value={selectedExperience}
                onChange={(e) => setSelectedExperience(e.target.value)}
                className="w-full bg-gray-50/80 border border-gray-200/80 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
              >
                <option value="">Any</option>
                <option value="5">5+ years</option>
                <option value="10">10+ years</option>
                <option value="15">15+ years</option>
              </select>
            </div>

            {/* Languages */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Languages</label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full bg-gray-50/80 border border-gray-200/80 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
              >
                <option value="">Any</option>
                {allLanguages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Price</label>
              <select
                value={selectedPrice}
                onChange={(e) => setSelectedPrice(e.target.value)}
                className="w-full bg-gray-50/80 border border-gray-200/80 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
              >
                <option value="">Any</option>
                <option value="200">Under ₹200</option>
                <option value="400">Under ₹400</option>
                <option value="600">Under ₹600</option>
              </select>
            </div>
          </div>

          {/* Filter Options Row 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4 items-end">
            {/* Session */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Session</label>
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="w-full bg-gray-50/80 border border-gray-200/80 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
              >
                <option value="">Any</option>
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">60 min</option>
              </select>
            </div>

            {/* Apply Filters Button */}
            <div className="md:col-start-4 flex justify-end">
              <button
                onClick={() => {}}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl py-2.5 px-6 text-sm transition-all shadow-sm shadow-blue-200 cursor-pointer flex items-center justify-center gap-2"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Apply Filters</span>
              </button>
            </div>
          </div>
        </div>

        {/* Results Count & Title Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Top counsellors</h2>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Browse profiles and explore counsellors that fit your goals.
            </p>
          </div>
          <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-3.5 py-1.5 rounded-full">
            {filteredCounsellors.length} counsellors
          </span>
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div className="flex items-center justify-center py-16 bg-white rounded-3xl border border-gray-200/80 mb-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-sm font-semibold text-gray-600">Loading counsellors...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-3xl p-6 mb-8 text-center">
            <p className="text-red-700 text-sm font-semibold mb-1">Error loading counsellors</p>
            <p className="text-red-600 text-xs">{error}</p>
          </div>
        )}

        {/* Counsellors List */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredCounsellors.length === 0 ? (
              <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200/80 p-12 text-center">
                <div className="text-4xl mb-3">🔍</div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">No counsellors found</h3>
                <p className="text-xs text-gray-500">Try adjusting your search criteria or filters.</p>
              </div>
            ) : (
              filteredCounsellors.map((counsellor) => {
                const counsellorUserId = getCounsellorUserId(counsellor)
                const highestQualification = getHighestQualification(counsellor.qualifications)
                const expertise = counsellor.expertise || []
                const visibleExpertise = expertise.slice(0, 3)
                const extraExpertiseCount = Math.max(0, expertise.length - 3)
                const experienceLabel =
                  counsellor.experience != null && counsellor.experience > 0
                    ? `${counsellor.experience} ${counsellor.experience === 1 ? "Year" : "Years"} Experience`
                    : null
                const languagesLabel = counsellor.languages?.length
                  ? counsellor.languages.join(", ")
                  : null

                return (
                  <article
                    key={counsellor._id || counsellorUserId}
                    className="group bg-white rounded-2xl border border-gray-200/70 p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-gray-300/80 transition-all duration-200 flex flex-col"
                  >
                    {/* Identity */}
                    <div className="flex gap-4">
                      {counsellor.avatar ? (
                        <img
                          src={counsellor.avatar}
                          alt={counsellor.fullName}
                          className="w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem] rounded-2xl object-cover shrink-0 ring-2 ring-gray-100 group-hover:ring-blue-100 transition-all"
                        />
                      ) : (
                        <div className="w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem] rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-semibold text-xl shrink-0 ring-2 ring-gray-100">
                          {counsellor.fullName?.charAt(0).toUpperCase() || "C"}
                        </div>
                      )}

                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-base sm:text-[1.05rem] font-bold text-gray-900 leading-tight tracking-tight">
                            {counsellor.fullName}
                          </h3>
                          {counsellor.verified && (
                            <span className="shrink-0 inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-100">
                              <CheckCircle2 className="w-3 h-3" />
                              Verified
                            </span>
                          )}
                        </div>

                        {counsellor.professionalTitle && (
                          <p className="text-sm text-gray-600 font-medium mt-1 leading-snug">
                            {counsellor.professionalTitle}
                          </p>
                        )}

                        {counsellor.location && (
                          <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                            <span className="truncate">{counsellor.location}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Specialization */}
                    {counsellor.specialization && (
                      <div className="mt-4">
                        <span className="inline-flex items-center bg-slate-900 text-white text-[11px] font-semibold px-3 py-1 rounded-full tracking-wide">
                          {counsellor.specialization}
                        </span>
                      </div>
                    )}

                    {/* Expertise chips */}
                    {expertise.length > 0 && (
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        {visibleExpertise.map((item) => (
                          <span
                            key={item}
                            className="inline-flex items-center bg-gray-50 text-gray-700 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-gray-200/80"
                          >
                            {item}
                          </span>
                        ))}
                        {extraExpertiseCount > 0 && (
                          <span className="text-[11px] font-semibold text-gray-400 px-1">
                            +{extraExpertiseCount} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Credentials row */}
                    <div className="mt-4 space-y-2">
                      {experienceLabel && (
                        <p className="text-xs font-semibold text-gray-800">{experienceLabel}</p>
                      )}

                      {highestQualification && (
                        <p className="text-xs text-gray-600 leading-snug">
                          <span aria-hidden="true">🎓 </span>
                          {highestQualification}
                        </p>
                      )}

                      {languagesLabel && (
                        <p className="text-xs text-gray-500">
                          <span className="font-medium text-gray-600">Speaks:</span> {languagesLabel}
                        </p>
                      )}
                    </div>

                    {/* Bio preview */}
                    {counsellor.bio && (
                      <p className="mt-4 text-sm text-gray-500 leading-relaxed line-clamp-2 flex-1">
                        {counsellor.bio}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => handleViewSessions(counsellorUserId)}
                          className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm shadow-blue-200/60 cursor-pointer transition-colors"
                        >
                          View Sessions
                        </button>

                        <button
                          onClick={() => handleFollow(counsellorUserId)}
                          className={`font-semibold text-xs px-3.5 py-2.5 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                            followedCounsellors.has(counsellorUserId)
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200"
                          }`}
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>
                            {followedCounsellors.has(counsellorUserId) ? "Following" : "Follow"}
                          </span>
                        </button>
                      </div>

                      <div className="flex items-center gap-4 sm:gap-5">
                        <button
                          onClick={() => handleMessage(counsellorUserId, counsellor.fullName)}
                          className="text-xs font-semibold text-gray-500 hover:text-gray-900 flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>Message</span>
                        </button>

                        <button
                          onClick={() => handleViewProfile(counsellorUserId)}
                          className="text-xs font-semibold text-gray-500 hover:text-gray-900 flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <User className="w-4 h-4" />
                          <span>Profile</span>
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })
            )}
          </div>
        )}

        {/* Quick Filters Section strictly matching bottom card in screenshot */}
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs mt-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Quick filters</h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Refine counsellors by your preferred criteria.
              </p>
            </div>
            <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-1 rounded-full">
              Live
            </span>
          </div>

          {/* Filter Pill Buttons Row 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            <button
              onClick={() => toggleQuickFilter("availableToday")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
                quickFilters.availableToday
                  ? "bg-blue-50 border-blue-200 text-blue-700 shadow-xs"
                  : "bg-white border-gray-200/80 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Clock className="w-4 h-4 text-gray-400" />
              <span>Available Today</span>
            </button>

            <button
              onClick={() => toggleQuickFilter("onlineSessions")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
                quickFilters.onlineSessions
                  ? "bg-blue-50 border-blue-200 text-blue-700 shadow-xs"
                  : "bg-white border-gray-200/80 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Globe className="w-4 h-4 text-gray-400" />
              <span>Online Sessions</span>
            </button>

            <button
              onClick={() => toggleQuickFilter("verified")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
                quickFilters.verified
                  ? "bg-blue-50 border-blue-200 text-blue-700 shadow-xs"
                  : "bg-white border-gray-200/80 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-gray-400" />
              <span>Verified</span>
            </button>
          </div>

          {/* Session Duration Radio Pills */}
          <div className="mt-4">
            <span className="block text-xs font-bold text-gray-700 mb-2">
              Session duration preference
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {["30", "45", "60"].map((duration) => (
                <button
                  key={duration}
                  onClick={() => toggleQuickFilterDuration(duration)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
                    quickFilters.duration === duration
                      ? "bg-white border-blue-500 text-gray-900 ring-2 ring-blue-500/20 shadow-xs"
                      : "bg-white border-gray-200/80 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span
                    className={`w-3 h-3 rounded-full border flex items-center justify-center shrink-0 ${
                      quickFilters.duration === duration
                        ? "border-blue-600 bg-blue-600"
                        : "border-gray-300"
                    }`}
                  />
                  <span>{duration} min</span>
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default ConsultCounsellor
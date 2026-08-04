"use client"

import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import Navbar from "../components/Navbar"
import {
  ArrowLeft,
  Briefcase,
  ChevronDown,
  Clock,
  Flame,
  Globe,
  MapPin,
  MessageSquare,
  Phone,
  Search,
  UserPlus,
  Video,
} from "lucide-react"

const API_URL = import.meta.env.VITE_API_URL

const getCategoryStyles = (category = "") => {
  const normalized = category.toLowerCase()
  if (normalized.includes("college")) {
    return "bg-purple-50 text-purple-700 border-purple-100"
  }
  return "bg-blue-50 text-blue-700 border-blue-100"
}

const CounsellorAvailableSessions = () => {
  const { counsellorId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const user = location.state?.user || JSON.parse(localStorage.getItem("user")) || null

  const [counsellor, setCounsellor] = useState(null)
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modeFilter, setModeFilter] = useState("all")
  const [sortBy, setSortBy] = useState("price-asc")
  const [isFollowing, setIsFollowing] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate("/")
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [profileRes, servicesRes] = await Promise.all([
          fetch(`${API_URL}/api/users/counsellor-profile/${counsellorId}`),
          fetch(`${API_URL}/api/services/counsellor/${counsellorId}?activeOnly=true`),
        ])

        if (!profileRes.ok) throw new Error("Counsellor not found")

        const profileData = await profileRes.json()
        setCounsellor(profileData)

        if (servicesRes.ok) {
          const servicesData = await servicesRes.json()
          setServices(Array.isArray(servicesData) ? servicesData.filter((s) => s.status !== false) : [])
        } else {
          setServices([])
        }
      } catch (err) {
        console.error(err)
        setError(err.message || "Failed to load sessions")
      } finally {
        setLoading(false)
      }
    }

    if (counsellorId) fetchData()
  }, [counsellorId, user, navigate])

  const filteredServices = useMemo(() => {
    let list = [...services]

    if (modeFilter === "video") list = list.filter((s) => s.mode === "video")
    if (modeFilter === "voice") list = list.filter((s) => s.mode === "voice")

    list.sort((a, b) => {
      if (sortBy === "price-asc") return (a.price || 0) - (b.price || 0)
      if (sortBy === "price-desc") return (b.price || 0) - (a.price || 0)
      if (sortBy === "duration") return (a.duration || 0) - (b.duration || 0)
      if (sortBy === "bookings") return (b.bookings || 0) - (a.bookings || 0)
      return 0
    })

    return list
  }, [services, modeFilter, sortBy])

  const languagesLabel = counsellor?.languages?.length
    ? counsellor.languages.join(", ")
    : null

  const handleMessage = () => {
    navigate("/messages", {
      state: {
        user,
        preSelectedChat: {
          userId: counsellorId,
          name: counsellor?.fullName,
          role: "counselor",
        },
      },
    })
  }

  const handleBookSession = (serviceId) => {
    navigate(`/counsellor/${counsellorId}/session/${serviceId}`, {
      state: { user, counsellor },
    })
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-gray-900 font-sans pb-16">
      <Navbar user={user} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <button
          onClick={() => navigate("/consult-counsellor", { state: { user } })}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>
            Consult Counsellors <span className="text-gray-300 mx-1">›</span>{" "}
            <span className="text-gray-800 font-medium">{counsellor?.fullName || "Counsellor"}</span>
          </span>
        </button>

        {loading && (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
            <p className="text-sm text-gray-500 mt-4 font-medium">Loading sessions...</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <p className="text-red-700 font-semibold text-sm">{error}</p>
            <button
              onClick={() => navigate("/consult-counsellor", { state: { user } })}
              className="mt-4 text-sm text-blue-600 font-semibold hover:underline cursor-pointer"
            >
              Back to counsellors
            </button>
          </div>
        )}

        {!loading && !error && counsellor && (
          <>
            {/* Counsellor Summary Card */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 sm:p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex gap-4 flex-1 min-w-0">
                  {counsellor.avatar ? (
                    <img
                      src={counsellor.avatar}
                      alt={counsellor.fullName}
                      className="w-14 h-14 rounded-xl object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center font-bold text-lg shrink-0">
                      {counsellor.fullName?.charAt(0)?.toUpperCase() || "C"}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-lg font-bold text-gray-900">{counsellor.fullName}</h1>
                      {counsellor.specialization && (
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                          {counsellor.specialization}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-xs text-gray-500">
                      {counsellor.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          {counsellor.location}
                        </span>
                      )}
                      {languagesLabel && (
                        <span className="inline-flex items-center gap-1">
                          <Globe className="w-3.5 h-3.5 text-gray-400" />
                          Speaks: {languagesLabel}
                        </span>
                      )}
                      {counsellor.experience != null && counsellor.experience > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                          {counsellor.experience} Years Experience
                        </span>
                      )}
                    </div>

                    {counsellor.bio && (
                      <p className="text-sm text-gray-500 mt-3 leading-relaxed line-clamp-2">
                        {counsellor.bio}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:shrink-0">
                  <button
                    onClick={() => setIsFollowing((prev) => !prev)}
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl border transition-colors cursor-pointer ${
                      isFollowing
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                  <button
                    onClick={handleMessage}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Message
                  </button>
                </div>
              </div>
            </div>

            {/* Section Header */}
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900">Available Sessions</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Choose a session and book your slot with {counsellor.fullName}
              </p>
            </div>

            {services.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                <div className="inline-flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
                  {[
                    { key: "all", label: "All" },
                    { key: "video", label: "Video" },
                    { key: "voice", label: "Voice" },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setModeFilter(tab.key)}
                      className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        modeFilter === tab.key
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-white border border-gray-200 rounded-xl pl-3 pr-8 py-2 text-xs font-semibold text-gray-700 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="price-asc">Sort by: Price ↑</option>
                    <option value="price-desc">Sort by: Price ↓</option>
                    <option value="duration">Sort by: Duration</option>
                    <option value="bookings">Sort by: Popularity</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Empty State */}
            {services.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 sm:p-14 text-center">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-5">
                  <Search className="w-7 h-7 text-blue-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No sessions available yet</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                  {counsellor.fullName} hasn&apos;t published any sessions yet. Follow them to get
                  notified when new sessions go live.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
                  <button
                    onClick={() => setIsFollowing(true)}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl cursor-pointer transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    Follow Counsellor
                  </button>
                  <button
                    onClick={() => navigate("/consult-counsellor", { state: { user } })}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    Browse Other Counsellors
                  </button>
                </div>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
                <p className="text-sm text-gray-500">No sessions match the selected filter.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredServices.map((service) => (
                  <article
                    key={service._id}
                    className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 sm:p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <span
                        className={`inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full border ${getCategoryStyles(service.category)}`}
                      >
                        {service.category}
                      </span>
                      <span className="shrink-0 w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                        {service.mode === "voice" ? (
                          <Phone className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Video className="w-4 h-4 text-blue-600" />
                        )}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-gray-900 mb-1.5">{service.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{service.description}</p>

                    {service.topics?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {service.topics.map((topic) => (
                          <span
                            key={topic}
                            className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-gray-50 text-gray-600 border border-gray-200/80"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {service.duration} min
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-orange-400" />
                        <span className="text-orange-500 font-semibold">{service.bookings || 0}</span>
                        <span>bookings</span>
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
                      <p className="text-lg font-bold text-blue-600">
                        ₹{service.price}{" "}
                        <span className="text-sm font-medium text-gray-400">/session</span>
                      </p>
                      <button
                        onClick={() => handleBookSession(service._id)}
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl shadow-sm shadow-blue-200 cursor-pointer transition-colors"
                      >
                        Book Session
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default CounsellorAvailableSessions

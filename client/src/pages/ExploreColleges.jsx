"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import CollegeMap from "./CollegeMap.jsx"
import LoadingSkeleton from "./LoadingSkeleton"
import { searchColleges } from "../services/collegeApi"
import Navbar from "../components/Navbar"
import { Building2 } from "lucide-react"

const DEFAULT_COLLEGES = [
  {
    _id: "col-1",
    name: "National Institute of Technology",
    location: "Bengaluru, Karnataka",
    badge: "Top Match",
    matchPercentage: "92% Match",
    details: "Engineering • Public • Affiliated to State University",
    ranking: 12,
    fees: 125000,
    type: "public",
    coordinates: [77.5946, 12.9716],
  },
  {
    _id: "col-2",
    name: "St. Xavier's College",
    location: "Mumbai, Maharashtra",
    badge: "Excellent Match",
    matchPercentage: "88% Match",
    details: "Commerce • Private • University of Mumbai",
    ranking: 18,
    fees: 85000,
    type: "private",
    coordinates: [72.8777, 19.0760],
  },
  {
    _id: "col-3",
    name: "Delhi Technological University",
    location: "New Delhi, Delhi",
    badge: "Great Choice",
    matchPercentage: "84% Match",
    details: "Computer Science • Public • Government of Delhi",
    ranking: 7,
    fees: 165000,
    type: "public",
    coordinates: [77.2090, 28.6139],
  },
]

const ExploreColleges = () => {
  const navigate = useNavigate()
  const [user] = useState(() => JSON.parse(localStorage.getItem("user")) || null)

  const [searchFilters, setSearchFilters] = useState({
    location: "",
    collegeType: "",
    courses: "",
    degreeLevel: "",
    budget: "",
    ranking: "",
    examsAccepted: "",
  })

  const [colleges, setColleges] = useState(DEFAULT_COLLEGES)
  const [aiColleges, setAiColleges] = useState([])
  const [activeTab, setActiveTab] = useState("search") // "search" | "ai"
  const [loading, setLoading] = useState(false)
  const [loadingAi, setLoadingAi] = useState(false)
  const [selectedCollege, setSelectedCollege] = useState(null)

  useEffect(() => {
    if (user?._id) {
      fetchUserRecommendations()
    }
  }, [user?._id])

  const fetchUserRecommendations = async () => {
    if (!user?._id) return
    setLoadingAi(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/recommendations/${user._id}`)
      if (response.ok) {
        const data = await response.json()
        const recommendedList = data.recommended || []
        const formatted = recommendedList.map((item, idx) => {
          const college = item.college || item
          return {
            _id: college._id || `ai-${idx}`,
            name: college.name || "Recommended College",
            location: college.location || (college.city ? `${college.city}, ${college.state}` : "India"),
            badge: item.rank ? `Rank #${item.rank}` : "AI Match",
            matchPercentage: item.score ? `${Math.round(item.score)}% Match` : "High Match",
            details: item.reasons && item.reasons.length > 0 ? item.reasons.join(" • ") : (college.type || "Premier Institution"),
            ranking: college.ranking || item.rank || idx + 1,
            fees: college.fees || 0,
            type: college.type || "public",
            coordinates: college.coordinates || [77.5946 + (idx % 3) * 0.4, 12.9716 + (idx % 3) * 0.3],
          }
        })
        setAiColleges(formatted)
      }
    } catch (err) {
      console.error("Error fetching user recommendations:", err)
      setAiColleges([])
    } finally {
      setLoadingAi(false)
    }
  }

  const handleSearch = async () => {
    setLoading(true)
    try {
      const data = await searchColleges(searchFilters)
      if (data.success && data.colleges && data.colleges.length > 0) {
        const formattedColleges = data.colleges.map((col, idx) => ({
          ...col,
          _id: col._id || `col-${idx}`,
          matchPercentage: col.matchPercentage || `${Math.floor(93 - idx * 4)}% Match`,
          details: col.details || [col.courses, col.type, col.affiliation].filter(Boolean).join(" • ") || "Higher Education",
          badge: col.badge || (idx === 0 ? "Top Match" : idx === 1 ? "Excellent Match" : "Great Choice"),
        }))
        setColleges(formattedColleges)
      } else {
        const filtered = DEFAULT_COLLEGES.filter((c) => {
          if (searchFilters.location && !c.location.toLowerCase().includes(searchFilters.location.toLowerCase())) return false
          if (searchFilters.collegeType && c.type !== searchFilters.collegeType) return false
          return true
        })
        setColleges(filtered)
      }
    } catch (error) {
      console.error("Error searching colleges:", error)
    } finally {
      setLoading(false)
      setActiveTab("search")
    }
  }

  const handleFilterChange = (key, value) => {
    setSearchFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const displayColleges = activeTab === "search" ? colleges : aiColleges
  const isLoading = activeTab === "search" ? loading : loadingAi

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 font-sans pb-16">
      {/* Shared Navbar */}
      <Navbar user={user} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Workspace Title & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 my-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Explore Colleges</h1>
            <p className="text-sm text-gray-500 font-medium mt-1 max-w-3xl">
              Search, compare, and discover colleges with a compact workspace that keeps filters, results, recommendations, and map context together.
            </p>
          </div>
          <div className="hidden sm:flex items-center px-4 py-2 rounded-full bg-white text-gray-600 font-medium text-xs border border-gray-200/80 shadow-xs shrink-0 self-start sm:self-center">
            Premium discovery workspace
          </div>
        </div>

        {/* Horizontal Filters Control Card */}
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Location */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Location</label>
              <input
                type="text"
                placeholder="Enter city, state, or region"
                value={searchFilters.location}
                onChange={(e) => handleFilterChange("location", e.target.value)}
                className="w-full bg-gray-50/80 border border-gray-200/80 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-gray-400"
              />
            </div>

            {/* College Type */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">College Type</label>
              <select
                value={searchFilters.collegeType}
                onChange={(e) => handleFilterChange("collegeType", e.target.value)}
                className="w-full bg-gray-50/80 border border-gray-200/80 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
              >
                <option value="">Select type</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="community">Community College</option>
                <option value="technical">Technical Institute</option>
              </select>
            </div>

            {/* Courses/Streams */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Courses/Streams</label>
              <select
                value={searchFilters.courses}
                onChange={(e) => handleFilterChange("courses", e.target.value)}
                className="w-full bg-gray-50/80 border border-gray-200/80 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
              >
                <option value="">Select field</option>
                <option value="engineering">Engineering</option>
                <option value="medicine">Medicine</option>
                <option value="business">Business</option>
                <option value="arts">Arts & Humanities</option>
                <option value="science">Science</option>
                <option value="law">Law</option>
              </select>
            </div>

            {/* Degree Level */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Degree Level</label>
              <select
                value={searchFilters.degreeLevel}
                onChange={(e) => handleFilterChange("degreeLevel", e.target.value)}
                className="w-full bg-gray-50/80 border border-gray-200/80 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
              >
                <option value="">Select level</option>
                <option value="undergraduate">Undergraduate</option>
                <option value="graduate">Graduate</option>
                <option value="doctorate">Doctorate</option>
                <option value="certificate">Certificate</option>
              </select>
            </div>

            {/* Budget Range */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Budget Range</label>
              <select
                value={searchFilters.budget}
                onChange={(e) => handleFilterChange("budget", e.target.value)}
                className="w-full bg-gray-50/80 border border-gray-200/80 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
              >
                <option value="">Select budget</option>
                <option value="0-10000">Under $10,000</option>
                <option value="10000-25000">$10,000 - $25,000</option>
                <option value="25000-50000">$25,000 - $50,000</option>
                <option value="50000+">$50,000+</option>
              </select>
            </div>

            {/* Ranking */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Ranking</label>
              <select
                value={searchFilters.ranking}
                onChange={(e) => handleFilterChange("ranking", e.target.value)}
                className="w-full bg-gray-50/80 border border-gray-200/80 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
              >
                <option value="">Select ranking</option>
                <option value="top-10">Top 10</option>
                <option value="top-50">Top 50</option>
                <option value="top-100">Top 100</option>
                <option value="all">All Rankings</option>
              </select>
            </div>

            {/* Exams Accepted */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Exams Accepted</label>
              <select
                value={searchFilters.examsAccepted}
                onChange={(e) => handleFilterChange("examsAccepted", e.target.value)}
                className="w-full bg-gray-50/80 border border-gray-200/80 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
              >
                <option value="">Select exam</option>
                <option value="sat">SAT</option>
                <option value="act">ACT</option>
                <option value="gre">GRE</option>
                <option value="gmat">GMAT</option>
                <option value="toefl">TOEFL</option>
              </select>
            </div>

            {/* Search Button */}
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl py-2.5 px-4 text-sm transition-all shadow-sm shadow-blue-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? "Searching..." : "Search Colleges"}
              </button>
            </div>

          </div>
        </div>

        {/* Bottom Workspace Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Tabbed Results (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Tab Navigation Pill Bar */}
            <div className="bg-gray-100/70 p-1.5 rounded-2xl inline-flex gap-1 border border-gray-200/60">
              <button
                onClick={() => setActiveTab("search")}
                className={`px-4 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                  activeTab === "search"
                    ? "bg-white text-gray-900 shadow-xs font-bold"
                    : "text-gray-500 hover:text-gray-900 font-semibold"
                }`}
              >
                Search Results
              </button>

              <button
                onClick={() => {
                  setActiveTab("ai")
                  if (user?._id && aiColleges.length === 0) {
                    fetchUserRecommendations()
                  }
                }}
                className={`px-4 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                  activeTab === "ai"
                    ? "bg-white text-gray-900 shadow-xs font-bold"
                    : "text-gray-500 hover:text-gray-900 font-semibold"
                }`}
              >
                AI Recommendations
              </button>
            </div>

            {/* Results Container Card */}
            <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs min-h-[480px] flex flex-col justify-between">
              <div>
                {/* List Header */}
                <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {activeTab === "search" ? "Search Results" : "AI Recommendations"}
                    </h2>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                      {activeTab === "search"
                        ? "Colleges matching your selected filters appear here."
                        : "Personalized AI recommendations powered by 7-factor ML scoring."}
                    </p>
                  </div>
                  <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-1 rounded-full shrink-0">
                    {displayColleges.length} results
                  </span>
                </div>

                {/* College Cards List */}
                {isLoading ? (
                  <LoadingSkeleton />
                ) : displayColleges.length > 0 ? (
                  <div className="space-y-3">
                    {displayColleges.map((college, idx) => (
                      <div
                        key={college._id || idx}
                        onClick={() => setSelectedCollege(college)}
                        className={`bg-white rounded-2xl border p-4 transition-all cursor-pointer flex items-center justify-between gap-4 group ${
                          selectedCollege?.name === college.name
                            ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/10"
                            : "border-gray-200/80 hover:border-blue-200 hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/50">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate leading-snug">
                                {college.name}
                              </h3>
                              {college.badge && (
                                <span className="bg-gray-100 text-gray-700 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0">
                                  {college.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 font-medium mt-0.5 truncate">
                              {college.location}
                            </p>
                            <p className="text-[11px] text-gray-400 font-medium mt-1 truncate">
                              {college.details}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-sm font-bold text-gray-900 block">
                            {college.matchPercentage || `#${college.ranking} Rank`}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/college/${college._id || idx}`)
                            }}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors mt-1 block ml-auto"
                          >
                            View Full Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Bottom Notice Banner matching screenshot */}
              <div className="bg-gray-50 border border-gray-200/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-600 font-medium mt-6 gap-2">
                <span className="font-bold text-gray-800">
                  {displayColleges.length === 0 ? "No colleges found" : "Discovery workspace active"}
                </span>
                <span>
                  {displayColleges.length === 0
                    ? activeTab === "search"
                      ? "Try adjusting your search filters to find more results."
                      : "Complete your profile to unlock personalized AI recommendations."
                    : "Try adjusting your search filters to find more results."}
                </span>
              </div>

            </div>
          </div>

          {/* Right Column: Interactive College Map (5 Cols) */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs flex flex-col">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Interactive College Map</h2>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    Markers update with the active discovery mode.
                  </p>
                </div>
                <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-1 rounded-full shrink-0">
                  Live
                </span>
              </div>

              <div className="w-full h-[520px] rounded-2xl overflow-hidden mt-5 border border-gray-200/60 relative shadow-inner">
                <CollegeMap
                  colleges={displayColleges}
                  selectedCollege={selectedCollege}
                  onCollegeSelect={setSelectedCollege}
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default ExploreColleges





"use client"

import { useState, useRef, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"

const CollegeDetails = () => {
  const navigate = useNavigate()
  const { collegeId } = useParams()
  const [college, setCollege] = useState(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [showARMode, setShowARMode] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const scrollContainerRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchCollegeDetails = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/colleges/${collegeId}`)

        if (!response.ok) {
          throw new Error("Failed to fetch college details")
        }

        const data = await response.json()
        setCollege(data)
      } catch (err) {
        console.error("Error fetching college:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (collegeId) {
      fetchCollegeDetails()
    }
  }, [collegeId])

  const scrollImages = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400
      if (direction === "left") {
        scrollContainerRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" })
      } else {
        scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" })
      }
    }
  }
const changeImage = (direction) => {
  setActiveImageIndex((prev) => {
    if (direction === "next") {
      return (prev + 1) % mockImages.length
    } else {
      return (prev - 1 + mockImages.length) % mockImages.length
    }
  })
}

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg font-semibold">Loading college details...</p>
        </div>
      </div>
    )
  }

  if (error || !college) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            {error ? "Error Loading College" : "College Not Found"}
          </h1>
          {error && <p className="text-red-400 mb-6">{error}</p>}
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-2xl transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const mockImages = [
  "https://images.unsplash.com/photo-1562774053-701939374585",
  "https://images.unsplash.com/photo-1580582932707-520aed937b7b",
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b",
  "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f",
]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      <Navbar />
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors"
          >
            <span className="text-xl">←</span>
            <span>Back</span>
          </button>
          <h1 className="text-2xl font-bold">{college.name}</h1>
          <button
            onClick={() => setIsSaved(!isSaved)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              isSaved
                ? "bg-pink-500/20 text-pink-400 border border-pink-500/50"
                : "bg-slate-700/50 text-white hover:bg-slate-600/50"
            }`}
          >
            {isSaved ? "❤️ Saved" : "🤍 Save"}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          <div className="lg:col-span-2">
            <div className="relative group">
              <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={mockImages[activeImageIndex] || "/placeholder.svg"}
                  alt={`${college.name} campus`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={() => setShowARMode(!showARMode)}
                    className={`px-4 py-2.5 rounded-full font-bold transition-all flex items-center gap-2 backdrop-blur-md ${
                      showARMode
                        ? "bg-cyan-500/90 text-white shadow-lg shadow-cyan-500/50"
                        : "bg-slate-900/70 text-cyan-400 hover:bg-slate-800/80"
                    }`}
                  >
                    <span className="text-lg">🥽</span>
                    {showARMode ? "AR Mode ON" : "View In AR"}
                  </button>
                </div>

                {showARMode && (
                  <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/20 via-transparent to-transparent flex items-center justify-center">
                    <div className="text-center backdrop-blur-sm bg-slate-900/50 px-8 py-6 rounded-2xl border border-cyan-500/30">
                      <div className="text-5xl mb-4">🏛️</div>
                      <h3 className="text-xl font-bold mb-2">AR Campus Experience</h3>
                      <p className="text-slate-300 text-sm mb-4">Tap to explore campus in augmented reality</p>
                      <button className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition-all">
                        Launch AR Tour
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() =>  changeImage("prev")}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 backdrop-blur-md p-3 rounded-full transition-all opacity-0 group-hover:opacity-100"
              >
                ←
              </button>
              <button
                onClick={() =>  changeImage("next")}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 backdrop-blur-md p-3 rounded-full transition-all opacity-0 group-hover:opacity-100"
              >
                →
              </button>
            </div>

            <div className="mt-6 relative">
              <div
                ref={scrollContainerRef}
                className="flex gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {mockImages.map((image, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`flex-shrink-0 h-24 w-40 rounded-xl overflow-hidden transition-all ${
                      activeImageIndex === idx
                        ? "ring-2 ring-cyan-500 shadow-lg shadow-cyan-500/30 scale-105"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`View ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
              <div className="flex justify-center gap-2 mt-4">
                {mockImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`h-2 rounded-full transition-all ${
                      activeImageIndex === idx ? "w-8 bg-cyan-500" : "w-2 bg-slate-600"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 shadow-xl">
              <div className="mb-6 pb-6 border-b border-slate-600/50">
                <p className="text-slate-400 text-sm mb-2">📍 Location</p>
                <p className="text-lg font-semibold">{college.address?.city || "City"}</p>
                <p className="text-slate-400 text-sm">{college.address?.state || "State"}</p>
              </div>

              <div className="mb-6 pb-6 border-b border-slate-600/50">
                <p className="text-slate-400 text-sm mb-3">Categories</p>
                <div className="flex flex-wrap gap-2">
                  {college.type && (
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-semibold">
                      {college.type}
                    </span>
                  )}
                  {college.affiliation && (
                    <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-semibold">
                      {college.affiliation}
                    </span>
                  )}
                </div>
              </div>

              {college.placements?.averagePackageLPA && (
                <div className="mb-6 pb-6 border-b border-slate-600/50">
                  <p className="text-slate-400 text-sm mb-2">💰 Avg Package</p>
                  <p className="text-2xl font-bold text-green-400">₹{college.placements.averagePackageLPA} LPA</p>
                  <p className="text-slate-400 text-xs mt-1">
                    Placement Rate: {college.placements.placementPercentage || "95"}%
                  </p>
                </div>
              )}

              {college.website && (
                <div className="mb-6 pb-6 border-b border-slate-600/50">
                  <p className="text-slate-400 text-sm mb-2">🌐 Website</p>
                  <a
                    href={college.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm truncate"
                  >
                    {college.website}
                  </a>
                </div>
              )}

              {college.contact?.email && (
                <div className="mb-6 pb-6 border-b border-slate-600/50">
                  <p className="text-slate-400 text-sm mb-2">📧 Contact</p>
                  <p className="text-slate-300 text-sm">{college.contact.email}</p>
                </div>
              )}

              <div className="mt-8 space-y-3 pt-6 border-t border-slate-600/50">
                <button className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition-all transform hover:scale-105">
                  🎯 Apply Now
                </button>
                <button className="w-full px-4 py-3 border border-slate-600 text-slate-300 font-semibold rounded-xl hover:border-slate-500 hover:bg-slate-700/50 transition-all">
                  📞 Contact College
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span>📚</span> About
            </h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              {college.description ||
                `${college.name} is a leading educational institution known for excellence in academics and research.`}
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span>🎯</span> Courses Offered
            </h2>
            <div className="space-y-3">
              {college.courses && college.courses.length > 0 ? (
                college.courses.slice(0, 4).map((course, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-cyan-500 rounded-full mt-2"></span>
                    <div>
                      <p className="font-semibold text-slate-200">{course.courseName}</p>
                      <p className="text-sm text-slate-400">
                        {course.degreeType} • {course.durationYears} years
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-400">Courses information coming soon</p>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span>🏢</span> Campus Facilities
            </h2>
            <ul className="space-y-3">
              {college.campus?.hostel && (
                <li className="flex items-center gap-3 text-slate-300">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>Hostel Facilities
                </li>
              )}
              {college.campus?.library && (
                <li className="flex items-center gap-3 text-slate-300">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>Advanced Library
                </li>
              )}
              {college.campus?.labs && (
                <li className="flex items-center gap-3 text-slate-300">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>State-of-the-art Labs
                </li>
              )}
              {college.campus?.sportsFacilities && (
                <li className="flex items-center gap-3 text-slate-300">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>Sports Complex
                </li>
              )}
              {college.campus?.transport && (
                <li className="flex items-center gap-3 text-slate-300">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>Campus Transport
                </li>
              )}
              {college.campus?.cafeteria && (
                <li className="flex items-center gap-3 text-slate-300">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>Cafeteria
                </li>
              )}
              {college.campus?.wifi && (
                <li className="flex items-center gap-3 text-slate-300">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>WiFi Campus
                </li>
              )}
            </ul>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span>📋</span> Admission Requirements
            </h2>
            <div className="space-y-3">
              {college.courses?.[0]?.eligibility?.minTwelfthPercent && (
                <div>
                  <p className="text-slate-400 text-sm mb-1">Minimum 12th Grade Score</p>
                  <p className="text-xl font-bold text-blue-400">
                    {college.courses[0].eligibility.minTwelfthPercent}%+
                  </p>
                </div>
              )}
              {college.courses?.[0]?.eligibility?.acceptedEntranceExams?.[0] && (
                <div>
                  <p className="text-slate-400 text-sm mb-1">Entrance Exams</p>
                  <p className="text-white font-semibold">
                    {college.courses[0].eligibility.acceptedEntranceExams.join(", ")}
                  </p>
                </div>
              )}
              {college.courses?.[0]?.fees?.tuitionPerYear && (
                <div>
                  <p className="text-slate-400 text-sm mb-1">Annual Tuition Fee</p>
                  <p className="text-white font-semibold">₹{college.courses[0].fees.tuitionPerYear.toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600/10 via-cyan-600/10 to-teal-600/10 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 mb-12">
          <h2 className="text-3xl font-bold mb-8 text-center">Student Testimonials</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Arjun Sharma", quote: "Best investment in my career. Exceptional faculty and placements!" },
              {
                name: "Priya Patel",
                quote: "The campus life is amazing. Made lifelong friends and learned so much beyond academics.",
              },
              {
                name: "Rohan Kumar",
                quote: "Outstanding infrastructure and world-class teaching. Highly recommended!",
              },
            ].map((testimonial, idx) => (
              <div
                key={idx}
                className="bg-slate-700/50 rounded-xl p-6 border border-slate-600/50 hover:border-cyan-500/50 transition-all"
              >
                <p className="text-slate-300 mb-4 italic">"{testimonial.quote}"</p>
                <p className="text-sm font-semibold text-cyan-400">— {testimonial.name}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center py-12">
          <h3 className="text-3xl font-bold mb-4">Ready to Join {college.name}?</h3>
          <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
            Start your application journey today and unlock your potential with one of India's finest educational
            institutions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl hover:shadow-2xl hover:shadow-blue-500/50 transition-all">
              Start Application
            </button>
            <button className="px-8 py-3 border-2 border-slate-600 text-white font-bold rounded-xl hover:border-cyan-500 hover:bg-slate-800/50 transition-all">
              Schedule Campus Tour
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default CollegeDetails

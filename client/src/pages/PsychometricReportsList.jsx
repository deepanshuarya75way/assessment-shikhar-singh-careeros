"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"

const PsychometricReportsList = () => {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem("user"))

  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchReports = async () => {
      if (!user?._id) {
        setError("User not found")
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/psychometric/all-reports/${user._id}`)

        if (!response.ok) throw new Error("Failed to fetch reports")

        const data = await response.json()
        setReports(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error("Error:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [user])

  const handleViewReport = (reportId) => {
    navigate(`/psychometric-report/${reportId}`)
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 font-semibold">Loading your reports...</p>
        </div>
      </div>
    )

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
          <p className="text-red-700 font-semibold">Error: {error}</p>
          <button
            onClick={() => navigate("/student-dashboard")}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-12">
      <Navbar user={user} />
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Assessment Reports</h1>
          <p className="text-gray-600 text-lg">View all your completed psychometric assessments</p>
        </div>

        {/* Reports List */}
        {reports.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="mb-4">
              <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-gray-600 text-lg font-medium mb-2">No reports yet</p>
            <p className="text-gray-500 mb-6">You haven't completed any psychometric assessments yet.</p>
            <button
              onClick={() => navigate("/psychometric-test")}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Take Assessment Now
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {reports.map((report, index) => {
              const completedDate = new Date(report.testCompletedAt)
              const formattedDate = completedDate.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
              const formattedTime = completedDate.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })

              return (
                <div
                  key={report._id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all overflow-hidden hover:scale-105 transform duration-300"
                >
                  <div className="flex flex-col md:flex-row items-stretch">
                    {/* Left Section - Report Number & Date */}
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-8 flex flex-col justify-center min-w-max">
                      <div className="text-sm font-semibold uppercase tracking-wider opacity-90">Report</div>
                      <div className="text-5xl font-bold mt-2">{reports.length - index}</div>
                      <div className="text-blue-100 text-sm mt-4 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span>
                          {formattedDate} <br /> {formattedTime}
                        </span>
                      </div>
                    </div>

                    {/* Middle Section - Career Summary */}
                    <div className="flex-1 p-8 border-l border-gray-100">
                      <div className="mb-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Career Assessment Summary</h3>
                        <p className="text-gray-600 line-clamp-2 leading-relaxed">{report.personalitySummary}</p>
                      </div>

                      {/* Top Career Match */}
                      {report.recommendedCareers && report.recommendedCareers.length > 0 && (
                        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-4 border border-indigo-200">
                          <p className="text-xs uppercase text-indigo-600 font-bold mb-2">Top Career Match</p>
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-lg font-bold text-gray-900">
                                {report.recommendedCareers[0].careerDomain}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">{report.recommendedCareers[0].description}</p>
                            </div>
                            <div className="flex items-center gap-3 whitespace-nowrap">
                              <div className="text-right">
                                <p className="text-2xl font-bold text-indigo-600">
                                  {report.recommendedCareers[0].matchPercentage}%
                                </p>
                                <p className="text-xs text-gray-500">Match Score</p>
                              </div>
                              <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                                ✓
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Section - View Button */}
                    <div className="bg-gray-50 p-8 flex flex-col justify-center items-center min-w-max border-l border-gray-100">
                      <button
                        onClick={() => handleViewReport(report._id)}
                        className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
                      >
                        <span>View Report</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Back to Dashboard Button */}
        <div className="mt-12 text-center">
          <button
            onClick={() => navigate("/student-dashboard")}
            className="px-6 py-3 border-2 border-indigo-600 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

export default PsychometricReportsList

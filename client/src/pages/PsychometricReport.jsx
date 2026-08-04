
"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation, useParams } from "react-router-dom"
import RadarChart from "../components/RadarChart"
import BarChart from "../components/BarChart"
import Navbar from "../components/Navbar"

const PsychometricReport = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { reportId } = useParams()
  const user = JSON.parse(localStorage.getItem("user"))
  const API_BASE_URL = `${import.meta.env.VITE_API_URL}`

  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchReport = async () => {
      if (!user?._id) {
        setError("User not found")
        setLoading(false)
        return
      }

      try {
        const endpoint = reportId
  ? `${API_BASE_URL}/api/psychometric/psychometric-report/${reportId}`
  : `${API_BASE_URL}/api/psychometric/psychometric-report/latest/${user._id}`


        const response = await fetch(endpoint)
        if (!response.ok) {
          throw new Error(`Failed to fetch report`)
        }
        const data = await response.json()
        setReportData(data)
      } catch (err) {
        console.error("Error:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchReport()
  }, [user, reportId])

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 font-semibold">Loading your report...</p>
        </div>
      </div>
    )
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
          <p className="text-red-700 font-semibold">Error: {error}</p>
        </div>
      </div>
    )
  if (!reportData)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md text-center">
          <p className="text-yellow-700 font-semibold">No report data found</p>
        </div>
      </div>
    )

  const handleDownloadPDF = () => {
    alert("PDF download feature coming soon!")
  }

  const handleGenerateRoadmap = () => {
    navigate("/career-recommendations", { state: { reportData } })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-12">
      <Navbar user={user} />
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="text-center mb-8 pb-6 border-b border-gray-200">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Career Assessment Report</h1>
            <p className="text-gray-600">Completed: {new Date(reportData.testCompletedAt).toLocaleDateString()}</p>
          </div>

          {/* Personality Profile */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Personality Profile</h2>
            <p className="text-gray-700 leading-relaxed mb-6 text-lg italic">{reportData.personalitySummary}</p>
            {reportData.calculatedScores?.bigFive && (
              <RadarChart
                data={[
                  { trait: "Openness", value: reportData.calculatedScores.bigFive.openness },
                  {
                    trait: "Conscientiousness",
                    value: reportData.calculatedScores.bigFive.conscientiousness,
                  },
                  {
                    trait: "Extraversion",
                    value: reportData.calculatedScores.bigFive.extraversion,
                  },
                  {
                    trait: "Agreeableness",
                    value: reportData.calculatedScores.bigFive.agreeableness,
                  },
                  {
                    trait: "Neuroticism",
                    value: reportData.calculatedScores.bigFive.neuroticism,
                  },
                ]}
              />
            )}
          </div>

          {/* Aptitude Scores */}
          <div className="mb-12 pb-12 border-b border-gray-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Aptitude Assessment</h2>
            {reportData.calculatedScores?.aptitude && (
              <BarChart
                data={[
                  { category: "Logical", score: reportData.calculatedScores.aptitude.logical },
                  { category: "Verbal", score: reportData.calculatedScores.aptitude.verbal },
                  {
                    category: "Numerical",
                    score: reportData.calculatedScores.aptitude.numerical,
                  },
                  { category: "Pattern", score: reportData.calculatedScores.aptitude.pattern },
                ]}
              />
            )}
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid md:grid-cols-2 gap-8 mb-12 pb-12 border-b border-gray-200">
            <div className="bg-green-50 rounded-lg p-6 border border-green-200">
              <h3 className="text-xl font-bold text-green-900 mb-4">Your Strengths</h3>
              <ul className="space-y-2">
                {reportData.strengths?.map((strength, idx) => (
                  <li key={idx} className="text-green-700 flex items-start">
                    <span className="text-green-600 mr-3">✓</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h3 className="text-xl font-bold text-blue-900 mb-4">Areas to Develop</h3>
              <ul className="space-y-2">
                {reportData.weaknesses?.map((weakness, idx) => (
                  <li key={idx} className="text-blue-700 flex items-start">
                    <span className="text-blue-600 mr-3">•</span>
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recommended Careers */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Top 5 Career Recommendations</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reportData.recommendedCareers?.map((career, idx) => (
                <div
                  key={idx}
                  className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg border border-indigo-200 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-indigo-600 text-white rounded-full font-bold text-sm">
                      {career.rank}
                    </span>
                    <h4 className="text-lg font-bold text-gray-900">{career.careerDomain}</h4>
                  </div>
                  <div className="mb-3">
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-blue-500 h-full rounded-full transition-all"
                        style={{ width: `${career.matchPercentage}%` }}
                      />
                    </div>
                    <p className="text-sm font-semibold text-indigo-600 mt-2">{career.matchPercentage}% Match</p>
                  </div>
                  <p className="text-sm text-gray-600">{career.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 justify-center pt-8 border-t border-gray-200">
            <button
              onClick={handleGenerateRoadmap}
              className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all"
            >
              Generate Career Roadmap
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-8 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-all"
            >
              Download PDF Report
            </button>
            <button
              onClick={() => navigate("/psychometric-reports-list")}
              className="px-8 py-3 border-2 border-indigo-600 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-all"
            >
              View All Reports
            </button>
            <button
              onClick={() => navigate("/student-dashboard")}
              className="px-8 py-3 border-2 border-gray-400 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PsychometricReport




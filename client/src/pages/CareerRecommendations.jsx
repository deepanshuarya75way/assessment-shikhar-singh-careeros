"use client"

import { useLocation, useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"

const CareerRecommendations = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const reportData = location.state?.reportData

  if (!reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Report Data</h2>
          <p className="text-gray-600 mb-6">Please complete the psychometric test first.</p>
          <button
            onClick={() => navigate("/psychometric-test")}
            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700"
          >
            Take Test
          </button>
        </div>
      </div>
    )
  }

  const roadmapSteps = [
    {
      phase: "Skill Development",
      duration: "3-6 months",
      actions: [
        "Identify skill gaps based on top career choices",
        "Enroll in online courses and certifications",
        "Build a portfolio with projects",
      ],
    },
    {
      phase: "Experience Building",
      duration: "6-12 months",
      actions: [
        "Pursue internships in target domains",
        "Volunteer for relevant projects",
        "Network with professionals in the field",
      ],
    },
    {
      phase: "Job Search",
      duration: "3-6 months",
      actions: [
        "Tailor resume to job descriptions",
        "Apply to entry-level and internship roles",
        "Prepare for technical and HR interviews",
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-12">
      <Navbar />
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="text-center mb-12 pb-8 border-b border-gray-200">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Personalized Career Roadmap</h1>
            <p className="text-gray-600 text-lg">Based on your psychometric assessment results</p>
          </div>

          {/* Recommended Careers Summary */}
          <div className="mb-12 pb-12 border-b border-gray-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Recommended Career Paths</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {reportData.recommendedCareers?.slice(0, 3).map((career, idx) => (
                <div
                  key={idx}
                  className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg border-2 border-indigo-200 p-6 text-center hover:shadow-lg transition-shadow"
                >
                  <h4 className="text-xl font-bold text-gray-900 mb-3">{career.careerDomain}</h4>
                  <p className="text-3xl font-bold text-indigo-600">{career.matchPercentage}%</p>
                  <p className="text-gray-600 text-sm">Match Score</p>
                </div>
              ))}
            </div>
          </div>

          {/* Roadmap Timeline */}
          <div className="mb-12 pb-12 border-b border-gray-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Your Career Development Timeline</h2>
            <div className="space-y-6">
              {roadmapSteps.map((step, idx) => (
                <div key={idx} className="flex gap-6">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                      {idx + 1}
                    </div>
                    {idx < roadmapSteps.length - 1 && <div className="w-1 h-16 bg-indigo-200 mt-2"></div>}
                  </div>
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-200 p-6 flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{step.phase}</h3>
                    <p className="text-indigo-600 font-semibold mb-3">Duration: {step.duration}</p>
                    <ul className="space-y-2">
                      {step.actions.map((action, i) => (
                        <li key={i} className="text-gray-700 flex items-start">
                          <span className="text-indigo-600 mr-3">→</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skills to Develop */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Key Skills to Develop</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-green-50 rounded-lg border border-green-200 p-6">
                <h4 className="text-xl font-bold text-green-900 mb-4">Technical Skills</h4>
                <ul className="space-y-2 text-green-700">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Programming languages</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Data analysis tools</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Domain-specific software</span>
                  </li>
                </ul>
              </div>
              <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
                <h4 className="text-xl font-bold text-blue-900 mb-4">Soft Skills</h4>
                <ul className="space-y-2 text-blue-700">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Communication</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Problem-solving</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Team collaboration</span>
                  </li>
                </ul>
              </div>
              <div className="bg-purple-50 rounded-lg border border-purple-200 p-6">
                <h4 className="text-xl font-bold text-purple-900 mb-4">Professional Development</h4>
                <ul className="space-y-2 text-purple-700">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Certifications</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Industry projects</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Networking</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex flex-wrap gap-4 justify-center pt-8 border-t border-gray-200">
            <button
              onClick={() => navigate("/psychometric-report")}
              className="px-8 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-all"
            >
              Back to Report
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CareerRecommendations

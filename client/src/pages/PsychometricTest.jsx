"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import StepLayout from "../components/StepLayout"
import ProgressBar from "../components/ProgressBar"
import PersonalitySection from "../components/PersonalitySection"
import AptitudeSection from "../components/AptitudeSection"
import RIASECSection from "../components/RIASECSection"
import ValuesSection from "../components/ValuesSection"
import SubmitModal from "../components/SubmitModal"
import Navbar from "../components/Navbar"

const PsychometricTest = () => {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem("user"))

  const [currentStep, setCurrentStep] = useState(1)
  const [showSubmitModal, setShowSubmitModal] = useState(false)

  const [personalityResponses, setPersonalityResponses] = useState([])
  const [aptitudeResponses, setAptitudeResponses] = useState([])
  const [riasecResponses, setRIASECResponses] = useState([])
  const [valuesResponses, setValuesResponses] = useState([])

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
      window.scrollTo(0, 0)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo(0, 0)
    }
  }

  const handlePersonalityChange = (responses) => {
    setPersonalityResponses(responses)
  }

  const handleAptitudeChange = (responses) => {
    setAptitudeResponses(responses)
  }

  const handleRIASECChange = (responses) => {
    setRIASECResponses(responses)
  }

  const handleValuesChange = (responses) => {
    setValuesResponses(responses)
  }

  const handleSubmit = async () => {
    if (!user?._id) {
      alert("User not found. Please login again.")
      return
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/psychometric/submit-psychometric-test`
, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          personalityResponses,
          aptitudeResponses,
          riasecResponses,
          valuesResponses,
        }),
      })

      if (!response.ok) throw new Error("Submission failed")

      const data = await response.json()
      alert("Test submitted successfully!")
      navigate("/psychometric-report", { state: { testId: data.testId, userId: user._id } })
    } catch (error) {
      console.error("Error:", error)
      alert("Failed to submit test. Please try again.")
    }

    setShowSubmitModal(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-12">
      <Navbar user={user} />
      <StepLayout currentStep={currentStep} totalSteps={4}>
        <ProgressBar currentStep={currentStep} totalSteps={4} />

        {currentStep === 1 && (
          <PersonalitySection onResponseChange={handlePersonalityChange} responses={personalityResponses} />
        )}

        {currentStep === 2 && <AptitudeSection onResponseChange={handleAptitudeChange} responses={aptitudeResponses} />}

        {currentStep === 3 && <RIASECSection onResponseChange={handleRIASECChange} responses={riasecResponses} />}

        {currentStep === 4 && <ValuesSection onResponseChange={handleValuesChange} responses={valuesResponses} />}

        <div className="flex justify-between gap-4 mt-8">
          <button
            onClick={handlePrevStep}
            disabled={currentStep === 1}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              currentStep === 1
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gray-500 text-white hover:bg-gray-600 shadow-md hover:shadow-lg"
            }`}
          >
            Back
          </button>

          {currentStep < 4 ? (
            <button
              onClick={handleNextStep}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 shadow-md hover:shadow-lg transition-all"
            >
              Next
            </button>
          ) : (
            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 shadow-md hover:shadow-lg transition-all"
            >
              Submit Test
            </button>
          )}
        </div>
      </StepLayout>

      {showSubmitModal && <SubmitModal onConfirm={handleSubmit} onCancel={() => setShowSubmitModal(false)} />}
    </div>
  )
}

export default PsychometricTest

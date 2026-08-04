"use client"

import { useState } from "react"

const CounsellorProfilePopup = ({ user, onComplete, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    professionalTitle: "",
    specialization: "",
    expertise: [],
    experience: "",
    qualifications: [],
    languages: [],
    location: "",
    phoneNumber: "",
    bio: "",
  })

  const steps = [
    { title: "Professional Basics", subtitle: "Core profile details" },
    { title: "Experience & Qualifications", subtitle: "Your background and credentials" },
    { title: "Expertise & Languages", subtitle: "Your counseling focus and communication" },
  ]

  const expertiseOptions = [
    "Career Counseling",
    "Academic Guidance",
    "College Admissions",
    "Skill Development",
    "Mental Health",
    "Life Coaching",
  ]

  const languageOptions = [
    "English",
    "Hindi",
    "Bengali",
    "Tamil",
    "Telugu",
    "Marathi",
    "Gujarati",
    "Kannada",
    "Malayalam",
    "Punjabi",
  ]

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleMultiSelect = (field, option) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(option)
        ? prev[field].filter((item) => item !== option)
        : [...prev[field], option],
    }))
  }

  const handleQualificationChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      qualifications: prev.qualifications.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }))
  }

  const addQualification = () => {
    setFormData((prev) => ({
      ...prev,
      qualifications: [...prev.qualifications, { degree: "", institution: "", year: "" }],
    }))
  }

  const removeQualification = (index) => {
    setFormData((prev) => ({
      ...prev,
      qualifications: prev.qualifications.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    try {
      const payload = {
        userId: user._id,
        professionalTitle: formData.professionalTitle,
        specialization: formData.specialization,
        expertise: formData.expertise,
        experience: Number(formData.experience),
        qualifications: formData.qualifications.map((item) => ({
          degree: item.degree,
          institution: item.institution,
          year: item.year ? Number(item.year) : undefined,
        })),
        languages: formData.languages,
        location: formData.location,
        phoneNumber: formData.phoneNumber,
        bio: formData.bio,
        verified: false,
        profileCompleted: true,
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/users/complete-counsellor-profile`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )

      if (response.ok) {
        const profileData = await response.json()
        onComplete(profileData)
      } else {
        const err = await response.json()
        console.error("Failed to save counsellor profile:", err)
        alert("Failed to save profile. Check console for details.")
      }
    } catch (error) {
      console.error("Error saving counsellor profile:", error)
      alert("Error saving profile. Please try again.")
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Professional Title</label>
              <input
                type="text"
                value={formData.professionalTitle}
                onChange={(e) => handleInputChange("professionalTitle", e.target.value)}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="e.g. Career Counsellor"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Primary Specialization *</label>
              <input
                type="text"
                value={formData.specialization}
                onChange={(e) => handleInputChange("specialization", e.target.value)}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your specialization"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="City, State"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Phone Number</label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="+91 9876543210"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Tell students about your background and approach..."
                rows="4"
              />
            </div>
          </div>
        )

      case 1:
        return (
          <div className="space-y-8">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Years of Experience *</label>
              <input
                type="number"
                value={formData.experience}
                onChange={(e) => handleInputChange("experience", e.target.value)}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter years of experience"
                min="0"
                max="50"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold text-gray-700">Qualifications</label>
                <button
                  type="button"
                  onClick={addQualification}
                  className="px-3 py-2 text-sm rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200"
                >
                  Add Qualification
                </button>
              </div>

              <div className="space-y-4">
                {formData.qualifications.length === 0 ? (
                  <p className="text-sm text-gray-500">No qualifications added yet.</p>
                ) : (
                  formData.qualifications.map((qualification, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-700">Qualification {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeQualification(index)}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>

                      <input
                        type="text"
                        value={qualification.degree}
                        onChange={(e) => handleQualificationChange(index, "degree", e.target.value)}
                        className="w-full p-3 border-2 border-gray-200 rounded-lg"
                        placeholder="Degree"
                      />
                      <input
                        type="text"
                        value={qualification.institution}
                        onChange={(e) => handleQualificationChange(index, "institution", e.target.value)}
                        className="w-full p-3 border-2 border-gray-200 rounded-lg"
                        placeholder="Institution"
                      />
                      <input
                        type="number"
                        value={qualification.year}
                        onChange={(e) => handleQualificationChange(index, "year", e.target.value)}
                        className="w-full p-3 border-2 border-gray-200 rounded-lg"
                        placeholder="Year"
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-8">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-4">Areas of Expertise</label>
              <div className="grid grid-cols-2 gap-3">
                {expertiseOptions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleMultiSelect("expertise", item)}
                    className={`p-3 text-sm rounded-xl border-2 transition-all ${
                      formData.expertise.includes(item)
                        ? "bg-purple-500 text-white border-purple-500 shadow-lg"
                        : "bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-4">Languages Spoken</label>
              <div className="grid grid-cols-2 gap-3">
                {languageOptions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleMultiSelect("languages", item)}
                    className={`p-3 text-sm rounded-xl border-2 transition-all ${
                      formData.languages.includes(item)
                        ? "bg-teal-500 text-white border-teal-500 shadow-lg"
                        : "bg-white text-gray-700 border-gray-200 hover:border-teal-300 hover:bg-teal-50"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return formData.specialization.trim().length > 0
      case 1:
        return formData.experience !== "" && Number(formData.experience) >= 0
      case 2:
        return formData.expertise.length > 0 && formData.languages.length > 0
      default:
        return false
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Counsellor Profile</h2>
              <p className="text-gray-600">Share only the profile details students need to know.</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-3xl font-light transition-colors"
            >
              ×
            </button>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      index <= currentStep ? "bg-blue-500 text-white shadow-lg" : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {index + 1}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-16 h-1 mx-2 rounded-full transition-all ${
                        index < currentStep ? "bg-blue-500" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">{steps[currentStep].title}</h3>
              <p className="text-sm text-gray-600">{steps[currentStep].subtitle}</p>
            </div>
          </div>
        </div>

        <div className="p-8">{renderStepContent()}</div>

        <div className="p-8 border-t border-gray-200 bg-gray-50 flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="px-6 py-3 text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
          >
            Previous
          </button>

          {currentStep === steps.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={!formData.specialization.trim() || !formData.experience || formData.expertise.length === 0 || formData.languages.length === 0}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Complete Profile
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!isStepValid()}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
            >
              Next Step
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default CounsellorProfilePopup

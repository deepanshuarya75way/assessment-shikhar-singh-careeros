import React, { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import {
  Pencil,
  Camera,
  User,
  Mail,
  Cake,
  GraduationCap,
  FlaskConical,
  MapPin,
  ShieldCheck,
  Heart,
  BookOpen,
  Target,
  ArrowLeft,
  Check,
  X,
  Plus,
} from "lucide-react"
import Navbar from "../components/Navbar"

const ProfilePage = () => {
  const navigate = useNavigate()

  // Primary user state from local storage or defaults
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {
        _id: "demo-user-id",
        name: "Maya Sharma",
        email: "maya.sharma@careeros.com",
        role: "Student",
      }
    } catch {
      return {
        _id: "demo-user-id",
        name: "Maya Sharma",
        email: "maya.sharma@careeros.com",
        role: "Student",
      }
    }
  })

  // User avatar state
  const [avatarImage, setAvatarImage] = useState(() => {
    return localStorage.getItem("userAvatar") || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400"
  })

  // Student Profile state from backend/local storage
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("userProfile"))
      if (saved) return saved
    } catch {
      // fallback
    }
    return {
      name: user?.name || "Maya Sharma",
      email: user?.email || "maya.sharma@careeros.com",
      age: "17 years",
      grade: "Grade 11",
      stream: "Science",
      location: "Bengaluru, India",
      interests: ["Robotics", "Astronomy", "Coding", "Design", "Reading"],
      strongSubjects: ["Physics", "Mathematics", "Computer Science", "Chemistry"],
      careerGoals:
        "Aspiring Aerospace Engineer aiming to work on next-generation propulsion systems. Passionate about combining physics and coding to solve real-world challenges in space exploration.",
    }
  })

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef(null)

  // Editable Form Data
  const [formData, setFormData] = useState(userProfile)
  const [newInterest, setNewInterest] = useState("")
  const [newSubject, setNewSubject] = useState("")

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)

  // Fetch full student profile from backend API
  useEffect(() => {
    if (!user) return

    const userId = user._id || user.id
    if (userId && userId !== "demo-user-id") {
      const apiUrl = import.meta.env.VITE_API_URL || ""
      fetch(`${apiUrl}/api/users/profile/${userId}`)
        .then((res) => {
          if (!res.ok) throw new Error("Profile endpoint response not ok")
          return res.json()
        })
        .then((data) => {
          if (data) {
            if (data.avatar || data.profilePicture) {
              const photoUrl = data.avatar || data.profilePicture
              setAvatarImage(photoUrl)
              localStorage.setItem("userAvatar", photoUrl)
              window.dispatchEvent(new Event("userAvatarUpdated"))
            }

            const merged = {
              name: data.name || user.name || "Maya Sharma",
              email: user.email || "maya.sharma@careeros.com",
              age: data.age ? `${data.age}${String(data.age).includes("years") ? "" : " years"}` : "17 years",
              grade: data.grade ? (data.grade.toLowerCase().includes("grade") ? data.grade : `Grade ${data.grade}`) : "Grade 11",
              stream: data.stream || "Science",
              location: data.location || "Bengaluru, India",
              interests:
                Array.isArray(data.interests) && data.interests.length > 0
                  ? data.interests
                  : ["Robotics", "Astronomy", "Coding", "Design", "Reading"],
              strongSubjects:
                Array.isArray(data.strongSubjects) && data.strongSubjects.length > 0
                  ? data.strongSubjects
                  : ["Physics", "Mathematics", "Computer Science", "Chemistry"],
              careerGoals:
                data.careerGoals ||
                "Aspiring Aerospace Engineer aiming to work on next-generation propulsion systems. Passionate about combining physics and coding to solve real-world challenges in space exploration.",
            }
            setUserProfile(merged)
            setFormData(merged)
            localStorage.setItem("userProfile", JSON.stringify(merged))
          }
        })
        .catch((err) => {
          console.log("Using cached/default profile data:", err)
        })
    }
  }, [user])

  // Synchronize form data when starting edit
  const handleStartEdit = () => {
    setFormData({
      ...userProfile,
      name: formData.name || user.name || "Maya Sharma",
      email: user.email || "maya.sharma@careeros.com",
    })
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setFormData(userProfile)
    setIsEditing(false)
  }

  // Handle Photo Click & File Upload to Cloudinary
  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB")
      return
    }

    setIsUploadingPhoto(true)

    const reader = new FileReader()
    reader.onload = async (event) => {
      const imageData = event.target?.result
      if (!imageData) {
        setIsUploadingPhoto(false)
        return
      }

      try {
        const apiUrl = import.meta.env.VITE_API_URL || ""
        const userId = user?._id || user?.id

        const response = await fetch(`${apiUrl}/api/users/upload-avatar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: imageData,
            userId: userId,
          }),
        })

        const data = await response.json()

        if (response.ok && data.url) {
          setAvatarImage(data.url)
          localStorage.setItem("userAvatar", data.url)

          const updatedUser = { ...user, avatar: data.url, profilePicture: data.url }
          setUser(updatedUser)
          localStorage.setItem("user", JSON.stringify(updatedUser))

          window.dispatchEvent(new Event("userAvatarUpdated"))
          alert("Profile picture uploaded to Cloudinary & saved to profile!")
        } else {
          // Direct client fallback to Cloudinary REST API
          const cloudFormData = new FormData()
          cloudFormData.append("file", file)
          cloudFormData.append("upload_preset", "ml_default")

          const cloudRes = await fetch("https://api.cloudinary.com/v1_1/svbvm4kd/image/upload", {
            method: "POST",
            body: cloudFormData,
          })
          const cloudData = await cloudRes.json()

          if (cloudData.secure_url) {
            setAvatarImage(cloudData.secure_url)
            localStorage.setItem("userAvatar", cloudData.secure_url)
            window.dispatchEvent(new Event("userAvatarUpdated"))
            alert("Profile picture uploaded to Cloudinary!")
          } else {
            alert(data.error || "Failed to upload image to Cloudinary")
          }
        }
      } catch (err) {
        console.error("Cloudinary upload error:", err)
        setAvatarImage(imageData)
        localStorage.setItem("userAvatar", imageData)
        window.dispatchEvent(new Event("userAvatarUpdated"))
      } finally {
        setIsUploadingPhoto(false)
      }
    }
    reader.readAsDataURL(file)
  }

  // Form Change Handlers
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Interest Badge Handlers
  const handleAddInterest = () => {
    if (!newInterest.trim()) return
    const current = formData.interests || []
    if (!current.includes(newInterest.trim())) {
      setFormData((prev) => ({
        ...prev,
        interests: [...current, newInterest.trim()],
      }))
    }
    setNewInterest("")
  }

  const handleRemoveInterest = (interestToRemove) => {
    setFormData((prev) => ({
      ...prev,
      interests: (prev.interests || []).filter((item) => item !== interestToRemove),
    }))
  }

  // Subject Badge Handlers
  const handleAddSubject = () => {
    if (!newSubject.trim()) return
    const current = formData.strongSubjects || []
    if (!current.includes(newSubject.trim())) {
      setFormData((prev) => ({
        ...prev,
        strongSubjects: [...current, newSubject.trim()],
      }))
    }
    setNewSubject("")
  }

  const handleRemoveSubject = (subjectToRemove) => {
    setFormData((prev) => ({
      ...prev,
      strongSubjects: (prev.strongSubjects || []).filter((item) => item !== subjectToRemove),
    }))
  }

  // Save Profile Handler
  const handleSaveProfile = async () => {
    setIsSaving(true)
    const updated = { ...formData }
    setUserProfile(updated)
    localStorage.setItem("userProfile", JSON.stringify(updated))

    // Update user name in local storage
    if (updated.name) {
      const updatedUser = { ...user, name: updated.name }
      setUser(updatedUser)
      localStorage.setItem("user", JSON.stringify(updatedUser))
    }

    // Call Backend PUT /api/users/profile/:userId
    const userId = user?._id || user?.id
    if (userId && userId !== "demo-user-id") {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || ""
        await fetch(`${apiUrl}/api/users/profile/${userId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        })
      } catch (err) {
        console.error("Backend sync notice:", err)
      }
    }

    setIsSaving(false)
    setIsEditing(false)
  }

  const currentName = isEditing ? formData.name : userProfile.name || user?.name || "Maya Sharma"
  const currentEmail = user?.email || userProfile.email || "maya.sharma@careeros.com"
  const currentGrade = isEditing ? formData.grade : userProfile.grade || "Grade 11"
  const currentStream = isEditing ? formData.stream : userProfile.stream || "Science"
  const currentAge = isEditing ? formData.age : userProfile.age || "17 years"
  const currentLocation = isEditing ? formData.location : userProfile.location || "Bengaluru, India"
  const currentInterests = isEditing ? formData.interests : userProfile.interests || []
  const currentSubjects = isEditing ? formData.strongSubjects : userProfile.strongSubjects || []
  const currentGoals = isEditing ? formData.careerGoals : userProfile.careerGoals || ""

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 pb-16 font-sans">
      <Navbar user={user} />
      {/* Hidden File Input for Avatar */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-200/60 rounded-xl transition-all"
              title="Go Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Profile</h1>
              <p className="text-sm text-gray-500 font-medium mt-0.5">
                Manage your personal details and career preferences on CareerOS.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-black hover:bg-zinc-800 text-white rounded-xl font-semibold text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleStartEdit}
                className="px-5 py-2.5 bg-[#18181b] hover:bg-black text-white rounded-xl font-semibold text-sm flex items-center gap-2 shadow-sm border border-zinc-800 transition-all cursor-pointer"
              >
                <Pencil className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column (Avatar + Account Info) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Card 1: User Avatar Card */}
            <div className="bg-white rounded-2xl p-7 border border-gray-200/80 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] text-center flex flex-col items-center justify-center">
              <div
                onClick={handleAvatarClick}
                className="w-36 h-36 rounded-full border-4 border-white shadow-md relative group overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]"
              >
                <img
                  src={avatarImage}
                  alt={currentName}
                  className="w-full h-full object-cover"
                />
                
                {/* Camera Overlay strictly matching Image 1 */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity duration-200 cursor-pointer">
                  <Camera className="w-6 h-6 mb-1 text-white" />
                  <span className="text-xs font-semibold tracking-wide">Change Photo</span>
                </div>
              </div>

              {/* Name & Grade/Stream info */}
              {isEditing ? (
                <div className="mt-4 w-full px-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 text-left">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-black text-center"
                    placeholder="Enter name"
                  />
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-gray-900 mt-4 mb-1">{currentName}</h2>
                  <p className="text-sm font-medium text-gray-500 mb-3">
                    {currentGrade} · {currentStream} Stream
                  </p>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 text-white text-xs font-medium shadow-sm">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span className="capitalize">{user?.role || "Student"}</span>
                  </div>
                </>
              )}
            </div>

            {/* Card 2: Account Information */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-2.5 mb-6">
                <ShieldCheck className="w-5 h-5 text-gray-700" />
                <h3 className="font-bold text-gray-900 text-base">Account Information</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-1">
                    EMAIL
                  </p>
                  <p className="text-sm font-semibold text-gray-900 break-all">{currentEmail}</p>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <p className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-1">
                    ROLE
                  </p>
                  <p className="text-sm font-semibold text-gray-900 capitalize">
                    {user?.role || "Student"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (Personal Info, Interests, Strong Subjects, Career Goals) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Card 3: Personal Information */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-2.5 mb-1">
                <User className="w-5 h-5 text-gray-700" />
                <h3 className="font-bold text-gray-900 text-lg">Personal Information</h3>
              </div>
              <p className="text-xs text-gray-400 font-medium mb-6">Your basic details and background</p>

              {/* 2-Column Info Grid matching Image 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                
                {/* 1. Name */}
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-gray-100/90 flex items-center justify-center text-gray-700 shrink-0 border border-gray-200/50">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-400 mb-0.5">Name</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        className="w-full px-2.5 py-1 border border-gray-300 rounded-lg text-sm font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-black"
                      />
                    ) : (
                      <p className="text-sm font-bold text-gray-900 truncate">{currentName}</p>
                    )}
                  </div>
                </div>

                {/* 2. Email */}
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-gray-100/90 flex items-center justify-center text-gray-700 shrink-0 border border-gray-200/50">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-400 mb-0.5">Email</p>
                    <p className="text-sm font-bold text-gray-900 truncate">{currentEmail}</p>
                  </div>
                </div>

                {/* 3. Age */}
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-gray-100/90 flex items-center justify-center text-gray-700 shrink-0 border border-gray-200/50">
                    <Cake className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-400 mb-0.5">Age</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.age}
                        onChange={(e) => handleInputChange("age", e.target.value)}
                        className="w-full px-2.5 py-1 border border-gray-300 rounded-lg text-sm font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-black"
                      />
                    ) : (
                      <p className="text-sm font-bold text-gray-900">{currentAge}</p>
                    )}
                  </div>
                </div>

                {/* 4. Grade */}
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-gray-100/90 flex items-center justify-center text-gray-700 shrink-0 border border-gray-200/50">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-400 mb-0.5">Grade</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.grade}
                        onChange={(e) => handleInputChange("grade", e.target.value)}
                        className="w-full px-2.5 py-1 border border-gray-300 rounded-lg text-sm font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-black"
                      />
                    ) : (
                      <p className="text-sm font-bold text-gray-900">{currentGrade}</p>
                    )}
                  </div>
                </div>

                {/* 5. Stream */}
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-gray-100/90 flex items-center justify-center text-gray-700 shrink-0 border border-gray-200/50">
                    <FlaskConical className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-400 mb-0.5">Stream</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.stream}
                        onChange={(e) => handleInputChange("stream", e.target.value)}
                        className="w-full px-2.5 py-1 border border-gray-300 rounded-lg text-sm font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-black"
                      />
                    ) : (
                      <p className="text-sm font-bold text-gray-900">{currentStream}</p>
                    )}
                  </div>
                </div>

                {/* 6. Location */}
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-gray-100/90 flex items-center justify-center text-gray-700 shrink-0 border border-gray-200/50">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-400 mb-0.5">Location</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => handleInputChange("location", e.target.value)}
                        className="w-full px-2.5 py-1 border border-gray-300 rounded-lg text-sm font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-black"
                      />
                    ) : (
                      <p className="text-sm font-bold text-gray-900 truncate">{currentLocation}</p>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Row with 2 Side-by-Side Cards: Interests & Strong Subjects */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Card 4: Interests */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Heart className="w-5 h-5 text-gray-700" />
                    <h3 className="font-bold text-gray-900 text-base">Interests</h3>
                  </div>

                  {/* Pills List */}
                  <div className="flex flex-wrap gap-2.5">
                    {currentInterests.map((interest, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-gray-100/90 text-gray-800 text-xs font-semibold border border-gray-200/60"
                      >
                        {interest}
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => handleRemoveInterest(interest)}
                            className="text-gray-400 hover:text-red-500 ml-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </span>
                    ))}
                    {currentInterests.length === 0 && (
                      <span className="text-xs text-gray-400 italic">No interests specified</span>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-4 flex gap-2 pt-3 border-t border-gray-100">
                    <input
                      type="text"
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddInterest())}
                      placeholder="Add interest"
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-black"
                    />
                    <button
                      type="button"
                      onClick={handleAddInterest}
                      className="p-1.5 bg-black text-white rounded-xl hover:bg-zinc-800 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Card 5: Strong Subjects */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="w-5 h-5 text-gray-700" />
                    <h3 className="font-bold text-gray-900 text-base">Strong Subjects</h3>
                  </div>

                  {/* Pills List */}
                  <div className="flex flex-wrap gap-2.5">
                    {currentSubjects.map((subject, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-gray-100/90 text-gray-800 text-xs font-semibold border border-gray-200/60"
                      >
                        {subject}
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSubject(subject)}
                            className="text-gray-400 hover:text-red-500 ml-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </span>
                    ))}
                    {currentSubjects.length === 0 && (
                      <span className="text-xs text-gray-400 italic">No strong subjects specified</span>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-4 flex gap-2 pt-3 border-t border-gray-100">
                    <input
                      type="text"
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSubject())}
                      placeholder="Add subject"
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-black"
                    />
                    <button
                      type="button"
                      onClick={handleAddSubject}
                      className="p-1.5 bg-black text-white rounded-xl hover:bg-zinc-800 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* Card 6: Career Goals */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white flex items-center justify-center shrink-0">
                  <Target className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-gray-900 text-base">Career Goals</h3>
              </div>

              {isEditing ? (
                <textarea
                  rows={4}
                  value={formData.careerGoals}
                  onChange={(e) => handleInputChange("careerGoals", e.target.value)}
                  className="w-full p-3.5 bg-gray-50 border border-gray-300 rounded-2xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Describe your career goals..."
                />
              ) : (
                <div className="bg-gray-50/90 border border-gray-200/80 rounded-2xl p-5">
                  <p className="text-sm font-medium text-gray-700 leading-relaxed">
                    {currentGoals || "No career goals specified yet."}
                  </p>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}

export default ProfilePage
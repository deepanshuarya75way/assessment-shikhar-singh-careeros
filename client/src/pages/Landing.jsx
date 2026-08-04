
"use client"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { useState, useCallback } from "react" // Added useCallback
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GraduationCap, Users, UserCheck, BookOpen, Target, TrendingUp } from "lucide-react"
import Navbar from "../components/Navbar"
import ProfileCompletionPopup from "./ProfileCompletionPopup"
import CounsellorProfilePopup from "./CounsellorProfilePopup"

export default function LandingPage() {
  const navigate = useNavigate()
  const [isSignUp, setIsSignUp] = useState(false)
  const [selectedRole, setSelectedRole] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showOTP, setShowOTP] = useState(false)
  const [otp, setOTP] = useState("")
  const [tempUserId, setTempUserId] = useState("")
  const [tempEmail, setTempEmail] = useState("")
  const [user, setUser] = useState(null)
  const [verifying, setVerifying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showProfilePopup, setShowProfilePopup] = useState(false)
  const [showCounsellorPopup, setShowCounsellorPopup] = useState(false)

  const handleRoleSelection = async (role) => {
    if (!name || !email || !password || !role) {
      alert("Please fill all fields!")
      return
    }

    try {
      setIsLoading(true) // Added loading state
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/users/signup`, {
        name,
        email,
        password,
        role,
      })

      alert("OTP sent to your email!")
      setTempUserId(res.data.userId)
      setTempEmail(email)
      setShowOTP(true)
    } catch (err) {
      console.error("[v0] Signup error:", err)
      alert(err.response?.data?.error || "Error creating user")
    } finally {
      setIsLoading(false) // Clear loading state
    }
  }

  const handleVerifyOTP = async () => {
    if (verifying) return
    setVerifying(true)

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/users/verify-otp`, {
        userId: tempUserId,
        otp: otp.trim(),
      })

      const verifiedUser = res.data.user
      setUser(verifiedUser)
      localStorage.setItem("user", JSON.stringify(verifiedUser))

      if (verifiedUser.role === "student") {
        setShowProfilePopup(true)
      } else if (verifiedUser.role === "counselor") {
        setShowCounsellorPopup(true)
      } else {
        navigate("/parent-dashboard", { state: { user: verifiedUser } })
      }
    } catch (err) {
      alert(err.response?.data?.error || "Invalid or expired OTP")
    } finally {
      setVerifying(false)
    }
  }

  const handleSignIn = async () => {
    if (!email || !password) {
      alert("Please enter email and password")
      return
    }

    try {
      setIsLoading(true) // Added loading state
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/users/signin`, {
        email,
        password,
      })

      const loggedInUser = res.data.user
      setUser(loggedInUser)
      localStorage.setItem("user", JSON.stringify(loggedInUser))

      if (loggedInUser.role === "student") {
        try {
          await axios.get(`${import.meta.env.VITE_API_URL}/api/users/profile/${loggedInUser._id}`)
          navigate("/student-dashboard", { state: { user: loggedInUser } })
        } catch {
          setShowProfilePopup(true)
        }
      } else if (loggedInUser.role === "counselor") {
        try {
          await axios.get(`${import.meta.env.VITE_API_URL}/api/users/counsellor-profile/${loggedInUser._id}`)
          navigate("/counselor-dashboard", { state: { user: loggedInUser } })
        } catch {
          setShowCounsellorPopup(true)
        }
      } else navigate("/parent-dashboard", { state: { user: loggedInUser } })
    } catch (err) {
      console.error("[v0] Signin error:", err)
      alert(err.response?.data?.error || "Signin failed")
    } finally {
      setIsLoading(false) // Clear loading state
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 font-sans pb-16" data-context="landing">
      <Navbar onAuthToggle={() => setIsSignUp(!isSignUp)} isSignUp={isSignUp} />

      <main className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 bg-gradient-to-b from-blue-50/80 via-sky-50/30 to-transparent rounded-3xl p-8 sm:p-10 border border-blue-100/50 shadow-sm">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight text-balance">
              Your Path to a <span className="text-blue-600">Successful Career</span>
            </h2>
            <p className="text-lg text-gray-600 font-medium leading-relaxed">
              Connect students, parents, and counselors on one comprehensive platform. Get personalized career guidance,
              track progress, and make informed decisions about your future.
            </p>

            {/* Features */}
            <div className="grid gap-5 mt-8">
              <div className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100/50 shrink-0">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Personalized Career Paths</h3>
                  <p className="text-sm text-gray-500 font-medium mt-0.5">
                    Tailored recommendations based on your interests and goals
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100/50 shrink-0">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Progress Tracking</h3>
                  <p className="text-sm text-gray-500 font-medium mt-0.5">Monitor your journey and celebrate milestones</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100/50 shrink-0">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Expert Guidance</h3>
                  <p className="text-sm text-gray-500 font-medium mt-0.5">Connect with professional counselors and mentors</p>
                </div>
              </div>
            </div>
          </div>

          {!showOTP && (
            <div className="w-full max-w-md mx-auto bg-white rounded-3xl border border-gray-200/80 p-8 shadow-sm" data-form-state={isSignUp ? "signup" : "signin"}>
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{isSignUp ? "Create Your Account" : "Welcome Back"}</h3>
                <p className="text-sm text-gray-500 font-medium">
                  {isSignUp ? "Join thousands of students on their career journey" : "Sign in to continue your journey"}
                </p>
              </div>

              <div className="space-y-4">
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-700 font-semibold">Name</Label>
                    <Input
                      id="name"
                      data-action="name"
                      type="text"
                      className="border-gray-200 focus-visible:ring-blue-600 rounded-xl"
                      placeholder="Your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      aria-label="Enter your full name"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-semibold">Email</Label>
                  <Input
                    id="email"
                    data-action="email"
                    type="email"
                    className="border-gray-200 focus-visible:ring-blue-600 rounded-xl"
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-label="Enter your email address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-semibold">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    data-action="password"
                    className="border-gray-200 focus-visible:ring-blue-600 rounded-xl"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-label="Enter your password"
                  />
                </div>

                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-gray-700 font-semibold">I am a...</Label>
                    <Select
                      value={selectedRole}
                      onValueChange={(v) => {
                        console.log("[v0] Role selected:", v)
                        setSelectedRole(v)
                      }}
                    >
                      <SelectTrigger id="role" data-action="role" aria-label="Select your role" className="border-gray-200 focus:ring-blue-600 rounded-xl">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student" data-action="role-student">
                          Student
                        </SelectItem>
                        <SelectItem value="parent" data-action="role-parent">
                          Parent
                        </SelectItem>
                        <SelectItem value="counselor" data-action="role-counselor">
                          Counselor
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-sm shadow-blue-200 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  data-action="submit-auth"
                  onClick={() => (isSignUp ? handleRoleSelection(selectedRole) : handleSignIn())}
                  disabled={(isSignUp && !selectedRole) || isLoading}
                  aria-label={isSignUp ? "Create your account" : "Sign in to your account"}
                >
                  {isLoading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
                </button>

                <div className="text-center text-sm text-gray-500 mt-6">
                  {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                  <button
                    data-action="toggle-signup-link"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-blue-600 hover:text-blue-700 hover:underline font-bold transition-colors"
                  >
                    {isSignUp ? "Sign in" : "Sign up"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {showOTP && (
            <div className="w-full max-w-md mx-auto bg-white rounded-3xl border border-gray-200/80 p-8 shadow-sm">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h3>
                <p className="text-sm text-gray-500 font-medium">Enter the 6-digit OTP sent to {tempEmail}</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-gray-700 font-semibold">OTP</Label>
                  <Input
                    id="otp"
                    data-action="otp"
                    type="text"
                    className="border-gray-200 focus-visible:ring-blue-600 rounded-xl"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOTP(e.target.value)}
                    aria-label="Enter the OTP sent to your email"
                  />
                </div>
                <button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-sm shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed" 
                  data-action="submit-otp" 
                  onClick={handleVerifyOTP} 
                  disabled={verifying}
                >
                  {verifying ? "Verifying..." : "Verify OTP"}
                </button>
              </div>
            </div>
          )}
        </div>

        <section className="mt-20">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-extrabold text-gray-900 mb-2">Choose Your Path</h3>
            <p className="text-gray-500 font-medium">Different roles, tailored experiences</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div
              className="bg-white rounded-3xl border border-gray-200/80 p-8 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col cursor-pointer group"
              data-action="select-student-role"
              onClick={() => {
                setSelectedRole("student")
                setIsSignUp(true)
                window.scrollTo({ top: 0, behavior: "smooth" })
              }}
              tabIndex={0}
              role="button"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-5 border border-blue-100/50 group-hover:scale-110 transition-transform">
                  <GraduationCap className="h-8 w-8" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">Students</h4>
                <p className="text-sm text-gray-500 font-medium">Discover your potential and plan your future</p>
              </div>
              <ul className="space-y-3 text-sm text-gray-600 font-medium mt-auto border-t border-gray-100 pt-6">
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></div> Personalized career assessments</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></div> Goal setting and tracking</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></div> Course recommendations</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></div> Progress monitoring</li>
              </ul>
            </div>

            <div
              className="bg-white rounded-3xl border border-gray-200/80 p-8 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col cursor-pointer group"
              data-action="select-parent-role"
              onClick={() => {
                setSelectedRole("parent")
                setIsSignUp(true)
                window.scrollTo({ top: 0, behavior: "smooth" })
              }}
              tabIndex={0}
              role="button"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-5 border border-blue-100/50 group-hover:scale-110 transition-transform">
                  <Users className="h-8 w-8" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">Parents</h4>
                <p className="text-sm text-gray-500 font-medium">Support your child's career journey</p>
              </div>
              <ul className="space-y-3 text-sm text-gray-600 font-medium mt-auto border-t border-gray-100 pt-6">
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></div> Track your child's progress</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></div> Access guidance resources</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></div> Connect with counselors</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></div> Stay informed on opportunities</li>
              </ul>
            </div>

            <div
              className="bg-white rounded-3xl border border-gray-200/80 p-8 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col cursor-pointer group"
              data-action="select-counselor-role"
              onClick={() => {
                setSelectedRole("counselor")
                setIsSignUp(true)
                window.scrollTo({ top: 0, behavior: "smooth" })
              }}
              tabIndex={0}
              role="button"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-5 border border-blue-100/50 group-hover:scale-110 transition-transform">
                  <UserCheck className="h-8 w-8" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">Counselors</h4>
                <p className="text-sm text-gray-500 font-medium">Guide students to success</p>
              </div>
              <ul className="space-y-3 text-sm text-gray-600 font-medium mt-auto border-t border-gray-100 pt-6">
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></div> Manage student portfolios</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></div> Track student progress</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></div> Schedule appointments</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></div> Generate insights and reports</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-20 py-8 border-t border-gray-200 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-200 shrink-0">
                <GraduationCap className="h-4 w-4" />
              </div>
              <span className="font-bold text-gray-900">CareerOS</span>
            </div>
            <p className="text-sm text-gray-500 font-medium">
              © 2025 CareerOS. Empowering futures, one student at a time.
            </p>
          </div>
        </div>
      </footer>
      {/* Profile Completion Popups */}
      {showProfilePopup && user && (
        <ProfileCompletionPopup
          user={user}
          onComplete={(profile) => {
            setShowProfilePopup(false)
            navigate("/student-dashboard", { state: { user } })
          }}
          onClose={() => setShowProfilePopup(false)}
        />
      )}

      {showCounsellorPopup && user && (
        <CounsellorProfilePopup
          user={user}
          onComplete={(profile) => {
            setShowCounsellorPopup(false)
            navigate("/counselor-dashboard", { state: { user } })
          }}
          onClose={() => setShowCounsellorPopup(false)}
        />
      )}


    </div>
  )
}








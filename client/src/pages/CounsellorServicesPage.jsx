import { useEffect, useMemo, useState } from "react"
import { CalendarDays, CircleDollarSign, MessageSquare, Pencil, Phone, Plus, Video, X } from "lucide-react"
import Navbar from "../components/Navbar"

const CounsellorServicesPage = ({ user }) => {
  const [services, setServices] = useState([])
  const [loadingServices, setLoadingServices] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [draft, setDraft] = useState({
    name: "Career Discovery Session",
    category: "Career Counselling",
    description:
      "A focused one-on-one session to help students clarify career direction, strengths, and next steps.",
    topics: ["Career Clarity", "Self Assessment", "Goal Mapping"],
    mode: "video",
    duration: 45,
    price: 399,
    active: true,
  })

  useEffect(() => {

    const currentUser = user || JSON.parse(localStorage.getItem("user"))
    if (!currentUser?._id) return
    console.log("Services user:", currentUser);
    const fetchServices = async () => {
      setLoadingServices(true)
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/services/counsellor/${currentUser._id}`)
        if (!response.ok) throw new Error("Failed to fetch services")
        const data = await response.json()
        setServices(data)
      } catch (error) {
        console.error(error)
        setServices([])
      } finally {
        setLoadingServices(false)
      }
    }

    fetchServices()
  }, [user])

  const totalBookings = useMemo(() => services.reduce((sum, item) => sum + (item.bookings || 0), 0), [services])

  const handleCreateService = async () => {
    const currentUser = user || JSON.parse(localStorage.getItem("user"))
    if (!currentUser?._id) return

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/services`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          counsellorId: currentUser._id,
          title: draft.name,
          category: draft.category,
          description: draft.description,
          topics: draft.topics,
          mode: draft.mode,
          duration: draft.duration,
          price: draft.price,
          status: draft.active,
        }),
      })

      if (!response.ok) throw new Error("Failed to save service")

      const result = await response.json()
      setServices((prev) => [result.service, ...prev])
      setShowCreateModal(false)
    } catch (error) {
      console.error(error)
      alert("Unable to save service right now.")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-10">
        <section className="bg-white rounded-[24px] border border-gray-200 shadow-sm p-6 sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Services</h1>
              <p className="text-gray-600 mt-1">Manage the counselling sessions students can book with you</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-full font-semibold text-sm shadow-sm shadow-blue-200 transition-colors"
            >
              <span className="inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Service
              </span>
            </button>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
          {loadingServices ? (
            <div className="xl:col-span-3 rounded-[24px] bg-white border border-gray-200 shadow-sm p-8 text-center text-gray-500">
              Loading your services...
            </div>
          ) : services.length === 0 ? (
            <div className="xl:col-span-3 rounded-[24px] bg-white border border-gray-200 shadow-sm p-8 text-center text-gray-500">
              No services created yet. Use “Create Service” to add your first offering.
            </div>
          ) : (
            services.map((service) => (
              <div key={service._id || service.id} className="bg-white rounded-[24px] border border-gray-200 shadow-sm p-5 flex flex-col h-full">
                <div className="flex items-center justify-between mb-5">
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {service.category}
                  </span>
                  <button className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-3">{service.title || service.name}</h2>
                <p className="text-sm text-gray-600 leading-6 mb-6">{service.description}</p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {(service.topics || []).map((topic) => (
                    <span key={topic} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                      {topic}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-auto">
                  <div className="rounded-2xl bg-gray-100 px-3 py-3">
                    <div className="text-xs text-gray-500">Mode</div>
                    <div className="mt-1 text-sm font-semibold text-gray-800 capitalize">
                      {service.mode === "video" ? "Video Call" : "Voice Call"}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-gray-100 px-3 py-3">
                    <div className="text-xs text-gray-500">Duration</div>
                    <div className="mt-1 text-sm font-semibold text-gray-800">{service.duration} minutes</div>
                  </div>
                  <div className="rounded-2xl bg-gray-100 px-3 py-3">
                    <div className="text-xs text-gray-500">Price</div>
                    <div className="mt-1 text-sm font-semibold text-gray-800">₹{service.price}</div>
                  </div>
                  <div className="rounded-2xl bg-gray-100 px-3 py-3">
                    <div className="text-xs text-gray-500">Bookings</div>
                    <div className="mt-1 text-sm font-semibold text-gray-800">{service.bookings || 0}</div>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-4 text-sm font-medium">
                  <span className="flex items-center gap-2 text-green-600">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    {service.status ? "Active" : "Inactive"}
                  </span>
                  <span className="text-gray-500">Edit</span>
                  <span className="text-gray-500">Archive</span>
                </div>
              </div>
            ))
          )}
        </section>

        <section className="mt-8 rounded-[24px] bg-white border border-gray-200 shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="rounded-2xl bg-gray-50 p-4">
              <div className="flex items-center gap-2 font-semibold text-gray-900">
                <CalendarDays className="w-4 h-4 text-blue-600" />
                Shared calendar
              </div>
              <div className="mt-2">All services use the same availability calendar.</div>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4">
              <div className="flex items-center gap-2 font-semibold text-gray-900">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                Booking flow
              </div>
              <div className="mt-2">Students can choose mode, duration, and time without overlap.</div>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4">
              <div className="flex items-center gap-2 font-semibold text-gray-900">
                <CircleDollarSign className="w-4 h-4 text-blue-600" />
                Total bookings
              </div>
              <div className="mt-2">{totalBookings} total service bookings</div>
            </div>
          </div>
        </section>
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/35 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-6xl max-h-[92vh] rounded-[24px] bg-white shadow-2xl overflow-hidden flex flex-col">
            <div className="border-b border-gray-200 px-6 py-5 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Create Service</h3>
                <p className="text-sm text-gray-500 mt-1">Design a new counselling service students can book from your profile.</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-full bg-gray-100 text-gray-600 p-2 hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-0 overflow-y-auto">
              <div className="p-6 border-r border-gray-200 overflow-y-auto">
                <div className="space-y-6">
                  <div>
                    <div className="text-sm font-semibold text-gray-900 mb-2">Service Details</div>
                    <p className="text-sm text-gray-500">Define what students can book. Availability is managed separately.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Service Title</label>
                    <input
                      value={draft.name}
                      onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                    <select
                      value={draft.category}
                      onChange={(e) => setDraft((prev) => ({ ...prev, category: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                    >
                      <option>Career Counselling</option>
                      <option>College Guidance</option>
                      <option>Psychometric Review</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                    <textarea
                      rows={4}
                      value={draft.description}
                      onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-gray-700">Topics Covered</label>
                      <button className="text-sm font-semibold text-blue-600">+ Add</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {draft.topics.map((topic) => (
                        <span key={topic} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                          {topic}
                        </span>
                      ))}
                    </div>
                    <input
                      className="mt-3 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                      placeholder="Add a topic"
                    />
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-gray-700 mb-2">Session Mode</div>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setDraft((prev) => ({ ...prev, mode: "video" }))}
                        className={`rounded-xl px-4 py-3 text-sm font-semibold ${draft.mode === "video" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
                          }`}
                      >
                        Video Call
                      </button>
                      <button
                        onClick={() => setDraft((prev) => ({ ...prev, mode: "voice" }))}
                        className={`rounded-xl px-4 py-3 text-sm font-semibold ${draft.mode === "voice" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
                          }`}
                      >
                        Voice Call
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-gray-700 mb-2">Duration</div>
                    <div className="grid grid-cols-3 gap-2">
                      {[20, 30, 45, 60, 90, 120].map((minutes) => (
                        <button
                          key={minutes}
                          onClick={() => setDraft((prev) => ({ ...prev, duration: minutes }))}
                          className={`rounded-full border px-3 py-2 text-sm font-medium ${draft.duration === minutes
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-gray-200 text-gray-600"
                            }`}
                        >
                          {minutes} min
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Price</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-gray-500">₹</span>
                      <input
                        type="number"
                        value={draft.price}
                        onChange={(e) => setDraft((prev) => ({ ...prev, price: Number(e.target.value) }))}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-8 pr-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Service Status</div>
                      <div className="text-sm text-gray-500">Active services are visible to students immediately.</div>
                    </div>
                    <button
                      onClick={() => setDraft((prev) => ({ ...prev, active: !prev.active }))}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${draft.active ? "bg-blue-600" : "bg-gray-300"
                        }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${draft.active ? "translate-x-6" : "translate-x-1"
                          }`}
                      />
                    </button>
                  </div>

                  <div className="flex gap-3">
                    <button className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700">
                      Save Draft
                    </button>
                    <button
                      onClick={handleCreateService}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Create Service
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 overflow-y-auto">
                <div className="mb-4">
                  <div className="text-lg font-bold text-gray-900">Live Preview</div>
                  <div className="text-sm text-gray-500">How this service will appear to students.</div>
                </div>

                <div className="rounded-[24px] bg-gradient-to-br from-blue-600 to-blue-500 p-5 text-white shadow-lg">
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span>{draft.category}</span>
                    <span>{draft.duration} min</span>
                  </div>
                  <h4 className="mt-4 text-2xl font-bold">{draft.name}</h4>
                  <p className="mt-3 text-sm text-blue-100 leading-6">{draft.description}</p>
                  <div className="mt-5 flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold">
                      {draft.mode === "video" ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                      {draft.mode === "video" ? "Video Call" : "Voice Call"}
                    </span>
                    <span className="text-lg font-bold">₹{draft.price}</span>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-white p-4 border border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    {draft.topics.map((topic) => (
                      <span key={topic} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                        {topic}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-gray-600">Status</span>
                    <span className="flex items-center gap-2 font-semibold text-green-600">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CounsellorServicesPage

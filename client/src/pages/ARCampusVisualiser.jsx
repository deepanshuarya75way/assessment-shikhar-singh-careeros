import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import CameraView from './CameraView'
import Navbar from '../components/Navbar'

const ARCampusVisualizer = () => {
  const navigate = useNavigate()
  const [location, setLocation] = useState('')
  const [collegeName, setCollegeName] = useState('')
  const [collegeType, setCollegeType] = useState('')
  const [showCamera, setShowCamera] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [stream, setStream] = useState(null)

  const collegeOptions = [
    'ABES Engineering College',
    'Other College 1',
    'Other College 2',
    'Other College 3'
  ]

  const collegeTypes = [
    'Engineering',
    'Medical',
    'Arts & Science',
    'Management',
    'Law',
    'Pharmacy'
  ]

  const locations = [
    'Ghaziabad',
    'Delhi',
    'Noida',
    'Gurugram',
    'Faridabad',
    'Mumbai',
    'Bangalore',
    'Pune'
  ]

  useEffect(() => {
    return () => {
      // Cleanup camera stream when component unmounts
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [stream])

  const startCamera = async () => {
    try {
      setCameraError('')
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      })
      
      setStream(mediaStream)
      setShowCamera(true)
    } catch (error) {
      console.error('Error accessing camera:', error)
      setCameraError('Unable to access camera. Please ensure camera permissions are granted and try again.')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setShowCamera(false)
  }

  const handleCollegeSelect = (selectedCollege) => {
    if (selectedCollege === 'ABES Engineering College') {
      startCamera()
    } else {
      alert('3D model not available for this college yet. Coming soon!')
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!location || !collegeName || !collegeType) {
      alert('Please fill in all fields')
      return
    }
    handleCollegeSelect(collegeName)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showCamera ? (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Experience Campus in AR</h2>
              <p className="text-lg text-gray-600">
                Enter your preferences to explore college campuses in immersive 3D augmented reality
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Location Input */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Location
                </label>
                <select
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  required
                >
                  <option value="">Choose a location...</option>
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              {/* College Name Input */}
              <div>
                <label htmlFor="collegeName" className="block text-sm font-medium text-gray-700 mb-2">
                  Select College
                </label>
                <select
                  id="collegeName"
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  required
                >
                  <option value="">Choose a college...</option>
                  {collegeOptions.map((college) => (
                    <option key={college} value={college}>
                      {college}
                    </option>
                  ))}
                </select>
              </div>

              {/* College Type Input */}
              <div>
                <label htmlFor="collegeType" className="block text-sm font-medium text-gray-700 mb-2">
                  College Type
                </label>
                <select
                  id="collegeType"
                  value={collegeType}
                  onChange={(e) => setCollegeType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  required
                >
                  <option value="">Choose college type...</option>
                  {collegeTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-medium py-4 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                🚀 Launch AR Experience
              </button>
            </form>

            {/* Info Section */}
            <div className="mt-8 bg-indigo-50 border border-indigo-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-indigo-900 mb-3">🎯 Available 3D Models</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></span>
                  <span className="text-indigo-800 font-medium">ABES Engineering College</span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">3D Ready</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full flex-shrink-0"></span>
                  <span className="text-indigo-800">Other Colleges</span>
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">Coming Soon</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-white rounded border border-indigo-100">
                <p className="text-sm text-indigo-700">
                  <strong>💡 AR Features:</strong> Interactive 3D campus model, 360° exploration, 
                  building information, and immersive virtual tour experience.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <CameraView
            collegeName={collegeName}
            location={location}
            collegeType={collegeType}
            onStop={stopCamera}
            stream={stream}
            setStream={setStream}
            cameraError={cameraError}
            setCameraError={setCameraError}
          />
        )}
      </main>
    </div>
  )
}

export default ARCampusVisualizer
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { generateCareerRoadmap } from '../services/generateRoadmap';
import RoadmapFlow from '../components/RoadmapFlow';
import Navbar from '../components/Navbar';

const CareerRoadmap = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [roadmapData, setRoadmapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    const formData = location.state?.formData;

    if (!formData) {
      navigate('/career-roadmap-form');
      return;
    }

    const fetchRoadmap = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await generateCareerRoadmap(formData);
        setRoadmapData(data);
      } catch (err) {
        setError(err.message || 'Failed to generate roadmap');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmap();
  }, [location, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Generating Your Career Roadmap</h2>
          <p className="text-gray-600">This may take a few moments...</p>
          <div className="mt-6 space-y-2">
            <p className="text-sm text-gray-500">Analyzing your profile...</p>
            <p className="text-sm text-gray-500">Creating personalized learning path...</p>
            <p className="text-sm text-gray-500">Compiling resources and recommendations...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/career-roadmap-form')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/student-dashboard')}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Navbar />
      <header className="bg-white shadow-sm border-b border-gray-200 z-50">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Your Career Roadmap</h1>
              <p className="text-sm text-gray-600 mt-1">
                {location.state?.formData?.career}
                {location.state?.formData?.specialization && ` - ${location.state.formData.specialization}`}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition"
              >
                {showSidebar ? 'Hide Info' : 'Show Info'}
              </button>
              <button
                onClick={() => navigate('/student-dashboard')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative">
          {roadmapData && roadmapData.nodes && roadmapData.edges && (
            <RoadmapFlow nodes={roadmapData.nodes} edges={roadmapData.edges} />
          )}
        </div>

        {showSidebar && roadmapData?.metadata && (
          <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto shadow-lg">
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Industry Overview</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {roadmapData.metadata.industryOverview}
                </p>
              </div>

              {roadmapData.metadata.salaryRange && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Salary Range</h3>
                  <p className="text-sm text-gray-700">{roadmapData.metadata.salaryRange}</p>
                </div>
              )}

              {roadmapData.metadata.jobTitles && roadmapData.metadata.jobTitles.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Potential Job Titles</h3>
                  <div className="space-y-2">
                    {roadmapData.metadata.jobTitles.map((title, idx) => (
                      <div
                        key={idx}
                        className="flex items-center space-x-2 text-sm text-gray-700 bg-blue-50 p-2 rounded-lg"
                      >
                        <span className="text-blue-600">💼</span>
                        <span>{title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {roadmapData.metadata.companiesHiring && roadmapData.metadata.companiesHiring.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Top Hiring Companies</h3>
                  <div className="flex flex-wrap gap-2">
                    {roadmapData.metadata.companiesHiring.map((company, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                      >
                        {company}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {roadmapData.metadata.softSkills && roadmapData.metadata.softSkills.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Essential Soft Skills</h3>
                  <div className="space-y-2">
                    {roadmapData.metadata.softSkills.map((skill, idx) => (
                      <div
                        key={idx}
                        className="flex items-center space-x-2 text-sm text-gray-700 bg-green-50 p-2 rounded-lg"
                      >
                        <span className="text-green-600">✓</span>
                        <span>{skill}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => navigate('/career-roadmap-form')}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition"
                >
                  Generate New Roadmap
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CareerRoadmap;

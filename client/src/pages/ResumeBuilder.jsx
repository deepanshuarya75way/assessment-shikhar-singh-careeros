import React, { useState } from 'react';
import { ArrowLeft, Download, Eye, FileText, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PersonalInfoForm from './resume/PersonalInfoForm';
import WorkExperienceForm from './resume/WorkExperienceForm';
import EducationForm from './resume/EducationForm';
import SkillsForm from './resume/SkillsForm';
import CertificationsProjectsForm from './resume/CertificationsProjectForm'; // check spelling
import TemplateSelector from './resume/TemplateSelector';
import ResumePreview from './resume/ResumePreview';
import AIOptimizationModal from './AIOptimizationModal';
import { exportResumeAsDocx, exportResumeAsPdf } from './resume/ExportUtils';
import Navbar from '../components/Navbar';

const ResumeBuilder = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('personal');
  const [showPreview, setShowPreview] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [showAIModal, setShowAIModal] = useState(false);

  const [resumeData, setResumeData] = useState({
    personal: {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      website: ''
    },
    workExperience: [
      {
        id: 1,
        jobTitle: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        description: ''
      }
    ],
    education: [
      {
        id: 1,
        degree: '',
        school: '',
        location: '',
        startDate: '',
        endDate: '',
        gpa: ''
      }
    ],
    skills: [],
    certifications: [],
    projects: []
  });

  const sections = [
    { id: 'personal', label: 'Personal Info', icon: '👤' },
    { id: 'experience', label: 'Work Experience', icon: '💼' },
    { id: 'education', label: 'Education', icon: '🎓' },
    { id: 'skills', label: 'Skills', icon: '🛠️' },
    { id: 'certifications', label: 'Certifications & Projects', icon: '🏆' },
    { id: 'template', label: 'Template', icon: '🎨' }
  ];

  const updateResumeData = (section, data) => {
    setResumeData(prev => ({
      ...prev,
      [section]: data
    }));
  };

  const handleExportDocx = async () => {
    try {
      await exportResumeAsDocx(resumeData, selectedTemplate);
    } catch (error) {
      console.error('Error exporting DOCX:', error);
      alert('Error exporting resume. Please try again.');
    }
  };

  const handleExportPdf = async () => {
    try {
      await exportResumeAsPdf(resumeData, selectedTemplate);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Error exporting resume. Please try again.');
    }
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'personal':
        return (
          <PersonalInfoForm
            data={resumeData.personal}
            onChange={(data) => updateResumeData('personal', data)}
          />
        );
      case 'experience':
        return (
          <WorkExperienceForm
            data={resumeData.workExperience}
            onChange={(data) => updateResumeData('workExperience', data)}
          />
        );
      case 'education':
        return (
          <EducationForm
            data={resumeData.education}
            onChange={(data) => updateResumeData('education', data)}
          />
        );
      case 'skills':
        return (
          <SkillsForm
            data={resumeData.skills}
            onChange={(data) => updateResumeData('skills', data)}
          />
        );
      case 'certifications':
        return (
          <CertificationsProjectsForm
            certifications={resumeData.certifications}
            projects={resumeData.projects}
            onCertificationsChange={(data) => updateResumeData('certifications', data)}
            onProjectsChange={(data) => updateResumeData('projects', data)}
          />
        );
      case 'template':
        return (
          <TemplateSelector
            selectedTemplate={selectedTemplate}
            onTemplateSelect={setSelectedTemplate}
            resumeData={resumeData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/student-dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-3">
                <FileText className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">ATS Resume Builder</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
              </button>
              <button
                onClick={handleExportDocx}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export DOCX</span>
              </button>
              <button
                onClick={handleExportPdf}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Left Sidebar - Form Sections */}
          <div className="w-1/3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Resume Sections</h2>
                <p className="text-sm text-gray-600 mt-1">Complete all sections to build your resume</p>
              </div>
              <nav className="p-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg mb-1 flex items-center space-x-3 transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-lg">{section.icon}</span>
                    <span className="font-medium">{section.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* AI Assistant */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 mt-6 border border-purple-200">
              <div className="flex items-center space-x-2 mb-3">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-purple-900">AI Assistant</h3>
              </div>
              <p className="text-sm text-purple-700 mb-3">
                Get AI-powered suggestions to optimize your resume for specific job descriptions.
              </p>
              <button 
                onClick={() => setShowAIModal(true)}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                Optimize with AI
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            <div className={`grid gap-8 ${showPreview ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {/* Form Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6">
                  {renderActiveSection()}
                </div>
              </div>

              {/* Preview Section */}
              {showPreview && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Resume Preview</h3>
                    <div className="border border-gray-300 rounded-lg overflow-hidden" style={{ height: '600px' }}>
                      <ResumePreview
                        data={resumeData}
                        template={selectedTemplate}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Global AI Optimization Modal */}
      <AIOptimizationModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onApply={() => {}}
        currentText=""
        jobTitle=""
        company=""
        type="general"
        resumeData={resumeData}
      />
    </div>
  );
};

export default ResumeBuilder;
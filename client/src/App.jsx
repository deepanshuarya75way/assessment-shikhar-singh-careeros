import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import { SocketProvider } from "./context/SocketContext";
import MessagingPage from "./pages/MessagingPage";
import Landing from "./pages/Landing";
import StudentDashboard from "./pages/StudentDashboard";
import CounsellorDashboard from "./pages/CounsellorDashboard";  
import ExploreColleges from "./pages/ExploreColleges";
import CareerRoadmapPage from "./pages/CareerRoadmap"; 
import RoadmapForm from "./components/RoadmapForm";
import BookAppointment from "./pages/BookApointment";
import ConsultCounsellor from "./pages/ConsultCounsellor";
import ARCampusVisualizer from "./pages/ARCampusVisualiser";
import ResumeBuilder from "./pages/ResumeBuilder";
import PsychometricTest from "./pages/PsychometricTest"
import PsychometricReport from "./pages/PsychometricReport"
import PsychometricReportsList from "./pages/PsychometricReportsList"
import CareerRecommendations from "./pages/CareerRecommendations"
import ProfilePage from "./pages/ProfilePage";
import SavedItems from "./pages/SavedItems";
import CollegeDetails from "./pages/CollegeDetails"


function App() {
  const [user, setUser] = useState(null); // shared user state

  return (
    <BrowserRouter>
          <SocketProvider>
      <Routes>
        <Route path="/" element={<Landing setUser={setUser} />} />
        <Route path="/student-dashboard" element={<StudentDashboard user={user} />} />
        <Route path="/profile" element={<ProfilePage user={user} />} />
         <Route path="/messages" element={<MessagingPage />} />
        <Route path="/explore-colleges" element={<ExploreColleges />} />
        <Route path="/counselor-dashboard" element={<CounsellorDashboard user={user} />} />
          <Route path="/career-roadmap" element={<CareerRoadmapPage user={user} />} />
          <Route path="/career-roadmap-form" element={<RoadmapForm />} />
<Route path="/consult-counsellor" element={<ConsultCounsellor user={user} />} />
<Route path="/book-appointment/:counsellorId" element={<BookAppointment user={user} />} />
 <Route path="/ar-campus-visualizer" element={<ARCampusVisualizer />} />
  <Route path="/resume-builder" element={< ResumeBuilder/>} />
    <Route path="/psychometric-test" element={<PsychometricTest />} />
          <Route path="/psychometric-reports-list" element={<PsychometricReportsList />} />
          <Route path="/psychometric-report" element={<PsychometricReport />} />
          <Route path="/psychometric-report/:reportId" element={<PsychometricReport />} />
        <Route path="/career-recommendations" element={<CareerRecommendations />} />
         <Route path ="/saved-items" element={<SavedItems/>}/>
         <Route path="/college/:collegeId" element={<CollegeDetails />} />
      </Routes>
     </SocketProvider>
    </BrowserRouter>
  );
}

export default App;

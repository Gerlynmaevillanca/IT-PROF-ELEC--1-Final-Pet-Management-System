import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import BrowsePetsAdminPage from "./pages/BrowsePetsAdminPage";
import ApplicationAdminPage from "./pages/ApplicationAdminPage";
import BrowsePetsPage from "./pages/BrowsePetsPageClean";
import PetDetailPage from "./pages/PetDetailPage";
import ApplicationPage from "./pages/ApplicationPage";
import ConversationsPage from "./pages/ConversationsPage";
import SignupPage from "./pages/SignupPage";
import ProfilePage from "./pages/ProfilePage";
import RequireAuth from "./components/RequireAuth";
import { petsData } from "./data/mockData";

function AppContent() {
  const location = useLocation();
  
  // Hide chat widget on these pages
  const hideChat = ['/', '/login', '/signup', '/profile'].includes(location.pathname);

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route path="/admindashboard" element={<RequireAuth requiredRole={["admin","staff"]}><AdminDashboardPage /></RequireAuth>} />
        <Route path="/browsepetsadmin" element={<RequireAuth requiredRole={["admin","staff"]}><BrowsePetsAdminPage pets={petsData} /></RequireAuth>} />
        <Route path="/applicationadmin" element={<RequireAuth requiredRole={["admin","staff"]}><ApplicationAdminPage /></RequireAuth>} />

        <Route path="/browsepet" element={<RequireAuth><BrowsePetsPage pets={petsData} /></RequireAuth>} />
        <Route path="/pet/:id" element={<RequireAuth><PetDetailPage /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
        <Route path="/conversations" element={<RequireAuth><ConversationsPage /></RequireAuth>} />
        <Route path="/application" element={<RequireAuth><ApplicationPage pets={petsData} /></RequireAuth>} />
      </Routes>
      
      {/* ChatbotWidget is rendered in Layout; no duplicate render here */}
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
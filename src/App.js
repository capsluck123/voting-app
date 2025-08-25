import React from "react";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "./firebase";
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Signup from "./pages/Signup";
import Notifications from "./pages/Notifications";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import Vote from "./pages/Vote";
import AdminSignup from "./pages/AdminSignup";
import AdminApproval from "./pages/AdminApproval";
import CandidateProfile from "./pages/CandidateProfile";
import ResetPassword from "./pages/ResetPassword";
import ResultDashboard from "./pages/ResultDashboard";
import Sidebar from "./Sidebar";
import AuditLog from "./pages/AuditLog";
import Settings from "./pages/Settings";
import './App.css';

// Helper to determine if sidebar should show
// Only show sidebar on admin dashboard, vote, and candidate profile pages
// Only show sidebar on admin dashboard, vote, and candidate profile pages (not on signup or admin-signup)
const sidebarRoutes = [
  "/admin",
  "/admin-dashboard",
  "/admin-approval",
  "/student-approval",
  "/vote",
  "/candidate-profile",
  "/candidate/",
  "/results",
  "/audit-log",
  "/notifications",
  "/settings"
];

// ...existing code...

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(window.innerWidth > 900);

  // Close sidebar on route change (mobile)
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) setSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  // Get role from localStorage (set on login/signup)
  const role = localStorage.getItem("role");
  const isAdmin = role === "admin";

  // Single session check for students
  React.useEffect(() => {
    if (role === "student") {
      const checkSession = async () => {
        const uid = localStorage.getItem("uid");
        const localSessionId = localStorage.getItem("sessionId");
        if (uid && localSessionId) {
          const userDocRef = doc(firestore, "users", uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            if (data.sessionId && data.sessionId !== localSessionId) {
              // Session mismatch, force logout
              localStorage.removeItem("role");
              localStorage.removeItem("uid");
              localStorage.removeItem("sessionId");
              localStorage.setItem("forceLogoutMessage", "Your account was logged out because it was opened in another browser or device.");
              window.location.href = "/";
            }
          }
        }
      };
      checkSession();
      const interval = setInterval(checkSession, 10000);
      return () => clearInterval(interval);
    }
  }, [role]);

  // Only show sidebar for admin/student dashboard, vote, and candidate profile pages
  // Exclude signup and admin-signup explicitly
  const showSidebar =
    !["/signup", "/admin-signup"].includes(location.pathname) &&
    sidebarRoutes.some(route => location.pathname === route || location.pathname.startsWith(route));

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
    window.location.reload();
  };

  return (
    <>
      <div className="voting-header" style={{position:'relative'}}>
        {showSidebar && (
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="sidebar-hamburger"
            aria-label={sidebarOpen ? 'Hide Menu' : 'Show Menu'}
          >
            ☰
          </button>
        )}
        Gardner College Voting App
      </div>
      {showSidebar && sidebarOpen && (
        <Sidebar onLogout={handleLogout} isAdmin={isAdmin} onClose={() => setSidebarOpen(false)} />
      )}
      <div className={showSidebar && sidebarOpen ? "with-sidebar" : ""}>
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/admin-signup" element={<AdminSignup />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/admin-approval" element={<AdminApproval />} />
          <Route path="/student-approval" element={<AdminApproval />} />
          <Route path="/vote" element={<Vote />} />
          <Route path="/candidate/:id" element={<CandidateProfile />} />
          <Route path="/candidate-profile" element={<CandidateProfile />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/results" element={<ResultDashboard />} />
          <Route path="/audit-log" element={<AuditLog />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/" element={<Login />} />
        </Routes>
      </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;

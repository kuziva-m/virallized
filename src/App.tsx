import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Pages
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/AdminDashboard";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";

// Legal Pages
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";

// Onboarding Pages
import Setup from "./pages/onboarding/Setup";
import UpdateTargeting from "./pages/onboarding/UpdateTargeting";
import Whitelist from "./pages/onboarding/Whitelist";
import Add2FA from "./pages/onboarding/Add2FA";

// 👇 CAPITALIZED IMPORTS
import InstagramGrowth50Off from "./pages/LandingPage-instagram-growth-50-off";
import Off50 from "./pages/LandingPage-50-off";
import BlogAdmin from "./pages/BlogAdmin";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* The Main Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Promo Pages */}
        <Route
          path="/instagram-growth-50-off"
          element={<InstagramGrowth50Off />}
        />
        <Route path="/50-off" element={<Off50 />} />

        {/* Legal Pages */}
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />

        {/* Blog Pages */}
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />

        {/* Onboarding Flow - Dynamic Pricing Routes */}
        <Route path="/set-up" element={<Setup />} />
        <Route path="/set-up-199" element={<Setup />} />
        <Route path="/set-up-pro" element={<Setup />} />
        <Route path="/set-up-299" element={<Setup />} />

        {/* Rest of Onboarding */}
        <Route path="/update-targeting" element={<UpdateTargeting />} />
        <Route path="/whitelist" element={<Whitelist />} />
        <Route path="/add-2fa" element={<Add2FA />} />

        {/* Auth & Command Center */}
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />

        {/* Admin Portal */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/blog-admin" element={<BlogAdmin />} />

        {/* Catch-all: Redirects any unknown URLs back to the home page (MUST BE LAST) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

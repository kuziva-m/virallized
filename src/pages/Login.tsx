import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { toast } from "../lib/toast";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get("setup") === "complete") {
      setShowSuccessBanner(true);
    }
  }, [location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const normalizedEmail = email.trim().toLowerCase();

    const { error, data: authData } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      toast.error("Invalid email or password. Please try again.");
      setIsSubmitting(false);
    } else {
      const user = authData.user;

      if (!user) {
        navigate("/dashboard");
        return;
      }

      // SMART ROUTING: Check if they are an Admin, Blogger, Agency, or Client.

      // 1. Check Admin Roles
      const { data: roleData, error: roleError } = await supabase
        .from("admin_roles")
        .select("role")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (roleError) {
        console.error("Error checking admin role:", roleError);
      }

      if (roleData?.role === "superadmin") {
        navigate("/admin");
        return;
      } else if (roleData?.role === "blogger") {
        navigate("/blog-admin");
        return;
      }

      // 2. Check Agency Roles (🚨 BULLETPROOF FIX: Check strictly by email 🚨)
      const { data: agencyData, error: agencyError } = await supabase
        .from("agencies")
        .select("email")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (agencyError) {
        console.error("Error checking agency role:", agencyError);
      }

      // If the email exists in the agencies table, send them to the Agency Hub
      if (agencyData) {
        navigate("/agency");
        return;
      }

      // 3. Normal Client Fallback
      navigate("/dashboard");
    }
  };

  const inputClass =
    "w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 focus:border-[#f80d5d] transition-all text-sm text-slate-900 bg-slate-50 focus:bg-white placeholder-slate-400";
  const labelClass =
    "block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2";

  return (
    <main className="min-h-screen bg-white flex font-sans selection:bg-[#ffefe9] selection:text-[#f80d5d]">
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 lg:px-20 xl:px-32 relative z-10 py-12 lg:py-0">
        <div className="max-w-md w-full mx-auto flex flex-col">
          <div className="mb-10 lg:mb-12">
            <Link to="/">
              <img
                src="/images/logos/virallized-main-logo.svg"
                alt="Virallized"
                className="w-36 lg:w-40 mb-8"
              />
            </Link>
            <h1 className="text-3xl lg:text-4xl font-black text-slate-900 mb-3 tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm lg:text-base text-slate-500 font-medium">
              Log in to your Command Center to track your organic growth.
            </p>
          </div>

          {showSuccessBanner && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-2xl text-sm font-bold text-center mb-8 shadow-sm flex items-start gap-3">
              <span className="text-xl leading-none">🎉</span>
              <div className="text-left">
                <span className="block text-green-800 mb-0.5">
                  Setup Complete!
                </span>
                <span className="font-medium text-[13px] opacity-90">
                  Please log in with your new credentials to access your
                  dashboard.
                </span>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div>
              <label className={labelClass}>Email Address</label>
              <input
                type="email"
                required
                placeholder="hello@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="#"
                  className="text-[11px] font-bold text-[#f80d5d] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full text-center bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white py-4 rounded-xl font-black tracking-wide hover:opacity-90 transition-opacity text-[14px] shadow-lg shadow-[#ff2429]/20 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isSubmitting ? "Authenticating..." : "Access Dashboard"}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 font-medium mt-8">
            Don't have an account?{" "}
            <Link
              to="/#pricing"
              className="text-[#f80d5d] font-bold hover:underline"
            >
              Start your growth today
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-1/2 relative bg-[#ffefe9] items-center justify-center overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-gradient-to-br from-[#ffae07]/20 to-[#ff2429]/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-gradient-to-tr from-[#f1078d]/20 to-[#ff2429]/20 rounded-full blur-3xl"></div>

        <div className="relative z-10 w-full max-w-lg flex flex-col items-center">
          <div
            className="absolute -left-12 top-20 bg-white p-3 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 z-20 animate-bounce"
            style={{ animationDuration: "3s" }}
          >
            <img
              src="/images/login.avif"
              alt="User"
              className="w-10 h-10 rounded-full"
            />
            <div>
              <p className="text-[10px] text-slate-500 font-bold mb-0.5">
                New Follower
              </p>
              <p className="text-xs font-black text-slate-900">@savnhale</p>
            </div>
          </div>

          <div className="absolute -right-8 bottom-32 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex flex-col gap-2 z-20 max-w-[200px]">
            <div className="flex items-center gap-1">
              <img src="/images/5stars.svg" alt="5 Stars" className="h-3" />
            </div>
            <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
              "Virallized got me over 3K new followers in my first month!"
            </p>
          </div>

          <div className="relative">
            <img
              src="/images/decorations/confetti-small.svg"
              alt=""
              className="absolute -top-10 -right-10 w-20 opacity-80 z-0"
            />
            <img
              src="/images/iphone-mockup-main.avif"
              alt="Dashboard Preview"
              className="w-full h-auto drop-shadow-2xl relative z-10 transform scale-110 translate-y-12"
            />
          </div>
        </div>
      </div>
    </main>
  );
};

export default Login;
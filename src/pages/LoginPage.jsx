import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, PawPrint, Mail, Lock, Eye, EyeOff, Check, XCircle, LogIn } from "lucide-react";
import Supabase, { ensureUserRow } from "../lib/supabase";

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    // Validation
    if (!form.email || !form.password) {
      setError("Please fill in all fields!");
      setLoading(false);
      return;
    }

    try {
        const { data, error: authError } = await Supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });

        if (authError) {
          setError(authError.message || "Login failed. Please try again.");
          setLoading(false);
          return;
        }

        const user = data?.user;

        // Ensure there's a record in public.users for this user
        let { data: userRow, error: userError } = await Supabase.from("users").select("*").eq("id", user.id).maybeSingle();
        if (userError) {
          // ignore and continue
        }

        if (!userRow) {
          const roleFromMeta = user?.user_metadata?.role || user?.role || "adopter";
          const fullNameMeta = user?.user_metadata?.fullname || user?.user_metadata?.fullName || user?.user_metadata?.full_name || "";

            const result = await ensureUserRow(user.id, user.email, fullNameMeta, roleFromMeta);

            if (!result.success && result.reason === "rls_policy") {
              setError("Database permissions issue: Please contact support to enable public access to users table.");
              setLoading(false);
              return;
            }

            userRow = { id: user.id, email: user.email, fullname: fullNameMeta, role: roleFromMeta };
        }

        // Decide redirect based on role and profile completeness
        const role = (userRow.role || user?.user_metadata?.role || "adopter").toLowerCase();

        if (role === "staff" || role === "admin") {
          setMessage("✓ Login successful! Redirecting to admin...");
          setTimeout(() => navigate("/admindashboard"), 800);
          setLoading(false);
          return;
        }

        // For adopters, check profile completeness
        const profileComplete = userRow && userRow.phone_number && userRow.address && userRow.city && userRow.state && userRow.zip_code;
        if (profileComplete) {
          setMessage("✓ Login successful! Redirecting...");
          setTimeout(() => navigate("/browsepet"), 800);
        } else {
          setMessage("✓ Login successful! Please complete your profile...");
          setTimeout(() => navigate("/profile"), 800);
        }
        setLoading(false);
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const navigateBack = () => {
    navigate("/");
  };

  const navigateToSignup = () => {
    navigate("/signup");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-4 bg-linear-to-br from-amber-50 via-white to-orange-50">
      <div className="w-full max-w-5xl">
        {/* Back Button */}
        <button
          onClick={navigateBack}
          className="mb-3 flex items-center gap-2 text-amber-700 hover:text-amber-900 font-semibold transition-all group cursor-pointer"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </button>

        {/* Form Container */}
        <div className="bg-white rounded-3xl shadow-2xl border border-amber-100 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left Side - Header Section with linear */}
            <div className="bg-linear-to-br from-amber-500 to-orange-500 px-8 py-12 flex flex-col items-center justify-center text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm mb-4">
                <PawPrint size={40} className="text-white" />
              </div>
              <h1 className="text-4xl font-black text-white mb-2">
                Welcome Back <br /> PetPeeve!
              </h1>
              <p className="text-lg text-white/90 mb-6">
                Sign in to continue your journey
              </p>
              <div className="flex items-center gap-4 text-sm text-white/80">
                <div className="flex items-center gap-1.5">
                  <Check size={16} />
                  <span>Secure</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check size={16} />
                  <span>Protected</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check size={16} />
                  <span>Private</span>
                </div>
              </div>
            </div>

            {/* Right Side - Form Section */}
            <div className="p-8">
              {/* Alert Messages */}
              {error && (
                <div className="mb-4 bg-linear-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-2.5 flex items-center gap-2">
                  <XCircle className="text-red-500 shrink-0" size={18} />
                  <p className="text-red-700 font-semibold text-sm">{error}</p>
                </div>
              )}
              
              {message && (
                <div className="mb-4 bg-linear-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-2.5 flex items-center gap-2">
                  <Check className="text-green-500 shrink-0" size={18} />
                  <p className="text-green-700 font-semibold text-sm">{message}</p>
                </div>
              )}

              {/* Form */}
              <div className="space-y-4">
                {/* Email Field */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-amber-900 mb-2">
                    <Mail size={14} />
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-amber-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-100 outline-none transition-all"
                    required
                  />
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-amber-900">
                      <Lock size={14} />
                      Password
                    </label>
                    <button
                      type="button"
                      className="text-xs font-semibold text-amber-600 hover:text-amber-800 transition-colors cursor-pointer"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={handleChange}
                      className="w-full px-4 py-3 pr-11 rounded-xl border-2 border-amber-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-100 outline-none transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-amber-600 hover:text-amber-800 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="remember"
                    className="w-4 h-4 rounded border-2 border-amber-300 text-amber-500 focus:ring-2 focus:ring-amber-200 cursor-pointer"
                  />
                  <label htmlFor="remember" className="text-sm text-amber-700 cursor-pointer">
                    Remember me
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-bold text-base bg-linear-to-r from-amber-500 to-orange-500 text-white hover:shadow-2xl hover:shadow-amber-300 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      Signing in...
                    </span>
                  ) : (
                    <>
                      <LogIn size={20} />
                      Sign In
                    </>
                  )}
                </button>
              </div>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-amber-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-amber-600 font-semibold">OR</span>
                </div>
              </div>

              {/* Social Login Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-amber-200 hover:border-amber-300 hover:bg-linear-to-br from-amber-50 to-orange-50 transition-all font-semibold text-amber-900 text-sm cursor-pointer">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </button>
                
                <button className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-amber-200 hover:border-amber-300 hover:bg-linear-to-br from-amber-50 to-orange-50 transition-all font-semibold text-amber-900 text-sm cursor-pointer">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </button>
              </div>

              {/* Footer Link */}
              <p className="mt-4 text-center text-amber-700 text-sm">
                Don't have an account?{" "}
                <button
                  onClick={navigateToSignup}
                  className="font-bold text-amber-600 hover:text-amber-800 hover:underline transition-all cursor-pointer"
                >
                  Create one
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
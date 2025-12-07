import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, PawPrint, User, Mail, Lock, Eye, EyeOff, Check, XCircle, UserCircle, Briefcase } from "lucide-react";
import Supabase, { ensureUserRow } from "../lib/supabase";

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullname: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "adopter",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    if (!form.fullname || !form.email || !form.password || !form.confirmPassword) {
      setError("Please fill in all fields!");
      setLoading(false);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match!");
      setLoading(false);
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters!");
      setLoading(false);
      return;
    }

    try {
      const { data, error: authError } = await Supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            fullname: form.fullname,
            role: form.role,
          },
        },
      });

      if (authError) {
        setError(authError.message || "Signup failed. Please try again.");
        setLoading(false);
        return;
      }

      // If sign up succeeded, only attempt to create a users row when
      // the user is actually authenticated (a session exists). If your
      // project requires email confirmation, signUp may not return a session.
      const userId = data?.user?.id;
      const session = data?.session || null;

      if (userId && session) {
        const result = await ensureUserRow(userId, form.email, form.fullname, form.role);

        if (!result.success && result.reason === "rls_policy") {
          setError("Database permissions issue: RLS policy blocks insert. Please contact support or check policies.");
          setLoading(false);
          return;
        }

        if (!result.success && result.reason === "other") {
          console.error("Failed to insert user row:", result.error);
          setError("Failed to create user profile. Please try again or contact support.");
          setLoading(false);
          return;
        }
      }

      // If the user wasn't signed in automatically (no session), they likely
      // need to confirm their email. In that case, send them to login and
      // instruct them to confirm — we won't try to upsert their row while
      // RLS requires the authenticated role.
      if (!session) {
        setMessage("Account created. Please confirm your email and then sign in.");
        setTimeout(() => navigate("/login"), 1200);
        return;
      }

      setMessage("✓ Account created successfully! Redirecting...");
      // For adopters, go to profile to collect extra info. Staff -> admin dashboard
      if ((form.role || "adopter").toLowerCase() === "staff") {
        setTimeout(() => navigate("/admindashboard"), 1200);
      } else {
        setTimeout(() => navigate("/profile"), 1200);
      }
    } catch (err) {
      setError(err?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const navigateBack = () => {
    navigate("/");
  };

  const navigateToLogin = () => {
    navigate("/login");
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
                Join PetPeeve
              </h1>
              <p className="text-lg text-white/90 mb-6">
                Create your account and start your adoption journey
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
              <div className="space-y-3">
                {/* Row 1: Full Name and Email */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-amber-900 mb-2">
                      <User size={14} />
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="fullname"
                      placeholder="Your full name"
                      value={form.fullname}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-amber-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-100 outline-none transition-all text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-amber-900 mb-2">
                      <Mail size={14} />
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-amber-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-100 outline-none transition-all text-sm"
                      required
                    />
                  </div>
                </div>

                {/* Row 2: Password and Confirm Password */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-amber-900 mb-2">
                      <Lock size={14} />
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="••••••••"
                        value={form.password}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 pr-10 rounded-xl border-2 border-amber-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-100 outline-none transition-all text-sm"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-amber-600 hover:text-amber-800 transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-amber-900 mb-2">
                      <Lock size={14} />
                      Confirm
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        placeholder="••••••••"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 pr-10 rounded-xl border-2 border-amber-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-100 outline-none transition-all text-sm"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-amber-600 hover:text-amber-800 transition-colors cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Row 3: Account Type */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-amber-900 mb-2">
                    <UserCircle size={14} />
                    Account Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, role: "adopter" })}
                      className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
                        form.role === "adopter"
                          ? "border-amber-400 bg-linear-to-br from-amber-50 to-orange-50 shadow-lg"
                          : "border-amber-200 hover:border-amber-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          form.role === "adopter"
                            ? "bg-linear-to-br from-amber-500 to-orange-500"
                            : "bg-amber-100"
                        }`}>
                          <User size={16} className={form.role === "adopter" ? "text-white" : "text-amber-600"} />
                        </div>
                        <div className="text-left">
                          <span className={`font-bold text-sm block ${
                            form.role === "adopter" ? "text-amber-900" : "text-amber-700"
                          }`}>
                            Adopter
                          </span>
                          <span className="text-xs text-amber-600">Find pets</span>
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setForm({ ...form, role: "staff" })}
                      className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
                        form.role === "staff"
                          ? "border-amber-400 bg-linear-to-br from-amber-50 to-orange-50 shadow-lg"
                          : "border-amber-200 hover:border-amber-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          form.role === "staff"
                            ? "bg-linear-to-br from-amber-500 to-orange-500"
                            : "bg-amber-100"
                        }`}>
                          <Briefcase size={16} className={form.role === "staff" ? "text-white" : "text-amber-600"} />
                        </div>
                        <div className="text-left">
                          <span className={`font-bold text-sm block ${
                            form.role === "staff" ? "text-amber-900" : "text-amber-700"
                          }`}>
                            Staff
                          </span>
                          <span className="text-xs text-amber-600">Manage</span>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-bold text-base bg-linear-to-r from-amber-500 to-orange-500 text-white hover:shadow-2xl hover:shadow-amber-300 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 mt-2 cursor-pointer"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating...
                    </span>
                  ) : (
                    "Create Account"
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
                Already have an account?{" "}
                <button
                  onClick={navigateToLogin}
                  className="font-bold text-amber-600 hover:text-amber-800 hover:underline transition-all cursor-pointer"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
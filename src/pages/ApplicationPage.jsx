import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { PawPrint, FileText, Check, Clock, XCircle, Calendar, Home, User } from "lucide-react";
import Layout from "../components/Layout";
import { getAvailablePets } from "../lib/pets";
import { getApplicationsByUser, submitApplication } from "../lib/applications";
import { notifyAdminsAboutApplication } from "../lib/notifications";
import { useAuth } from "../components/RequireAuth";
import Toast from "../components/Toast";

export default function ApplicationPage() {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();

  const [form, setForm] = useState({
    pet_id: "",
    living_situation: "",
    home_type: "",
    rent_or_own: "",
    landlord_allows_pets: "",
    household_members: "",
    children_ages: "",
    other_pets_description: "",
    reason_for_adoption: "",
    daily_schedule: "",
    veterinary_reference: "",
    personal_reference: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [pets, setPets] = useState([]);
  const [applications, setApplications] = useState([]);
  const [toast, setToast] = useState({ message: "", type: "info" });
  const [errors, setErrors] = useState({});

  // Load available pets
  useEffect(() => {
    const loadPets = async () => {
      const result = await getAvailablePets();
      if (result.success) {
        setPets(result.pets || []);
      }
    };
    loadPets();
  }, []);

  // Prefill pet if passed via location state or query param
  useEffect(() => {
    // From navigation state
    if (location?.state?.pet_id) {
      setForm((f) => ({ ...f, pet_id: location.state.pet_id }));
      return;
    }

    // From query string ?pet_id=...
    try {
      const params = new URLSearchParams(window.location.search);
      const qPet = params.get("pet_id");
      if (qPet) {
        setForm((f) => ({ ...f, pet_id: qPet }));
      }
    } catch (e) {
      // ignore
    }
  }, [location]);

  // Load user's applications
  useEffect(() => {
    if (user?.id) {
      const loadApplications = async () => {
        const result = await getApplicationsByUser(user.id);
        if (result.success) {
          setApplications(result.applications || []);
        }
      };
      loadApplications();
    }
  }, [user?.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.pet_id) newErrors.pet_id = "Please select a pet";
    if (!form.living_situation.trim()) newErrors.living_situation = "Living situation is required";
    if (!form.home_type) newErrors.home_type = "Home type is required";
    if (!form.rent_or_own) newErrors.rent_or_own = "Please select rent or own";
    if (form.rent_or_own === "rent" && !form.landlord_allows_pets) {
      newErrors.landlord_allows_pets = "Required for renters";
    }
    if (!form.household_members) newErrors.household_members = "Household members is required";
    if (!form.reason_for_adoption.trim()) newErrors.reason_for_adoption = "Reason for adoption is required";
    if (!form.daily_schedule.trim()) newErrors.daily_schedule = "Daily schedule is required";
    if (!form.veterinary_reference.trim()) newErrors.veterinary_reference = "Veterinary reference is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setToast({ message: "Please fill in all required fields", type: "error" });
      return;
    }

    if (!user?.id) {
      setToast({ message: "You must be logged in to apply", type: "error" });
      return;
    }

    setSubmitting(true);

    try {
      // Prepare form data - remove landlord_allows_pets if not renting
      const applicationData = { ...form };
      
      // Only include landlord_allows_pets if renting
      if (form.rent_or_own !== "rent") {
        applicationData.landlord_allows_pets = null;
      }
      
      // Convert household_members to number
      if (applicationData.household_members) {
        applicationData.household_members = parseInt(applicationData.household_members);
      }

      const result = await submitApplication(applicationData, user.id);

      if (result.success) {
        // Notify admins
        const selectedPet = pets.find((p) => p.id === form.pet_id);
        await notifyAdminsAboutApplication(
          form.pet_id,
          selectedPet?.name || "a pet",
          user.id,
          user.user_metadata?.fullname || user.email || "An adopter"
        );

        // Notify adopter that their application was submitted
        const { createNotification } = await import("../lib/notifications");
        await createNotification(
          user.id,
          "application_submitted",
          "Application Submitted",
          `The application for ${selectedPet?.name || "a pet"} has been submitted`,
          { pet_id: form.pet_id, pet_name: selectedPet?.name }
        );

        setToast({ message: "Application submitted successfully! Admins have been notified.", type: "success" });
        
        // Reset form
        setForm({
          pet_id: "",
          living_situation: "",
          home_type: "",
          rent_or_own: "",
          landlord_allows_pets: "",
          household_members: "",
          children_ages: "",
          other_pets_description: "",
          reason_for_adoption: "",
          daily_schedule: "",
          veterinary_reference: "",
          personal_reference: "",
        });
        setErrors({});

        // Reload applications
        const appResult = await getApplicationsByUser(user.id);
        if (appResult.success) {
          setApplications(appResult.applications || []);
        }
      } else {
        setToast({ message: result.error || "Failed to submit application", type: "error" });
      }
    } catch (err) {
      console.error("Error submitting application:", err);
      setToast({ message: "Error submitting application", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status) => {
    if (status === "Approved") return <Check size={16} />;
    if (status === "Declined") return <XCircle size={16} />;
    return <Clock size={16} />;
  };

  const getStatusColor = (status) => {
    if (status === "Approved") return "from-green-500 to-emerald-500";
    if (status === "Declined") return "from-red-500 to-orange-500";
    return "from-amber-500 to-orange-500";
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-amber-700 text-lg">Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-linear-to-br from-amber-50 via-white to-orange-50">
        {/* Hero Header */}
        <div className="bg-linear-to-r from-amber-500 to-orange-500 px-6 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm mb-6">
              <FileText size={16} className="text-white" />
              <span className="text-sm font-bold text-white">ADOPT A PET</span>
            </div>
            <h1 className="text-5xl font-black text-white mb-4">Start Your Adoption Journey</h1>
            <p className="text-xl text-white/90">Complete the application form and we'll review your request</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 py-12">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Toast Messages */}
            {toast.message && (
              <Toast
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ message: "", type: "info" })}
              />
            )}

            {/* APPLICATION FORM */}
            <div className="bg-white rounded-3xl p-8 border border-amber-100 shadow-2xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-linear-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <FileText size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-amber-900">Adoption Application</h2>
                  <p className="text-amber-600 text-sm mt-1">All fields marked with * are required</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Pet Selection */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-amber-900 mb-3">
                    <PawPrint size={16} />
                    Select Pet *
                  </label>
                  <select
                    name="pet_id"
                    value={form.pet_id}
                    onChange={handleChange}
                    className={`w-full px-4 py-3.5 rounded-xl border-2 ${
                      errors.pet_id ? "border-red-400" : "border-amber-200"
                    } focus:border-amber-400 focus:ring-4 focus:ring-amber-100 outline-none transition-all font-medium text-amber-900`}
                  >
                    <option value="">Choose a pet...</option>
                    {pets.map((pet) => (
                      <option key={pet.id} value={pet.id}>
                        {pet.name} ({pet.category})
                      </option>
                    ))}
                  </select>
                  {errors.pet_id && <p className="text-red-600 text-xs mt-1">{errors.pet_id}</p>}
                </div>

                {/* Living Situation */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-amber-900 mb-3">
                    <Home size={16} />
                    Living Situation *
                  </label>
                  <textarea
                    name="living_situation"
                    value={form.living_situation}
                    onChange={handleChange}
                    placeholder="Describe your living situation (e.g., apartment, house, farm)"
                    className={`w-full px-4 py-3.5 rounded-xl border-2 ${
                      errors.living_situation ? "border-red-400" : "border-amber-200"
                    } focus:border-amber-400 focus:ring-4 focus:ring-amber-100 outline-none transition-all resize-none`}
                    rows="2"
                  />
                  {errors.living_situation && <p className="text-red-600 text-xs mt-1">{errors.living_situation}</p>}
                </div>

                {/* Home Type & Rent/Own */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-bold text-amber-900 mb-3 block">Home Type *</label>
                    <select
                      name="home_type"
                      value={form.home_type}
                      onChange={handleChange}
                      className={`w-full px-4 py-3.5 rounded-xl border-2 ${
                        errors.home_type ? "border-red-400" : "border-amber-200"
                      } focus:border-amber-400 focus:ring-4 focus:ring-amber-100 outline-none transition-all`}
                    >
                      <option value="">-- Select --</option>
                      <option value="apartment">🏢 Apartment</option>
                      <option value="house">🏠 House</option>
                      <option value="condo">🏘️ Condo</option>
                      <option value="farm">🌾 Farm</option>
                      <option value="other">📍 Other</option>
                    </select>
                    {errors.home_type && <p className="text-red-600 text-xs mt-1">{errors.home_type}</p>}
                  </div>

                  <div>
                    <label className="text-sm font-bold text-amber-900 mb-3 block">Rent or Own *</label>
                    <select
                      name="rent_or_own"
                      value={form.rent_or_own}
                      onChange={handleChange}
                      className={`w-full px-4 py-3.5 rounded-xl border-2 ${
                        errors.rent_or_own ? "border-red-400" : "border-amber-200"
                      } focus:border-amber-400 focus:ring-4 focus:ring-amber-100 outline-none transition-all`}
                    >
                      <option value="">-- Select --</option>
                      <option value="own">Own</option>
                      <option value="rent">Rent</option>
                    </select>
                    {errors.rent_or_own && <p className="text-red-600 text-xs mt-1">{errors.rent_or_own}</p>}
                  </div>
                </div>

                {/* Landlord Allows Pets (conditional) */}
                {form.rent_or_own === "rent" && (
                  <div>
                    <label className="text-sm font-bold text-amber-900 mb-3 block">Landlord Allows Pets *</label>
                    <select
                      name="landlord_allows_pets"
                      value={form.landlord_allows_pets}
                      onChange={handleChange}
                      className={`w-full px-4 py-3.5 rounded-xl border-2 ${
                        errors.landlord_allows_pets ? "border-red-400" : "border-amber-200"
                      } focus:border-amber-400 focus:ring-4 focus:ring-amber-100 outline-none transition-all`}
                    >
                      <option value="">-- Select --</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                      <option value="pending">Pending Approval</option>
                    </select>
                    {errors.landlord_allows_pets && (
                      <p className="text-red-600 text-xs mt-1">{errors.landlord_allows_pets}</p>
                    )}
                  </div>
                )}

                {/* Household Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-amber-900 mb-3">
                      <User size={16} />
                      Household Members *
                    </label>
                    <input
                      type="number"
                      name="household_members"
                      value={form.household_members}
                      onChange={handleChange}
                      placeholder="Number of people"
                      min="1"
                      className={`w-full px-4 py-3.5 rounded-xl border-2 ${
                        errors.household_members ? "border-red-400" : "border-amber-200"
                      } focus:border-amber-400 focus:ring-4 focus:ring-amber-100 outline-none transition-all`}
                    />
                    {errors.household_members && (
                      <p className="text-red-600 text-xs mt-1">{errors.household_members}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-bold text-amber-900 mb-3 block">Children Ages (if any)</label>
                    <input
                      type="text"
                      name="children_ages"
                      value={form.children_ages}
                      onChange={handleChange}
                      placeholder="e.g., 5, 8, 12"
                      className="w-full px-4 py-3.5 rounded-xl border-2 border-amber-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-100 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Other Pets */}
                <div>
                  <label className="text-sm font-bold text-amber-900 mb-3 block">Other Pets Description</label>
                  <textarea
                    name="other_pets_description"
                    value={form.other_pets_description}
                    onChange={handleChange}
                    placeholder="Describe any other pets you have (e.g., 1 dog, 2 cats)"
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-amber-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-100 outline-none transition-all resize-none"
                    rows="2"
                  />
                </div>

                {/* Reason for Adoption */}
                <div>
                  <label className="text-sm font-bold text-amber-900 mb-3 block">Why Do You Want to Adopt? *</label>
                  <textarea
                    name="reason_for_adoption"
                    value={form.reason_for_adoption}
                    onChange={handleChange}
                    placeholder="Tell us why you want to adopt this pet..."
                    className={`w-full px-4 py-3.5 rounded-xl border-2 ${
                      errors.reason_for_adoption ? "border-red-400" : "border-amber-200"
                    } focus:border-amber-400 focus:ring-4 focus:ring-amber-100 outline-none transition-all resize-none`}
                    rows="3"
                  />
                  {errors.reason_for_adoption && (
                    <p className="text-red-600 text-xs mt-1">{errors.reason_for_adoption}</p>
                  )}
                </div>

                {/* Daily Schedule */}
                <div>
                  <label className="text-sm font-bold text-amber-900 mb-3 block">Daily Schedule *</label>
                  <textarea
                    name="daily_schedule"
                    value={form.daily_schedule}
                    onChange={handleChange}
                    placeholder="Describe a typical day for the pet (e.g., alone 8 hours for work, etc.)"
                    className={`w-full px-4 py-3.5 rounded-xl border-2 ${
                      errors.daily_schedule ? "border-red-400" : "border-amber-200"
                    } focus:border-amber-400 focus:ring-4 focus:ring-amber-100 outline-none transition-all resize-none`}
                    rows="3"
                  />
                  {errors.daily_schedule && <p className="text-red-600 text-xs mt-1">{errors.daily_schedule}</p>}
                </div>

                {/* References */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-bold text-amber-900 mb-3 block">
                      Veterinary Reference (Name & Contact) *
                    </label>
                    <input
                      type="text"
                      name="veterinary_reference"
                      value={form.veterinary_reference}
                      onChange={handleChange}
                      placeholder="Vet name and phone"
                      className={`w-full px-4 py-3.5 rounded-xl border-2 ${
                        errors.veterinary_reference ? "border-red-400" : "border-amber-200"
                      } focus:border-amber-400 focus:ring-4 focus:ring-amber-100 outline-none transition-all`}
                    />
                    {errors.veterinary_reference && (
                      <p className="text-red-600 text-xs mt-1">{errors.veterinary_reference}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-bold text-amber-900 mb-3 block">Personal Reference (Name & Contact)</label>
                    <input
                      type="text"
                      name="personal_reference"
                      value={form.personal_reference}
                      onChange={handleChange}
                      placeholder="Reference name and phone"
                      className="w-full px-4 py-3.5 rounded-xl border-2 border-amber-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-100 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-xl font-bold text-lg bg-linear-to-r from-amber-500 to-orange-500 text-white hover:shadow-2xl hover:shadow-amber-300 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-8"
                >
                  {submitting ? "Submitting..." : "Submit Application"}
                </button>
              </form>
            </div>

            {/* APPLICATIONS LIST */}
            <div className="bg-white rounded-3xl p-8 border border-amber-100 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <FileText size={24} className="text-white" />
                </div>
                <h2 className="text-3xl font-black text-amber-900">Your Applications</h2>
              </div>

              {applications.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-linear-to-br from-amber-100 to-orange-100 flex items-center justify-center mx-auto mb-4">
                    <FileText size={32} className="text-amber-500" />
                  </div>
                  <p className="text-amber-700 font-medium">No applications yet. Start by submitting one!</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {applications.map((app) => (
                    <div
                      key={app.id}
                      className="p-6 rounded-2xl border-2 border-amber-100 hover:border-amber-300 transition-all bg-linear-to-br from-white to-amber-50/30 hover:shadow-lg"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-amber-900 mb-1">
                            {app.pets?.name || "Unknown Pet"}
                          </h3>
                          <p className="text-sm text-amber-600 flex items-center gap-2">
                            <Calendar size={14} />
                            Submitted {new Date(app.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-white bg-linear-to-r ${getStatusColor(
                            app.status
                          )}`}
                        >
                          {getStatusIcon(app.status)}
                          {app.status}
                        </span>
                      </div>
                      {app.reason_for_adoption && (
                        <p className="text-sm text-amber-700 bg-white/60 p-3 rounded-xl border border-amber-100">
                          <strong>Why:</strong> {app.reason_for_adoption.substring(0, 150)}...
                        </p>
                      )}
                      {app.status === "Declined" && app.decline_reason && (
                        <p className="text-sm text-red-700 bg-red-50/60 p-3 rounded-xl border border-red-200 mt-2">
                          <strong>Decline Reason:</strong> {app.decline_reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { getPetById } from "../lib/pets";
import { submitApplication } from "../lib/applications";
import { notifyAdminsAboutApplication } from "../lib/notifications";
import { useAuth } from "../hooks/useAuth";
import ApplicationFormModal from "../components/ApplicationFormModal";
import Toast from "../components/Toast";
import Button from "../components/Button";
import { ArrowLeft } from "lucide-react";

export default function PetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "info" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchPet = async () => {
      setLoading(true);
      setError("");
      
      if (!id) {
        setError("Pet ID not found");
        setLoading(false);
        return;
      }

      try {
        const result = await getPetById(id);
        if (result.success && result.pet) {
          setPet(result.pet);
        } else {
          setError(result.error || "Pet not found");
        }
      } catch (err) {
        setError("Failed to load pet details");
      } finally {
        setLoading(false);
      }
    };

    fetchPet();
  }, [id]);

  const handleApplicationSubmit = async (applicationData) => {
    setSubmitting(true);

    try {
      if (!user || !user.id) {
        setToast({ message: "You must be logged in to apply", type: "error" });
        setSubmitting(false);
        return;
      }

      // Submit application
      const result = await submitApplication(
        {
          pet_id: pet.id,
          ...applicationData,
        },
        user.id
      );

      if (result.success) {
        // Notify admins about the new application
        await notifyAdminsAboutApplication(
          pet.id,
          pet.name,
          user.id,
          user.fullname || user.email || "An adopter"
        );

        // Notify adopter that their application was submitted
        const { createNotification } = await import("../lib/notifications");
        await createNotification(
          user.id,
          "application_submitted",
          "Application Submitted",
          `The application for ${pet.name} has been submitted`,
          { pet_id: pet.id, pet_name: pet.name }
        );

        setToast({ message: "Application submitted successfully! Admins have been notified.", type: "success" });
        setIsApplicationModalOpen(false);
        
        // Redirect after 2 seconds
        setTimeout(() => {
          navigate("/browsepet");
        }, 2000);
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

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-amber-700 text-lg">Loading pet details...</p>
        </div>
      </Layout>
    );
  }

  if (error || !pet) {
    return (
      <Layout>
        <div className="min-h-screen bg-light px-6 py-12">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => navigate("/browsepet")}
              className="flex items-center gap-2 text-amber-600 hover:text-amber-800 mb-6 font-semibold"
            >
              <ArrowLeft size={20} />
              Back to Browse
            </button>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-700 text-lg">{error || "Pet not found"}</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-light">
        <div className="px-6 py-12">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <button
              onClick={() => navigate("/browsepet")}
              className="flex items-center gap-2 text-amber-600 hover:text-amber-800 mb-6 font-semibold"
            >
              <ArrowLeft size={20} />
              Back to Browse
            </button>

            {/* Toast */}
            {toast.message && (
              <Toast
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ message: "", type: "info" })}
              />
            )}

            {/* Main Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Image Section */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                {pet.image_url ? (
                  <img
                    src={pet.image_url}
                    alt={pet.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="h-96 bg-linear-amber-br flex items-center justify-center text-9xl">
                    {pet.category === "dog"
                      ? "🐕"
                      : pet.category === "cat"
                      ? "🐱"
                      : pet.category === "bird"
                      ? "🦜"
                      : pet.category === "rabbit"
                      ? "🐰"
                      : "🐾"}
                  </div>
                )}
              </div>

              {/* Details Section */}
              <div className="space-y-6">
                <div>
                  <h1 className="text-5xl font-bold text-amber-900 mb-2">{pet.name}</h1>
                  <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                    pet.status === "Available"
                      ? "bg-green-100 text-green-800"
                      : pet.status === "Adopted"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {pet.status}
                  </span>
                </div>

                {/* Pet Info Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <p className="text-sm text-amber-700 font-semibold">Category</p>
                    <p className="text-lg font-bold text-amber-900 capitalize">{pet.category}</p>
                  </div>

                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <p className="text-sm text-amber-700 font-semibold">Breed</p>
                    <p className="text-lg font-bold text-amber-900">{pet.breed || "—"}</p>
                  </div>

                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <p className="text-sm text-amber-700 font-semibold">Age</p>
                    <p className="text-lg font-bold text-amber-900">{pet.age || "—"}</p>
                  </div>

                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <p className="text-sm text-amber-700 font-semibold">Gender</p>
                    <p className="text-lg font-bold text-amber-900 capitalize">{pet.gender || "—"}</p>
                  </div>

                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <p className="text-sm text-amber-700 font-semibold">Size</p>
                    <p className="text-lg font-bold text-amber-900 capitalize">{pet.size || "—"}</p>
                  </div>

                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <p className="text-sm text-amber-700 font-semibold">Color</p>
                    <p className="text-lg font-bold text-amber-900">{pet.color || "—"}</p>
                  </div>

                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <p className="text-sm text-amber-700 font-semibold">Health Status</p>
                    <p className="text-lg font-bold text-amber-900 capitalize">{pet.health_status || "—"}</p>
                  </div>

                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <p className="text-sm text-amber-700 font-semibold">Vaccinated</p>
                    <p className="text-lg font-bold text-amber-900">
                      {pet.vaccination_status ? "Yes ✓" : "No"}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {pet.description && (
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h3 className="font-bold text-amber-900 mb-3">About {pet.name}</h3>
                    <p className="text-amber-800 leading-relaxed">{pet.description}</p>
                  </div>
                )}

                {/* Apply Button */}
                {pet.status === "Available" && (
                  <Button
                    onClick={() => navigate("/application", { state: { pet_id: pet.id } })}
                    variant="primary"
                    className="w-full py-4 text-lg font-bold"
                  >
                    🤍 Apply to Adopt
                  </Button>
                )}

                {pet.status !== "Available" && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                    <p className="text-yellow-800 font-semibold">This pet is no longer available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Application Modal */}
        <ApplicationFormModal
          isOpen={isApplicationModalOpen}
          onClose={() => setIsApplicationModalOpen(false)}
          pet={pet}
          onSubmit={handleApplicationSubmit}
          loading={submitting}
        />
      </div>
    </Layout>
  );
}

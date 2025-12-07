import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import Modal from "../components/Modal";
import Button from "../components/Button";
import Toast from "../components/Toast";
import {
  getAllApplications,
  approveApplication,
  declineApplication,
} from "../lib/applications";
import { useAuth } from "../components/RequireAuth";

export default function ApplicationAdminPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("Pending");
  const [toast, setToast] = useState({ message: "", type: "info" });
  
  // Modal state for decline
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [selectedAppForDecline, setSelectedAppForDecline] = useState(null);

  useEffect(() => {
    const loadApplications = async () => {
      setLoading(true);
      const result = await getAllApplications();
      
      if (result.success) {
        setApplications(result.applications);
      } else {
        setToast({ message: result.error || "Failed to load applications", type: "error" });
      }
      setLoading(false);
    };

    loadApplications();
  }, []);

  const handleApprove = async (applicationId, petId) => {
    setLoading(true);
    const result = await approveApplication(applicationId, petId, user?.id);
    
    if (result.success) {
      // Notify adopter that their application was approved
      try {
        const { createNotification } = await import("../lib/notifications");
        const app = applications.find(a => a.id === applicationId);
        if (app) {
          await createNotification(
            app.user_id,
            "application_approved",
            "Application Approved",
            `Your application for ${app.pets?.name || "a pet"} has been approved! Congratulations!`,
            { applicationId, petName: app.pets?.name }
          );
        }
      } catch (err) {
        console.error("[AdminApp] Error notifying adopter of approval:", err);
      }
      
      setToast({ message: "Application approved!", type: "success" });
      const reload = await getAllApplications();
      if (reload.success) {
        setApplications(reload.applications);
      }
    } else {
      setToast({ message: result.error || "Failed to approve application", type: "error" });
    }
    setLoading(false);
  };

  const handleDeclineClick = (app) => {
    console.log("[AdminApp] ===== DECLINE BUTTON CLICKED =====");
    console.log("[AdminApp] App data:", app);
    console.log("[AdminApp] App ID:", app?.id);
    console.log("[AdminApp] Setting selectedAppForDecline and showing modal");
    setSelectedAppForDecline(app);
    setDeclineReason("");
    setShowDeclineModal(true);
    console.log("[AdminApp] State updated - should show modal");
  };

  const handleDeclineSubmit = async () => {
    console.log("[AdminApp] ===== DECLINE SUBMIT CLICKED =====");
    console.log("[AdminApp] Decline reason entered:", declineReason);
    console.log("[AdminApp] Selected app:", selectedAppForDecline);
    console.log("[AdminApp] Selected app ID:", selectedAppForDecline?.id);
    console.log("[AdminApp] User ID:", user?.id);

    if (!declineReason.trim()) {
      console.log("[AdminApp] VALIDATION FAILED - No reason provided");
      setToast({ message: "Please provide a reason for declining", type: "error" });
      return;
    }

    if (!selectedAppForDecline?.id) {
      console.log("[AdminApp] VALIDATION FAILED - No app selected");
      setToast({ message: "No application selected", type: "error" });
      return;
    }

    if (!user?.id) {
      console.log("[AdminApp] VALIDATION FAILED - No user ID");
      setToast({ message: "User not authenticated", type: "error" });
      return;
    }

    setLoading(true);
    console.log("[AdminApp] CALLING declineApplication with:", {
      applicationId: selectedAppForDecline.id,
      reason: declineReason,
      reviewedByUserId: user?.id
    });
    
    try {
      const result = await declineApplication(selectedAppForDecline.id, declineReason, user?.id);
      console.log("[AdminApp] ===== DECLINE RESULT =====", result);
      
      if (result.success) {
        console.log("[AdminApp] SUCCESS - Reloading applications");
        setToast({ message: "Application declined", type: "success" });
        const reload = await getAllApplications();
        if (reload.success) {
          setApplications(reload.applications);
        }
        setShowDeclineModal(false);
        setDeclineReason("");
        setSelectedAppForDecline(null);
        console.log("[AdminApp] SUCCESS - Modal closed and state cleared");
      } else {
        console.log("[AdminApp] FAILED - Error:", result.error);
        setToast({ message: result.error || "Failed to decline application", type: "error" });
      }
    } catch (err) {
      console.log("[AdminApp] EXCEPTION in handleDeclineSubmit:", err);
      setToast({ message: "Exception: " + err.message, type: "error" });
    }
    setLoading(false);
  };

  const filteredApplications = applications.filter(
    (app) => !filterStatus || app.status === filterStatus
  );

  return (
    <AdminLayout>
      <div style={{ backgroundColor: "var(--white)", minHeight: "100vh" }}>
        {/* Header Section */}
        <div style={{ backgroundColor: "var(--primary-beige)", padding: "3rem 1.5rem" }}>
          <div className="max-w-6xl mx-auto">
            <p style={{ color: "var(--accent-dark)", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
              📋 MANAGE APPLICATIONS
            </p>
            <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", color: "var(--text-dark)", marginBottom: "0.5rem" }}>
              Adoption Applications
            </h1>
            <p style={{ color: "var(--text-light)", fontSize: "1.125rem" }}>
              Review and manage pending adoption requests
            </p>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-8" style={{ maxWidth: "1400px", margin: "0 auto" }}>

        {/* Messages */}
        {toast.message && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ message: "", type: "info" })}
          />
        )}

        {/* Filter Tabs */}
        <div className="flex gap-4">
          {["Pending", "Approved", "Declined"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status === filterStatus ? "" : status)}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                filterStatus === status
                  ? "btn-primary"
                  : "btn-secondary"
              }`}
            >
              {status} {status === "Pending" && `(${applications.filter(a => a.status === "Pending").length})`}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <p style={{ color: "var(--text-light)" }}>Loading applications...</p>
        )}

        {/* Applications List */}
        {!loading && filteredApplications.length > 0 && (
          <div className="space-y-4">
            {filteredApplications.map((app) => (
              <div
                key={app.id}
                className="p-8 rounded-2xl shadow-lg"
                style={{
                  backgroundColor: "var(--white)",
                  border: "1px solid var(--primary-beige)",
                  borderLeft: `4px solid ${
                    app.status === "Pending"
                      ? "var(--accent-warm)"
                      : app.status === "Approved"
                      ? "#2D7A3A"
                      : "#8B4513"
                  }`,
                }}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  {/* Application Info */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold" style={{ color: "var(--text-dark)" }}>
                          {app.users?.fullname || "Unknown User"}
                        </h3>
                        <p style={{ color: "var(--text-light)", fontSize: "14px" }}>
                          Applied for <strong>{app.pets?.name || "Unknown Pet"}</strong> ({app.pets?.category})
                        </p>
                      </div>
                      <span
                        className="px-4 py-2 rounded-full text-sm font-bold"
                        style={{
                          backgroundColor:
                            app.status === "Approved"
                              ? "#D4F1D4"
                              : app.status === "Declined"
                              ? "#FFE8D4"
                              : "var(--primary-beige)",
                          color:
                            app.status === "Approved"
                              ? "#2D7A3A"
                              : app.status === "Declined"
                              ? "#8B4513"
                              : "var(--accent-dark)",
                        }}
                      >
                        {app.status}
                      </span>
                    </div>

                    {/* Contact Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      <div>
                        <p style={{ color: "var(--text-light)", fontSize: "12px" }}>
                          <strong>Email:</strong> {app.users?.email || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: "var(--text-light)", fontSize: "12px" }}>
                          <strong>Phone:</strong> {app.users?.phone_number || "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Application Details */}
                    {app.living_situation && (
                      <div className="space-y-2 mb-4">
                        <div className="section-subtitle" style={{ marginTop: "0" }}>
                          Application Details
                        </div>
                        <p style={{ color: "var(--text-light)", fontSize: "13px" }}>
                          <strong>Living Situation:</strong> {app.living_situation}
                        </p>
                        {app.reason && (
                          <p style={{ color: "var(--text-light)", fontSize: "13px" }}>
                            <strong>Why they want to adopt:</strong> {app.reason.substring(0, 200)}...
                          </p>
                        )}
                      </div>
                    )}

                    {/* Submission Date */}
                    <p style={{ color: "var(--text-light)", fontSize: "12px" }}>
                      Submitted {new Date(app.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  {app.status === "Pending" && (
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleApprove(app.id, app.pet_id)}
                        variant="primary"
                        className="px-6 py-2 whitespace-nowrap"
                        style={{ backgroundColor: "#2D7A3A" }}
                      >
                        ✓ Approve
                      </Button>
                      <Button
                        onClick={() => handleDeclineClick(app)}
                        variant="ghost"
                        className="px-6 py-2 whitespace-nowrap text-red-600 hover:bg-red-50"
                      >
                        ✗ Decline
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredApplications.length === 0 && !toast.message && (
          <div className="text-center py-12">
            <p className="text-2xl mb-2">📭</p>
            <p style={{ color: "var(--text-light)" }}>
              No {filterStatus ? filterStatus.toLowerCase() : ""} applications found.
            </p>
          </div>
        )}
        </div>

        {/* Decline Modal */}
        {selectedAppForDecline && (
          <Modal
            open={showDeclineModal}
            onClose={() => setShowDeclineModal(false)}
            children={
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Declining application from <strong>{selectedAppForDecline.users?.fullname}</strong> for{" "}
                    <strong>{selectedAppForDecline.pets?.name}</strong>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Declining *</label>
                  <textarea
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    placeholder="Provide a reason for declining this application..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    rows="4"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => setShowDeclineModal(false)}
                    variant="secondary"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeclineSubmit}
                    variant="primary"
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    disabled={loading}
                  >
                    {loading ? "Processing..." : "Decline Application"}
                  </Button>
                </div>
              </div>
            }
            width={500}
          />
        )}
      </div>
    </AdminLayout>
  );
}

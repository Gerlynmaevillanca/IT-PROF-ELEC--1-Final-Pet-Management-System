import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import { getOverallStatistics } from "../lib/reports";
import Toast from "../components/Toast";

const StatCard = ({ icon, label, value, color = "var(--accent-warm)" }) => (
  <div className="p-8 rounded-2xl shadow-lg" style={{ backgroundColor: "var(--white)", border: "1px solid var(--primary-beige)" }}>
    <div className="flex items-start justify-between">
      <div>
        <p style={{ color: "var(--text-light)" }} className="text-sm font-medium mb-1">
          {label}
        </p>
        <p style={{ color: color }} className="text-3xl font-bold">
          {value}
        </p>
      </div>
      <span className="text-3xl">{icon}</span>
    </div>
  </div>
);

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: "", type: "info" });

  useEffect(() => {
    const loadStatistics = async () => {
      setLoading(true);
      const result = await getOverallStatistics();
      
      if (result.success) {
        setStats(result);
      } else {
        setToast({ message: result.error || "Failed to load statistics", type: "error" });
      }
      setLoading(false);
    };

    loadStatistics();
  }, []);

  return (
    <AdminLayout>
      <div style={{ backgroundColor: "var(--white)", minHeight: "100vh" }}>
        {/* Header Section */}
        <div style={{ backgroundColor: "var(--primary-beige)", padding: "3rem 1.5rem" }}>
          <div className="max-w-6xl mx-auto">
            <p style={{ color: "var(--accent-dark)", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
              📊 OVERVIEW
            </p>
            <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", color: "var(--text-dark)", marginBottom: "0.5rem" }}>
              Admin Dashboard
            </h1>
            <p style={{ color: "var(--text-light)", fontSize: "1.125rem" }}>
              Monitor shelter operations and key statistics
            </p>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-8" style={{ maxWidth: "1400px", margin: "0 auto" }}>

        {/* Toast Messages */}
        {toast.message && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ message: "", type: "info" })}
          />
        )}

        {/* Loading State */}
        {loading && (
          <p style={{ color: "var(--text-light)" }}>Loading statistics...</p>
        )}

        {/* Stats Cards */}
        {!loading && stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon="🐾"
              label="Total Pets"
              value={stats.total_pets || 0}
              color="var(--accent-warm)"
            />
            <StatCard
              icon="✅"
              label="Available"
              value={stats.available_pets || 0}
              color="#2D7A3A"
            />
            <StatCard
              icon="🏠"
              label="Adopted"
              value={stats.adopted_pets || 0}
              color="#8B6F47"
            />
            <StatCard
              icon="📋"
              label="Pending Applications"
              value={stats.pending_applications || 0}
              color="#D4A574"
            />
          </div>
        )}

        {/* Additional Stats Row */}
        {!loading && stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatCard
              icon="✔️"
              label="Approved Applications"
              value={stats.approved_applications || 0}
              color="#2D7A3A"
            />
            <StatCard
              icon="📊"
              label="Total Applications"
              value={stats.total_applications || 0}
              color="var(--accent-warm)"
            />
            <StatCard
              icon="👥"
              label="Total Users"
              value={stats.total_users || 0}
              color="#8B6F47"
            />
          </div>
        )}

        {/* Quick Actions */}
        <div className="p-8 rounded-2xl shadow-lg" style={{ backgroundColor: "var(--white)", border: "1px solid var(--primary-beige)" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--text-dark)", marginBottom: "1.5rem" }}>Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button className="btn-primary py-3 font-semibold">
              ➕ Add New Pet
            </button>
            <button className="btn-secondary py-3 font-semibold">
              📋 Review Applications
            </button>
            <button className="btn-secondary py-3 font-semibold">
              📊 View Reports
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="p-8 rounded-2xl shadow-lg" style={{ backgroundColor: "var(--white)", border: "1px solid var(--primary-beige)" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--text-dark)", marginBottom: "1.5rem" }}>Recent Activity</h2>
          <div className="space-y-3">
            <div className="pb-3 border-b-2" style={{ borderColor: "var(--secondary-beige)" }}>
              <p style={{ color: "var(--text-dark)" }}>
                🐶 <strong>Buddy</strong> was adopted by <strong>Mark Johnson</strong>
              </p>
              <p style={{ color: "var(--text-light)", fontSize: "12px" }}>2 hours ago</p>
            </div>
            <div className="pb-3 border-b-2" style={{ borderColor: "var(--secondary-beige)" }}>
              <p style={{ color: "var(--text-dark)" }}>
                🐱 New pet <strong>Luna</strong> added to the shelter
              </p>
              <p style={{ color: "var(--text-light)", fontSize: "12px" }}>5 hours ago</p>
            </div>
            <div className="pb-3">
              <p style={{ color: "var(--text-dark)" }}>
                📄 <strong>3 new adoption applications</strong> received
              </p>
              <p style={{ color: "var(--text-light)", fontSize: "12px" }}>Yesterday</p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </AdminLayout>
  );
}
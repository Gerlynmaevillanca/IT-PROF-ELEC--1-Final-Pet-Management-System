import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { getAllApplications } from "../lib/applications";
import { getUnreadNotifications, deleteNotification } from "../lib/notifications";
import Supabase from "../lib/supabase";

export default function AdminNotificationBell({ userId, userRole }) {
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isAdmin = userRole === "admin" || userRole === "staff";
  const [activeTab, setActiveTab] = useState(isAdmin ? "applications" : "notifications");
  const [adminApplications, setAdminApplications] = useState([]);
  const [adminNotifications, setAdminNotifications] = useState([]);

  // Load data based on user role
  useEffect(() => {
    if (!userId) {
      console.log("[NotificationBell] No userId provided");
      return;
    }

    const loadData = async () => {
      console.log("[NotificationBell] Loading for user:", userId, "role:", userRole);
      setLoading(true);
      
      try {
        if (isAdmin) {
          // Admins see pending applications OR notifications depending on active tab
          const appsResult = await getAllApplications();
          console.log("[NotificationBell] Applications Result:", appsResult);
          const pendingApps = appsResult.success ? (appsResult.applications || []).filter(app => app.status === "Pending") : [];
          setAdminApplications(pendingApps);

          // Fetch recent notifications for admins (admins can view notifications for all users)
          const { data: adminNotifs, error: notErr } = await Supabase.from("notifications")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(50);
          if (notErr) console.error("[NotificationBell] Error fetching admin notifications:", notErr);
          setAdminNotifications(adminNotifs || []);

          // Set items based on active tab
          if (activeTab === "applications") {
            setItems(pendingApps);
            setUnreadCount(pendingApps.length);
            console.log("[NotificationBell] Pending applications count:", pendingApps.length);
          } else {
            setItems(adminNotifs || []);
            setUnreadCount((adminNotifs || []).length);
            console.log("[NotificationBell] Admin notifications count:", (adminNotifs || []).length);
          }
        } else {
          // Adopters see their notifications
          const result = await getUnreadNotifications(userId);
          console.log("[NotificationBell] Notifications Result:", result);
          if (result.success) {
            setItems(result.notifications || []);
            setUnreadCount(result.notifications?.length || 0);
            console.log("[NotificationBell] Unread notifications count:", result.notifications?.length || 0);
          }
        }
      } catch (error) {
        console.error("[NotificationBell] Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Poll every 10 seconds
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [userId, userRole, isAdmin]);

  // Re-run when admin toggles active tab
  useEffect(() => {
    if (!userId) return;
    if (isAdmin) {
      // call thin loader for active tab
      const loadTab = async () => {
        setLoading(true);
        try {
          if (activeTab === "applications") {
            const appsResult = await getAllApplications();
            const pendingApps = appsResult.success ? (appsResult.applications || []).filter(app => app.status === "Pending") : [];
            setItems(pendingApps);
            setUnreadCount(pendingApps.length);
          } else {
            const { data: adminNotifs, error: notErr } = await Supabase.from("notifications")
              .select("*")
              .order("created_at", { ascending: false })
              .limit(50);
            if (notErr) console.error("[NotificationBell] Error fetching admin notifications:", notErr);
            setItems(adminNotifs || []);
            setUnreadCount((adminNotifs || []).length);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      };

      loadTab();
    }
  }, [activeTab]);

  const handleDismiss = (itemId) => {
    // If dismissing an admin notification, try to delete it server-side
    const doDismiss = async () => {
      try {
        // If the current items look like notifications (have user_id) call deleteNotification
        const item = items.find((i) => i.id === itemId);
        if (item && item.user_id) {
          await deleteNotification(itemId);
        }
      } catch (e) {
        console.error("[NotificationBell] Failed to delete notification:", e);
      } finally {
        setItems((prev) => prev.filter((item) => item.id !== itemId));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    };

    doDismiss();
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition"
        title="Notifications"
      >
        <Bell size={24} style={{ color: "var(--text-dark)" }} />
        {unreadCount > 0 && (
          <span
            className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white rounded-full"
            style={{ backgroundColor: "#dc2626" }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
          style={{ maxHeight: "400px", overflowY: "auto" }}
        >
          {/* Header */}
          <div
            className="p-4 border-b border-gray-200"
            style={{ backgroundColor: "var(--primary-beige)" }}
          >
              <div className="flex items-center justify-between">
                {isAdmin ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveTab("applications")}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${activeTab === "applications" ? "bg-amber-200 text-amber-800" : "bg-transparent text-gray-700 hover:bg-gray-100"}`}
                      >
                        Applications
                      </button>
                      <button
                        onClick={() => setActiveTab("notifications")}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${activeTab === "notifications" ? "bg-amber-200 text-amber-800" : "bg-transparent text-gray-700 hover:bg-gray-100"}`}
                      >
                        Notifications
                      </button>
                    </div>
                  </div>
                ) : (
                  <h3 className="font-bold" style={{ color: "var(--text-dark)" }}>
                    Notifications
                  </h3>
                )}

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <X size={18} />
                </button>
              </div>
          </div>

          {/* Items List */}
          <div className="divide-y divide-gray-200">
            {loading && (
              <div className="p-4 text-center" style={{ color: "var(--text-light)" }}>
                Loading...
              </div>
            )}

            {!loading && items.length === 0 && (
              <div className="p-6 text-center" style={{ color: "var(--text-light)" }}>
                <p className="text-sm">{isAdmin ? "No pending applications" : "No new notifications"}</p>
              </div>
            )}

            {items.map((item) => {
              if (isAdmin) {
                // Admin view: show applications
                return (
                  <div key={item.id} className="p-4 hover:bg-gray-50 transition">
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div
                        className="p-2 rounded-full shrink-0"
                        style={{ backgroundColor: "var(--primary-beige)" }}
                      >
                        <Bell size={16} style={{ color: "var(--accent-warm)" }} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h4
                          className="font-semibold text-sm"
                          style={{ color: "var(--text-dark)" }}
                        >
                          Application Submitted
                        </h4>
                        <p
                          className="text-xs mt-1"
                          style={{ color: "var(--text-light)" }}
                        >
                          <strong>{item.users?.fullname || "An adopter"}</strong> submitted an application for <strong>{item.pets?.name || "a pet"}</strong>
                        </p>
                        <p
                          className="text-xs mt-2"
                          style={{ color: "var(--text-lighter)" }}
                        >
                          {new Date(item.created_at).toLocaleDateString()}{" "}
                          {new Date(item.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleDismiss(item.id)}
                          className="p-1 hover:bg-gray-200 rounded transition"
                          title="Dismiss"
                        >
                          <X size={16} style={{ color: "var(--text-light)" }} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              } else {
                // Adopter view: show notifications
                return (
                  <div key={item.id} className="p-4 hover:bg-gray-50 transition">
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div
                        className="p-2 rounded-full shrink-0"
                        style={{ backgroundColor: "var(--primary-beige)" }}
                      >
                        <Bell size={16} style={{ color: "var(--accent-warm)" }} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h4
                          className="font-semibold text-sm"
                          style={{ color: "var(--text-dark)" }}
                        >
                          {item.title}
                        </h4>
                        <p
                          className="text-xs mt-1"
                          style={{ color: "var(--text-light)" }}
                        >
                          {item.message}
                        </p>
                        <p
                          className="text-xs mt-2"
                          style={{ color: "var(--text-lighter)" }}
                        >
                          {new Date(item.created_at).toLocaleDateString()}{" "}
                          {new Date(item.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleDismiss(item.id)}
                          className="p-1 hover:bg-gray-200 rounded transition"
                          title="Dismiss"
                        >
                          <X size={16} style={{ color: "var(--text-light)" }} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        </div>
      )}
    </div>
  );
}

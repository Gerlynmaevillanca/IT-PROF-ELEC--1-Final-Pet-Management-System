// Header.jsx
import React, { useState, useRef, useEffect } from "react";
import { Menu, Bell, Settings, X, PawPrint } from "lucide-react";
import { signOut } from "../lib/auth";
import { useAuth } from "./RequireAuth";
import AdminNotificationBell from "./AdminNotificationBell";

// ============= HEADER =============
export default function Header({ toggleSidebar }) {
  const { user } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const notifRef = useRef();
  const settingsRef = useRef();

  useEffect(() => {
    console.log("[Header] User loaded:", user);
    if (user) {
      console.log("[Header] User ID:", user.id);
      console.log("[Header] User role:", user.role);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="flex items-center justify-between bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-3 fixed top-0 left-0 right-0 z-50 md:static shadow-sm">
      <button
        className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
        onClick={toggleSidebar}
      >
        <Menu size={22} />
      </button>

      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-linear-amber">
          <PawPrint size={24} className="text-white" />
        </div>
        <h1 className="text-xl font-bold text-amber-700 hidden sm:block">
          Pet Peeve
        </h1>
      </div>

      <div className="flex items-center gap-2 relative">
        {/* Show notification bell for all authenticated users */}
        {user && user.id && (
          <AdminNotificationBell userId={user.id} userRole={user.role} />
        )}

        <div
          className="relative cursor-pointer hover:bg-gray-100 p-2 rounded-lg text-gray-600 transition-colors"
          onClick={() => setSettingsOpen(!settingsOpen)}
          ref={settingsRef}
        >
          <Settings size={20} />

          {settingsOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <button
                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-gray-800 text-sm transition-colors font-medium"
                onClick={async () => {
                  const res = await signOut();
                  // ignore errors, but redirect to landing
                  window.location.href = "/";
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
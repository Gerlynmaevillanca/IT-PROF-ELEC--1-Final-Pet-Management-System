import React, { useEffect } from "react";

export default function Toast({ message, type = "info", onClose, duration = 2500 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  let bg = "bg-gray-800";
  if (type === "success") bg = "bg-green-600";
  if (type === "error") bg = "bg-red-600";
  if (type === "warning") bg = "bg-yellow-500";

  return (
    <div className={`fixed bottom-8 right-8 z-[9999] px-6 py-3 rounded-xl shadow-lg text-white font-semibold text-base ${bg} animate-fade-in`}>
      {message}
      <button className="ml-4 text-white/80 hover:text-white font-bold" onClick={onClose}>
        ×
      </button>
    </div>
  );
}

// Add fade-in animation to global CSS if not present
// .animate-fade-in { animation: fadeIn 0.3s; }
// @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }

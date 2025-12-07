import React from "react";

export default function Modal({ open, onClose, children, width = "600px", height = "auto" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl shadow-2xl p-8 relative animate-fade-in"
        style={{ minWidth: "400px", maxWidth: width, width, height }}
      >
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-red-500 text-xl font-bold"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

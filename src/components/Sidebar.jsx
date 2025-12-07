import { X, PawPrint, FileText } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Sidebar({ isOpen, setIsOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname || "/";

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm md:hidden z-10"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      <aside
        className={`
          fixed md:static inset-y-0 left-0 w-64 bg-white/95 backdrop-blur-sm border-r border-gray-200 shadow-lg md:shadow-none
          transform transition-all duration-300 z-20 pt-16 md:pt-0 top-0 md:top-auto
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <button
          className="md:hidden p-2.5 m-3 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          onClick={() => setIsOpen(false)}
        >
          <X size={20} />
        </button>

        <nav className="mt-4 space-y-1 px-3">
          <button
            onClick={() => {
              navigate("/browsepet");
              setIsOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium ${
              pathname.startsWith("/browsepet")
                ? "bg-linear-amber text-white shadow-md" 
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <PawPrint size={18} />
            <span>Browse Pets</span>
          </button>

          <button
            onClick={() => {
              navigate("/application");
              setIsOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium ${
              pathname.startsWith("/application")
                ? "bg-linear-amber text-white shadow-md" 
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <FileText size={18} />
            <span>My Applications</span>
          </button>
        </nav>
      </aside>
    </>
  );
}
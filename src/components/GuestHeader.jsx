import { useNavigate } from "react-router-dom";
import { PawPrint } from "lucide-react";

export default function GuestHeader() {
    const navigate = useNavigate();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-amber-100 px-6 py-3">
            <div className="max-w-6xl mx-auto flex justify-between items-center">
                <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-linear-amber">
                        <PawPrint size={24} className="text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-amber-700 hidden sm:block">
                        Pet Peeve
                    </h1>
                </div>

                <div className="flex gap-3">
                    <button onClick={() => navigate("/login")} className="btn-secondary px-4 py-2 text-sm border-amber-500 text-amber-600 bg-amber-100 shadow-md rounded-full w-25 hover:text-white hover:bg-amber-600 hover:animate-pulse cursor-pointer">
                        Login
                    </button>
                    <button onClick={() => navigate("/signup")} className="btn-primary px-4 py-2 text-sm border-amber-500 bg-linear-amber text-white shadow-md rounded-full w-25 hover:animate-pulse cursor-pointer">
                        Sign Up
                    </button>
                </div>
            </div>
        </nav>
    );
}
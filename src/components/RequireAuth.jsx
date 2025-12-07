import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Supabase from "../lib/supabase";
import Toast from "./Toast";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchUser = async () => {
      try {
        const { data } = await Supabase.auth.getUser();
        const authUser = data?.user;
        
        if (authUser && mounted) {
          // Fetch the user's role from public.users table
          const { data: userData, error } = await Supabase.from("users")
            .select("id, email, fullname, role")
            .eq("id", authUser.id)
            .single();

          if (error) {
            console.warn("[useAuth] Error fetching user role:", error);
            // Fallback to auth user if query fails
            setUser(authUser);
          } else if (userData && mounted) {
            // Merge database user data with auth user
            setUser({
              ...authUser,
              role: userData.role,
              fullname: userData.fullname,
            });
          }
        } else if (mounted) {
          setUser(null);
        }
      } catch (err) {
        console.error("[useAuth] Error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchUser();

    return () => (mounted = false);
  }, []);

  return { user, loading };
}

export default function RequireAuth({ children, requiredRole }) {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [showToast, setShowToast] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await Supabase.auth.getUser();
        const user = data?.user;
        if (!mounted) return;
        if (user) {
          // If requiredRole is set, check user_metadata.role
          if (requiredRole) {
            const role = user.user_metadata?.role || user.user_metadata?.Role || user.user_metadata?.role?.toLowerCase();
            if (!role || (Array.isArray(requiredRole) ? !requiredRole.includes(role) : role !== requiredRole)) {
              setShowToast("Access denied: insufficient permissions.");
              setAuthenticated(false);
              setTimeout(() => navigate("/", { replace: true }), 1800);
              return;
            }
          }
          setAuthenticated(true);
        } else {
          setAuthenticated(false);
          setShowToast("Please log in to access this page.");
          setTimeout(() => navigate("/login", { state: { from: location }, replace: true }), 1800);
        }
      } catch (err) {
        setAuthenticated(false);
        setShowToast("Authentication error. Please log in.");
        setTimeout(() => navigate("/login", { state: { from: location }, replace: true }), 1800);
      } finally {
        if (mounted) setChecking(false);
      }
    })();
    return () => (mounted = false);
  }, [location, navigate, requiredRole]);

  if (checking) return (
    <div className="flex flex-col items-center justify-center min-h-[40vh]">
      <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4"></div>
      <div className="text-lg font-semibold text-amber-700">Checking authentication...</div>
      {showToast && <Toast message={showToast} type="error" onClose={() => setShowToast("")} />}
    </div>
  );
  if (!authenticated) return showToast ? <Toast message={showToast} type="error" onClose={() => setShowToast("")} /> : null;
  return <>{children}</>;
}

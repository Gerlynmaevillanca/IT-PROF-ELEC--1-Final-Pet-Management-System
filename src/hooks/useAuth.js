import { useEffect, useState } from "react";
import Supabase from "../lib/supabase";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchUser = async () => {
      try {
        const { data } = await Supabase.auth.getUser();
        if (mounted) {
          if (data?.user) {
            setUser(data.user);
          } else {
            setUser(null);
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err.message);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchUser();

    // Subscribe to auth changes
    const { data: authListener } = Supabase.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        if (session?.user) {
          setUser(session.user);
        } else {
          setUser(null);
        }
      }
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  return { user, loading, error };
}

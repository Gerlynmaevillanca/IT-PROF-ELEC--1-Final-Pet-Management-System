import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Phone, MapPin, Home, X, Check } from "lucide-react";
import Supabase from "../lib/supabase";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [profile, setProfile] = useState({
    id: "",
    fullname: "",
    email: "",
    role: "adopter",
    phone_number: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: userData } = await Supabase.auth.getUser();
        const user = userData?.user;
        if (!user) {
          navigate("/login");
          return;
        }

        const { data, error } = await Supabase.from("users").select("*").eq("id", user.id).maybeSingle();
        if (error) {
          setError("Failed to load profile");
        }

        if (data) {
          setProfile({ ...profile, ...data });

          // If profile is complete, redirect to browse
          if (data.phone_number && data.address && data.city && data.state && data.zip_code) {
            navigate("/browsepet");
            return;
          }
        } else {
          // Pre-fill id/email/role
          setProfile((p) => ({ ...p, id: user.id, email: user.email, role: user.user_metadata?.role || "adopter", fullname: user.user_metadata?.fullname || user.user_metadata?.full_name || "" }));
        }
      } catch (err) {
        setError("Unexpected error loading profile");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        id: profile.id,
        fullname: profile.fullname,
        email: profile.email,
        role: profile.role || "adopter",
        phone_number: profile.phone_number,
        address: profile.address,
        city: profile.city,
        state: profile.state,
        zip_code: profile.zip_code,
      };

      const { error } = await Supabase.from("users").upsert(payload);
      if (error) throw error;

      setMessage("Profile saved. Redirecting...");
      setTimeout(() => navigate("/browsepet"), 900);
    } catch (err) {
      setError(err?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading profile...</div>;

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Complete Your Profile</h2>

        {error && <div className="mb-4 text-red-700 font-semibold">{error}</div>}
        {message && <div className="mb-4 text-green-700 font-semibold">{message}</div>}

        <form className="space-y-4" onSubmit={handleSave}>
          <div>
            <label className="block text-sm font-semibold mb-1">Phone</label>
            <div className="flex items-center gap-2">
              <Phone />
              <input name="phone_number" value={profile.phone_number || ""} onChange={handleChange} className="w-full p-2 border rounded" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Address</label>
            <div className="flex items-center gap-2">
              <MapPin />
              <input name="address" value={profile.address || ""} onChange={handleChange} className="w-full p-2 border rounded" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold mb-1">City</label>
              <input name="city" value={profile.city || ""} onChange={handleChange} className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">State</label>
              <input name="state" value={profile.state || ""} onChange={handleChange} className="w-full p-2 border rounded" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Zipcode</label>
            <input name="zip_code" value={profile.zip_code || ""} onChange={handleChange} className="w-full p-2 border rounded" />
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" className="px-4 py-2 bg-linear-amber text-white rounded cursor-pointer" disabled={saving}>
              {saving ? "Saving..." : "Save & Continue"}
            </button>
            <button type="button" onClick={() => navigate("/")} className="px-4 py-2 border rounded cursor-pointer">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

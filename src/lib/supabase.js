import { createClient } from "@supabase/supabase-js";

const Supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

// Helper to check if users table exists and has proper permissions
export async function ensureUserRow(userId, email, fullName, role) {
  try {
    // Use upsert with onConflict to safely create or update the user's row.
    // This plays nicely with RLS if policies allow the authenticated user to INSERT/UPDATE their own row.
    const payload = {
      id: userId,
      email,
      fullname: fullName,
      role,
    };

    const { data, error } = await Supabase.from("users")
      .upsert(payload, { onConflict: "id", returning: "representation" })
      .select();

    if (error) {
      console.error("Upsert error:", error);
      // PostgREST error when schema cache is stale or column missing returns PGRST204
      if (error.code === "PGRST204" || error.message?.includes("Could not find")) {
        return { success: false, reason: "schema_cache", error };
      }
      // Check if it's a permission/policy error
      if (error.message?.toLowerCase().includes("permission denied") || error.message?.toLowerCase().includes("policy")) {
        return { success: false, reason: "rls_policy", error };
      }
      return { success: false, reason: "other", error };
    }

    console.log("User row upserted successfully:", data);
    return { success: true, reason: "upserted", data };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { success: false, reason: "exception", error: err };
  }
}

export default Supabase;
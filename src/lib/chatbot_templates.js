import Supabase from "./supabase";

export async function createTemplate(userId, title, messages) {
  try {
    if (!title || !messages) return { success: false, error: "title and messages are required" };

    // if userId is present, persist in DB; otherwise return error to caller to save locally
    if (!userId) return { success: false, error: "user_id is required for DB save" };

    const { data, error } = await Supabase.from("chatbot_templates")
      .insert({ user_id: userId, title, messages, created_at: new Date().toISOString() })
      .select()
      .single();

    if (error) throw error;
    return { success: true, template: data };
  } catch (err) {
    return { success: false, error: err.message || "Failed to create template" };
  }
}

export async function getUserTemplates(userId) {
  try {
    if (!userId) return { success: false, templates: [] };
    const { data, error } = await Supabase.from("chatbot_templates")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return { success: true, templates: data || [] };
  } catch (err) {
    return { success: false, error: err.message || "Failed to fetch templates", templates: [] };
  }
}

export async function deleteTemplate(id) {
  try {
    const { error } = await Supabase.from("chatbot_templates").delete().eq("id", id);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || "Failed to delete template" };
  }
}

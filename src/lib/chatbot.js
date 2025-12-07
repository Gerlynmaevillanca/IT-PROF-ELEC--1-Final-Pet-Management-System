import Supabase from "./supabase";

/**
 * Save a chatbot prompt/response pair to DB
 * Returns { success, record } or { success:false, error }
 */
export async function createChatbotPrompt(userId, prompt, response, metadata = {}) {
  try {
    if (!userId) {
      return { success: false, error: "user_id is required" };
    }

    const { data, error } = await Supabase.from("chatbot_prompts")
      .insert({
        user_id: userId,
        prompt,
        response,
        metadata,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, record: data };
  } catch (err) {
    return { success: false, error: err.message || "Failed to create chatbot prompt" };
  }
}

/**
 * CREATE CHATBOT CONVERSATION
 * Stores an array of messages [{sender, text, id, created_at}] as a single conversation row
 */
export async function createChatbotConversation(userId, messages = [], metadata = {}) {
  try {
    if (!userId) return { success: false, error: "user_id is required" };
    if (!Array.isArray(messages) || messages.length === 0) return { success: false, error: "messages array is required" };

    const { data, error } = await Supabase.from("chatbot_conversations")
      .insert({
        user_id: userId,
        messages,
        metadata,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, conversation: data };
  } catch (err) {
    return { success: false, error: err.message || "Failed to create conversation" };
  }
}

export async function getUserConversations(userId, limit = 50) {
  try {
    if (!userId) return { success: false, conversations: [] };
    const { data, error } = await Supabase.from("chatbot_conversations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return { success: true, conversations: data || [] };
  } catch (err) {
    return { success: false, error: err.message || "Failed to fetch conversations", conversations: [] };
  }
}

import Supabase from "./supabase";

/**
 * CREATE OR GET CONVERSATION
 */
export async function createOrGetConversation(userOneId, userTwoId) {
  try {
    // Check if conversation already exists
    const { data: existing, error: existingError } = await Supabase.from("conversations")
      .select("*")
      .or(
        `and(user_one_id.eq.${userOneId},user_two_id.eq.${userTwoId}),and(user_one_id.eq.${userTwoId},user_two_id.eq.${userOneId})`
      );

    if (existingError) throw existingError;

    if (existing && existing.length > 0) {
      return {
        success: true,
        conversation: existing[0],
        isNew: false,
      };
    }

    // Create new conversation
    const { data: newConversation, error: createError } = await Supabase.from("conversations")
      .insert({
        user_one_id: userOneId,
        user_two_id: userTwoId,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) throw createError;

    return {
      success: true,
      conversation: newConversation,
      isNew: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to create/get conversation",
    };
  }
}

/**
 * GET USER CONVERSATIONS
 */
export async function getUserConversations(userId) {
  try {
    const { data, error } = await Supabase.from("conversations")
      .select(
        `
        *,
        user_one:user_one_id(id, fullname, email),
        user_two:user_two_id(id, fullname, email)
      `
      )
      .or(`user_one_id.eq.${userId},user_two_id.eq.${userId}`)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    return {
      success: true,
      conversations: data || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to fetch conversations",
      conversations: [],
    };
  }
}

/**
 * GET CONVERSATION MESSAGES
 */
export async function getConversationMessages(conversationId) {
  try {
    const { data, error } = await Supabase.from("messages")
      .select(
        `
        *,
        sender:sender_id(id, fullname),
        receiver:receiver_id(id, fullname)
      `
      )
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return {
      success: true,
      messages: data || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to fetch messages",
      messages: [],
    };
  }
}

/**
 * SEND MESSAGE
 */
export async function sendMessage(conversationId, senderId, receiverId, message) {
  try {
    if (!message || !message.trim()) {
      throw new Error("Message cannot be empty");
    }

    const { data, error } = await Supabase.from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        receiver_id: receiverId,
        message: message.trim(),
        read: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      message: "Message sent successfully",
      messageData: data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to send message",
    };
  }
}

/**
 * MARK MESSAGE AS READ
 */
export async function markMessageAsRead(messageId) {
  try {
    const { error } = await Supabase.from("messages")
      .update({ read: true })
      .eq("id", messageId);

    if (error) throw error;

    return {
      success: true,
      message: "Message marked as read",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to mark message as read",
    };
  }
}

/**
 * MARK ALL MESSAGES IN CONVERSATION AS READ
 */
export async function markConversationAsRead(conversationId, userId) {
  try {
    const { error } = await Supabase.from("messages")
      .update({ read: true })
      .eq("conversation_id", conversationId)
      .eq("receiver_id", userId)
      .eq("read", false);

    if (error) throw error;

    return {
      success: true,
      message: "All messages marked as read",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to mark messages as read",
    };
  }
}

/**
 * GET UNREAD MESSAGE COUNT
 */
export async function getUnreadCount(userId) {
  try {
    const { count, error } = await Supabase.from("messages")
      .select("*", { count: "exact", head: true })
      .eq("receiver_id", userId)
      .eq("read", false);

    if (error) throw error;

    return {
      success: true,
      unreadCount: count || 0,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to get unread count",
      unreadCount: 0,
    };
  }
}

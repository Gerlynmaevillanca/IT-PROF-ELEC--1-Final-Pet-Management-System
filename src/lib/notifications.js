import Supabase from "./supabase";

/**
 * GET USER NOTIFICATIONS
 */
export async function getUserNotifications(userId, limit = 50) {
  try {
    const { data, error } = await Supabase.from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return {
      success: true,
      notifications: data || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to fetch notifications",
      notifications: [],
    };
  }
}

/**
 * GET UNREAD NOTIFICATIONS
 */
export async function getUnreadNotifications(userId) {
  try {
    console.log("[GetUnreadNotifications] Fetching for user:", userId);
    const { data, error } = await Supabase.from("notifications")
      .select("*")
      .eq("user_id", userId)
      .eq("read", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[GetUnreadNotifications] Error:", error);
      throw error;
    }

    console.log("[GetUnreadNotifications] Success, found", data?.length || 0, "notifications");

    return {
      success: true,
      notifications: data || [],
    };
  } catch (error) {
    console.error("[GetUnreadNotifications] Catch block error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch notifications",
      notifications: [],
    };
  }
}

/**
 * MARK NOTIFICATION AS READ
 */
export async function markNotificationAsRead(notificationId) {
  try {
    const { error } = await Supabase.from("notifications")
      .update({ read: true })
      .eq("id", notificationId);

    if (error) throw error;

    return {
      success: true,
      message: "Notification marked as read",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to mark notification as read",
    };
  }
}

/**
 * MARK ALL NOTIFICATIONS AS READ
 */
export async function markAllNotificationsAsRead(userId) {
  try {
    const { error } = await Supabase.from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) throw error;

    return {
      success: true,
      message: "All notifications marked as read",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to mark notifications as read",
    };
  }
}

/**
 * DELETE NOTIFICATION
 */
export async function deleteNotification(notificationId) {
  try {
    const { error } = await Supabase.from("notifications").delete().eq("id", notificationId);

    if (error) throw error;

    return {
      success: true,
      message: "Notification deleted",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to delete notification",
    };
  }
}

/**
 * DELETE ALL NOTIFICATIONS FOR USER
 */
export async function deleteAllNotifications(userId) {
  try {
    const { error } = await Supabase.from("notifications")
      .delete()
      .eq("user_id", userId);

    if (error) throw error;

    return {
      success: true,
      message: "All notifications deleted",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to delete notifications",
    };
  }
}

/**
 * CREATE NOTIFICATION
 * Validates that user_id is provided before inserting
 */
export async function createNotification(userId, type, title, message, relatedData = {}) {
  try {
    // Validate user_id
    if (!userId) {
      console.error("[CreateNotification] user_id is required but got:", userId);
      return {
        success: false,
        error: "user_id is required",
      };
    }

    console.log("[CreateNotification] Creating notification:", { userId, type, title });

    const { data, error } = await Supabase.from("notifications")
      .insert({
        user_id: userId,
        type,
        title,
        message,
        related_data: relatedData,
        read: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("[CreateNotification] Supabase error:", error);
      throw error;
    }

    console.log("[CreateNotification] Success:", data);

    return {
      success: true,
      notification: data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to create notification",
    };
  }
}

/**
 * GET UNREAD NOTIFICATION COUNT
 */
export async function getUnreadNotificationCount(userId) {
  try {
    const { count, error } = await Supabase.from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
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

/**
 * NOTIFY ALL ADMINS AND STAFF ABOUT NEW APPLICATION
 */
export async function notifyAdminsAboutApplication(petId, petName, adopterId, adopterName) {
  try {
    console.log("\n\n========== NOTIFY ADMINS FUNCTION ==========");
    console.log("[Notify] STEP 1 - Input params:", { petId, petName, adopterId, adopterName });

    // Get all admin and staff users
    console.log("[Notify] STEP 2 - Fetching admin/staff users from database...");
    const { data: adminUsers, error: queryError } = await Supabase.from("users")
      .select("id, fullname, email, role")
      .in("role", ["admin", "staff"]);

    if (queryError) {
      console.error("[Notify] STEP 2 FAILED - Query error:", queryError);
      throw queryError;
    }

    console.log("[Notify] STEP 2 SUCCESS - Found users:", adminUsers);
    console.log("[Notify] Total admin/staff users:", adminUsers?.length || 0);

    if (!adminUsers || adminUsers.length === 0) {
      console.log("[Notify] STEP 2 - No admin users found in database");
      return { success: true, message: "No admin users to notify", notifiedCount: 0 };
    }

    // Log each admin
    adminUsers.forEach((admin, idx) => {
      console.log(`[Notify] Admin ${idx + 1}:`, { id: admin.id, fullname: admin.fullname, email: admin.email, role: admin.role });
    });

    // Create notification for each admin/staff
    console.log("[Notify] STEP 3 - Creating notifications for each admin...");
    const notificationPromises = adminUsers.map((admin, idx) => {
      if (!admin.id) {
        console.error("[Notify] STEP 3 - Admin has no ID:", admin);
        return Promise.resolve({ success: false, error: "Admin user missing ID" });
      }

      console.log(`[Notify] STEP 3.${idx + 1} - Creating notification for admin:`, admin.id);
      return createNotification(
        admin.id,
        "application_submitted",
        "New Adoption Application",
        `${adopterName} submitted an application for ${petName}`,
        {
          petId,
          petName,
          adopterId,
          adopterName,
        }
      );
    });

    const results = await Promise.all(notificationPromises);
    const failedNotifications = results.filter((r) => !r.success);

    console.log("[Notify] STEP 4 - Results:");
    console.log("  - Total admins:", adminUsers.length);
    console.log("  - Successful notifications:", results.filter(r => r.success).length);
    console.log("  - Failed notifications:", failedNotifications.length);
    console.log("  - Details:", results);
    console.log("[Notify] ========== COMPLETE ==========\n");

    return {
      success: results.every((r) => r.success),
      notifiedCount: results.filter(r => r.success).length,
    };
  } catch (error) {
    console.error("[Notify] ========== FATAL ERROR ==========");
    console.error("[Notify] Error:", error);
    return {
      success: false,
      error: error.message || "Failed to notify admins",
    };
  }
}

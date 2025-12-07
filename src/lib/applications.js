import Supabase from "./supabase";
import { createNotification } from "./notifications";

/**
 * SUBMIT ADOPTION APPLICATION
 */
export async function submitApplication(applicationData, userId) {
  try {
    if (!applicationData.pet_id || !applicationData.living_situation) {
      throw new Error("Pet ID and living situation are required");
    }

    // Prepare data with proper type conversions
    const preparedData = {
      ...applicationData,
      pet_id: applicationData.pet_id, // Ensure UUID
      user_id: userId,
      status: "Pending",
      household_members: applicationData.household_members ? parseInt(applicationData.household_members) : null,
      // Handle boolean fields - convert string values to actual booleans or null
      landlord_allows_pets:
        applicationData.landlord_allows_pets === "yes"
          ? true
          : applicationData.landlord_allows_pets === "no"
          ? false
          : null,
      created_at: new Date().toISOString(),
    };

    console.log("Submitting application data:", preparedData);

    const { data, error } = await Supabase.from("adoption_applications")
      .insert(preparedData)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    return {
      success: true,
      message: "Application submitted successfully",
      application: data,
    };
  } catch (error) {
    console.error("Application submission error:", error);
    return {
      success: false,
      error: error.message || "Failed to submit application",
    };
  }
}

/**
 * GET APPLICATIONS BY USER
 */
export async function getApplicationsByUser(userId) {
  try {
    const { data, error } = await Supabase.from("adoption_applications")
      .select(
        `
        *,
        pets:pet_id(id, name, category, image_url, status)
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return {
      success: true,
      applications: data || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to fetch applications",
      applications: [],
    };
  }
}

/**
 * GET APPLICATIONS BY PET
 */
export async function getApplicationsByPet(petId) {
  try {
    const { data, error } = await Supabase.from("adoption_applications")
      .select(
        `
        *,
        users:user_id(id, fullname, email, phone_number)
      `
      )
      .eq("pet_id", petId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return {
      success: true,
      applications: data || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to fetch applications",
      applications: [],
    };
  }
}

/**
 * GET SINGLE APPLICATION
 */
export async function getApplicationById(applicationId) {
  try {
    const { data, error } = await Supabase.from("adoption_applications")
      .select(
        `
        *,
        pets:pet_id(*),
        users:user_id(*)
      `
      )
      .eq("id", applicationId)
      .single();

    if (error) throw error;

    return {
      success: true,
      application: data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to fetch application",
    };
  }
}

/**
 * GET PENDING APPLICATIONS (Staff/Admin only)
 */
export async function getPendingApplications() {
  try {
    const { data, error } = await Supabase.from("adoption_applications")
      .select(
        `
        *,
        pets:pet_id(id, name, category, image_url),
        users:user_id(id, fullname, email, phone_number)
      `
      )
      .eq("status", "Pending")
      .order("created_at", { ascending: true });

    if (error) throw error;

    return {
      success: true,
      applications: data || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to fetch pending applications",
      applications: [],
    };
  }
}

/**
 * GET ALL APPLICATIONS (Staff/Admin only)
 * Returns all applications regardless of status
 */
export async function getAllApplications() {
  try {
    const { data, error } = await Supabase.from("adoption_applications")
      .select(
        `
        *,
        pets:pet_id(id, name, category, image_url),
        users:user_id(id, fullname, email, phone_number)
      `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    return {
      success: true,
      applications: data || [],
    };
  } catch (error) {
    console.error("Error fetching applications:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch applications",
      applications: [],
    };
  }
}

/**
 * APPROVE APPLICATION (Staff/Admin only)
 */
export async function approveApplication(applicationId, petId, reviewedByUserId) {
  try {
    // Update application status to Approved
    const { error: appError } = await Supabase.from("adoption_applications")
      .update({
        status: "Approved",
        reviewed_by: reviewedByUserId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    if (appError) throw appError;

    // Update pet status to Adopted
    const { error: petError } = await Supabase.from("pets")
      .update({ status: "Adopted" })
      .eq("id", petId);

    if (petError) throw petError;

    // Notify the applicant that their application was approved
    try {
      const appRes = await getApplicationById(applicationId);
      if (appRes.success && appRes.application) {
        const applicantId = appRes.application.user_id;
        const petName = appRes.application.pets?.name || "your selected pet";
        await createNotification(
          applicantId,
          "application_approved",
          "Application Approved",
          `Your application for ${petName} has been approved!`,
          { applicationId, petId }
        );
      }
    } catch (notifyErr) {
      console.warn("Failed to notify applicant about approval:", notifyErr);
    }

    return {
      success: true,
      message: "Application approved successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to approve application",
    };
  }
}

/**
 * DECLINE APPLICATION (Staff/Admin only)
 */
export async function declineApplication(applicationId, reason = "", reviewedByUserId) {
  try {
    console.log("\n\n========== DECLINE APPLICATION FUNCTION ==========");
    console.log("[DeclineApplication] STEP 1 - Input parameters:");
    console.log("  - applicationId:", applicationId, typeof applicationId);
    console.log("  - reason:", reason, typeof reason);
    console.log("  - reviewedByUserId:", reviewedByUserId, typeof reviewedByUserId);

    if (!applicationId) {
      console.error("[DeclineApplication] VALIDATION FAILED: applicationId is missing!");
      throw new Error("applicationId is required");
    }

    console.log("[DeclineApplication] STEP 2 - Validation passed, updating database...");
    
    const updateData = {
      status: "Declined",
      decline_reason: reason,
      reviewed_by: reviewedByUserId,
      reviewed_at: new Date().toISOString(),
    };
    
    console.log("[DeclineApplication] STEP 2a - Update payload:", updateData);

    const { error: updateError } = await Supabase.from("adoption_applications")
      .update(updateData)
      .eq("id", applicationId);

    if (updateError) {
      console.error("[DeclineApplication] STEP 2 FAILED - Database error:", updateError);
      throw updateError;
    }

    console.log("[DeclineApplication] STEP 3 - Application updated successfully in database");

    // Notify the applicant that their application was declined
    console.log("[DeclineApplication] STEP 4 - Fetching application details for notification...");
    try {
      const appRes = await getApplicationById(applicationId);
      console.log("[DeclineApplication] STEP 4a - Application fetch result:", appRes);
      
      if (appRes.success && appRes.application) {
        const applicantId = appRes.application.user_id;
        const petName = appRes.application.pets?.name || "the pet";
        
        console.log("[DeclineApplication] STEP 5 - Creating notification...");
        console.log("  - Recipient (applicantId):", applicantId);
        console.log("  - Pet name:", petName);
        console.log("  - Reason:", reason);
        
        const notifyRes = await createNotification(
          applicantId,
          "application_declined",
          "Application Declined",
          `Your application for ${petName} was declined. Reason: ${reason}`,
          { applicationId, reason }
        );
        console.log("[DeclineApplication] STEP 5a - Notification creation result:", notifyRes);
      } else {
        console.warn("[DeclineApplication] STEP 4b - Could not fetch application for notification");
      }
    } catch (notifyErr) {
      console.error("[DeclineApplication] STEP 5 - NOTIFICATION FAILED (non-fatal):", notifyErr);
      // Don't throw - notification failure shouldn't fail the decline
    }

    console.log("[DeclineApplication] ========== SUCCESS ==========\n");
    return {
      success: true,
      message: "Application declined successfully",
    };
  } catch (error) {
    console.error("[DeclineApplication] ========== FATAL ERROR ==========");
    console.error("[DeclineApplication] Error details:", error);
    console.log("[DeclineApplication] Stack:", error.stack);
    return {
      success: false,
      error: error.message || "Failed to decline application",
    };
  }
}

/**
 * UPDATE APPLICATION (User can only update pending applications)
 */
export async function updateApplication(applicationId, updateData) {
  try {
    const { data, error } = await Supabase.from("adoption_applications")
      .update(updateData)
      .eq("id", applicationId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      message: "Application updated successfully",
      application: data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to update application",
    };
  }
}

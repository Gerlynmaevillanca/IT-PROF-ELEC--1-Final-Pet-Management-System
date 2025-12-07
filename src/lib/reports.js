import Supabase from "./supabase";

/**
 * GET OVERALL STATISTICS
 */
export async function getOverallStatistics() {
  try {
    // Get total pets count
    const { count: totalPets, error: petsError } = await Supabase.from("pets")
      .select("*", { count: "exact", head: true });

    if (petsError) throw petsError;

    // Get available pets count
    const { count: availablePets, error: availError } = await Supabase.from("pets")
      .select("*", { count: "exact", head: true })
      .eq("status", "Available");

    if (availError) throw availError;

    // Get adopted pets count
    const { count: adoptedPets, error: adoptError } = await Supabase.from("pets")
      .select("*", { count: "exact", head: true })
      .eq("status", "Adopted");

    if (adoptError) throw adoptError;

    // Get pending applications count
    const { count: pendingApps, error: appError } = await Supabase.from("adoption_applications")
      .select("*", { count: "exact", head: true })
      .eq("status", "Pending");

    if (appError) throw appError;

    // Get total applications
    const { count: totalApps, error: totalAppError } = await Supabase.from("adoption_applications")
      .select("*", { count: "exact", head: true });

    if (totalAppError) throw totalAppError;

    // Get approved applications
    const { count: approvedApps, error: approvedError } = await Supabase.from("adoption_applications")
      .select("*", { count: "exact", head: true })
      .eq("status", "Approved");

    if (approvedError) throw approvedError;

    // Get total users
    const { count: totalUsers, error: usersError } = await Supabase.from("users")
      .select("*", { count: "exact", head: true });

    if (usersError) throw usersError;

    return {
      success: true,
      total_pets: totalPets || 0,
      available_pets: availablePets || 0,
      adopted_pets: adoptedPets || 0,
      pending_applications: pendingApps || 0,
      total_applications: totalApps || 0,
      approved_applications: approvedApps || 0,
      total_users: totalUsers || 0,
    };
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch statistics",
      total_pets: 0,
      available_pets: 0,
      adopted_pets: 0,
      pending_applications: 0,
      total_applications: 0,
      approved_applications: 0,
      total_users: 0,
    };
  }
}

/**
 * GET ADOPTION STATISTICS
 */
export async function getAdoptionStatistics() {
  try {
    const { data, error } = await Supabase.from("adoption_applications")
      .select("id, status, created_at")
      .eq("status", "Approved");

    if (error) throw error;

    const adoptedCount = data ? data.length : 0;
    const monthlyAdoptions = groupByMonth(data || []);

    return {
      success: true,
      adoptionStats: {
        totalAdoptions: adoptedCount,
        monthlyAdoptions,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to fetch adoption statistics",
    };
  }
}

/**
 * GET PET CATEGORY DEMAND
 */
export async function getPetCategoryDemand() {
  try {
    const { data, error } = await Supabase.from("adoption_applications")
      .select(
        `
        id,
        status,
        pets:pet_id(category)
      `
      )
      .eq("status", "Approved");

    if (error) throw error;

    const categoryDemand = {};
    if (data) {
      data.forEach((app) => {
        const category = app.pets?.category;
        if (category) {
          categoryDemand[category] = (categoryDemand[category] || 0) + 1;
        }
      });
    }

    return {
      success: true,
      categoryDemand,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to fetch category demand",
    };
  }
}

/**
 * GET PET INVENTORY BY CATEGORY
 */
export async function getPetInventoryByCategory() {
  try {
    const { data, error } = await Supabase.from("pets").select("category, status");

    if (error) throw error;

    const inventory = {};
    if (data) {
      data.forEach((pet) => {
        if (!inventory[pet.category]) {
          inventory[pet.category] = {
            total: 0,
            available: 0,
            reserved: 0,
            adopted: 0,
          };
        }
        inventory[pet.category].total += 1;
        if (pet.status === "Available") inventory[pet.category].available += 1;
        if (pet.status === "Reserved") inventory[pet.category].reserved += 1;
        if (pet.status === "Adopted") inventory[pet.category].adopted += 1;
      });
    }

    return {
      success: true,
      inventory,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to fetch inventory",
    };
  }
}

/**
 * GET APPLICATION STATISTICS BY MONTH
 */
export async function getApplicationStatisticsByMonth() {
  try {
    const { data, error } = await Supabase.from("adoption_applications").select(
      "id, status, created_at"
    );

    if (error) throw error;

    const monthlyStats = {};
    if (data) {
      data.forEach((app) => {
        const date = new Date(app.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

        if (!monthlyStats[monthKey]) {
          monthlyStats[monthKey] = {
            total: 0,
            approved: 0,
            pending: 0,
            declined: 0,
          };
        }
        monthlyStats[monthKey].total += 1;
        if (app.status === "Approved") monthlyStats[monthKey].approved += 1;
        if (app.status === "Pending") monthlyStats[monthKey].pending += 1;
        if (app.status === "Declined") monthlyStats[monthKey].declined += 1;
      });
    }

    return {
      success: true,
      monthlyStats,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to fetch monthly statistics",
    };
  }
}

/**
 * GET ADOPTION RATE (Percentage of adopted pets)
 */
export async function getAdoptionRate() {
  try {
    const { data: pets, error: petError } = await Supabase.from("pets").select("status");

    if (petError) throw petError;

    const totalPets = pets ? pets.length : 0;
    const adoptedPets = pets ? pets.filter((p) => p.status === "Adopted").length : 0;
    const adoptionRate = totalPets > 0 ? ((adoptedPets / totalPets) * 100).toFixed(2) : 0;

    return {
      success: true,
      adoptionRate: {
        totalPets,
        adoptedPets,
        percentage: parseFloat(adoptionRate),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to calculate adoption rate",
    };
  }
}

/**
 * GENERATE CUSTOM REPORT
 */
export async function generateCustomReport(filters = {}) {
  try {
    let query = Supabase.from("adoption_applications").select(
      `
      *,
      pets:pet_id(id, name, category, status),
      users:user_id(id, fullname, email)
    `
    );

    // Apply filters
    if (filters.status) {
      query = query.eq("status", filters.status);
    }
    if (filters.category) {
      query = query.eq("pets.category", filters.category);
    }
    if (filters.startDate) {
      query = query.gte("created_at", filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte("created_at", filters.endDate);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;

    return {
      success: true,
      report: data || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to generate report",
    };
  }
}

/**
 * HELPER FUNCTION: Group data by month
 */
function groupByMonth(data) {
  const grouped = {};
  data.forEach((item) => {
    const date = new Date(item.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    grouped[monthKey] = (grouped[monthKey] || 0) + 1;
  });
  return grouped;
}

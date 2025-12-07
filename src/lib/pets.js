import Supabase from "./supabase";

/**
 * GET ALL PETS
 */
export async function getAllPets() {
  try {
    const { data, error } = await Supabase.from("pets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return {
      success: true,
      pets: data || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to fetch pets",
      pets: [],
    };
  }
}

/**
 * GET PET BY ID
 */
export async function getPetById(petId) {
  try {
    const { data, error } = await Supabase.from("pets")
      .select("*")
      .eq("id", petId)
      .single();

    if (error) throw error;

    return {
      success: true,
      pet: data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to fetch pet",
    };
  }
}

/**
 * GET PETS BY CATEGORY
 */
export async function getPetsByCategory(category) {
  try {
    const { data, error } = await Supabase.from("pets")
      .select("*")
      .eq("category", category)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return {
      success: true,
      pets: data || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to fetch pets by category",
      pets: [],
    };
  }
}

/**
 * GET AVAILABLE PETS
 */
export async function getAvailablePets() {
  try {
    const { data, error } = await Supabase.from("pets")
      .select("*")
      .eq("status", "Available")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return {
      success: true,
      pets: data || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to fetch available pets",
      pets: [],
    };
  }
}

/**
 * ADD NEW PET (Staff/Admin only)
 */
export async function addPet(petData, createdByUserId) {
  try {
    if (!petData.name || !petData.category) {
      throw new Error("Pet name and category are required");
    }

    // Normalize and validate category to satisfy DB check constraints
    const rawCategory = petData.category;
    const normalizedCategory = typeof rawCategory === "string" ? rawCategory.trim().toLowerCase() : rawCategory;


    // Resolve the creator id: prefer provided value, otherwise attempt to use the current authenticated user
    let creatorId = createdByUserId;
    if (!creatorId) {
      try {
        const { data } = await Supabase.auth.getUser();
        creatorId = data?.user?.id || null;
      } catch (err) {
        creatorId = null;
      }
    }

    if (!creatorId) {
      throw new Error("`created_by` is required and no authenticated user was found. Sign in as staff/admin to add pets.");
    }

    // Normalize and map gender to likely DB values (avoid check-constraint failures)
    const rawGender = petData.gender;
    let normalizedGender = null;
    if (rawGender !== undefined && rawGender !== null) {
      const g = String(rawGender).trim().toLowerCase();
      if (g === "m" || g === "male") normalizedGender = "male";
      else if (g === "f" || g === "female") normalizedGender = "female";
      else if (g === "unknown" || g === "unspecified" || g === "n/a") normalizedGender = "unknown";
      else normalizedGender = g; // pass through lowercased value
    }

    // Normalize size to lowercase (avoid check-constraint failures)
    const rawSize = petData.size;
    const normalizedSize = typeof rawSize === "string" ? rawSize.trim().toLowerCase() : rawSize;

    // Only send columns that should exist in the pets table
    const payload = {
      name: petData.name,
      category: normalizedCategory,
      breed: petData.breed || null,
      age: petData.age || null,
      gender: normalizedGender,
      size: normalizedSize || null,
      color: petData.color || null,
      description: petData.description || null,
      health_status: petData.health_status || 'healthy',
      vaccination_status: petData.vaccination_status === 'true' || petData.vaccination_status === true,
      neutered_spayed: petData.neutered_spayed === 'true' || petData.neutered_spayed === true,
      image_url: petData.image_url || null,
      status: petData.status || "Available",
      created_by: creatorId,
    };

    console.log("Inserting pet with payload (normalized):", payload);

    const { data, error } = await Supabase.from("pets")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error details:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      try {
        console.error("Supabase insert error (full):", JSON.stringify(error, null, 2));
      } catch (e) {
        console.error("Failed to stringify Supabase error", e);
      }
      throw error;
    }

    console.log("Pet inserted successfully:", data);
    return {
      success: true,
      message: "Pet added successfully",
      pet: data,
    };
  } catch (error) {
    console.error("addPet error:", error);
    return {
      success: false,
      error: error.message || "Failed to add pet. Check console for details.",
    };
  }
}

/**
 * UPDATE PET (Staff/Admin only)
 */
export async function updatePet(petId, petData) {
  try {
    if (!petId) {
      throw new Error("Pet ID is required");
    }

    // Normalize category
    const rawCategory = petData.category;
    const normalizedCategory = typeof rawCategory === "string" ? rawCategory.trim().toLowerCase() : rawCategory;

    // Normalize gender
    const rawGender = petData.gender;
    let normalizedGender = null;
    if (rawGender !== undefined && rawGender !== null) {
      const g = String(rawGender).trim().toLowerCase();
      if (g === "m" || g === "male") normalizedGender = "male";
      else if (g === "f" || g === "female") normalizedGender = "female";
      else if (g === "unknown" || g === "unspecified" || g === "n/a") normalizedGender = "unknown";
      else normalizedGender = g;
    }

    // Normalize size to lowercase
    const rawSize = petData.size;
    const normalizedSize = typeof rawSize === "string" ? rawSize.trim().toLowerCase() : rawSize;

    // Build payload with only updateable fields
    const payload = {
      ...(petData.name && { name: petData.name }),
      ...(normalizedCategory && { category: normalizedCategory }),
      ...(petData.breed !== undefined && { breed: petData.breed || null }),
      ...(petData.age !== undefined && { age: petData.age || null }),
      ...(normalizedGender !== undefined && { gender: normalizedGender }),
      ...(normalizedSize !== undefined && { size: normalizedSize || null }),
      ...(petData.color !== undefined && { color: petData.color || null }),
      ...(petData.description !== undefined && { description: petData.description || null }),
      ...(petData.health_status !== undefined && { health_status: petData.health_status || 'healthy' }),
      ...(petData.vaccination_status !== undefined && { vaccination_status: petData.vaccination_status === 'true' || petData.vaccination_status === true }),
      ...(petData.neutered_spayed !== undefined && { neutered_spayed: petData.neutered_spayed === 'true' || petData.neutered_spayed === true }),
      ...(petData.image_url !== undefined && { image_url: petData.image_url || null }),
      ...(petData.status !== undefined && { status: petData.status || "Available" }),
    };

    console.log("Updating pet", petId, "with payload:", payload);

    const { data, error } = await Supabase.from("pets")
      .update(payload)
      .eq("id", petId)
      .select()
      .single();

    if (error) {
      console.error("Supabase update error:", { code: error.code, message: error.message, details: error.details });
      throw error;
    }

    console.log("Pet updated successfully:", data);
    return {
      success: true,
      message: "Pet updated successfully",
      pet: data,
    };
  } catch (error) {
    console.error("updatePet error:", error);
    return {
      success: false,
      error: error.message || "Failed to update pet",
    };
  }
}

/**
 * UPDATE PET STATUS
 */
export async function updatePetStatus(petId, status) {
  try {
    if (!["Available", "Reserved", "Adopted"].includes(status)) {
      throw new Error("Invalid status");
    }

    const { data, error } = await Supabase.from("pets")
      .update({ status })
      .eq("id", petId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      message: `Pet status updated to ${status}`,
      pet: data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to update pet status",
    };
  }
}

/**
 * DELETE PET (Staff/Admin only)
 */
export async function deletePet(petId) {
  try {
    if (!petId) {
      throw new Error("Pet ID is required");
    }

    // First, delete any associated images
    const { data: petData } = await Supabase.from("pets").select("image_url").eq("id", petId).single();
    if (petData?.image_url) {
      try {
        const pathMatch = petData.image_url.match(/pet-images\/(.+)/);
        if (pathMatch) {
          await deletePetImage(pathMatch[1]);
        }
      } catch (err) {
        console.warn("Failed to delete pet image:", err);
      }
    }

    // Then delete the pet record
    const { error } = await Supabase.from("pets").delete().eq("id", petId);

    if (error) throw error;

    return {
      success: true,
      message: "Pet deleted successfully",
    };
  } catch (error) {
    console.error("deletePet error:", error);
    return {
      success: false,
      error: error.message || "Failed to delete pet",
    };
  }
}

/**
 * UPLOAD PET IMAGE
 */
export async function uploadPetImage(file, petId) {
  try {
    if (!file) {
      throw new Error("File is required");
    }
    const bucket = "pet-images";
    const fileExtension = (file.name || "").split(".").pop();
    const filePath = `pets/${petId || "unknown"}/${Date.now()}.${fileExtension}`;

    // Upload file and capture full response for debugging
    const uploadResult = await Supabase.storage.from(bucket).upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "application/octet-stream",
    });

    // Log full response for easier debugging of 400/403 issues
    console.log("Supabase storage upload result:", uploadResult);

    if (uploadResult.error) {
      // Throw a richer Error so callers/logs show details
      const e = uploadResult.error;
      const errMsg = `Storage upload error: ${e.message || JSON.stringify(e)} (status: ${e.status || "unknown"})`;
      throw new Error(errMsg);
    }

    // Get public URL (pet-images bucket is public)
    const publicUrlResult = Supabase.storage.from(bucket).getPublicUrl(filePath);
    console.log("Supabase getPublicUrl result:", publicUrlResult);
    const publicUrl = publicUrlResult.data?.publicUrl || null;

    if (!publicUrl) {
      throw new Error("Failed to generate public URL for image");
    }

    return {
      success: true,
      message: "Image uploaded successfully",
      imageUrl: publicUrl,
      filePath: filePath,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to upload image",
    };
  }
}

/**
 * DELETE PET IMAGE
 */
export async function deletePetImage(filePath) {
  try {
    const { error } = await Supabase.storage.from("pet-images").remove([filePath]);

    if (error) throw error;

    return {
      success: true,
      message: "Image deleted successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to delete image",
    };
  }
}

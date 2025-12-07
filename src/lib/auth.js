import Supabase from "./supabase";

/**
 * SIGNUP - Creates user in auth.users and public.users
 * - email and password go to auth.users
 * - fullname and role go to public.users
 * - fullname is stored in both places for consistency
 */
export async function signUp(email, password, confirmPassword, fullname, role = "adopter") {
  try {
    // Validate inputs
    if (!email || !password || !confirmPassword || !fullname) {
      throw new Error("All fields are required");
    }

    if (password !== confirmPassword) {
      throw new Error("Passwords do not match");
    }

    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters long");
    }

    // Step 1: Create user in auth.users with fullname in metadata
    const { data: authData, error: authError } = await Supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          fullname: fullname, // Stored in user_metadata for reference
        },
      },
    });

    if (authError) throw authError;

    if (!authData.user) {
      throw new Error("User creation failed");
    }

    // Step 2: Create user profile in public.users
    // This is the primary source of truth for fullname and role
    const { data: userData, error: userError } = await Supabase.from("users")
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        fullname: fullname, // Primary record
        role: role, // 'adopter', 'staff', 'admin'
      })
      .select()
      .single();

    if (userError) throw userError;

    return {
      success: true,
      message: "Signup successful! Please check your email for confirmation.",
      user: authData.user,
      profile: userData,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Signup failed",
    };
  }
}

/**
 * LOGIN - Authenticates user and returns auth user + profile
 */
export async function signIn(email, password) {
  try {
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    // Sign in with email and password
    const { data, error } = await Supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (!data.user) {
      throw new Error("Login failed");
    }

    // Get user profile
    const { data: profile, error: profileError } = await Supabase.from("users")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (profileError) throw profileError;

    return {
      success: true,
      message: "Login successful!",
      user: data.user,
      profile: profile,
      session: data.session,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Login failed",
    };
  }
}

/**
 * LOGOUT - Signs out the user
 */
export async function signOut() {
  try {
    const { error } = await Supabase.auth.signOut();
    if (error) throw error;

    return {
      success: true,
      message: "Logged out successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Logout failed",
    };
  }
}

/**
 * GET CURRENT USER - Returns both auth user and profile
 */
export async function getCurrentUser() {
  try {
    const {
      data: { user: authUser },
      error: authError,
    } = await Supabase.auth.getUser();

    if (authError) throw authError;

    if (!authUser) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    // Get user profile
    const { data: profile, error: profileError } = await Supabase.from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();

    if (profileError) throw profileError;

    return {
      success: true,
      user: authUser,
      profile: profile,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to get current user",
    };
  }
}

/**
 * UPDATE USER PROFILE
 */
export async function updateUserProfile(userId, updateData) {
  try {
    const { data, error } = await Supabase.from("users")
      .update(updateData)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      profile: data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to update profile",
    };
  }
}

/**
 * UPDATE AUTH USER DISPLAY NAME AND SYNC TO PUBLIC
 * Updates both auth metadata and public.users fullname
 */
export async function updateUserDisplayName(userId, fullname) {
  try {
    // Step 1: Update auth.users metadata
    const { data: authData, error: authError } = await Supabase.auth.updateUser({
      data: { fullname: fullname },
    });

    if (authError) throw authError;

    // Step 2: Update public.users fullname to match
    const { data: userData, error: userError } = await Supabase.from("users")
      .update({ fullname: fullname })
      .eq("id", userId)
      .select()
      .single();

    if (userError) throw userError;

    return {
      success: true,
      user: authData.user,
      profile: userData,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to update display name",
    };
  }
}

/**
 * GET USER PROFILE BY ID
 */
export async function getUserProfile(userId) {
  try {
    const { data, error } = await Supabase.from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;

    return {
      success: true,
      profile: data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to get user profile",
    };
  }
}

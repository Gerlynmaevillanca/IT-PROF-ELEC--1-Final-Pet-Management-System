import Supabase from "./supabase";

/**
 * UPLOAD ANIMAL SOUND
 */
export async function uploadAnimalSound(file, petId) {
  try {
    if (!file) {
      throw new Error("File is required");
    }

    // Validate file is audio
    if (!file.type.startsWith("audio/")) {
      throw new Error("File must be an audio file");
    }

    const fileExtension = file.name.split(".").pop();
    const filePath = `sounds/${petId}/${Date.now()}.${fileExtension}`;

    // Upload file
    const { error } = await Supabase.storage
      .from("animal-sounds")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    // Get public URL
    const {
      data: { publicUrl },
    } = Supabase.storage.from("animal-sounds").getPublicUrl(filePath);

    return {
      success: true,
      message: "Sound uploaded successfully",
      soundUrl: publicUrl,
      filePath: filePath,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to upload sound",
    };
  }
}

/**
 * SAVE SOUND ANALYSIS RESULT
 */
export async function saveSoundAnalysis(petId, soundUrl, analysisResult) {
  try {
    if (!petId || !soundUrl || !analysisResult) {
      throw new Error("Pet ID, sound URL, and analysis result are required");
    }

    const { data, error } = await Supabase.from("sound_analysis")
      .insert({
        pet_id: petId,
        sound_url: soundUrl,
        analysis: analysisResult, // JSONB field
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      message: "Sound analysis saved successfully",
      analysis: data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to save sound analysis",
    };
  }
}

/**
 * GET SOUND ANALYSES FOR PET
 */
export async function getPetSoundAnalyses(petId) {
  try {
    const { data, error } = await Supabase.from("sound_analysis")
      .select("*")
      .eq("pet_id", petId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return {
      success: true,
      analyses: data || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to fetch sound analyses",
      analyses: [],
    };
  }
}

/**
 * GET SINGLE SOUND ANALYSIS
 */
export async function getSoundAnalysisById(analysisId) {
  try {
    const { data, error } = await Supabase.from("sound_analysis")
      .select("*")
      .eq("id", analysisId)
      .single();

    if (error) throw error;

    return {
      success: true,
      analysis: data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to fetch sound analysis",
    };
  }
}

/**
 * DELETE SOUND FILE
 */
export async function deleteSoundFile(filePath) {
  try {
    const { error } = await Supabase.storage
      .from("animal-sounds")
      .remove([filePath]);

    if (error) throw error;

    return {
      success: true,
      message: "Sound file deleted successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to delete sound file",
    };
  }
}

/**
 * DELETE SOUND ANALYSIS
 */
export async function deleteSoundAnalysis(analysisId) {
  try {
    // Get the analysis to find the file path
    const { data: analysis, error: fetchError } = await Supabase.from("sound_analysis")
      .select("*")
      .eq("id", analysisId)
      .single();

    if (fetchError) throw fetchError;

    // Delete from database
    const { error: deleteError } = await Supabase.from("sound_analysis")
      .delete()
      .eq("id", analysisId);

    if (deleteError) throw deleteError;

    // Delete file from storage if available
    if (analysis && analysis.sound_url) {
      // Extract file path from URL
      const urlParts = analysis.sound_url.split("/");
      const fileName = urlParts.pop();
      const petId = analysis.pet_id;
      const filePath = `sounds/${petId}/${fileName}`;

      await Supabase.storage.from("animal-sounds").remove([filePath]);
    }

    return {
      success: true,
      message: "Sound analysis deleted successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to delete sound analysis",
    };
  }
}

/**
 * FORMAT GEMINI ANALYSIS RESULT
 * Helper function to structure Gemini API response
 */
export function formatGeminiAnalysis(geminiResponse) {
  return {
    transcription: geminiResponse.transcription || null,
    emotionalIndicators: geminiResponse.emotionalIndicators || [],
    behaviorAssessment: geminiResponse.behaviorAssessment || null,
    healthConcerns: geminiResponse.healthConcerns || [],
    recommendations: geminiResponse.recommendations || [],
    confidence: geminiResponse.confidence || 0,
    analyzedAt: new Date().toISOString(),
  };
}

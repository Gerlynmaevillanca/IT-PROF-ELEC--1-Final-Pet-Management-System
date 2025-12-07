import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({apiKey:"AIzaSyAAMnx2my4nfStkAOoQQQPG0c1tqT5DLnU"});

export async function askAi(prompt) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      systemInstruction: `Your name is Alexa and only introduce yourself once. You are PetPeeve AI, a helpful assistant for a pet adoption website. Provide friendly and informative responses to user inquiries about pet adoption, care tips, and website navigation, make the conversation engaging, supportive and short.
      Layout your answers in a way that is easy to read and understand.
      If you don't know the answer, respond with "I'm not sure about that, but you can contact our support team for more information."
      Can give the list of available pets in my supabase.
      `,
    },
  });
  return(response.text);
}


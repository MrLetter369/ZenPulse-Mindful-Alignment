
import { GoogleGenAI, Type } from "@google/genai";
import { MindfulObject } from "../types";

// We create the instance inside the functions to ensure we use the latest process.env.API_KEY
// in case the user updates it via the select key dialog.

const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getZenFeedback = async (accuracy: number, level: number): Promise<string> => {
  try {
    const ai = getAiClient();
    const prompt = `The user just finished a mindfulness level in a game called ZenPulse. 
    Their accuracy was ${Math.round(accuracy * 100)}%. They are at level ${level}. 
    Provide a very short, poetic, and encouraging zen feedback message (max 10 words).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.8,
        topP: 0.9,
      }
    });

    return response.text || "Breathe and continue.";
  } catch (error: any) {
    if (error?.message?.includes('429')) throw new Error('QUOTA_EXCEEDED');
    return accuracy > 0.8 ? "Perfectly centered." : "Return to the breath.";
  }
};

export const generateMindfulObject = async (seenEmojis: string[]): Promise<MindfulObject | null> => {
  try {
    const ai = getAiClient();
    const prompt = `Generate a new, unique mindful object for a meditation app.
    The object must be either a fruit or a simple geometric shape.
    It must NOT use any of these emojis: ${seenEmojis.join(', ')}.
    
    Return the response in JSON format with:
    - name: A poetic name for the object
    - emoji: A single emoji character (fruit or shape)
    - color: A vibrant hex color code that matches the object
    - mantra: A short, 1-sentence calming mantra`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            emoji: { type: Type.STRING },
            color: { type: Type.STRING },
            mantra: { type: Type.STRING },
          },
          required: ["name", "emoji", "color", "mantra"],
        },
      },
    });

    if (!response.text) throw new Error("Empty response");
    
    const data = JSON.parse(response.text);
    return {
      id: Math.random().toString(36).substr(2, 9),
      ...data
    };
  } catch (error: any) {
    if (error?.message?.includes('429')) {
      console.warn("Quota exceeded. Switch to personal key recommended.");
      throw new Error('QUOTA_EXCEEDED');
    }
    return null;
  }
};

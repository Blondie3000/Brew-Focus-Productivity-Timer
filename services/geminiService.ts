import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const getBaristaMessage = async (isBreak: boolean): Promise<string> => {
  if (!apiKey) return "Don't forget to set your API Key for the Barista Bot!";

  const prompt = isBreak 
    ? "Give me a very short, cozy, whimsical, 1-sentence suggestion for a 5-minute coffee break activity. Be cute and friendly."
    : "Give me a very short, motivating, coffee-themed 1-sentence quote to help me focus on work. Use puns if possible.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text?.trim() || "Enjoy your coffee!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Time to recharge your beans!";
  }
};

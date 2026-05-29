
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getSmartInsights = async (userStats: any) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the following MLM user stats and provide 3 actionable growth tips. Stats: ${JSON.stringify(userStats)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tips: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || '{"tips": []}');
  } catch (error) {
    console.error("Gemini Error:", error);
    return { tips: ["Focus on direct referrals", "Host a webinar", "Run a bonus campaign"] };
  }
};

export const getPlanRecommendation = async (usage: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Recommend a mobile recharge plan type (e.g., Heavy Data, Long Validity) for a user who says: "${usage}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendation: { type: Type.STRING },
            reason: { type: Type.STRING }
          }
        }
      }
    });
    return JSON.parse(response.text || '{"recommendation": "Standard Plan", "reason": "Reliable data and calls"}');
  } catch (error) {
    return { recommendation: "Standard Unlimited", reason: "Good balance of value and utility" };
  }
};

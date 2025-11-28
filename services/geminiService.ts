import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `You are an expert Forex and Binary Options technical analyst. 
Your task is to provide a concise, professional analysis of a currency pair based on provided technical data.
Focus on finding hidden entry points, divergences, and pattern completions (e.g., Engulfing, Hammer).
Keep the response under 50 words. Be direct. Use trader terminology.
Do not give financial advice.
`;

export const getGeminiAnalysis = async (
  pairName: string, 
  currentPrice: number, 
  rsi: number, 
  stochK: number,
  trend: string
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      Analyze pair: ${pairName}
      Current Price: ${currentPrice}
      RSI (14): ${rsi.toFixed(2)}
      Stochastic %K: ${stochK.toFixed(2)}
      Short-term Trend: ${trend}
      
      Identify the best entry point (CALL or PUT) and explain why based on the momentum and trend.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        maxOutputTokens: 100,
      }
    });

    return response.text || "Analysis inconclusive.";

  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI connectivity interruption. Rely on technical indicators.";
  }
};
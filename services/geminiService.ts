
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY || '';

export const generateGroundedAnswer = async (
  context: string,
  userQuestion: string,
  history: { role: string; content: string }[]
) => {
  if (!API_KEY) throw new Error("API Key not found");

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const systemInstruction = `
    You are an AI Classroom Doubt Solver. Your primary objective is to assist students by answering questions ONLY using the provided textbook content/notes.
    
    CRITICAL CONSTRAINTS:
    1. ZERO HALLUCINATION: If the answer is not contained within the provided context, explicitly state: "The provided materials do not contain information regarding this topic."
    
    2. STRUCTURED FORMATTING: 
       - USE MARKDOWN for all responses.
       - Use '###' for Main Headings.
       - Use '####' for Subheadings.
       - Use BOLD (**text**) for key terms and definitions.
       - USE BULLET POINTS for explanations. 
       - AVOID LONG PARAGRAPHS. Each distinct concept or point must be its own bullet point.
    
    3. EXAM FOCUS: Provide professional academic language suitable for engineering exams.
    
    4. CITATION: If multiple sections of the text are used, mention the context reference points if available.
    
    5. STRICT GROUNDING: Do not use your external knowledge base. Only use the context provided below.
    
    CONTEXT:
    ---
    ${context}
    ---
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] })),
        { role: 'user', parts: [{ text: userQuestion }] }
      ],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.1, 
        topP: 0.8,
        topK: 40,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

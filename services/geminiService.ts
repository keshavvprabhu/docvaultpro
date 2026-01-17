
import { GoogleGenAI, Type } from "@google/genai";
import { Classification } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeDocumentMetadata = async (fileName: string, description: string = '') => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following document information and suggest classification, a short summary, and tags.
      FileName: ${fileName}
      Context: ${description}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedClassification: {
              type: Type.STRING,
              enum: Object.values(Classification),
              description: "The most appropriate security classification."
            },
            summary: {
              type: Type.STRING,
              description: "A one-sentence summary of the document purpose."
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Keywords associated with the document."
            }
          },
          required: ["suggestedClassification", "summary", "tags"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
};

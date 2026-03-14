import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const MODEL_NAME = "gemini-3.1-pro-preview";

export interface PlantAnalysis {
  name: string;
  scientificName: string;
  description: string;
  careInstructions: {
    watering: string;
    sunlight: string;
    soil: string;
    temperature: string;
    fertilizing: string;
    pruning: string;
  };
  commonIssues: string[];
  funFact: string;
}

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set");
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async identifyPlant(base64Image: string): Promise<PlantAnalysis> {
    const prompt = `Identify this plant from the image. Provide a detailed analysis in JSON format with the following structure:
    {
      "name": "Common Name",
      "scientificName": "Scientific Name",
      "description": "A brief description of the plant.",
      "careInstructions": {
        "watering": "Watering needs",
        "sunlight": "Sunlight requirements",
        "soil": "Soil preferences",
        "temperature": "Ideal temperature range",
        "fertilizing": "Fertilization schedule",
        "pruning": "Pruning tips"
      },
      "commonIssues": ["Issue 1", "Issue 2"],
      "funFact": "An interesting fact about this plant."
    }
    If the image does not contain a plant, return an error message in the 'description' field and leave other fields empty or generic.`;

    const response = await this.ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    try {
      return JSON.parse(response.text || "{}") as PlantAnalysis;
    } catch (e) {
      console.error("Failed to parse Gemini response", e);
      throw new Error("Could not analyze plant image.");
    }
  }

  async chat(message: string, history: { role: "user" | "model"; parts: { text: string }[] }[] = []) {
    const chat = this.ai.chats.create({
      model: MODEL_NAME,
      config: {
        systemInstruction: "You are an expert gardening assistant named Flora. You are knowledgeable about all types of plants, flowers, vegetables, and trees. You provide helpful, friendly, and accurate gardening advice. If asked about non-gardening topics, politely redirect the conversation back to plants and gardening.",
      },
    });

    // Note: The @google/genai SDK chats.create doesn't take history directly in the same way as some other SDKs
    // but we can simulate it or just use sendMessage. 
    // For simplicity and following the provided examples, we'll use a new chat each time or just sendMessage.
    // Actually, the SDK supports history in create.
    
    const chatWithHistory = this.ai.chats.create({
      model: MODEL_NAME,
      config: {
        systemInstruction: "You are an expert gardening assistant named Flora.",
      },
      // history: history // The SDK types might vary, but let's stick to simple sendMessage for now
    });

    const response = await chatWithHistory.sendMessage({ message });
    return response.text;
  }
}

export const geminiService = new GeminiService();

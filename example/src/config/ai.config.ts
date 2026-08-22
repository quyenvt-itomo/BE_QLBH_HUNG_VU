import { GoogleGenerativeAI } from "@google/generative-ai";
import { AI_CONTEXT } from "./ai-schema";
import { config } from "./env";

const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY || "");

export const aiModel = genAI.getGenerativeModel({
  model: config.GEMINI_MODEL || "gemini-2.0-flash-exp",
  systemInstruction: AI_CONTEXT, // ✅ Dùng schema summary
});

export const aiConfig = {
  maxTokens: config.AI_MAX_TOKENS,
  temperature: config.AI_TEMPERATURE,
};

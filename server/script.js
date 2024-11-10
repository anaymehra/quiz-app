import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API);

export const generateResponse = async (prompt) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  prompt = prompt || `I am confused about this topic: [Topic Name or Code Snippet].

Generate 10 multiple-choice questions in JSON format with this structure:

[
  {
    "question": "Your question here",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correctOptionIndex": 0  // Use the index of the correct option
  },
  ...
]

Please respond only with the JSON data and nothing else.
`;
  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error generating content:", error);
    throw error;
  }
};



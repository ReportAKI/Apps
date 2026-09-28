import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export async function stream({ systemPrompt, userMessage }) {
    const response = await ai.models.generateContentStream({
        model: 'gemini-3.6-flash',
        contents: userMessage,
        config: {
            systemInstruction: systemPrompt,
            maxOutputTokens: 8192, // 👈 Αλλαγή σε 8192
        }
    });

    return response;
}
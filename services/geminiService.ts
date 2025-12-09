import { GoogleGenAI, Type } from "@google/genai";
import { ParsedQuestion, ValidationResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const modelId = "gemini-2.5-flash";

export const validateAnswer = async (question: ParsedQuestion, selectedOptionIndex: number): Promise<ValidationResult> => {
  const selectedOptionText = question.options[selectedOptionIndex];
  const optionsFormatted = question.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n');
  const myAnswerFormatted = `${String.fromCharCode(65 + selectedOptionIndex)}. ${selectedOptionText}`;

  const prompt = `
Question: ${question.questionText}
My Answer: ${myAnswerFormatted}
Options:
${optionsFormatted}

For this question, analyze my response and give feedback based on the answer options provided.
If my answer is correct, confirm it and explain why it is correct.
If my answer is incorrect, identify the correct answer and explain why my answer was wrong.
Also, provide an explanation about why the other options are incorrect.
`;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isCorrect: { type: Type.BOOLEAN },
            correctOptionIndex: { type: Type.INTEGER },
            explanation: { type: Type.STRING },
            reasoningForIncorrect: { type: Type.STRING }
          },
          required: ["isCorrect", "correctOptionIndex", "explanation"]
        }
      }
    });

    const textResponse = response.text;
    if (!textResponse) throw new Error("Empty response from AI");
    return JSON.parse(textResponse) as ValidationResult;
  } catch (error) {
    console.error("Error validating answer:", error);
    throw error;
  }
};

export const validateBatch = async (items: { question: ParsedQuestion, selectedOptionIndex?: number }[]): Promise<ValidationResult[]> => {
    if (items.length === 0) return [];

    const itemsPrompt = items.map((item, idx) => {
        const q = item.question;
        
        let myAnswerFormatted = "No answer provided (Skipped)";
        if (item.selectedOptionIndex !== undefined && item.selectedOptionIndex >= 0) {
            const selectedOptionText = q.options[item.selectedOptionIndex];
            myAnswerFormatted = `${String.fromCharCode(65 + item.selectedOptionIndex)}. ${selectedOptionText}`;
        }
        
        const optionsFormatted = q.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n');
        
        return `
        ID: ${q.id}
        Question: ${q.questionText}
        My Answer: ${myAnswerFormatted}
        Options:
        ${optionsFormatted}
        `;
    }).join('\n\n----------------\n\n');

    const prompt = `
    You are grading a quiz. Here are ${items.length} questions.
    For each question:
    1. If the user provided an answer, determine if it is correct.
    2. If the user did not provide an answer (Skipped), mark it as incorrect.
    3. In ALL cases, provide the correct answer index (correctOptionIndex) and a brief explanation.
    
    Questions:
    ${itemsPrompt}
    `;

    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            isCorrect: { type: Type.BOOLEAN },
                            correctOptionIndex: { type: Type.INTEGER },
                            explanation: { type: Type.STRING },
                            reasoningForIncorrect: { type: Type.STRING }
                        },
                        required: ["id", "isCorrect", "correctOptionIndex", "explanation"]
                    }
                }
            }
        });

        const textResponse = response.text;
        if (!textResponse) throw new Error("Empty batch response from AI");
        return JSON.parse(textResponse) as ValidationResult[];
    } catch (error) {
        console.error("Error validating batch:", error);
        throw error;
    }
};
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GenerationSettings, WorksheetData, ProblemType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const worksheetSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    mentalQuestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of mental math questions (e.g., '25 + 15 ='). Return empty array if count is 0.",
    },
    verticalQuestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of vertical calculation questions (e.g., '345 + 128'). Return empty array if count is 0.",
    },
    mixedQuestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of step-by-step/mixed operation questions (e.g., '25 + 4 x 5'). Return empty array if count is 0.",
    },
    fillInBlankQuestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of fill-in-the-blank questions (e.g., '1 m = ( ) cm', '3000g = ( ) kg', '3 x ( ) = 27'). Return empty array if count is 0.",
    },
    compareQuestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of comparison questions. Use '( )' as placeholder for > < or =. (e.g., '50 + 20 ( ) 80'). Return empty array if count is 0.",
    },
    wordQuestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of word problems appropriate for Grade 3 in Chinese. Return empty array if count is 0.",
    },
  },
  required: ["mentalQuestions", "verticalQuestions", "mixedQuestions", "fillInBlankQuestions", "compareQuestions", "wordQuestions"],
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function generateContentWithRetry(contents: string, config: any, retries = 3, backoff = 2000): Promise<any> {
  try {
    return await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents,
      config,
    });
  } catch (error: any) {
    // Check for rate limit (429) or service unavailable (503)
    // The error object might be wrapped differently depending on the SDK version, 
    // checking various properties for robustness.
    const errorCode = error?.status || error?.code || error?.error?.code;
    const isRateLimit = errorCode === 429 || errorCode === 503 || error?.message?.includes("429") || error?.message?.includes("quota");

    if (isRateLimit && retries > 0) {
      console.warn(`Gemini API Quota/Limit hit. Retrying in ${backoff}ms... (Attempts left: ${retries})`);
      await delay(backoff);
      return generateContentWithRetry(contents, config, retries - 1, backoff * 2);
    }
    throw error;
  }
}

export const generateQuestions = async (
  settings: GenerationSettings, 
  avoidList: string[] = [], 
  setIndex: number = 0
): Promise<WorksheetData> => {
  
  // To avoid hitting token limits, we only pass the last ~50 questions to avoid
  const limitedAvoidList = avoidList.slice(-50);
  const avoidPrompt = limitedAvoidList.length > 0 
    ? `\n    **CRITICAL REQUIREMENT**: DO NOT Generate any of the following questions again: ${JSON.stringify(limitedAvoidList)}.` 
    : '';

  const prompt = `
    You are a math teacher in China teaching Grade 3 (小学三年级数学老师). Generate a math worksheet based on the following requirements.
    
    **IMPORTANT RULES:**
    1. All output questions, instructions, and word problems MUST be in Simplified Chinese (简体中文).
    2. **STRICTLY use '÷' for division. DO NOT use '/'.**
    3. **STRICTLY use '×' for multiplication. DO NOT use '*'.**
    ${avoidPrompt}
    
    Topic Focus: ${settings.topicFocus}
    
    Requirements:
    1. ${settings.mentalCount} Mental Math questions (口算). Format: "A operator B = ".
    2. ${settings.verticalCount} Vertical Calculation questions (竖式计算). Just provide the expression.
    3. ${settings.mixedCount} Mixed/Step-by-step Calculation questions (脱式计算). Expressions with 3 numbers and 2 operators.
    4. ${settings.fillInBlankCount} Fill-in-the-blank questions (填空题). Cover unit conversions (length, weight), time, or missing factors. e.g. "3米 = ( )分米".
    5. ${settings.compareCount} Comparison questions (比大小). Compare expressions or units. Use '( )' as the placeholder for the student to write >, <, or =.
    6. ${settings.wordCount} Word Problems (应用题). Real-life scenarios familiar to Chinese students.
    
    Constraints:
    - Ensure difficulty is appropriate for Grade 3.
    - If a count is 0, do not generate questions for that type.
    - STRICTLY NO DUPLICATE QUESTIONS within the worksheet.
    - Return strictly JSON.
  `;

  try {
    const response = await generateContentWithRetry(prompt, {
      responseMimeType: "application/json",
      responseSchema: worksheetSchema,
      temperature: 0.85, // Increased temperature for better variety
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const parsed = JSON.parse(text);

    // Helper function to ensure symbols are correct
    const cleanQuestion = (q: string) => {
      if (!q) return "";
      return q.replace(/\//g, '÷').replace(/\*/g, '×');
    };

    const createProblems = (raw: string[], type: ProblemType, count: number) => 
      (raw || []).slice(0, count).map((q: string, i: number) => {
        const cleaned = cleanQuestion(q.trim());
        let questionText = cleaned;
        
        if ((type === ProblemType.MENTAL || type === ProblemType.MIXED) && !cleaned.endsWith('=')) {
          questionText = cleaned + ' =';
        }

        return {
          // Unique ID combining set index to prevent collisions in batch
          id: `${type.toLowerCase()}-set${setIndex}-${Date.now()}-${i}`,
          type,
          question: questionText,
        };
      });

    return {
      id: `worksheet-${Date.now()}-${setIndex}`,
      mentalMath: createProblems(parsed.mentalQuestions, ProblemType.MENTAL, settings.mentalCount),
      vertical: createProblems(parsed.verticalQuestions, ProblemType.VERTICAL, settings.verticalCount),
      mixed: createProblems(parsed.mixedQuestions, ProblemType.MIXED, settings.mixedCount),
      fillInBlank: createProblems(parsed.fillInBlankQuestions, ProblemType.FILL_IN_BLANK, settings.fillInBlankCount),
      compare: createProblems(parsed.compareQuestions, ProblemType.COMPARE, settings.compareCount),
      word: createProblems(parsed.wordQuestions, ProblemType.WORD, settings.wordCount),
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate questions. Please try again.");
  }
};
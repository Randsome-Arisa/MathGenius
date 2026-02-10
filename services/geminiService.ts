import { GenerationSettings, WorksheetData, ProblemType } from "../types";

// ==========================================
// 请在这里填入您的 Kimi (Moonshot) API Key
// ==========================================
const KIMI_API_KEY = "sk-vve88rz3tUcpDDXA0eUPwwHB9jNfIUfgwhi6ZvaEnl0maP85"; 

const API_URL = "https://api.moonshot.cn/v1/chat/completions";

// Helper for delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Call Kimi API with retry logic
async function callKimiAPI(messages: any[], retries = 3, backoff = 2000): Promise<any> {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${KIMI_API_KEY}`
      },
      body: JSON.stringify({
        model: "moonshot-v1-8k",
        messages: messages,
        temperature: 0.3, // Lower temperature for stable JSON output
        response_format: { type: "json_object" } // Force JSON mode
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      // Handle Rate Limits (429)
      if (response.status === 429 && retries > 0) {
        console.warn(`Kimi API Rate Limit hit. Retrying in ${backoff}ms...`);
        await delay(backoff);
        return callKimiAPI(messages, retries - 1, backoff * 1.5);
      }
      throw new Error(`Kimi API Request Failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();

  } catch (error) {
    if (retries > 0) {
       console.warn(`Network error, retrying...`);
       await delay(backoff);
       return callKimiAPI(messages, retries - 1, backoff * 1.5);
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
    ? `\n    **禁止生成的题目（已存在）**: ${JSON.stringify(limitedAvoidList)}.` 
    : '';

  // Construct the prompt
  const systemPrompt = `
    你是一位中国小学三年级数学老师。请根据用户的要求生成一套数学练习题。
    
    **输出格式要求：**
    1. 必须且只能返回标准的 **JSON** 格式字符串。
    2. JSON 对象的根必须包含以下字段（如果某类题目数量为0，则返回空数组 []）：
       - "mentalQuestions": 字符串数组，口算题 (格式: "A + B = ")
       - "verticalQuestions": 字符串数组，竖式计算题 (格式: "A + B")
       - "mixedQuestions": 字符串数组，脱式计算题 (格式: "A + B * C")
       - "fillInBlankQuestions": 字符串数组，填空题 (例如: "1米 = ( )分米")
       - "compareQuestions": 字符串数组，比大小 (例如: "50 + 20 ( ) 80")
       - "wordQuestions": 字符串数组，应用题 (中文描述)

    **内容要求：**
    1. 所有题目、说明和应用题必须使用 **简体中文**。
    2. 除法符号必须使用 '÷'，禁止使用 '/'。
    3. 乘法符号必须使用 '×'，禁止使用 '*'。
    4. 难度必须严格符合中国小学三年级标准。
    5. 绝对不要生成重复的题目。
    ${avoidPrompt}
  `;

  const userPrompt = `
    请生成一套试卷，包含以下题目：
    1. 口算题 (mentalQuestions): ${settings.mentalCount} 道
    2. 竖式计算 (verticalQuestions): ${settings.verticalCount} 道
    3. 脱式计算 (mixedQuestions): ${settings.mixedCount} 道
    4. 填空题 (fillInBlankQuestions): ${settings.fillInBlankCount} 道
    5. 比大小 (compareQuestions): ${settings.compareCount} 道
    6. 应用题 (wordQuestions): ${settings.wordCount} 道

    当前侧重的主题/知识点: ${settings.topicFocus}
  `;

  try {
    const data = await callKimiAPI([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]);

    const content = data.choices[0].message.content;
    if (!content) throw new Error("No content from Kimi API");

    // Clean JSON string (sometimes LLMs wrap in ```json ... ```)
    const jsonStr = content.replace(/```json\n?|```/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    // Helper function to ensure symbols are correct
    const cleanQuestion = (q: string) => {
      if (!q) return "";
      return q.replace(/\//g, '÷').replace(/\*/g, '×');
    };

    const createProblems = (raw: string[], type: ProblemType, count: number) => 
      (raw || []).slice(0, count).map((q: string, i: number) => {
        const cleaned = cleanQuestion(q.trim());
        let questionText = cleaned;
        
        // Ensure equation format for Mental and Mixed
        if ((type === ProblemType.MENTAL || type === ProblemType.MIXED) && !cleaned.endsWith('=') && !cleaned.includes('=')) {
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
    console.error("Kimi API Error:", error);
    throw new Error("Failed to generate questions via Kimi API. Please check your API Key and Network.");
  }
};

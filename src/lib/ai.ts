import { GoogleGenerativeAI } from "@google/generative-ai";
import { Entry } from "@/types";
import { AnalysisResult } from "./analysis-store";
import { getCorrectionPrompt, getAnalysisPrompt } from "./prompts";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

const DEFAULT_MODEL_NAME = "gemini-3-flash-preview";

export const AVAILABLE_MODELS = [
  { id: "gemini-3-flash-preview", name: "Gemini 3 Flash (Preview) - Default" },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
  { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite" },
];

export const AI_MODEL_INFO = DEFAULT_MODEL_NAME;

async function generateWithRetry(prompt: string, modelName: string, retries = 3, delay = 2000): Promise<string> {
  const model = genAI.getGenerativeModel({ model: modelName });

  for (let i = 0; i < retries; i++) {
    try {
      console.log(`AI Request (Attempt ${i + 1}/${retries}) with ${modelName}...`);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.warn(`AI Attempt ${i + 1} failed:`, error.message);

      // Special handling for Gemini 3 Pro Quota limits (Limit 0)
      if (modelName.includes("gemini-3-pro") && error.message.includes("429")) {
        throw new Error("현재 API 키로는 Gemini 3 Pro 모델을 사용할 수 없습니다. Flash 모델을 선택해주세요.");
      }

      // Check for other 429, 503, or 500 errors
      if ((error.message.includes("429") || error.message.includes("503") || error.message.includes("500")) && i < retries - 1) {
        const waitTime = delay * Math.pow(2, i);
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(res => setTimeout(res, waitTime));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Maximum retries exceeded");
}

export async function correctText(text: string, modelName = "gemini-2.5-flash-lite"): Promise<{ correction: string; notes: string }> {
  try {
    const prompt = getCorrectionPrompt(text);

    const textResponse = await generateWithRetry(prompt, modelName);

    // Debug Log Raw Response
    if (typeof window !== 'undefined') {
      import('./debug-store').then(({ useDebugStore }) => {
        useDebugStore.getState().addLog('info', 'AI Raw Response (Correction)', { raw: textResponse });
      });
    }

    // Clean up potential markdown code blocks (more robust regex)
    const jsonString = textResponse.replace(/```json|```/g, "").trim();
    const data = JSON.parse(jsonString);

    // Fallback logic for Array responses (if AI ignores strict instructions)
    if (Array.isArray(data)) {
      const consolidatedCorrection = data
        .map((item: any) => item.corrected || item.correction || "")
        .filter(Boolean)
        .join(" ");

      const consolidatedNotes = data
        .map((item: any) => {
          const original = item.original || item.originalText || "원문";
          const explanation = item.explanation || item.notes || "";
          return `- **${original}**: ${explanation}`;
        })
        .join("\n\n");

      return {
        correction: consolidatedCorrection || text,
        notes: consolidatedNotes || "문장별 교정 정보를 생성했습니다."
      };
    }

    return {
      correction: data.correction || text,
      notes: data.notes || "교정 설명을 생성하지 못했습니다.",
    };
  } catch (error) {
    console.error("AI Correction Error:", error);
    return {
      correction: text,
      notes: "AI 연결이 지연되고 있습니다. 잠시 후 다시 시도해주세요.",
    };
  }
}

export async function analyzeWriting(entries: Entry[], modelName = DEFAULT_MODEL_NAME, previousAnalysis?: AnalysisResult | null): Promise<AnalysisResult> {
  try {
    // Optimization: Limit to max 30 entries to save tokens (increased from 15)
    const MAX_ENTRIES = 30;
    const MAX_CHARS_PER_ENTRY = 1000;

    // Use entries passed from UI (already filtered by user's date selection usually)
    // Sort by date desc (if not already) and take top N for safety
    const recentEntriesList = entries
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, MAX_ENTRIES);

    let dateRange = undefined;
    if (recentEntriesList.length > 0) {
      const end = recentEntriesList[0].date;
      const start = recentEntriesList[recentEntriesList.length - 1].date;
      dateRange = { start, end };
    }

    const recentEntries = recentEntriesList.map(e => {
      let text = e.originalText;
      if (text.length > MAX_CHARS_PER_ENTRY) {
        text = text.substring(0, MAX_CHARS_PER_ENTRY) + " ... (truncated)";
      }
      return `[${e.date}] ${text}`;
    }).join("\n\n");

    console.log(`Analyzing ${recentEntriesList.length} entries (capped at ${MAX_ENTRIES}) from the last 3 months.`);

    // Construct Previous Context String
    let previousContext = "";
    if (previousAnalysis) {
      const prevVocab = previousAnalysis.vocabularyList?.map((v: any) => v.word).join(", ");
      const prevWeakness = previousAnalysis.rubricAnalysis?.grammar?.diagnosis;
      const prevQuiz = previousAnalysis.quiz?.map((q: any) => q.question).join("\n- ");

      previousContext = `
        - 지난번 추천 어휘: ${prevVocab || "없음"}
        - 지난번 지적 사항: ${prevWeakness || "없음"}
        - 지난번 퀴즈 질문:
          - ${prevQuiz || "없음"}
      `;
    }

    const prompt = getAnalysisPrompt(recentEntries, previousContext);

    console.log("Sending prompt to Gemini:", modelName);

    const textResponse = await generateWithRetry(prompt, modelName);

    console.log("Gemini Raw Response:", textResponse);

    const cleanJson = textResponse.replace(/```json|```/g, "").trim();

    try {
      const data = JSON.parse(cleanJson);

      // KST Date Generation
      const now = new Date();
      const kstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Mapper: Convert "Mentor Persona" Format to AnalysisResult
      const flattenedResult: AnalysisResult = {
        date: kstDate,
        entryDateRange: dateRange,
        level: data.evaluation?.cefrLevel || "분석 완료",
        levelDescription: data.evaluation?.levelDetails || data.evaluation?.summary || "분석 내용이 없습니다.",
        scores: {
          grammar: data.evaluation?.scores?.["문법정확도"] || 0,
          vocabulary: data.evaluation?.scores?.["어휘다양성"] || 0,
          coherence: data.evaluation?.scores?.["논리전개"] || 0,
          expression: data.evaluation?.scores?.["자연스러움"] || 0,
          clarity: data.evaluation?.scores?.["전문성"] || 70,
        },
        grammarPatterns: data.grammarAnalysis?.map((p: any) => ({
          pattern: p.pattern,
          explanation: `${p.diagnosis}\n\n💡 선생님의 팁: ${p.rule}`,
          examples: p.examples || []
        })) || [],
        rubricAnalysis: {
          grammar: data.evaluation?.rubric?.grammar || { diagnosis: "문법 패턴 분석을 참고하세요.", improvement: "자주 틀리는 패턴을 복습하세요." },
          vocabulary: data.evaluation?.rubric?.vocabulary || { diagnosis: "어휘 다양성을 높여보세요.", improvement: `권장 학습 어휘: ${data.vocabularyUpgrade?.focusedVocabulary?.join(", ") || "없음"}` },
          logic: data.evaluation?.rubric?.logic || { diagnosis: "논리 전개를 보완하세요.", improvement: "주장과 근거를 명확히 연결해보세요." },
          flow: data.evaluation?.rubric?.flow || { diagnosis: "흐름을 더 자연스럽게 만들어보세요.", improvement: "문장 간의 연결어를 활용해보세요." },
          tone: data.evaluation?.rubric?.tone || { diagnosis: "상황에 맞는 어조를 사용하세요.", improvement: "비즈니스 매너를 지켜보세요." }
        },
        strategy: data.learningStrategy?.map((s: any) => ({
          action: s.subject,
          example: `🧠 Theory (원리): ${s.theory}\n\n⚙️ Mechanics (구조): ${s.mechanics}\n\n💼 Application (실전): ${s.application}\n\n💌 Teacher's Message: "${s.teacherMessage}"`, // Keep fallback for safety
          theory: s.theory,
          mechanics: s.mechanics,
          application: s.application,
          message: s.teacherMessage
        })) || [],
        vocabularyList: data.recommendedVocabulary?.map((v: any) => ({
          word: v.word,
          meaning: v.meaning,
          example: v.example
        })) || [],
        quiz: data.customQuiz?.map((q: any) => ({
          question: q.question,
          options: q.options,
          answer: q.answer_index !== undefined ? q.answer_index : 0,
          explanation: q.explanation
        })) || [],
        rawDeepInsight: data
      };

      return flattenedResult;
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, "Raw:", textResponse);
      throw new Error(`AI 응답 형식이 올바르지 않습니다.`);
    }

  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    const errorMessage = error.message || "AI 분석 중 알 수 없는 오류가 발생했습니다.";
    throw new Error(errorMessage);
  }
}

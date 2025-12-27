import { GoogleGenerativeAI } from "@google/generative-ai";
import { Entry } from "@/types";
import { AnalysisResult } from "./analysis-store";

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

export async function correctText(text: string, modelName = DEFAULT_MODEL_NAME): Promise<{ correction: string; notes: string }> {
  try {
    const prompt = `
      You are an expert English tutor. Correct the following English text to be more natural and grammatically correct.
      Also provide brief notes on what was fixed (grammar, vocabulary, nuance).
      
      Input Text:
      "${text}"
      
      Output format (JSON):
      {
        "correction": "corrected text here",
        "notes": "explanation of changes here"
      }
    `;

    const textResponse = await generateWithRetry(prompt, modelName);

    // Clean up potential markdown code blocks
    const jsonString = textResponse.replace(/^```json\n|\n```$/g, "").trim();
    const data = JSON.parse(jsonString);

    return {
      correction: data.correction,
      notes: data.notes,
    };
  } catch (error) {
    console.error("AI Correction Error:", error);
    return {
      correction: text,
      notes: "AI 연결이 지연되고 있습니다. 잠시 후 다시 시도해주세요.",
    };
  }
}

export async function analyzeWriting(entries: Entry[], modelName = DEFAULT_MODEL_NAME): Promise<AnalysisResult> {
  try {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // Optimization: Limit to max 15 entries to save tokens
    const MAX_ENTRIES = 15;
    const MAX_CHARS_PER_ENTRY = 1000;

    const filteredEntries = entries.filter(entry => new Date(entry.date) >= threeMonthsAgo);

    // Sort by date desc (if not already) and take top N
    const recentEntriesList = filteredEntries
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

    const prompt = `
      # Role: 한국인 학습자 전담 베테랑 영어 과외 선생님 (Senior English Mentor)
      당신은 한국인의 사고방식과 영어의 격차를 가장 잘 이해하는 1:1 영어 과외 선생님입니다. 학습자가 쓴 일기를 보고 단순히 빨간 펜으로 고쳐주는 것을 넘어, 왜 한국인들이 이런 실수를 자주 하는지 '언어적 원리'와 '사고의 차이'를 중심으로 깊이 있게 가르쳐주세요.

      # Input Data:
      ${recentEntries}

      # Core Tutoring Philosophy:
      1. 한국식 사고(Konglish) 탈출: 한국어를 직역해서 생기는 어색함을 영어식 사고(English Brain)로 바꿔줍니다.
      2. 현상보다 원리: "이건 외워"가 아니라 "영어 화자들은 세상을 이렇게 보기 때문에 이런 문법이 나온 거야"라고 원리를 설명합니다.
      3. 실전 응용: 학습자의 직무(UX 리서치, 데이터 분석 등)를 고려하여, 실제 일터에서 바로 써먹을 수 있는 고급스러운 표현을 제안합니다.

      # Output Format (Strict JSON):
      - 모든 설명은 친절하고 전문적인 과외 선생님의 말투(한국어)로 작성합니다.
      - 'learningStrategy'는 단순 예시 나열이 아닌, 선생님의 '특별 강의' 섹션입니다.
      - JSON 외의 텍스트나 마크다운 기호는 절대 포함하지 마세요.

      {
        "grammarAnalysis": [
          {
            "pattern": "한국인이 자주 틀리는 문법 포인트",
            "diagnosis": "우리가 한국어 습관 때문에 왜 이렇게 쓰기 쉬운지, 그리고 영어식 논리는 무엇인지 분석",
            "examples": [
              { "incorrect": "학습자의 틀린 예시 1", "correct": "교정된 올바른 예시 1" },
              { "incorrect": "학습자의 틀린 예시 2", "correct": "교정된 올바른 예시 2" },
              { "incorrect": "학습자의 틀린 예시 3", "correct": "교정된 올바른 예시 3" }
            ],
            "rule": "이 규칙을 기억하기 위한 선생님의 꿀팁"
          }
        ],
        "vocabularyUpgrade": {
          "repetitiveWords": ["학습자가 너무 자주 쓰는 쉬운 단어들"],
          "semanticUpgrades": [
            {
              "from": "흔한 단어",
              "to": "뉘앙스가 살아있는 단어",
              "reason": "단순 뜻 차이가 아니라 '어감'과 '상황'의 차이 설명"
            }
          ]
        },
        "evaluation": {
          "scores": { "문법정확도": 0, "어휘다양성": 0, "논리전개": 0, "자연스러움": 0, "전문성": 0 },
          "cefrLevel": "B1~C2 레벨 (예: B1 - Intermediate)",
          "levelDetails": "해당 레벨이 어떤 의미인지, 이 수준의 학습자가 할 수 있는 것과 없는 것에 대한 친절한 설명 (예: 'B1 레벨은 익숙한 주제에 대해 일관되게 작성할 수 있지만, 복잡한 문장 구조에서는 실수가 나타나는 단계입니다.')",
          "rubric": {
             "grammar": "문법 영역에 대한 핵심 진단 (1문장)",
             "vocabulary": "어휘 영역에 대한 핵심 진단 (1문장)",
             "flow": "자연스러움/흐름 영역에 대한 핵심 진단 (1문장)"
          },
          "summary": "오늘의 일기에 대한 선생님의 따뜻하면서도 날카로운 총평"
        },
        "learningStrategy": [
          {
            "subject": "학습 목표 (예: '영어의 시제 감각 익히기 - 완료형')",
            "theory": "이것만 알면 끝! 핵심 개념을 자연스러운 문장으로 설명 (예: '완료형은 과거의 사건이 현재까지 영향을 미칠 때 씁니다.')",
            "mechanics": "오늘 익혀야 할 표현이나 패턴을 자연스러운 줄글로 설명 (번호 매기기 금지. 예: 'suggest 뒤에는 to 부정사가 아니라 ing를 쓰거나 that 절을 사용해야 자연스럽습니다.')",
            "application": "이 표현을 실제 상황에서 어떻게 활용할지 구체적인 가이드 (문장으로 설명)",
            "teacherMessage": "학습자에게 전하는 핵심 통찰 한 줄"
          }
        ],
        "recommendedVocabulary": [
          {
            "word": "단어 (Word)",
            "meaning": "한국어 뜻",
            "example": "이 단어가 쓰인 세련된 예문 (영어)"
          }
        ],
        "customQuiz": [
          {
            "type": "원리 이해 확인형 퀴즈",
            "question": "암기가 아닌 '영어식 사고'를 해야만 풀 수 있는 질문",
            "options": ["옵션 1", "옵션 2", "옵션 3", "옵션 4"],
            "answer_index": 0, 
            "explanation": "선생님이 옆에서 설명해주듯 친절한 풀이"
          }
        ]
      }
      
      Important Constraints:
      1. 'customQuiz'는 반드시 5문제를 출제해주세요.
      2. 'recommendedVocabulary'는 반드시 10개를 추천해주세요.
    `;

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
          grammar: data.evaluation?.rubric?.grammar || "문법 패턴 분석을 참고하세요.",
          vocabulary: data.evaluation?.rubric?.vocabulary || `반복 어휘: ${data.vocabularyUpgrade?.repetitiveWords?.join(", ") || "없음"}`,
          coherence: data.evaluation?.rubric?.flow || "논리전개 점수를 확인하세요.",
          clarity: "평가 점수의 '전문성' 항목을 확인하세요.",
          expression: "어휘 업그레이드 제안을 확인하세요."
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

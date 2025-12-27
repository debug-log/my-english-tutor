import { Entry } from "@/types";

export interface AnalysisResult {
    totalEntries: number;
    streak: number;
    weaknesses: string[];
    recommendations: string[];
    level: string;
}

export function analyzeEntries(entries: Entry[]): AnalysisResult {
    const totalEntries = entries.length;

    // Calculate streak
    let streak = 0;
    const sortedDates = [...new Set(entries.map(e => e.date))].sort().reverse();
    const today = new Date().toISOString().split('T')[0];

    if (sortedDates.length > 0) {
        let current = new Date(today);
        // Check if posted today or yesterday to keep streak
        const lastPost = new Date(sortedDates[0]);
        const diffTime = Math.abs(current.getTime() - lastPost.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 1) {
            streak = 1;
            for (let i = 0; i < sortedDates.length - 1; i++) {
                const d1 = new Date(sortedDates[i]);
                const d2 = new Date(sortedDates[i + 1]);
                const diff = (d1.getTime() - d2.getTime()) / (1000 * 3600 * 24);
                if (diff <= 1.1) { // roughly 1 day
                    streak++;
                } else {
                    break;
                }
            }
        }
    }

    // Identify Weaknesses
    const allNotes = entries.map(e => e.notes || "").join(" ").toLowerCase();
    const weaknesses: string[] = [];
    if (allNotes.includes("formal") || allNotes.includes("격식")) weaknesses.push("정중한 표현(Formal)");
    if (allNotes.includes("tense") || allNotes.includes("past") || allNotes.includes("시제")) weaknesses.push("동사 시제");
    if (allNotes.includes("article") || allNotes.includes("관사") || allNotes.includes(" a ") || allNotes.includes(" the ")) weaknesses.push("관사(a/the)");
    if (weaknesses.length === 0 && totalEntries > 0) weaknesses.push("전반적인 유창성");

    // Generate Recommendations
    const recommendations: string[] = [];
    if (weaknesses.includes("정중한 표현(Formal)")) {
        recommendations.push("'Business English' 어휘 목록을 학습하세요.");
        recommendations.push("편안한 이메일을 격식 있게 바꾸는 연습을 해보세요.");
    }
    if (weaknesses.includes("동사 시제")) {
        recommendations.push("과거 완료(Past Perfect)와 과거(Past Simple)의 차이를 복습하세요.");
        recommendations.push("어제 있었던 일을 영어 일기로 적어보세요.");
    }
    if (weaknesses.includes("관사(a/the)")) {
        recommendations.push("영어 뉴스 기사를 읽으며 관사에 동그라미 쳐보세요.");
    }
    if (recommendations.length === 0) {
        recommendations.push("매일 조금씩 꾸준히 쓰는 습관이 중요합니다!");
        recommendations.push("하루 15분 영어 원서 읽기에 도전해보세요.");
    }

    // Determine Level
    let level = "초급 (Beginner)";
    if (totalEntries > 5) level = "중급 (Intermediate)";
    if (totalEntries > 20) level = "고급 (Advanced)";

    return {
        totalEntries,
        streak,
        weaknesses,
        recommendations,
        level
    };
}

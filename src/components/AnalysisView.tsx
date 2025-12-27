"use client";

import { useEntries } from "@/lib/store";
import { analyzeWriting, AVAILABLE_MODELS } from "@/lib/ai";
import { useAnalysisStore, AnalysisResult } from "@/lib/analysis-store";
// Use page.module.css or create a new one? Let's use a new one to avoid conflicts or reuse AnalysisPage styles if possible.
// Better to copy the relevant styles to AnalysisView.module.css
import styles from "./AnalysisView.module.css";
import { useEffect, useState } from "react";
import { useToast } from "@/lib/toast-context";
import { RefreshCw } from "lucide-react";

// Components from src/components/analysis
import { LevelDiagnosis } from "@/components/analysis/LevelDiagnosis";
import { WeaknessAnalysis } from "@/components/analysis/WeaknessAnalysis";
import { StrategySection } from "@/components/analysis/StrategySection";
import { VocabularySection } from "@/components/analysis/VocabularySection";
import { QuizSection } from "@/components/analysis/QuizSection";

export default function AnalysisView() {
    const { entries, isLoaded } = useEntries();
    const { history, addAnalysis, getLatestAnalysis, fetchHistory, isLoading: storeLoading } = useAnalysisStore();
    const [latestAnalysis, setLatestAnalysis] = useState<AnalysisResult | null>(null);
    const [localLoading, setLocalLoading] = useState(false);
    const isLoading = localLoading || storeLoading;
    const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id);
    const { addToast } = useToast();

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    // Update latestAnalysis whenever history runs or updates
    useEffect(() => {
        if (history.length > 0) {
            setLatestAnalysis(history[0]);
        }
    }, [history]);

    const handleAnalyze = async (force = false) => {
        if (entries.length < 3) {
            addToast("분석을 위해서는 최소 3개 이상의 피드가 필요합니다.", "error");
            return;
        }

        const today = new Date().toISOString().split('T')[0];

        if (!force && latestAnalysis && latestAnalysis.date === today) {
            addToast("오늘의 분석은 이미 완료되었습니다.");
            return;
        }

        setLocalLoading(true);
        try {
            const result = await analyzeWriting(entries, selectedModel);
            addAnalysis(result);
            setLatestAnalysis(result);
            addToast("학습 분석이 완료되었습니다!");
        } catch (error: any) {
            console.error(error);
            const msg = error.message || "분석 중 오류가 발생했습니다.";
            addToast(`오류 발생: ${msg}`, "error");
        } finally {
            setLocalLoading(false);
        }
    };

    const handleExport = () => {
        const dataStr = JSON.stringify(history, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `analysis-history-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        addToast("분석 히스토리가 저장되었습니다.");
    };

    if (!isLoaded) return null;

    const displayAnalysis = latestAnalysis || {} as AnalysisResult;

    return (
        <div className={styles.container}>
            {/* Control Bar */}
            <div className={styles.controls}>
                <div className={styles.modelSelector}>
                    <label htmlFor="model-select">AI Model:</label>
                    <select
                        id="model-select"
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className={styles.select}
                        disabled={isLoading}
                    >
                        {AVAILABLE_MODELS.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                </div>

                <div className={styles.actions}>
                    {/* Export Button - Small text link style */}
                    <button onClick={handleExport} className={styles.textButton}>
                        History Export
                    </button>

                    <button
                        onClick={() => handleAnalyze(true)}
                        className={styles.refreshButton}
                        disabled={isLoading}
                    >
                        {isLoading ? "분석 중..." : (
                            <>
                                <RefreshCw className={styles.refreshIcon} size={16} />
                                <span>분석 갱신</span>
                            </>
                        )}
                    </button>

                </div>
            </div>

            {/* Info Text */}
            <div className={styles.infoText}>
                {latestAnalysis ? (
                    <>
                        AI가 진단한 나의 영어 실력과 맞춤 학습 전략입니다. (최근 업데이트: {latestAnalysis.date})
                        {latestAnalysis.entryDateRange && (
                            <span className={styles.dateRange}> | 대상 기간: {latestAnalysis.entryDateRange.start} ~ {latestAnalysis.entryDateRange.end}</span>
                        )}
                    </>
                ) : (
                    "AI가 진단한 나의 영어 실력과 맞춤 학습 전략입니다."
                )}
            </div>

            {!latestAnalysis && !isLoading ? (
                <div className={styles.emptyState}>
                    <p>아직 분석된 데이터가 없습니다.</p>
                    <button onClick={() => handleAnalyze(true)} className={styles.startButton} disabled={isLoading}>
                        {isLoading ? "분석 중..." : "지금 내 실력 분석하기"}
                    </button>
                    {entries.length < 3 && <p className={styles.hint}>* 최소 3개의 피드가 필요합니다.</p>}
                </div>
            ) : (
                <div className={styles.reportGrid}>
                    {/* Top Section */}
                    {/* Main Analysis Section */}
                    <LevelDiagnosis analysis={displayAnalysis} isLoading={isLoading} />

                    <WeaknessAnalysis analysis={displayAnalysis} isLoading={isLoading} />
                    <StrategySection analysis={displayAnalysis} isLoading={isLoading} />
                    <VocabularySection analysis={displayAnalysis} isLoading={isLoading} />
                    <QuizSection analysis={displayAnalysis} isLoading={isLoading} />
                </div>
            )}
        </div>
    );
}

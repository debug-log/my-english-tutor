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
    const [dateRange, setDateRange] = useState("all");
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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

    const onAnalyzeClick = () => {
        setIsSettingsOpen(true);
    };

    const onConfirmAnalyze = () => {
        setIsSettingsOpen(false);
        handleAnalyze(true);
    };

    const handleAnalyze = async (force = false) => {
        let filteredEntries = [...entries];

        // Filter by Date Range
        if (dateRange !== 'all') {
            const now = new Date();
            const targetDate = new Date();

            switch (dateRange) {
                case '1w': targetDate.setDate(now.getDate() - 7); break;
                case '2w': targetDate.setDate(now.getDate() - 14); break;
                case '1m': targetDate.setMonth(now.getMonth() - 1); break;
                case '2m': targetDate.setMonth(now.getMonth() - 2); break;
            }

            filteredEntries = entries.filter(entry => new Date(entry.date) >= targetDate);
        }

        if (filteredEntries.length < 3) {
            addToast(`선택된 기간(${getRangeLabel(dateRange)}) 내의 피드가 부족합니다 (최소 3개 필요). 현재: ${filteredEntries.length}개`, "error");
            return;
        }

        const today = new Date().toISOString().split('T')[0];

        if (!force && latestAnalysis && latestAnalysis.date === today) {
            addToast("오늘의 분석은 이미 완료되었습니다.");
            return;
        }

        setLocalLoading(true);
        try {
            const result = await analyzeWriting(filteredEntries, selectedModel);
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

    const getRangeLabel = (range: string) => {
        switch (range) {
            case '1w': return '최근 1주일';
            case '2w': return '최근 2주일';
            case '1m': return '최근 1개월';
            case '2m': return '최근 2개월';
            default: return '전체 기간';
        }
    };



    if (!isLoaded) return null;

    const displayAnalysis = latestAnalysis || {} as AnalysisResult;

    return (
        <div className={styles.container}>
            {/* Analysis Settings Modal */}
            {isSettingsOpen && (
                <div className={styles.overlay} onClick={() => setIsSettingsOpen(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div className={styles.modalTitle}>
                                <RefreshCw size={20} className={styles.refreshIcon} />
                                <span>분석 설정 업데이트</span>
                            </div>
                            <button className={styles.closeButton} onClick={() => setIsSettingsOpen(false)}>
                                <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>&times;</span>
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <div className={styles.formGroup}>
                                <label className={styles.label} htmlFor="modal-model-select">AI Model</label>
                                <select
                                    id="modal-model-select"
                                    value={selectedModel}
                                    onChange={(e) => setSelectedModel(e.target.value)}
                                    className={styles.select}
                                    style={{ width: '100%' }}
                                >
                                    {AVAILABLE_MODELS.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label} htmlFor="modal-range-select">분석 대상 기간</label>
                                <select
                                    id="modal-range-select"
                                    value={dateRange}
                                    onChange={(e) => setDateRange(e.target.value)}
                                    className={styles.select}
                                    style={{ width: '100%' }}
                                >
                                    <option value="all">전체 기간</option>
                                    <option value="1w">최근 1주일</option>
                                    <option value="2w">최근 2주일</option>
                                    <option value="1m">최근 1개월</option>
                                    <option value="2m">최근 2개월</option>
                                </select>
                            </div>
                        </div>

                        <div className={styles.modalActions}>
                            <button className={styles.cancelButton} onClick={() => setIsSettingsOpen(false)}>
                                취소
                            </button>
                            <button className={styles.confirmButton} onClick={onConfirmAnalyze}>
                                분석 시작
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                    <button onClick={onAnalyzeClick} className={styles.startButton} disabled={isLoading}>
                        {isLoading ? "분석 중..." : "지금 내 실력 분석하기"}
                    </button>
                    {entries.length < 3 && <p className={styles.hint}>* 최소 3개의 피드가 필요합니다.</p>}
                </div>
            ) : (
                <>
                    <div className={styles.reportGrid}>
                        <LevelDiagnosis analysis={displayAnalysis} isLoading={isLoading} />
                        <WeaknessAnalysis analysis={displayAnalysis} isLoading={isLoading} />
                        <StrategySection analysis={displayAnalysis} isLoading={isLoading} />
                        <VocabularySection analysis={displayAnalysis} isLoading={isLoading} />
                        <QuizSection analysis={displayAnalysis} isLoading={isLoading} />
                    </div>

                    {/* Footer Actions */}
                    <div className={styles.actionFooter}>
                        <button
                            onClick={onAnalyzeClick}
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
                </>
            )}
        </div>
    );
}

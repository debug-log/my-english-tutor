type ViewMode = "original" | "corrected" | "diff";

import { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { Entry } from "@/types";
import { correctText } from "@/lib/ai";
import { normalizeContent } from "@/lib/formatter";
import DiffViewer from "./DiffViewer";
import styles from "./EntryCard.module.css";
import { useToast } from "@/lib/toast-context";
import Modal from "./Modal";

interface EntryCardProps {
    entry: Entry;
    onEdit: (entry: Entry) => void;
    onDelete: (id: string) => void;
    onUpdate?: (entry: Entry) => void;
    hideDate?: boolean;
}

export default function EntryCard({ entry, onEdit, onDelete, onUpdate, hideDate = false }: EntryCardProps) {
    const [viewMode, setViewMode] = useState<ViewMode>(entry.correction ? "diff" : "original");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isAiNotesExpanded, setIsAiNotesExpanded] = useState(false);
    const [isConfirmingRegen, setIsConfirmingRegen] = useState(false);
    const { addToast } = useToast();

    const handleAICorrect = async () => {
        if (!entry.originalText) return;
        setIsAnalyzing(true);
        try {
            const normalizedInput = normalizeContent(entry.originalText);
            const result = await correctText(normalizedInput);

            if (onUpdate) {
                // Debug Log
                import('@/lib/debug-store').then(({ useDebugStore }) => {
                    useDebugStore.getState().addLog('info', 'AI Correction Result in Component', result);
                });

                onUpdate({
                    ...entry,
                    aiCorrection: result.correction,
                    aiNotes: result.notes
                });
                addToast("AI 교정이 완료되었습니다.");
                // Switch to original view so the AI section is visible (if it was hidden in diff mode)
                if (viewMode === "diff") {
                    setViewMode("original");
                }
            }
        } catch (e) {
            console.error(e);
            addToast("AI 교정 실패", "error");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className={styles.card}>
            <div className={styles.actions}>
                <button
                    onClick={() => onEdit(entry)}
                    className={styles.iconBtn}
                    aria-label="수정"
                >
                    ✎
                </button>
                <button
                    onClick={() => onDelete(entry.id)}
                    className={`${styles.iconBtn} ${styles.deleteBtn}`}
                    aria-label="삭제"
                >
                    ×
                </button>
            </div>

            {/* Header only shows date if needed, or nothing if date is hidden */}
            {!hideDate && (
                <div className={styles.header}>
                    <span className={styles.date}>{entry.date}</span>
                </div>
            )}

            <div className={styles.content}>
                {entry.correction && (
                    <div className={styles.tabs}>
                        <button
                            className={`${styles.tab} ${viewMode === "diff" ? styles.activeTab : ""}`}
                            onClick={() => setViewMode("diff")}
                        >
                            비교(Diff)
                        </button>
                        <button
                            className={`${styles.tab} ${viewMode === "original" ? styles.activeTab : ""}`}
                            onClick={() => setViewMode("original")}
                        >
                            원문
                        </button>
                        <button
                            className={`${styles.tab} ${viewMode === "corrected" ? styles.activeTab : ""}`}
                            onClick={() => setViewMode("corrected")}
                        >
                            교정본
                        </button>
                    </div>
                )}

                <div className={styles.textBody}>
                    {!entry.correction || viewMode === "original" ? (
                        <p className={styles.text}>{entry.originalText}</p>
                    ) : viewMode === "corrected" ? (
                        <p className={styles.text}>{entry.correction}</p>
                    ) : (
                        <DiffViewer original={entry.originalText} corrected={entry.correction} />
                    )}
                </div>

                {/* AI Correction Section (Shown if exists and NOT in diff mode) */}
                {entry.aiCorrection && viewMode !== "diff" && (
                    <div className={styles.aiResultSection}>
                        <div className={styles.aiHeader}>
                            <div className={styles.aiHeaderLeft}>
                                <Sparkles size={14} className={styles.aiIcon} />
                                <span>AI 튜터 교정</span>
                            </div>

                            {isConfirmingRegen ? (
                                <div className={styles.aiConfirmInline}>
                                    <span className={styles.aiConfirmText}>다시 생성할까요?</span>
                                    <div className={styles.aiConfirmActions}>
                                        <button
                                            className={styles.confirmActionBtn}
                                            onClick={() => {
                                                setIsConfirmingRegen(false);
                                                handleAICorrect();
                                            }}
                                        >
                                            예
                                        </button>
                                        <button
                                            className={styles.cancelActionBtn}
                                            onClick={() => setIsConfirmingRegen(false)}
                                        >
                                            아니오
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    className={styles.aiRegenerateBtn}
                                    onClick={() => setIsConfirmingRegen(true)}
                                    disabled={isAnalyzing}
                                    title="AI 교정 다시 받기"
                                >
                                    <RotateCcw size={14} className={isAnalyzing ? styles.spin : ""} />
                                </button>
                            )}
                        </div>
                        {isAnalyzing ? (
                            <div style={{ marginTop: '0.5rem' }}>
                                <div className={styles.skeletonLine}></div>
                                <div className={styles.skeletonLine}></div>
                                <div className={styles.skeletonLine} style={{ width: '60%' }}></div>
                            </div>
                        ) : (
                            <>
                                <p className={styles.aiText} style={{ whiteSpace: 'pre-wrap' }}>{entry.aiCorrection}</p>

                                {entry.aiNotes && (
                                    <div className={styles.aiNotesWrapper}>
                                        <div className={styles.aiNotesHeader}>
                                            <div className={styles.aiNotesTitle}>
                                                부연 설명
                                            </div>
                                            <button
                                                className={styles.expandBtn}
                                                onClick={() => setIsAiNotesExpanded(!isAiNotesExpanded)}
                                            >
                                                {isAiNotesExpanded ? (
                                                    <>접기 <ChevronUp size={14} /></>
                                                ) : (
                                                    <>자세히 보기 <ChevronDown size={14} /></>
                                                )}
                                            </button>
                                        </div>
                                        <div className={`${styles.aiNotesContent} ${isAiNotesExpanded ? styles.expanded : ""}`}>
                                            <div className={styles.aiNotes}>
                                                <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{entry.aiNotes}</ReactMarkdown>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Loading Skeleton (First time only - when no previous correction exists) */}
                {isAnalyzing && !entry.aiCorrection && (
                    <div className={styles.skeletonSection}>
                        <div className={styles.aiHeader}>
                            <Sparkles size={14} className={`${styles.aiIcon} ${styles.spin}`} />
                            <span>AI 교정 생성 중...</span>
                        </div>
                        <div className={styles.skeletonLine}></div>
                        <div className={styles.skeletonLine}></div>
                        <div className={styles.skeletonLine}></div>
                    </div>
                )}

                {entry.notes && (
                    <div className={styles.notesSection}>
                        <h4>메모</h4>
                        <p className={styles.notes}>{entry.notes}</p>
                    </div>
                )}

                {/* AI Button moved below notes, hidden if aiCorrection exists or in diff mode */}
                {onUpdate && !entry.aiCorrection && viewMode !== "diff" && (
                    <div className={styles.aiButtonFooter}>
                        <button
                            onClick={handleAICorrect}
                            disabled={isAnalyzing}
                            className={`${styles.aiCorrectButton} ${isAnalyzing ? styles.loading : ""}`}
                        >
                            <Sparkles size={16} className={isAnalyzing ? styles.spin : ""} />
                            <span>
                                {isAnalyzing ? "AI 교정 중..." : "AI 교정 받기"}
                            </span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

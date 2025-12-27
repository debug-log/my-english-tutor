import { useState } from "react";
import { Entry } from "@/types";
import DiffViewer from "./DiffViewer";
import styles from "./EntryCard.module.css";

interface EntryCardProps {
    entry: Entry;
    onEdit: (entry: Entry) => void;
    onDelete: (id: string) => void;
    hideDate?: boolean;
}

type ViewMode = "original" | "corrected" | "diff";

export default function EntryCard({ entry, onEdit, onDelete, hideDate = false }: EntryCardProps) {
    const [viewMode, setViewMode] = useState<ViewMode>("diff");

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

                {entry.notes && (
                    <div className={styles.notesSection}>
                        <h4>메모</h4>
                        <p className={styles.notes}>{entry.notes}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

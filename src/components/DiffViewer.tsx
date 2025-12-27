import { diffWords } from "diff";
import styles from "./DiffViewer.module.css";
import { calculateDiffRows, DiffRow } from "@/lib/diff-utils";
import { normalizeContent } from "@/lib/formatter";

interface DiffViewerProps {
    original: string;
    corrected: string;
}

export default function DiffViewer({ original, corrected }: DiffViewerProps) {
    // Auto-normalize text to handle legacy data without manual save
    const normOriginal = normalizeContent(original);
    const normCorrected = normalizeContent(corrected);

    const rows = calculateDiffRows(normOriginal, normCorrected);

    return (
        <div className={styles.container}>
            {rows.map((row, idx) => (
                <div key={idx} className={styles.row}>
                    {renderRowContent(row)}
                </div>
            ))}
        </div>
    );
}

function renderRowContent(row: DiffRow) {
    if (row.type === 'unchanged') {
        return (
            <div className={styles.unchangedBlock}>
                <p className={styles.text}>{row.original}</p>
                <span className={styles.perfectBadge} aria-label="Perfect sentence">✔ Perfect</span>
            </div>
        );
    }

    if (row.type === 'modified') {
        const wordDiff = diffWords(row.original, row.corrected);
        return (
            <div className={styles.modification}>
                <div className={styles.originalLine}>
                    {wordDiff.map((part, i) =>
                        part.removed ? <span key={i} className={styles.deletionHighlight}>{part.value}</span> :
                            part.added ? null : <span key={i}>{part.value}</span>
                    )}
                </div>
                <div className={styles.correctedLine}>
                    {wordDiff.map((part, i) =>
                        part.added ? <span key={i} className={styles.additionHighlight}>{part.value}</span> :
                            part.removed ? null : <span key={i}>{part.value}</span>
                    )}
                </div>
            </div>
        );
    }

    if (row.type === 'removed') {
        return (
            <div className={styles.removedBlock}>
                <p className={styles.removedText}>{row.original}</p>
                <span className={styles.deletedBadge} aria-label="Deleted sentence">⛔ Deleted</span>
            </div>
        );
    }

    if (row.type === 'added') {
        return (
            <div className={styles.addedBlock}>
                <p className={styles.addedText}>{row.corrected}</p>
                <span className={styles.addedBadge} aria-label="Added sentence">+ Added</span>
            </div>
        );
    }

    return null;
}

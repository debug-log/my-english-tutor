import { useState, useEffect } from "react";
import { Entry, NewEntry } from "@/types";
import { normalizeContent } from "@/lib/formatter";
import styles from "./EntryForm.module.css";

interface EntryFormProps {
    initialData?: Entry | null;
    onSave: (entry: NewEntry) => void;
    onCancel?: () => void;
}

export default function EntryForm({ initialData, onSave, onCancel }: EntryFormProps) {
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [originalText, setOriginalText] = useState("");
    const [correction, setCorrection] = useState("");
    const [notes, setNotes] = useState("");

    useEffect(() => {
        if (initialData) {
            setDate(initialData.date);
            setOriginalText(initialData.originalText);
            setCorrection(initialData.correction || "");
            setNotes(initialData.notes || "");
        } else {
            // Always reset when switching to "Add" mode
            setDate(new Date().toISOString().split("T")[0]);
            setOriginalText("");
            setCorrection("");
            setNotes("");
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!originalText.trim()) return;

        // Normalize everything on save
        const finalOriginal = normalizeContent(originalText);
        const finalCorrection = normalizeContent(correction);

        onSave({
            date,
            originalText: finalOriginal,
            correction: finalCorrection || undefined,
            notes: notes.trim() || undefined,
        });

        if (!initialData) {
            setOriginalText("");
            setCorrection("");
            setNotes("");
        }
    };

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <h2 className={styles.title}>{initialData ? "공부 내용 수정" : "오늘의 공부"}</h2>

            <div className={styles.group}>
                <label htmlFor="date">날짜</label>
                <input
                    type="date"
                    id="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                />
            </div>

            <div className={styles.row}>
                <div className={styles.group}>
                    <label htmlFor="original">나의 작문 / 대화 내용</label>
                    <textarea
                        id="original"
                        rows={8}
                        value={originalText}
                        onChange={(e) => setOriginalText(e.target.value)}
                        placeholder="오늘의 영어 공부 내용을 자유롭게 적어보세요..."
                        required
                    />
                </div>

                <div className={styles.group}>
                    <label htmlFor="correction">
                        교정 / 첨삭 내용
                        <span className={styles.optionalBadge}>* 필수</span>
                    </label>
                    <textarea
                        id="correction"
                        rows={8}
                        value={correction}
                        onChange={(e) => setCorrection(e.target.value)}
                        placeholder="AI나 선생님의 피드백 내용을 입력해주세요."
                        required
                    />
                </div>
            </div>

            <div className={styles.group}>
                <label htmlFor="notes">
                    메모 / 복습 노트
                    <span className={styles.optionalBadge}>(선택)</span>
                </label>
                <textarea
                    id="notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="중요한 문법 포인트이나 단어를 기록하세요."
                />
            </div>



            <div className={styles.actions}>
                <button type="submit" className={styles.button}>
                    {initialData ? "수정 완료" : "저장하기"}
                </button>
                {initialData && onCancel && (
                    <button type="button" onClick={onCancel} className={styles.cancelButton}>
                        취소
                    </button>
                )}
            </div>
        </form>
    );
}

"use client";

import { useState, useEffect } from "react";
import styles from "../AnalysisView.module.css";
import { AnalysisResult } from "@/lib/analysis-store";

interface QuizSectionProps {
    analysis: AnalysisResult;
    isLoading?: boolean;
}

export function QuizSection({ analysis, isLoading }: QuizSectionProps) {
    const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<Record<number, number>>({});
    const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});

    // Reset state when analysis changes (using date as proxy or just on mount)
    useEffect(() => {
        setSelectedQuizAnswer({});
        setShowExplanation({});
    }, [analysis]); // Whenever analysis object changes

    const handleQuizSelect = (qIndex: number, optionIndex: number) => {
        if (showExplanation[qIndex]) return; // Prevent changing after revealing
        setSelectedQuizAnswer(prev => ({ ...prev, [qIndex]: optionIndex }));
        setShowExplanation(prev => ({ ...prev, [qIndex]: true }));
    };

    if (isLoading) {
        // Since original code didn't have specific skeleton for quiz (it was part of strategy loading maybe?), 
        // asking for review. Wait, previous AnalysisPage passed [1, 2, 3] to strategyList skeleton map.
        // I will add a simple skeleton here or just return nothing if parent handles layout skeleton differently.
        // Let's add independent skeleton.
        return (
            <div className={styles.reportCard}>
                <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
                <div className={styles.quizList}>
                    {[1, 2, 3].map((i) => (
                        <div key={i} className={styles.skeleton} style={{ height: '5rem' }} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.reportCard}>
            <h2 className={styles.cardTitle}>📝 실전 연습 퀴즈</h2>
            <div className={styles.quizList}>
                {(analysis.quiz || []).map((q, qIdx) => (
                    <div key={qIdx} className={styles.quizCard} style={{ border: 'none', padding: 0, background: 'transparent', boxShadow: 'none' }}>
                        <p className={styles.quizQuestion}>Q{qIdx + 1}. {q.question}</p>
                        <div className={styles.optionList}>
                            {q.options.map((opt, optIdx) => {
                                const isSelected = selectedQuizAnswer[qIdx] === optIdx;
                                const isCorrect = q.answer === optIdx;
                                const isRevealed = showExplanation[qIdx];

                                let className = styles.optionBtn;
                                if (isRevealed) {
                                    if (isCorrect) className += ` ${styles.correct}`;
                                    else if (isSelected) className += ` ${styles.incorrect}`;
                                } else if (isSelected) {
                                    className += ` ${styles.selected}`;
                                }

                                return (
                                    <button
                                        key={optIdx}
                                        className={className}
                                        onClick={() => handleQuizSelect(qIdx, optIdx)}
                                        disabled={isRevealed}
                                    >
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>
                        {showExplanation[qIdx] && (
                            <div className={styles.explanation}>
                                <strong>해설:</strong> {q.explanation}
                            </div>
                        )}
                    </div>
                ))}
                {(!analysis.quiz || analysis.quiz.length === 0) && (
                    <p>생성된 퀴즈가 없습니다.</p>
                )}
            </div>
        </div>
    );
}

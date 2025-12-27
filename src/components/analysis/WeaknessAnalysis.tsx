import styles from "../AnalysisView.module.css";
import { AnalysisResult } from "@/lib/analysis-store";

interface WeaknessAnalysisProps {
    analysis: AnalysisResult;
    isLoading?: boolean;
}

export function WeaknessAnalysis({ analysis, isLoading }: WeaknessAnalysisProps) {
    if (isLoading) {
        return (
            <div className={styles.reportCard}>
                <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
                <div className={styles.verticalList}>
                    {[1, 2].map((i) => (
                        <div key={i} style={{ marginBottom: '1.5rem' }}>
                            <div className={styles.skeleton} style={{ width: '30%', height: '1.2rem', marginBottom: '1rem' }} />
                            <div className={styles.skeleton} style={{ width: '90%', height: '1rem', marginBottom: '0.5rem' }} />
                            <div className={styles.skeleton} style={{ width: '100%', height: '3rem', borderRadius: '8px' }} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.reportCard}>
            <h2 className={styles.cardTitle}>🔍 자주 틀리는 패턴 & 개선점</h2>
            <div className={styles.verticalList}>
                {(analysis.grammarPatterns || []).map((item: any, idx: number) => {
                    const parts = item.explanation.split('💡 선생님의 팁:');
                    const mainExpl = parts[0].trim();
                    const tipText = parts.length > 1 ? parts[1].trim() : null;

                    return (
                        <div key={idx} className={styles.weaknessItem}>
                            <h3 className={styles.weaknessTitle}>
                                <span className={styles.weaknessIndex}>{idx + 1}.</span> {item.pattern}
                            </h3>
                            <div className={styles.weaknessContent}>
                                <p className={styles.weaknessText}>{mainExpl}</p>
                                {tipText && (
                                    <div className={styles.tipBox}>
                                        <span className={styles.tipIcon}>💡</span>
                                        <div className={styles.tipContent}>
                                            <span className={styles.tipLabel}>선생님의 팁:</span>
                                            {tipText}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className={styles.exampleList}>
                                {(item.examples || []).map((ex: any, exIdx: number) => (
                                    <div key={exIdx} className={styles.exampleItem}>
                                        <div className={styles.incorrectSentence}>❌ {ex.incorrect}</div>
                                        <div className={styles.correctSentence}>✅ {ex.correct}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

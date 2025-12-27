import styles from "../AnalysisView.module.css";
import { AnalysisResult } from "@/lib/analysis-store";

interface StrategySectionProps {
    analysis: AnalysisResult;
    isLoading?: boolean;
}

export function StrategySection({ analysis, isLoading }: StrategySectionProps) {
    if (isLoading) {
        return (
            <div className={styles.reportCard}>
                <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
                <div className={styles.strategyList}>
                    {[1, 2, 3].map((i) => (
                        <div key={i} className={styles.skeleton} style={{ height: '3rem' }} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.reportCard}>
            <h2 className={styles.cardTitle}>💡 맞춤 학습 전략</h2>
            <ul className={styles.strategyList}>
                {(analysis.strategy || []).map((sc: any, idx: number) => (
                    <li key={idx} className={styles.strategyItem}>
                        {typeof sc === 'string' ? (
                            sc
                        ) : (
                            // Structured Strategy Display
                            <div>
                                <div className={styles.strategyHeader}>
                                    <div className={styles.strategyTitle}>{sc.action}</div>
                                </div>

                                {sc.theory ? (
                                    // New Rich Layout
                                    <div className={styles.strategyBody}>
                                        <div className={styles.strategySubSection}>
                                            <div className={styles.strategyLabel}>
                                                <span className={styles.sectionIcon}>💡</span> 핵심 포인트 (Core Point)
                                            </div>
                                            <div className={styles.strategyContent}>{sc.theory}</div>
                                        </div>

                                        <div className={styles.strategySubSection}>
                                            <div className={styles.strategyLabel}>
                                                <span className={styles.sectionIcon}>📋</span> 오늘의 학습 (Study List)
                                            </div>
                                            <div className={styles.strategyContent}>{sc.mechanics}</div>
                                        </div>

                                        <div className={styles.strategySubSection}>
                                            <div className={styles.strategyLabel}>
                                                <span className={styles.sectionIcon}>🚀</span> 실전 응용 (Action Item)
                                            </div>
                                            <div className={styles.strategyContent}>{sc.application}</div>
                                        </div>

                                        {sc.message && (
                                            <div className={styles.teacherMessage}>
                                                <span>💌</span>
                                                <div>{sc.message}</div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    // Fallback for old data or simple format
                                    <div style={{ fontSize: '0.9rem', color: 'var(--muted-foreground)', background: 'var(--muted)', padding: '0.75rem', borderRadius: '6px', marginTop: '0.25rem', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                        💡 예시: {sc.example}
                                    </div>
                                )}
                            </div>
                        )}
                    </li>
                ))}
                {(!analysis.strategy || analysis.strategy.length === 0) && (
                    <li className={styles.strategyItem}>제안된 학습 전략이 없습니다.</li>
                )}
            </ul>
        </div>
    );
}

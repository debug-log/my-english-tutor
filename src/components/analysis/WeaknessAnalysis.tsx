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
                {(analysis.grammarPatterns || []).map((item, idx) => (
                    <div key={idx} style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--destructive)' }}>
                            {idx + 1}. {item.pattern}
                        </h3>
                        <p style={{ margin: '0 0 1rem 0', lineHeight: 1.6 }}>{item.explanation}</p>
                        {(item.examples || []).map((ex, exIdx) => (
                            <div key={exIdx} style={{ background: 'var(--muted)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                                <div style={{ color: 'var(--destructive)', textDecoration: 'line-through', marginBottom: '0.25rem' }}>❌ {ex.incorrect}</div>
                                <div style={{ color: 'var(--primary)', fontWeight: 600 }}>✅ {ex.correct}</div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

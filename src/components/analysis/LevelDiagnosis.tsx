import styles from "../AnalysisView.module.css";
import { AnalysisResult } from "@/lib/analysis-store";

interface LevelDiagnosisProps {
    analysis: AnalysisResult;
    isLoading?: boolean;
}

export function LevelDiagnosis({ analysis, isLoading }: LevelDiagnosisProps) {
    if (isLoading) {
        return (
            <div className={styles.reportCard}>
                <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem 0' }}>
                    <div className={styles.skeleton} style={{ width: '120px', height: '40px' }} />
                    <div className={styles.skeleton} style={{ width: '80%', height: '1rem' }} />
                    <div className={styles.skeleton} style={{ width: '60%', height: '1rem' }} />
                </div>
            </div>
        );
    }

    const levelText = analysis.level || "진단 결과 없음";
    const splitIndex = levelText.indexOf(". ");
    const hasSplit = splitIndex !== -1;
    const title = hasSplit ? levelText.substring(0, splitIndex + 1) : levelText;
    const desc = hasSplit ? levelText.substring(splitIndex + 1) : "";

    return (
        <div className={styles.reportCard}>
            <h2 className={styles.cardTitle}>🏆 종합 레벨 진단</h2>
            <div className={styles.levelDiagnosis}>
                <div className={styles.levelMain}>
                    <p className={styles.levelGrade}>{title}</p>
                    <p className={styles.levelText}>{desc}</p>
                </div>

                {analysis.rubricAnalysis && (
                    <div className={styles.rubricGrid}>
                        <div className={styles.rubricItem}>
                            <span className={styles.rubricLabel}>문법 (Grammar)</span>
                            <div className={styles.rubricValue}>{analysis.rubricAnalysis.grammar}</div>
                        </div>
                        <div className={styles.rubricItem}>
                            <span className={styles.rubricLabel}>어휘 (Vocab)</span>
                            <div className={styles.rubricValue}>{analysis.rubricAnalysis.vocabulary}</div>
                        </div>
                        <div className={styles.rubricItem}>
                            <span className={styles.rubricLabel}>자연스러움 (Flow)</span>
                            <div className={styles.rubricValue}>{analysis.rubricAnalysis.coherence}</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

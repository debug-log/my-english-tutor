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
                    {desc && <p className={styles.levelText}>{desc}</p>}
                </div>

                {analysis.rubricAnalysis && (
                    <div className={styles.rubricGrid}>
                        <div className={styles.rubricItem}>
                            <span className={styles.rubricLabel}>문법 (Grammar)</span>
                            <div className={styles.rubricValue}>
                                {typeof analysis.rubricAnalysis.grammar === 'string' ? analysis.rubricAnalysis.grammar : (
                                    <>
                                        <div>{analysis.rubricAnalysis.grammar?.diagnosis}</div>
                                        <div className={styles.rubricImprovement}>
                                            💡 {analysis.rubricAnalysis.grammar?.improvement}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className={styles.rubricItem}>
                            <span className={styles.rubricLabel}>어휘 (Vocab)</span>
                            <div className={styles.rubricValue}>
                                {typeof analysis.rubricAnalysis.vocabulary === 'string' ? analysis.rubricAnalysis.vocabulary : (
                                    <>
                                        <div>{analysis.rubricAnalysis.vocabulary?.diagnosis}</div>
                                        <div className={styles.rubricImprovement}>
                                            💡 {analysis.rubricAnalysis.vocabulary?.improvement}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className={styles.rubricItem}>
                            <span className={styles.rubricLabel}>논리 (Logic)</span>
                            <div className={styles.rubricValue}>
                                {typeof analysis.rubricAnalysis.logic === 'string' ? analysis.rubricAnalysis.logic : (
                                    <>
                                        <div>{analysis.rubricAnalysis.logic?.diagnosis}</div>
                                        <div className={styles.rubricImprovement}>
                                            💡 {analysis.rubricAnalysis.logic?.improvement}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className={styles.rubricItem}>
                            <span className={styles.rubricLabel}>자연스러움 (Flow)</span>
                            <div className={styles.rubricValue}>
                                {typeof analysis.rubricAnalysis.flow === 'string' ? analysis.rubricAnalysis.flow : (
                                    <>
                                        <div>{analysis.rubricAnalysis.flow?.diagnosis}</div>
                                        <div className={styles.rubricImprovement}>
                                            💡 {analysis.rubricAnalysis.flow?.improvement}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className={styles.rubricItem}>
                            <span className={styles.rubricLabel}>어조 (Tone)</span>
                            <div className={styles.rubricValue}>
                                {typeof analysis.rubricAnalysis.tone === 'string' ? analysis.rubricAnalysis.tone : (
                                    (analysis.rubricAnalysis.tone || (analysis.rubricAnalysis as any).professionalism) ? (
                                        <>
                                            <div>{analysis.rubricAnalysis.tone?.diagnosis || (analysis.rubricAnalysis as any).professionalism}</div>
                                            {analysis.rubricAnalysis.tone?.improvement && (
                                                <div className={styles.rubricImprovement}>
                                                    💡 {analysis.rubricAnalysis.tone.improvement}
                                                </div>
                                            )}
                                        </>
                                    ) : null
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

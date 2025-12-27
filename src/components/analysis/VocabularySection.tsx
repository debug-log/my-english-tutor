import styles from "../AnalysisView.module.css";
import { AnalysisResult } from "@/lib/analysis-store";

interface VocabularySectionProps {
    analysis: AnalysisResult;
    isLoading?: boolean;
}

export function VocabularySection({ analysis, isLoading }: VocabularySectionProps) {
    if (isLoading) {
        return (
            <div className={styles.reportCard}>
                <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
                <div className={styles.vocabGrid}>
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={styles.skeleton} style={{ height: '100px' }} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.reportCard}>
            <h2 className={styles.cardTitle}>📚 추천 어휘 10선</h2>
            <div className={styles.vocabGrid}>
                {(analysis.vocabularyList || []).map((v, idx) => (
                    <div key={idx} className={styles.vocabCard}>
                        <div className={styles.vocabWord}>{v.word}</div>
                        <div className={styles.vocabMeaning}>{v.meaning}</div>
                        <div className={styles.vocabExample}>"{v.example}"</div>
                    </div>
                ))}
                {(!analysis.vocabularyList || analysis.vocabularyList.length === 0) && (
                    <p style={{ color: 'var(--muted-foreground)' }}>추천 어휘가 없습니다.</p>
                )}
            </div>
        </div>
    );
}

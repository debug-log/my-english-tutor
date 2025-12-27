import { Entry } from "@/types";
import EntryCard from "./EntryCard";
import styles from "./EntryList.module.css";
import { useState } from "react";

interface EntryListProps {
    entries: Entry[];
    onDelete: (id: string) => void;
    onEdit: (entry: Entry) => void;
    onUpdate?: (entry: Entry) => void;
}

export default function EntryList({ entries, onDelete, onEdit, onUpdate }: EntryListProps) {
    if (entries.length === 0) {
        return (
            <div className={styles.empty}>
                <p>아직 작성된 내용이 없습니다. 첫 글을 남겨보세요!</p>
            </div>
        );
    }

    // State for pagination
    const [visibleCount, setVisibleCount] = useState(5);

    // Group entries by date
    const groupedEntries = entries.reduce((groups, entry) => {
        const date = entry.date;
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(entry);
        return groups;
    }, {} as Record<string, Entry[]>);

    // Sort dates descending
    const sortedDates = Object.keys(groupedEntries).sort((a, b) =>
        new Date(b).getTime() - new Date(a).getTime()
    );

    const visibleDates = sortedDates.slice(0, visibleCount);
    const hasMore = visibleCount < sortedDates.length;

    const handleLoadMore = () => {
        setVisibleCount((prev) => prev + 5);
    };

    return (
        <div className={styles.list}>
            {visibleDates.map((date) => (
                <div key={date} className={styles.dateGroup}>
                    <h3 className={styles.dateHeader}>
                        {new Date(date).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            weekday: 'long'
                        })}
                    </h3>
                    <div className={styles.entriesGrid}>
                        {groupedEntries[date].map((entry) => (
                            <EntryCard
                                key={entry.id}
                                entry={entry}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onUpdate={onUpdate}
                                hideDate={true}
                            />
                        ))}
                    </div>
                </div>
            ))}

            {hasMore && (
                <button
                    onClick={handleLoadMore}
                    className={styles.loadMoreButton}
                >
                    더 불러오기
                </button>
            )}
        </div>
    );
}

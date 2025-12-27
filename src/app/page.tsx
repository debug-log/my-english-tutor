"use client";

import { useEntries } from "@/lib/store";
import EntryForm from "@/components/EntryForm";
import EntryList from "@/components/EntryList";
import styles from "./page.module.css";
import { useRef, useState, useEffect } from "react";
import { Entry, NewEntry } from "@/types";
import { useToast } from "@/lib/toast-context";
import Modal from "@/components/Modal";

import AnalysisView from "@/components/AnalysisView";

export default function Home() {
  const { entries, fetchEntries, addEntry, updateEntry, deleteEntry, importEntries, isLoaded } = useEntries();
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [activeTab, setActiveTab] = useState<'write' | 'list' | 'analysis'>('write');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading your tutor...</div>;

  const handleSaveEntry = async (data: NewEntry) => {
    try {
      if (editingEntry) {
        await updateEntry(editingEntry.id, data);
        addToast("일기가 수정되었습니다.");
        setEditingEntry(null);
      } else {
        await addEntry(data);
        addToast("새로운 피드가 저장되었습니다!");
        // setActiveTab('list'); // Stay on write tab
      }
    } catch (e) {
      addToast("저장에 실패했습니다.", "error");
    }
  };

  const handleEdit = (entry: Entry) => {
    setEditingEntry(entry);
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
  };

  const handleExport = () => {
    // ... same logic ...
    const dataStr = JSON.stringify(entries, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `english-tutor-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast("데이터가 내보내졌습니다.");
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // ... same logic ...
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content) as Entry[];
        if (Array.isArray(importedData)) {
          importEntries(importedData);
          addToast("데이터를 성공적으로 가져왔습니다!");
          setActiveTab('list');
        } else {
          addToast("올바르지 않은 파일 형식입니다.", "error");
        }
      } catch (error) {
        console.error("Import failed:", error);
        addToast("파일을 읽는 중 오류가 발생했습니다.", "error");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.title}>내 영어 과외 선생님</h1>
          <div className={styles.headerActions}>
            {/* Minimized Import/Export */}
            <button onClick={handleImportClick} className={styles.miniLink}>
              Import Data
            </button>
            <span className={styles.divider}>|</span>
            <button onClick={handleExport} className={styles.miniLink}>
              Export JSON
            </button>
          </div>
        </div>
        <p className={styles.subtitle}>매일 쓰고, 교정받고, 성장하세요</p>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json"
          style={{ display: 'none' }}
        />
      </header>

      {/* Tabs */}
      <nav className={styles.tabNav}>
        <button
          className={`${styles.tabButton} ${activeTab === 'write' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('write')}
        >
          새 피드 작성
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'list' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('list')}
        >
          전체 기록 ({entries.length})
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'analysis' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          학습 분석
        </button>
      </nav>

      <div className={styles.grid}>
        {/* Write Tab */}
        {activeTab === 'write' && (
          <section className={styles.column}>
            {/* <h2 className={styles.sectionTitle}>새 피드 작성하기</h2> Title redundant with tab? Maybe keep for structure */}
            <EntryForm
              onSave={handleSaveEntry}
            />
          </section>
        )}

        {/* List Tab */}
        {activeTab === 'list' && (
          <section className={styles.column}>
            {/* <h2 className={styles.sectionTitle}>전체 기록</h2> */}
            <EntryList
              entries={entries}
              onDelete={async (id) => {
                if (confirm('정말 삭제하시겠습니까?')) {
                  try {
                    await deleteEntry(id);
                    addToast("삭제되었습니다.");
                  } catch (e) {
                    addToast("삭제 실패", "error");
                  }
                }
              }}
              onEdit={handleEdit}
            />
          </section>
        )}

        {/* Analysis Tab */}
        {activeTab === 'analysis' && (
          <section className={styles.column}>
            <AnalysisView />
          </section>
        )}
      </div>

      <Modal isOpen={!!editingEntry} onClose={handleCancelEdit}>
        <div style={{ padding: '0 0.5rem' }}>
          <EntryForm
            initialData={editingEntry}
            onSave={handleSaveEntry}
            onCancel={handleCancelEdit}
          />
        </div>
      </Modal>

    </main>
  );
}

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
  const { entries, fetchEntries, addEntry, updateEntry, deleteEntry, isLoaded, error } = useEntries();
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [activeTab, setActiveTab] = useState<'write' | 'list' | 'analysis'>('write');
  const { addToast } = useToast();

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  if (!isLoaded && !error) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading your tutor...</div>;

  if (error && !isLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#f8fafc]">
        <div className="bg-white p-8 rounded-2xl shadow-xl shadow-blue-100/50 max-w-md w-full border border-blue-50 text-center animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">연결 설정 확인 필요</h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            데이터베이스(Supabase)와 통신할 수 없습니다. 배포 환경의 보안 비밀(Secrets) 설정을 확인해주세요.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => fetchEntries()}
              className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all active:scale-[0.98] shadow-lg shadow-blue-200"
            >
              다시 연결 시도
            </button>
            <button
              onClick={() => useEntries.setState({ isLoaded: true })}
              className="w-full py-3.5 bg-slate-50 text-slate-600 rounded-xl font-medium hover:bg-slate-100 transition-all"
            >
              오프라인 모드로 둘러보기
            </button>
          </div>

          <div className="mt-8 p-4 bg-slate-50 rounded-xl text-left">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">도움말 (GitHub Actions 설정)</p>
            <ol className="text-sm text-slate-600 space-y-2 list-decimal ml-4">
              <li>GitHub 저장소 <b>Settings</b>로 이동</li>
              <li><b>Secrets and variables → Actions</b> 클릭</li>
              <li><code>NEXT_PUBLIC_SUPABASE_URL</code> 추가</li>
              <li><code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> 추가</li>
              <li>Actions 탭에서 워크플로우를 재실행하세요.</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

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

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.title}>내 영어 과외 선생님</h1>

        </div>
        <p className={styles.subtitle}>매일 쓰고, 교정받고, 성장하세요</p>


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
              onUpdate={async (updatedEntry) => {
                try {
                  await updateEntry(updatedEntry.id, updatedEntry);
                } catch (e) {
                  console.error(e);
                  addToast("업데이트 실패", "error");
                }
              }}
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

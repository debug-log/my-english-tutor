"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Entry } from "@/types";
import { useAnalysisStore } from "@/lib/analysis-store";

export default function SupabaseMigration() {
    const [entries, setEntries] = useState<Entry[]>([]);
    const [status, setStatus] = useState<"idle" | "migrating" | "done" | "error">("idle");
    const [log, setLog] = useState<string[]>([]);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Load entries from LocalStorage
        const saved = localStorage.getItem("english-tutor-entries");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setEntries(parsed);
            } catch (e) {
                console.error("Failed to parse local entries", e);
            }
        }
    }, []);

    const addLog = (msg: string) => setLog((prev) => [...prev, msg]);

    const verifyConnection = async () => {
        setStatus("migrating"); // Reuse migrating state for loading spinner
        addLog("🔍 Verifying Supabase connection...");
        try {
            const { count, error } = await supabase.from('entries').select('*', { count: 'exact', head: true });

            if (error) {
                throw error;
            }

            addLog(`✅ Connection Verified! Supabase is reachable. (Current entries: ${count})`);
            setStatus("idle");
        } catch (e: any) {
            setStatus("error");
            addLog(`❌ Connection Failed: ${e.message}`);
            addLog("Tip: Check your .env.local file. Did you restart the server?");
        }
    };

    const handleMigration = async () => {
        setStatus("migrating");
        setLog([]);
        setProgress(0);
        addLog("Starting migration...");

        try {
            // 1. Migrate Entries
            if (entries.length > 0) {
                addLog(`Found ${entries.length} entries to migrate.`);

                let successCount = 0;

                for (const entry of entries) {
                    const { error } = await supabase.from("entries").upsert({
                        id: entry.id,
                        date: entry.date,
                        original_text: entry.originalText,
                        correction: entry.correction,
                        notes: entry.notes,
                        tags: entry.tags,
                        // user_id is optional/null for now as per schema
                    });

                    if (error) {
                        addLog(`❌ Failed to migrate entry ${entry.date}: ${error.message}`);
                    } else {
                        successCount++;
                    }
                    setProgress((prev) => prev + 1);
                }
                addLog(`✅ Successfully migrated ${successCount}/${entries.length} entries.`);
            } else {
                addLog("ℹ️ No entries found in LocalStorage.");
            }

            // 2. Migrate Analysis History
            const analysisHistory = useAnalysisStore.getState().history;
            if (analysisHistory.length > 0) {
                addLog(`Found ${analysisHistory.length} analysis records to migrate.`);

                let successCount = 0;

                for (const record of analysisHistory) {
                    // We assume analysis_history table structure matches
                    // Since analysis_history table doesn't have a known ID from local store usually (unless we stored it), 
                    // we might generate one or let DB generate it. 
                    // However, analysis-store usually didn't store IDs. 
                    // Let's check if we can insert them safely.

                    const { error } = await supabase.from("analysis_history").insert({
                        date: record.date, // This is ISO string in store?
                        result: record, // Store the whole JSON object
                        // user_id null
                    });

                    if (error) {
                        addLog(`❌ Failed to migrate analysis for ${record.date}: ${error.message}`);
                    } else {
                        successCount++;
                    }
                }
                addLog(`✅ Successfully migrated ${successCount}/${analysisHistory.length} analysis records.`);
            } else {
                addLog("ℹ️ No analysis history found.");
            }

            setStatus("done");
            addLog("🎉 Migration completed!");

        } catch (e: any) {
            setStatus("error");
            addLog(`🔥 Critical Error: ${e.message}`);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto bg-white rounded-xl shadow-md border border-gray-100">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Data Migration</h1>

            <div className="mb-6 space-y-2 text-gray-600">
                <p>Ready to migrate data from <strong>LocalStorage</strong> to <strong>Supabase</strong>.</p>
                <ul className="list-disc list-inside bg-gray-50 p-4 rounded-lg">
                    <li>Entries found: <strong>{entries.length}</strong></li>
                    <li>Analysis records found: <strong>{useAnalysisStore.getState().history.length}</strong></li>
                </ul>
            </div>

            {status === "idle" && (
                <div className="space-y-3">
                    <button
                        onClick={verifyConnection}
                        className="w-full py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors border border-gray-300"
                    >
                        Verify Connection First
                    </button>
                    <button
                        onClick={handleMigration}
                        className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                    >
                        Start Migration via Supabase Client
                    </button>
                </div>
            )}

            {status === "migrating" && (
                <div className="space-y-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${(progress / (entries.length || 1)) * 100}%` }}
                        ></div>
                    </div>
                    <p className="text-center text-sm text-gray-500">Migrating...</p>
                </div>
            )}

            <div className="mt-8 p-4 bg-gray-900 text-gray-100 rounded-lg h-64 overflow-y-auto font-mono text-xs">
                {log.length === 0 ? <span className="text-gray-500 opacity-50">Log output will appear here...</span> : log.map((l, i) => (
                    <div key={i} className="mb-1 border-b border-gray-800 pb-1 last:border-0">{l}</div>
                ))}
            </div>
        </div>
    );
}

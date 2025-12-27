"use client";

import React, { useEffect, useRef } from 'react';
import { useDebugStore } from '@/lib/debug-store';
import { X, Trash2, Bug, PlayCircle, PauseCircle } from 'lucide-react';

export function DebugPanel() {
    const { logs, isOpen, isEnabled, togglePanel, toggleDebugMode, clearLogs, unreadCount } = useDebugStore();
    const logContainerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of logs
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs, isOpen]);

    if (!isOpen) {
        return (
            <button
                onClick={togglePanel}
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    zIndex: 9999,
                    background: '#1e293b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '50px',
                    height: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1.0)'}
                title="Open Debug Console"
            >
                <Bug size={24} />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '0px',
                        right: '0px',
                        background: '#ef4444',
                        color: 'white',
                        borderRadius: '9999px',
                        padding: '2px 5px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        minWidth: '16px',
                        height: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transform: 'translate(25%, -25%)'
                    }}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '400px',
            height: '500px',
            background: 'rgba(30, 41, 59, 0.95)',
            backdropFilter: 'blur(10px)',
            color: '#f8fafc',
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid #334155',
            fontSize: '0.85rem'
        }}>
            {/* Header */}
            <div style={{
                padding: '10px 16px',
                borderBottom: '1px solid #334155',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#0f172a'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                    <Bug size={16} />
                    <span>Debug Console</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={toggleDebugMode}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: isEnabled ? '#4ade80' : '#94a3b8',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.8rem'
                        }}
                    >
                        {isEnabled ? <PauseCircle size={16} /> : <PlayCircle size={16} />}
                        {isEnabled ? 'Recording' : 'Paused'}
                    </button>
                    <button
                        onClick={clearLogs}
                        title="Clear Logs"
                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                    >
                        <Trash2 size={16} />
                    </button>
                    <button
                        onClick={togglePanel}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Logs List */}
            <div
                ref={logContainerRef}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                }}
            >
                {logs.length === 0 ? (
                    <div style={{ color: '#64748b', textAlign: 'center', marginTop: '40px' }}>
                        No logs yet...
                    </div>
                ) : (
                    logs.map(log => <LogItem key={log.id} log={log} />)
                )}
            </div>
        </div>
    );
}

function LogItem({ log }: { log: any }) {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const detailsString = log.details ? JSON.stringify(log.details, null, 2) : '';
    const sizeBytes = new Blob([detailsString]).size;
    const sizeDisplay = sizeBytes > 1024
        ? `${(sizeBytes / 1024).toFixed(2)} KB`
        : `${sizeBytes} B`;

    return (
        <div style={{
            padding: '8px',
            background: '#1e293b',
            borderRadius: '6px',
            borderLeft: `3px solid ${getColorForType(log.type)}`
        }}>
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '4px',
                    color: '#94a3b8',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                }}
            >
                <div style={{ display: 'flex', gap: '8px' }}>
                    <span>{log.timestamp}</span>
                    <span style={{ textTransform: 'uppercase', fontWeight: 600, color: getColorForType(log.type) }}>{log.type}</span>
                </div>
                {log.details && (
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.65rem', color: '#64748b' }}>{sizeDisplay}</span>
                        <span style={{ fontSize: '0.7rem', background: '#334155', padding: '1px 6px', borderRadius: '4px' }}>
                            {isExpanded ? 'Collapse' : 'Expand'}
                        </span>
                    </div>
                )}
            </div>

            <div style={{ wordBreak: 'break-all', fontSize: '0.8rem' }}>{log.message}</div>

            {log.details && (
                <div style={{
                    display: isExpanded ? 'block' : 'none',
                    marginTop: '6px',
                    animation: 'fadeIn 0.2s'
                }}>
                    <pre style={{
                        background: '#0f172a',
                        padding: '8px',
                        borderRadius: '4px',
                        overflowX: 'auto',
                        fontSize: '0.75rem',
                        color: '#cbd5e1',
                        margin: 0,
                        maxHeight: '300px'
                    }}>
                        {detailsString}
                    </pre>
                </div>
            )}
        </div>
    );
}

function getColorForType(type: string) {
    switch (type) {
        case 'query': return '#60a5fa'; // Blue
        case 'error': return '#f87171'; // Red
        case 'warning': return '#fbbf24'; // Amber
        case 'success': return '#4ade80'; // Green
        default: return '#94a3b8'; // Slate
    }
}

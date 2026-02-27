'use client';

import { useEffect, useState } from 'react';

interface Session {
    id: string;
    name: string;
    stage: string;
}

interface SessionPickerProps {
    currentSessionId: string | null;
    onSelect: (id: string | null) => void;
}

export function SessionPicker({ currentSessionId, onSelect }: SessionPickerProps) {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        fetch('/api/sessions')
            .then((r) => r.json())
            .then((data) => setSessions(data.sessions || []))
            .catch(() => { });
    }, []);

    const current = sessions.find((s) => s.id === currentSessionId);

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            >
                <span>📦</span>
                <span>{current ? current.name : 'Select session'}</span>
                <span style={{ color: 'var(--text-muted)' }}>▾</span>
            </button>

            {open && (
                <div
                    className="absolute top-full right-0 mt-1 w-56 rounded-lg overflow-hidden z-50"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                    {sessions.length === 0 && (
                        <p className="p-3 text-xs" style={{ color: 'var(--text-muted)' }}>No sessions</p>
                    )}
                    {sessions.map((session) => (
                        <button
                            key={session.id}
                            onClick={() => { onSelect(session.id); setOpen(false); }}
                            className="w-full px-3 py-2 text-left text-xs hover:bg-[var(--bg-card-hover)] flex items-center gap-2"
                        >
                            <span style={{ color: session.id === currentSessionId ? 'var(--accent)' : 'var(--text-primary)' }}>
                                {session.name}
                            </span>
                            <span className="ml-auto badge badge-info">{session.stage}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

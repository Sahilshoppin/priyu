'use client';

import { useState } from 'react';

interface APICall {
    id: string;
    stage: string;
    service: string;
    method: string;
    request?: Record<string, unknown>;
    response?: Record<string, unknown>;
    statusCode?: number;
    durationMs: number;
    timestamp: string;
    error?: string;
}

interface ApiInspectorProps {
    calls: APICall[];
}

export function ApiInspector({ calls }: ApiInspectorProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    return (
        <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                API Inspector
            </h3>

            {calls.length === 0 && (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No API calls yet</p>
            )}

            <div className="space-y-1">
                {calls.map((call) => (
                    <div key={call.id}>
                        <button
                            onClick={() => setExpandedId(expandedId === call.id ? null : call.id)}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs hover:bg-[var(--bg-card-hover)] transition-colors"
                        >
                            <span className={`badge ${call.error ? 'badge-error' : 'badge-success'}`}>
                                {call.service}
                            </span>
                            <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
                                {call.method}
                            </span>
                            <span className="ml-auto" style={{ color: 'var(--text-muted)' }}>
                                {call.durationMs}ms
                            </span>
                        </button>

                        {expandedId === call.id && (
                            <div className="ml-4 mt-1 p-2 rounded text-xs font-mono" style={{ background: 'var(--bg-primary)' }}>
                                {call.request && (
                                    <div className="mb-2">
                                        <span style={{ color: 'var(--text-muted)' }}>Request:</span>
                                        <pre className="mt-1 overflow-x-auto" style={{ color: 'var(--text-secondary)' }}>
                                            {JSON.stringify(call.request, null, 2)}
                                        </pre>
                                    </div>
                                )}
                                {call.response && (
                                    <div>
                                        <span style={{ color: 'var(--text-muted)' }}>Response:</span>
                                        <pre className="mt-1 overflow-x-auto" style={{ color: 'var(--text-secondary)' }}>
                                            {JSON.stringify(call.response, null, 2)}
                                        </pre>
                                    </div>
                                )}
                                {call.error && (
                                    <div style={{ color: 'var(--error)' }}>Error: {call.error}</div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

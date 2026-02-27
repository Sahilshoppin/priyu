'use client';

const STAGES = [
    { key: 'IDLE', label: 'Idle', icon: '⏸' },
    { key: 'ANALYZING', label: 'Analyzing', icon: '🔍' },
    { key: 'UI_GENERATION', label: 'UI Design', icon: '🎨' },
    { key: 'UI_REVIEW', label: 'Review', icon: '👀' },
    { key: 'CODE_GENERATION', label: 'Code Gen', icon: '⚡' },
    { key: 'BACKEND_SETUP', label: 'Backend', icon: '🗄' },
    { key: 'SECURITY_SETUP', label: 'Security', icon: '🔒' },
    { key: 'MONITORING_SETUP', label: 'Monitoring', icon: '📊' },
    { key: 'COMPLETE', label: 'Complete', icon: '✅' },
];

interface BuildProgressProps {
    status: {
        stage: string;
        metadata?: { appName: string; idea: string };
        generatedFiles: unknown[];
        errors: unknown[];
        startedAt?: string;
    } | null;
}

export function BuildProgress({ status }: BuildProgressProps) {
    const currentIdx = status ? STAGES.findIndex((s) => s.key === status.stage) : -1;
    const progress = currentIdx >= 0 ? Math.round((currentIdx / (STAGES.length - 1)) * 100) : 0;
    const isFailed = status?.stage === 'FAILED';

    return (
        <div className="card">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Build Progress
                </h2>
                <span className="text-xs font-mono" style={{ color: 'var(--accent)' }}>
                    {progress}%
                </span>
            </div>

            {status?.metadata && (
                <div className="mb-3">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {status.metadata.appName}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                        {status.metadata.idea}
                    </p>
                </div>
            )}

            {/* Progress bar */}
            <div className="w-full h-2 rounded-full mb-4" style={{ background: 'var(--bg-primary)' }}>
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                        width: `${progress}%`,
                        background: isFailed
                            ? 'var(--error)'
                            : 'linear-gradient(90deg, var(--accent), #a855f7)',
                    }}
                />
            </div>

            {/* Stage list */}
            <div className="space-y-1">
                {STAGES.map((stage, i) => {
                    const isComplete = i < currentIdx;
                    const isCurrent = i === currentIdx;
                    const isPending = i > currentIdx;

                    return (
                        <div
                            key={stage.key}
                            className="flex items-center gap-2 py-1 px-2 rounded-md text-xs"
                            style={{
                                background: isCurrent ? 'var(--accent)15' : 'transparent',
                                color: isComplete
                                    ? 'var(--success)'
                                    : isCurrent
                                        ? 'var(--accent)'
                                        : 'var(--text-muted)',
                            }}
                        >
                            <span>{isComplete ? '✓' : stage.icon}</span>
                            <span className={isCurrent ? 'font-semibold' : ''}>{stage.label}</span>
                            {isCurrent && (
                                <span className="ml-auto animate-pulse" style={{ color: 'var(--accent)' }}>●</span>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Stats */}
            {status && (
                <div className="mt-3 pt-3 flex gap-3 text-xs" style={{ borderTop: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Files: {status.generatedFiles.length}</span>
                    <span style={{ color: status.errors.length > 0 ? 'var(--error)' : 'var(--text-muted)' }}>
                        Errors: {status.errors.length}
                    </span>
                </div>
            )}

            {!status && (
                <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>
                    No active build. Run <code>priyu build</code> to start.
                </p>
            )}
        </div>
    );
}

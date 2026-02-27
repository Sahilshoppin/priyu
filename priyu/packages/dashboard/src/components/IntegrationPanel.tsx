'use client';

interface IntegrationPanelProps {
    status: { stage: string; stitchOutput?: unknown; supabaseSchema?: unknown } | null;
}

const integrations = [
    { name: 'Stitch MCP', icon: '🎨', key: 'stitch', check: (s: any) => !!s?.stitchOutput },
    { name: 'Supabase', icon: '⚡', key: 'supabase', check: (s: any) => !!s?.supabaseSchema },
    { name: 'Sentry', icon: '🐛', key: 'sentry', check: () => false },
    { name: 'PostHog', icon: '📈', key: 'posthog', check: () => false },
];

export function IntegrationPanel({ status }: IntegrationPanelProps) {
    return (
        <div className="card">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                Integrations
            </h3>

            <div className="space-y-2">
                {integrations.map((int) => {
                    const active = status ? int.check(status) : false;
                    return (
                        <div
                            key={int.key}
                            className="flex items-center gap-3 p-2 rounded-lg"
                            style={{ background: 'var(--bg-primary)' }}
                        >
                            <span className="text-sm">{int.icon}</span>
                            <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                                {int.name}
                            </span>
                            <div
                                className="ml-auto w-2 h-2 rounded-full"
                                style={{ background: active ? 'var(--success)' : 'var(--text-muted)' }}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

'use client';

interface SupabaseSchema {
    tables: Array<{ name: string; columns: Array<{ name: string; type: string; nullable: boolean; isPrimaryKey?: boolean }> }>;
    policies: Array<{ name: string; table: string; operation: string; expression: string }>;
}

interface SchemaViewerProps {
    schema: SupabaseSchema | null;
}

export function SchemaViewer({ schema }: SchemaViewerProps) {
    if (!schema) {
        return (
            <div>
                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Schema Viewer</h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No schema generated yet</p>
            </div>
        );
    }

    return (
        <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                Schema Viewer
            </h3>

            {/* Tables */}
            <div className="space-y-3">
                {schema.tables.map((table) => (
                    <div key={table.name} className="rounded-lg p-2" style={{ background: 'var(--bg-primary)' }}>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs">🗄</span>
                            <span className="text-xs font-semibold" style={{ color: 'var(--success)' }}>
                                {table.name}
                            </span>
                        </div>
                        <div className="space-y-0.5">
                            {table.columns.map((col) => (
                                <div key={col.name} className="flex items-center gap-2 text-xs px-1">
                                    <span style={{ color: col.isPrimaryKey ? 'var(--warning)' : 'var(--text-muted)' }}>
                                        {col.isPrimaryKey ? '🔑' : '·'}
                                    </span>
                                    <span style={{ color: 'var(--text-primary)' }}>{col.name}</span>
                                    <span className="ml-auto font-mono" style={{ color: 'var(--text-muted)' }}>
                                        {col.type}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* RLS Policies */}
            {schema.policies.length > 0 && (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                    <h4 className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                        RLS Policies
                    </h4>
                    {schema.policies.map((policy) => (
                        <div key={policy.name} className="text-xs mb-1 flex gap-2">
                            <span>🔒</span>
                            <span style={{ color: 'var(--text-primary)' }}>{policy.table}</span>
                            <span className="badge badge-info">{policy.operation}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

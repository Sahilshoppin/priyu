'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';

export function ApiNode({ data }: NodeProps) {
    const d = data as { method: string; path: string; auth: boolean };
    const methodColors: Record<string, string> = {
        GET: '#10b981',
        POST: '#3b82f6',
        PUT: '#f59e0b',
        PATCH: '#f59e0b',
        DELETE: '#ef4444',
    };
    const color = methodColors[d.method] || '#8888a0';

    return (
        <div className="rounded-xl px-4 py-3 min-w-[180px]" style={{ background: `${color}15`, border: `1px solid ${color}50` }}>
            <Handle type="target" position={Position.Left} style={{ background: color }} />
            <div className="flex items-center gap-2 mb-1">
                <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{ background: `${color}30`, color }}
                >
                    {d.method}
                </span>
                <span className="text-xs font-mono" style={{ color: '#e8e8f0' }}>
                    {d.path}
                </span>
            </div>
            {d.auth && (
                <span className="text-[10px]" style={{ color: '#f59e0b' }}>🔐 Auth required</span>
            )}
            <Handle type="source" position={Position.Right} style={{ background: color }} />
        </div>
    );
}

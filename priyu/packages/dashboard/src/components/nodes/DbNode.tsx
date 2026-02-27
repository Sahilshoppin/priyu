'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';

export function DbNode({ data }: NodeProps) {
    const d = data as { name: string; fields: string[] };

    return (
        <div className="rounded-xl px-4 py-3 min-w-[160px]" style={{ background: '#10b98115', border: '1px solid #10b98150' }}>
            <Handle type="target" position={Position.Left} style={{ background: '#10b981' }} />
            <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">🗄</span>
                <span className="text-xs font-semibold" style={{ color: '#6ee7b7' }}>
                    {d.name}
                </span>
            </div>
            <div className="space-y-0.5">
                {(d.fields || []).slice(0, 5).map((field) => (
                    <div key={field} className="text-[10px] font-mono" style={{ color: '#8b8ba0' }}>
                        · {field}
                    </div>
                ))}
                {(d.fields || []).length > 5 && (
                    <div className="text-[10px]" style={{ color: '#5a5a70' }}>
                        +{d.fields.length - 5} more
                    </div>
                )}
            </div>
            <Handle type="source" position={Position.Right} style={{ background: '#10b981' }} />
        </div>
    );
}

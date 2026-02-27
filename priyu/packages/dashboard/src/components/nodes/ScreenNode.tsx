'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';

export function ScreenNode({ data }: NodeProps) {
    return (
        <div className="rounded-xl px-4 py-3 min-w-[180px]" style={{ background: '#7c3aed20', border: '1px solid #7c3aed60' }}>
            <Handle type="target" position={Position.Left} style={{ background: '#7c3aed' }} />
            <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">📱</span>
                <span className="text-xs font-semibold" style={{ color: '#c4b5fd' }}>
                    {(data as { label: string }).label}
                </span>
                {(data as { protected?: boolean }).protected && <span className="text-xs">🔒</span>}
            </div>
            <p className="text-xs truncate" style={{ color: '#8b8ba0', maxWidth: 160 }}>
                {(data as { description: string }).description}
            </p>
            <Handle type="source" position={Position.Right} style={{ background: '#7c3aed' }} />
        </div>
    );
}

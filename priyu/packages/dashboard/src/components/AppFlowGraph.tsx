'use client';

import { useCallback } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    type Node,
    type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ScreenNode } from './nodes/ScreenNode';
import { ApiNode } from './nodes/ApiNode';
import { DbNode } from './nodes/DbNode';

const nodeTypes = {
    screenNode: ScreenNode,
    apiNode: ApiNode,
    dbNode: DbNode,
};

interface FlowData {
    nodes: Node[];
    edges: Edge[];
}

interface AppFlowGraphProps {
    flowData: FlowData | null;
}

export function AppFlowGraph({ flowData }: AppFlowGraphProps) {
    const nodes = flowData?.nodes || [];
    const edges = flowData?.edges || [];

    if (nodes.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
                <div className="text-center">
                    <div className="text-4xl mb-3">🔮</div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        App flow will appear here after analysis
                    </p>
                </div>
            </div>
        );
    }

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            style={{ background: 'var(--bg-primary)' }}
            defaultEdgeOptions={{
                type: 'smoothstep',
                style: { stroke: '#7c3aed60', strokeWidth: 2 },
                animated: true,
            }}
        >
            <Background color="#2a2a3a" gap={20} />
            <Controls />
            <MiniMap
                nodeColor={(node) => {
                    if (node.type === 'screenNode') return '#7c3aed';
                    if (node.type === 'apiNode') return '#3b82f6';
                    if (node.type === 'dbNode') return '#10b981';
                    return '#555';
                }}
                style={{ background: '#13131a' }}
            />
        </ReactFlow>
    );
}

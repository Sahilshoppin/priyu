'use client';

import { useState, useEffect } from 'react';
import type { Node, Edge } from '@xyflow/react';

interface FlowData {
    nodes: Node[];
    edges: Edge[];
}

export function useAppFlow(sessionId: string | null) {
    const [flowData, setFlowData] = useState<FlowData | null>(null);

    useEffect(() => {
        const fetchFlow = async () => {
            try {
                const url = sessionId
                    ? `/api/flow?sessionId=${sessionId}`
                    : '/api/flow';
                const res = await fetch(url);
                const data = await res.json();
                setFlowData(data);
            } catch { }
        };

        fetchFlow();
        const interval = setInterval(fetchFlow, 5000);
        return () => clearInterval(interval);
    }, [sessionId]);

    return { flowData };
}

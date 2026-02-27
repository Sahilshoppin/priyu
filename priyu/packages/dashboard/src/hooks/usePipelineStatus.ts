'use client';

import { useState, useEffect, useRef } from 'react';

interface PipelineStatus {
    sessionId: string;
    stage: string;
    metadata: { appName: string; idea: string };
    generatedFiles: unknown[];
    errors: unknown[];
    apiCallLog: Array<{
        id: string;
        stage: string;
        service: string;
        method: string;
        request?: Record<string, unknown>;
        response?: Record<string, unknown>;
        durationMs: number;
        timestamp: string;
        error?: string;
    }>;
    supabaseSchema?: {
        tables: Array<{ name: string; columns: Array<{ name: string; type: string; nullable: boolean; isPrimaryKey?: boolean }> }>;
        policies: Array<{ name: string; table: string; operation: string; expression: string }>;
    } | null;
    stitchOutput?: unknown;
    startedAt?: string;
    completedAt?: string;
}

export function usePipelineStatus(sessionId: string | null) {
    const [status, setStatus] = useState<PipelineStatus | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const eventSourceRef = useRef<EventSource | null>(null);

    useEffect(() => {
        const url = sessionId
            ? `/api/status?sessionId=${sessionId}`
            : '/api/status';

        const es = new EventSource(url);
        eventSourceRef.current = es;

        es.onopen = () => setIsConnected(true);
        es.onerror = () => setIsConnected(false);
        es.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setStatus(data);
            } catch { }
        };

        return () => {
            es.close();
            eventSourceRef.current = null;
        };
    }, [sessionId]);

    return { status, isConnected };
}

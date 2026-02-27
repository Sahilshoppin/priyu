'use client';

import { useState } from 'react';
import { BuildProgress } from '@/components/BuildProgress';
import { AppFlowGraph } from '@/components/AppFlowGraph';
import { ApiInspector } from '@/components/ApiInspector';
import { SchemaViewer } from '@/components/SchemaViewer';
import { IntegrationPanel } from '@/components/IntegrationPanel';
import { SessionPicker } from '@/components/SessionPicker';
import { usePipelineStatus } from '@/hooks/usePipelineStatus';
import { useAppFlow } from '@/hooks/useAppFlow';

export default function DashboardPage() {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const { status, isConnected } = usePipelineStatus(sessionId);
    const { flowData } = useAppFlow(sessionId);

    return (
        <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
            {/* Header */}
            <header
                className="flex items-center justify-between px-6 py-4"
                style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                        style={{ background: 'linear-gradient(135deg, var(--accent), #a855f7)' }}
                    >
                        P
                    </div>
                    <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Priyu Dashboard
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <SessionPicker currentSessionId={sessionId} onSelect={setSessionId} />
                    <div className="flex items-center gap-2">
                        <div
                            className="w-2 h-2 rounded-full"
                            style={{ background: isConnected ? 'var(--success)' : 'var(--error)' }}
                        />
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {isConnected ? 'Connected' : 'Disconnected'}
                        </span>
                    </div>
                    {status && (
                        <span className="badge badge-accent">{status.stage}</span>
                    )}
                </div>
            </header>

            {/* Main Grid */}
            <div className="grid grid-cols-12 gap-4 p-4" style={{ height: 'calc(100vh - 73px)' }}>
                {/* Left Column — Progress + Integrations */}
                <div className="col-span-3 flex flex-col gap-4 overflow-y-auto">
                    <BuildProgress status={status} />
                    <IntegrationPanel status={status} />
                </div>

                {/* Center — Flow Graph */}
                <div className="col-span-9 flex flex-col gap-4">
                    <div className="card flex-1 min-h-0 p-0 overflow-hidden" style={{ minHeight: '55%' }}>
                        <AppFlowGraph flowData={flowData} />
                    </div>

                    {/* Bottom Row — Inspector + Schema */}
                    <div className="grid grid-cols-2 gap-4" style={{ height: '40%' }}>
                        <div className="card overflow-y-auto">
                            <ApiInspector calls={status?.apiCallLog || []} />
                        </div>
                        <div className="card overflow-y-auto">
                            <SchemaViewer schema={status?.supabaseSchema || null} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

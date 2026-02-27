// ─── Session Types ───────────────────────────────────────────────────────────
// Multi-session support: run multiple app pipelines concurrently

import type { PipelineStage } from './pipeline.js';

export interface Session {
    id: string;
    name: string;
    idea: string;
    stage: PipelineStage;
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
    outputDir: string;
}

export interface SessionIndex {
    activeSessionId: string | null;
    sessions: Session[];
}

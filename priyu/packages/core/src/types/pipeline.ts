// ─── Pipeline Types ──────────────────────────────────────────────────────────
// State machine types for tracking the build pipeline.

import type { AppSpec } from './app-spec.js';

export enum PipelineStage {
    IDLE = 'IDLE',
    ANALYZING = 'ANALYZING',
    UI_GENERATION = 'UI_GENERATION',
    UI_REVIEW = 'UI_REVIEW',
    CODE_GENERATION = 'CODE_GENERATION',
    BACKEND_SETUP = 'BACKEND_SETUP',
    SECURITY_SETUP = 'SECURITY_SETUP',
    MONITORING_SETUP = 'MONITORING_SETUP',
    COMPLETE = 'COMPLETE',
    FAILED = 'FAILED',
}

export interface PipelineError {
    stage: PipelineStage;
    message: string;
    timestamp: string;
    details?: unknown;
}

export interface APICall {
    id: string;
    stage: PipelineStage;
    service: 'gemini' | 'stitch' | 'supabase' | 'sentry' | 'posthog';
    method: string;
    request?: Record<string, unknown>;
    response?: Record<string, unknown>;
    statusCode?: number;
    durationMs: number;
    timestamp: string;
    error?: string;
}

export interface GeneratedFile {
    path: string;
    content: string;
    language: string; // 'tsx', 'ts', 'json', 'sql', etc.
    stage: PipelineStage;
}

export interface StitchOutput {
    siteUrl?: string;
    screenImages: Array<{
        screenName: string;
        imageUrl?: string;
        imageBase64?: string;
    }>;
    designTokens?: {
        colors: Record<string, string>;
        typography: Record<string, unknown>;
        spacing: Record<string, string>;
    };
    rawOutput?: unknown;
}

export interface SupabaseTable {
    name: string;
    columns: Array<{
        name: string;
        type: string;
        nullable: boolean;
        defaultValue?: string;
        isPrimaryKey?: boolean;
        isForeignKey?: boolean;
        references?: { table: string; column: string };
    }>;
}

export interface RLSPolicy {
    name: string;
    table: string;
    operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
    expression: string;
    description?: string;
}

export interface SupabaseSchema {
    tables: SupabaseTable[];
    policies: RLSPolicy[];
    migrations: string[]; // SQL strings
    edgeFunctions?: Array<{
        name: string;
        code: string;
    }>;
}

export interface PipelineState {
    sessionId: string;
    stage: PipelineStage;
    appSpec?: AppSpec;
    stitchOutput?: StitchOutput;
    generatedFiles: GeneratedFile[];
    supabaseSchema?: SupabaseSchema;
    startedAt: string;
    completedAt?: string;
    errors: PipelineError[];
    apiCallLog: APICall[];
    metadata: {
        idea: string;
        appName: string;
        createdAt: string;
        updatedAt: string;
    };
}

export const PIPELINE_STAGE_ORDER: PipelineStage[] = [
    PipelineStage.IDLE,
    PipelineStage.ANALYZING,
    PipelineStage.UI_GENERATION,
    PipelineStage.UI_REVIEW,
    PipelineStage.CODE_GENERATION,
    PipelineStage.BACKEND_SETUP,
    PipelineStage.SECURITY_SETUP,
    PipelineStage.MONITORING_SETUP,
    PipelineStage.COMPLETE,
];

export function getStageIndex(stage: PipelineStage): number {
    return PIPELINE_STAGE_ORDER.indexOf(stage);
}

export function getStageProgress(stage: PipelineStage): number {
    const index = getStageIndex(stage);
    if (index === -1) return 0;
    return Math.round((index / (PIPELINE_STAGE_ORDER.length - 1)) * 100);
}

// ─── SSE Event Types ─────────────────────────────────────────────────────────
// Shapes for Server-Sent Events between dashboard and backend

import type { PipelineStage, APICall, PipelineError } from './pipeline.js';

export interface StageChangeEvent {
    type: 'stage_change';
    sessionId: string;
    stage: PipelineStage;
    previousStage: PipelineStage;
    progress: number; // 0-100
    timestamp: string;
}

export interface LogEvent {
    type: 'log';
    sessionId: string;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    data?: unknown;
    timestamp: string;
}

export interface ApiCallEvent {
    type: 'api_call';
    sessionId: string;
    call: APICall;
}

export interface ErrorEvent {
    type: 'error';
    sessionId: string;
    error: PipelineError;
}

export interface FileGeneratedEvent {
    type: 'file_generated';
    sessionId: string;
    filePath: string;
    language: string;
    stage: PipelineStage;
    timestamp: string;
}

export type PipelineEvent =
    | StageChangeEvent
    | LogEvent
    | ApiCallEvent
    | ErrorEvent
    | FileGeneratedEvent;

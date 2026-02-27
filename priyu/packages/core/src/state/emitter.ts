// ─── Pipeline Event Emitter ──────────────────────────────────────────────────
// Typed EventEmitter wrapper for pipeline stage transitions and events

import { EventEmitter } from 'node:events';
import type { PipelineEvent } from '../types/events.js';

export interface PipelineEmitterEvents {
    event: [PipelineEvent];
    stageChange: [{ sessionId: string; stage: string; previousStage: string }];
    error: [{ sessionId: string; message: string; stage: string }];
    log: [{ sessionId: string; level: string; message: string }];
    fileGenerated: [{ sessionId: string; filePath: string }];
}

export class PipelineEmitter extends EventEmitter {
    emit<K extends keyof PipelineEmitterEvents>(
        event: K,
        ...args: PipelineEmitterEvents[K]
    ): boolean {
        return super.emit(event, ...args);
    }

    on<K extends keyof PipelineEmitterEvents>(
        event: K,
        listener: (...args: PipelineEmitterEvents[K]) => void,
    ): this {
        return super.on(event, listener as (...args: unknown[]) => void);
    }

    emitPipelineEvent(pipelineEvent: PipelineEvent): void {
        this.emit('event', pipelineEvent);

        switch (pipelineEvent.type) {
            case 'stage_change':
                this.emit('stageChange', {
                    sessionId: pipelineEvent.sessionId,
                    stage: pipelineEvent.stage,
                    previousStage: pipelineEvent.previousStage,
                });
                break;
            case 'error':
                this.emit('error', {
                    sessionId: pipelineEvent.sessionId,
                    message: pipelineEvent.error.message,
                    stage: pipelineEvent.error.stage,
                });
                break;
            case 'log':
                this.emit('log', {
                    sessionId: pipelineEvent.sessionId,
                    level: pipelineEvent.level,
                    message: pipelineEvent.message,
                });
                break;
            case 'file_generated':
                this.emit('fileGenerated', {
                    sessionId: pipelineEvent.sessionId,
                    filePath: pipelineEvent.filePath,
                });
                break;
        }
    }
}

// Singleton emitter for the process
export const globalEmitter = new PipelineEmitter();

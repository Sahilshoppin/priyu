// ─── Pipeline Orchestrator ───────────────────────────────────────────────────
// Drives pipeline stages sequentially with error handling + state persistence

import chalk from 'chalk';
import {
    type PriyuConfig,
    StateManager,
    SessionManager,
    PipelineStage,
    globalEmitter,
    getStageProgress,
} from '@priyu/core';
import { analyzeStage } from './stages/analyze.js';
import { uiGenStage } from './stages/ui-gen.js';
import { codeGenStage } from './stages/code-gen.js';
import { backendStage } from './stages/backend.js';
import { securityStage } from './stages/security.js';
import { monitoringStage } from './stages/monitoring.js';
import { createSpinner } from '../ui/spinner.js';

export interface PipelineOptions {
    skipUI?: boolean;
    skipSecurity?: boolean;
    skipMonitoring?: boolean;
}

export class Orchestrator {
    constructor(
        private config: PriyuConfig,
        private stateMgr: StateManager,
        private sessionMgr: SessionManager,
        private sessionId: string,
    ) { }

    async run(idea: string, options: PipelineOptions = {}): Promise<void> {
        await this.runStage(PipelineStage.ANALYZING, 'Analyzing idea...', () =>
            analyzeStage(idea, this.config, this.stateMgr, this.sessionId),
        );

        if (!options.skipUI) {
            await this.runStage(PipelineStage.UI_GENERATION, 'Generating UI designs...', () =>
                uiGenStage(this.config, this.stateMgr, this.sessionId),
            );
        }

        await this.runStage(PipelineStage.CODE_GENERATION, 'Generating code...', () =>
            codeGenStage(this.config, this.stateMgr, this.sessionId),
        );

        await this.runStage(PipelineStage.BACKEND_SETUP, 'Setting up backend...', () =>
            backendStage(this.config, this.stateMgr, this.sessionId),
        );

        if (!options.skipSecurity) {
            await this.runStage(PipelineStage.SECURITY_SETUP, 'Adding security...', () =>
                securityStage(this.config, this.stateMgr, this.sessionId),
            );
        }

        if (!options.skipMonitoring && (this.config.monitoring.sentry.enabled || this.config.monitoring.posthog.enabled)) {
            await this.runStage(PipelineStage.MONITORING_SETUP, 'Setting up monitoring...', () =>
                monitoringStage(this.config, this.stateMgr, this.sessionId),
            );
        }

        this.transition(PipelineStage.COMPLETE);
    }

    async resumeFrom(stage: PipelineStage, idea: string): Promise<void> {
        const stageOrder = [
            PipelineStage.ANALYZING,
            PipelineStage.UI_GENERATION,
            PipelineStage.CODE_GENERATION,
            PipelineStage.BACKEND_SETUP,
            PipelineStage.SECURITY_SETUP,
            PipelineStage.MONITORING_SETUP,
        ];

        const startIdx = stageOrder.indexOf(stage);
        if (startIdx === -1) {
            await this.run(idea);
            return;
        }

        // Run from the current stage onwards
        const stages = stageOrder.slice(startIdx);
        for (const s of stages) {
            switch (s) {
                case PipelineStage.ANALYZING:
                    await this.runStage(s, 'Analyzing idea...', () => analyzeStage(idea, this.config, this.stateMgr, this.sessionId));
                    break;
                case PipelineStage.UI_GENERATION:
                    await this.runStage(s, 'Generating UI...', () => uiGenStage(this.config, this.stateMgr, this.sessionId));
                    break;
                case PipelineStage.CODE_GENERATION:
                    await this.runStage(s, 'Generating code...', () => codeGenStage(this.config, this.stateMgr, this.sessionId));
                    break;
                case PipelineStage.BACKEND_SETUP:
                    await this.runStage(s, 'Setting up backend...', () => backendStage(this.config, this.stateMgr, this.sessionId));
                    break;
                case PipelineStage.SECURITY_SETUP:
                    await this.runStage(s, 'Adding security...', () => securityStage(this.config, this.stateMgr, this.sessionId));
                    break;
                case PipelineStage.MONITORING_SETUP:
                    await this.runStage(s, 'Setting up monitoring...', () => monitoringStage(this.config, this.stateMgr, this.sessionId));
                    break;
            }
        }

        this.transition(PipelineStage.COMPLETE);
    }

    private async runStage(stage: PipelineStage, label: string, fn: () => Promise<void>): Promise<void> {
        const spinner = createSpinner(label);
        spinner.start();

        const previousStage = this.stateMgr.load()?.stage || PipelineStage.IDLE;
        this.transition(stage);

        try {
            await fn();
            const progress = getStageProgress(stage);
            spinner.succeed(`${label.replace('...', '')} — done (${progress}%)`);
        } catch (err) {
            spinner.fail(`${label.replace('...', '')} — failed`);
            this.stateMgr.appendError({
                stage,
                message: err instanceof Error ? err.message : String(err),
                timestamp: new Date().toISOString(),
            });
            this.transition(PipelineStage.FAILED);
            throw err;
        }
    }

    private transition(stage: PipelineStage): void {
        const state = this.stateMgr.load();
        const previousStage = state?.stage || PipelineStage.IDLE;
        this.stateMgr.updateStage(stage);
        this.sessionMgr.updateSessionStage(this.sessionId, stage);

        globalEmitter.emitPipelineEvent({
            type: 'stage_change',
            sessionId: this.sessionId,
            stage,
            previousStage,
            progress: getStageProgress(stage),
            timestamp: new Date().toISOString(),
        });
    }
}

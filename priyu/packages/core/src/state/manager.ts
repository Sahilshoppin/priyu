// ─── State Manager ───────────────────────────────────────────────────────────
// Read/write .priyu/sessions/<id>/state.json with file locking

import * as fs from 'node:fs';
import * as path from 'node:path';
import { PipelineStage, type PipelineState, type PipelineError, type APICall, type GeneratedFile } from '../types/pipeline.js';

const PRIYU_DIR = '.priyu';
const SESSIONS_DIR = 'sessions';

export class StateManager {
    private basePath: string;
    private sessionId: string;

    constructor(projectRoot: string, sessionId: string) {
        this.basePath = path.join(projectRoot, PRIYU_DIR, SESSIONS_DIR, sessionId);
        this.sessionId = sessionId;
    }

    get stateFilePath(): string {
        return path.join(this.basePath, 'state.json');
    }

    get outputDir(): string {
        return path.join(this.basePath, 'generated');
    }

    get migrationsDir(): string {
        return path.join(this.basePath, 'migrations');
    }

    ensureDirs(): void {
        fs.mkdirSync(this.basePath, { recursive: true });
        fs.mkdirSync(this.outputDir, { recursive: true });
        fs.mkdirSync(this.migrationsDir, { recursive: true });
    }

    createInitialState(idea: string, appName: string): PipelineState {
        const now = new Date().toISOString();
        const state: PipelineState = {
            sessionId: this.sessionId,
            stage: PipelineStage.IDLE,
            generatedFiles: [],
            errors: [],
            apiCallLog: [],
            startedAt: now,
            metadata: {
                idea,
                appName,
                createdAt: now,
                updatedAt: now,
            },
        };
        this.save(state);
        return state;
    }

    load(): PipelineState | null {
        try {
            if (!fs.existsSync(this.stateFilePath)) return null;
            const raw = fs.readFileSync(this.stateFilePath, 'utf-8');
            return JSON.parse(raw) as PipelineState;
        } catch {
            return null;
        }
    }

    save(state: PipelineState): void {
        this.ensureDirs();
        state.metadata.updatedAt = new Date().toISOString();
        // Atomic write: write to temp then rename
        const tmpPath = this.stateFilePath + '.tmp';
        fs.writeFileSync(tmpPath, JSON.stringify(state, null, 2), 'utf-8');
        fs.renameSync(tmpPath, this.stateFilePath);
    }

    updateStage(stage: PipelineStage): PipelineState {
        const state = this.load();
        if (!state) throw new Error(`No state found for session ${this.sessionId}`);
        state.stage = stage;
        if (stage === PipelineStage.COMPLETE || stage === PipelineStage.FAILED) {
            state.completedAt = new Date().toISOString();
        }
        this.save(state);
        return state;
    }

    appendError(error: PipelineError): void {
        const state = this.load();
        if (!state) throw new Error(`No state found for session ${this.sessionId}`);
        state.errors.push(error);
        this.save(state);
    }

    appendApiCall(call: APICall): void {
        const state = this.load();
        if (!state) throw new Error(`No state found for session ${this.sessionId}`);
        state.apiCallLog.push(call);
        this.save(state);
    }

    addGeneratedFile(file: GeneratedFile): void {
        const state = this.load();
        if (!state) throw new Error(`No state found for session ${this.sessionId}`);
        // Upsert: replace if same path exists
        const idx = state.generatedFiles.findIndex((f) => f.path === file.path);
        if (idx >= 0) {
            state.generatedFiles[idx] = file;
        } else {
            state.generatedFiles.push(file);
        }
        this.save(state);
    }

    writeGeneratedFile(relativePath: string, content: string): string {
        const fullPath = path.join(this.outputDir, relativePath);
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, content, 'utf-8');
        return fullPath;
    }
}

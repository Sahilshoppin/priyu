// ─── Session Manager ─────────────────────────────────────────────────────────
// Create, list, switch, and delete sessions

import * as fs from 'node:fs';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Session, SessionIndex } from '../types/session.js';
import { PipelineStage } from '../types/pipeline.js';

const PRIYU_DIR = '.priyu';
const INDEX_FILE = 'sessions.json';

export class SessionManager {
    private projectRoot: string;

    constructor(projectRoot: string) {
        this.projectRoot = projectRoot;
    }

    private get indexPath(): string {
        return path.join(this.projectRoot, PRIYU_DIR, INDEX_FILE);
    }

    private get priyuDir(): string {
        return path.join(this.projectRoot, PRIYU_DIR);
    }

    private ensureDir(): void {
        fs.mkdirSync(this.priyuDir, { recursive: true });
    }

    loadIndex(): SessionIndex {
        try {
            if (!fs.existsSync(this.indexPath)) {
                return { activeSessionId: null, sessions: [] };
            }
            return JSON.parse(fs.readFileSync(this.indexPath, 'utf-8'));
        } catch {
            return { activeSessionId: null, sessions: [] };
        }
    }

    saveIndex(index: SessionIndex): void {
        this.ensureDir();
        const tmpPath = this.indexPath + '.tmp';
        fs.writeFileSync(tmpPath, JSON.stringify(index, null, 2), 'utf-8');
        fs.renameSync(tmpPath, this.indexPath);
    }

    createSession(name: string, idea: string): Session {
        const id = randomUUID().slice(0, 8);
        const now = new Date().toISOString();
        const session: Session = {
            id,
            name: name || `session-${id}`,
            idea,
            stage: PipelineStage.IDLE,
            createdAt: now,
            updatedAt: now,
            outputDir: path.join(PRIYU_DIR, 'sessions', id, 'generated'),
        };

        const index = this.loadIndex();
        index.sessions.push(session);
        index.activeSessionId = id;
        this.saveIndex(index);

        return session;
    }

    listSessions(): Session[] {
        return this.loadIndex().sessions;
    }

    getActiveSession(): Session | null {
        const index = this.loadIndex();
        if (!index.activeSessionId) return null;
        return index.sessions.find((s) => s.id === index.activeSessionId) ?? null;
    }

    switchSession(sessionId: string): Session | null {
        const index = this.loadIndex();
        const session = index.sessions.find((s) => s.id === sessionId);
        if (!session) return null;
        index.activeSessionId = sessionId;
        this.saveIndex(index);
        return session;
    }

    updateSessionStage(sessionId: string, stage: PipelineStage): void {
        const index = this.loadIndex();
        const session = index.sessions.find((s) => s.id === sessionId);
        if (session) {
            session.stage = stage;
            session.updatedAt = new Date().toISOString();
            if (stage === PipelineStage.COMPLETE || stage === PipelineStage.FAILED) {
                session.completedAt = new Date().toISOString();
            }
            this.saveIndex(index);
        }
    }

    deleteSession(sessionId: string): boolean {
        const index = this.loadIndex();
        const idx = index.sessions.findIndex((s) => s.id === sessionId);
        if (idx === -1) return false;

        index.sessions.splice(idx, 1);
        if (index.activeSessionId === sessionId) {
            index.activeSessionId = index.sessions[0]?.id ?? null;
        }
        this.saveIndex(index);

        // Clean up session directory
        const sessionDir = path.join(this.priyuDir, 'sessions', sessionId);
        if (fs.existsSync(sessionDir)) {
            fs.rmSync(sessionDir, { recursive: true, force: true });
        }
        return true;
    }
}

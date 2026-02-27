// ─── Session Tools ───────────────────────────────────────────────────────────
// MCP tools for managing multiple concurrent sessions

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SessionManager, StateManager, PipelineStage } from '@priyu/core';

function getProjectRoot(): string {
    return process.env.PRIYU_PROJECT_ROOT || process.cwd();
}

export function registerSessionTools(server: McpServer): void {
    // ── priyu_create_session ────────────────────────────────────────────────
    server.tool(
        'priyu_create_session',
        'Create a new pipeline session. Returns the session ID.',
        {
            name: z.string().describe('Human-readable session name'),
            idea: z.string().describe('The app idea to build'),
        },
        async ({ name, idea }) => {
            const root = getProjectRoot();
            const sessionMgr = new SessionManager(root);
            const session = sessionMgr.createSession(name, idea);

            // Initialize state for the session
            const stateMgr = new StateManager(root, session.id);
            stateMgr.createInitialState(idea, name);

            return {
                content: [{
                    type: 'text' as const,
                    text: JSON.stringify({
                        success: true,
                        sessionId: session.id,
                        name: session.name,
                        message: `Session "${session.name}" created. Use priyu_analyze_idea to start the pipeline.`,
                    }),
                }],
            };
        },
    );

    // ── priyu_list_sessions ─────────────────────────────────────────────────
    server.tool(
        'priyu_list_sessions',
        'List all pipeline sessions with their current status.',
        {},
        async () => {
            const root = getProjectRoot();
            const sessionMgr = new SessionManager(root);
            const sessions = sessionMgr.listSessions();
            const active = sessionMgr.getActiveSession();

            return {
                content: [{
                    type: 'text' as const,
                    text: JSON.stringify({
                        activeSessionId: active?.id ?? null,
                        sessions: sessions.map((s) => ({
                            id: s.id,
                            name: s.name,
                            idea: s.idea,
                            stage: s.stage,
                            isActive: s.id === active?.id,
                            createdAt: s.createdAt,
                            updatedAt: s.updatedAt,
                        })),
                    }),
                }],
            };
        },
    );

    // ── priyu_switch_session ────────────────────────────────────────────────
    server.tool(
        'priyu_switch_session',
        'Switch the active session.',
        {
            sessionId: z.string().describe('Session ID to switch to'),
        },
        async ({ sessionId }) => {
            const root = getProjectRoot();
            const sessionMgr = new SessionManager(root);
            const session = sessionMgr.switchSession(sessionId);

            if (!session) {
                return {
                    content: [{ type: 'text' as const, text: JSON.stringify({ success: false, error: `Session ${sessionId} not found` }) }],
                };
            }

            return {
                content: [{
                    type: 'text' as const,
                    text: JSON.stringify({
                        success: true,
                        sessionId: session.id,
                        name: session.name,
                        stage: session.stage,
                    }),
                }],
            };
        },
    );
}

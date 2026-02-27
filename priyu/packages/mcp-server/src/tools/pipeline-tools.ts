// ─── Pipeline Tools ──────────────────────────────────────────────────────────
// 8 MCP tools for the build pipeline. These are pure orchestrators —
// the IDE's AI does the thinking and passes structured data here.

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
    StateManager,
    SessionManager,
    PipelineStage,
    globalEmitter,
    loadConfig,
    type AppSpec,
    type GeneratedFile,
    type SupabaseSchema,
    type StitchOutput,
    getStageProgress,
} from '@priyu/core';

function getProjectRoot(): string {
    return process.env.PRIYU_PROJECT_ROOT || process.cwd();
}

function getSessionState(sessionId?: string) {
    const root = getProjectRoot();
    const sessionMgr = new SessionManager(root);

    const id = sessionId || sessionMgr.getActiveSession()?.id;
    if (!id) throw new Error('No active session. Create one with priyu_create_session first.');

    const stateMgr = new StateManager(root, id);
    const state = stateMgr.load();
    if (!state) throw new Error(`No state found for session ${id}`);

    return { stateMgr, state, sessionMgr, sessionId: id };
}

export function registerPipelineTools(server: McpServer): void {
    // ── priyu_analyze_idea ──────────────────────────────────────────────────
    server.tool(
        'priyu_analyze_idea',
        'Save a structured AppSpec to the active session. The IDE AI should generate this using the analyze prompt.',
        {
            appSpec: z.object({
                name: z.string(),
                description: z.string(),
                screens: z.array(z.any()),
                navigation: z.any(),
                dataModels: z.array(z.any()),
                apiEndpoints: z.array(z.any()),
                authStrategy: z.enum(['email', 'oauth', 'phone', 'magic_link']),
                features: z.array(z.string()),
                colorScheme: z.any().optional(),
                targetPlatform: z.enum(['ios', 'android', 'both']).optional(),
            }),
            sessionId: z.string().optional(),
        },
        async ({ appSpec, sessionId }) => {
            const { stateMgr, state, sessionMgr, sessionId: sid } = getSessionState(sessionId);
            const previousStage = state.stage;

            state.appSpec = appSpec as AppSpec;
            state.stage = PipelineStage.ANALYZING;
            stateMgr.save(state);
            stateMgr.updateStage(PipelineStage.UI_GENERATION);
            sessionMgr.updateSessionStage(sid, PipelineStage.UI_GENERATION);

            globalEmitter.emitPipelineEvent({
                type: 'stage_change',
                sessionId: sid,
                stage: PipelineStage.UI_GENERATION,
                previousStage,
                progress: getStageProgress(PipelineStage.UI_GENERATION),
                timestamp: new Date().toISOString(),
            });

            return {
                content: [{ type: 'text' as const, text: JSON.stringify({ success: true, appName: appSpec.name, screenCount: appSpec.screens.length, modelCount: appSpec.dataModels.length, endpointCount: appSpec.apiEndpoints.length }) }],
            };
        },
    );

    // ── priyu_generate_ui ───────────────────────────────────────────────────
    server.tool(
        'priyu_generate_ui',
        'Save Stitch MCP UI generation output to the session.',
        {
            stitchOutput: z.object({
                siteUrl: z.string().optional(),
                screenImages: z.array(z.object({
                    screenName: z.string(),
                    imageUrl: z.string().optional(),
                    imageBase64: z.string().optional(),
                })),
                designTokens: z.any().optional(),
                rawOutput: z.any().optional(),
            }),
            sessionId: z.string().optional(),
        },
        async ({ stitchOutput, sessionId }) => {
            const { stateMgr, state, sessionMgr, sessionId: sid } = getSessionState(sessionId);
            state.stitchOutput = stitchOutput as StitchOutput;
            stateMgr.save(state);

            const config = loadConfig();
            if (config.pipeline.requireUIApproval) {
                stateMgr.updateStage(PipelineStage.UI_REVIEW);
                sessionMgr.updateSessionStage(sid, PipelineStage.UI_REVIEW);
                return { content: [{ type: 'text' as const, text: JSON.stringify({ success: true, requiresApproval: true, previewUrl: stitchOutput.siteUrl }) }] };
            }

            stateMgr.updateStage(PipelineStage.CODE_GENERATION);
            sessionMgr.updateSessionStage(sid, PipelineStage.CODE_GENERATION);
            return { content: [{ type: 'text' as const, text: JSON.stringify({ success: true, requiresApproval: false }) }] };
        },
    );

    // ── priyu_generate_code ─────────────────────────────────────────────────
    server.tool(
        'priyu_generate_code',
        'Save generated Expo/React Native code files to the session. The IDE AI should generate these using the code-gen prompt.',
        {
            files: z.array(z.object({
                path: z.string(),
                content: z.string(),
                language: z.string(),
            })),
            sessionId: z.string().optional(),
        },
        async ({ files, sessionId }) => {
            const { stateMgr, state, sessionMgr, sessionId: sid } = getSessionState(sessionId);

            stateMgr.updateStage(PipelineStage.CODE_GENERATION);

            for (const file of files) {
                const genFile: GeneratedFile = { ...file, stage: PipelineStage.CODE_GENERATION };
                stateMgr.addGeneratedFile(genFile);
                stateMgr.writeGeneratedFile(file.path, file.content);

                globalEmitter.emitPipelineEvent({
                    type: 'file_generated',
                    sessionId: sid,
                    filePath: file.path,
                    language: file.language,
                    stage: PipelineStage.CODE_GENERATION,
                    timestamp: new Date().toISOString(),
                });
            }

            stateMgr.updateStage(PipelineStage.BACKEND_SETUP);
            sessionMgr.updateSessionStage(sid, PipelineStage.BACKEND_SETUP);

            return { content: [{ type: 'text' as const, text: JSON.stringify({ success: true, filesWritten: files.length }) }] };
        },
    );

    // ── priyu_setup_supabase ────────────────────────────────────────────────
    server.tool(
        'priyu_setup_supabase',
        'Save Supabase schema (tables, RLS policies, migrations) to the session.',
        {
            schema: z.object({
                tables: z.array(z.any()),
                policies: z.array(z.any()),
                migrations: z.array(z.string()),
                edgeFunctions: z.array(z.object({ name: z.string(), code: z.string() })).optional(),
            }),
            sessionId: z.string().optional(),
        },
        async ({ schema, sessionId }) => {
            const { stateMgr, state, sessionMgr, sessionId: sid } = getSessionState(sessionId);

            state.supabaseSchema = schema as SupabaseSchema;
            stateMgr.save(state);

            // Write migration files
            for (let i = 0; i < schema.migrations.length; i++) {
                stateMgr.writeGeneratedFile(`migrations/${String(i).padStart(4, '0')}_migration.sql`, schema.migrations[i]);
            }

            stateMgr.updateStage(PipelineStage.SECURITY_SETUP);
            sessionMgr.updateSessionStage(sid, PipelineStage.SECURITY_SETUP);

            return { content: [{ type: 'text' as const, text: JSON.stringify({ success: true, tables: schema.tables.length, policies: schema.policies.length, migrations: schema.migrations.length }) }] };
        },
    );

    // ── priyu_add_security ──────────────────────────────────────────────────
    server.tool(
        'priyu_add_security',
        'Apply security patches to generated code. Accepts file modifications from the IDE AI.',
        {
            patches: z.array(z.object({
                path: z.string(),
                content: z.string(),
                description: z.string(),
            })),
            sessionId: z.string().optional(),
        },
        async ({ patches, sessionId }) => {
            const { stateMgr, sessionMgr, sessionId: sid } = getSessionState(sessionId);

            stateMgr.updateStage(PipelineStage.SECURITY_SETUP);

            for (const patch of patches) {
                stateMgr.writeGeneratedFile(patch.path, patch.content);
                stateMgr.addGeneratedFile({
                    path: patch.path,
                    content: patch.content,
                    language: patch.path.split('.').pop() || 'ts',
                    stage: PipelineStage.SECURITY_SETUP,
                });
            }

            const config = loadConfig();
            const nextStage = config.monitoring.sentry.enabled || config.monitoring.posthog.enabled
                ? PipelineStage.MONITORING_SETUP
                : PipelineStage.COMPLETE;

            stateMgr.updateStage(nextStage);
            sessionMgr.updateSessionStage(sid, nextStage);

            return { content: [{ type: 'text' as const, text: JSON.stringify({ success: true, patchesApplied: patches.length, nextStage }) }] };
        },
    );

    // ── priyu_add_monitoring ────────────────────────────────────────────────
    server.tool(
        'priyu_add_monitoring',
        'Inject Sentry and/or PostHog SDK configurations into the generated app.',
        {
            sentryDsn: z.string().optional(),
            posthogApiKey: z.string().optional(),
            files: z.array(z.object({
                path: z.string(),
                content: z.string(),
            })).optional(),
            sessionId: z.string().optional(),
        },
        async ({ files, sessionId }) => {
            const { stateMgr, sessionMgr, sessionId: sid } = getSessionState(sessionId);

            stateMgr.updateStage(PipelineStage.MONITORING_SETUP);

            if (files) {
                for (const file of files) {
                    stateMgr.writeGeneratedFile(file.path, file.content);
                }
            }

            stateMgr.updateStage(PipelineStage.COMPLETE);
            sessionMgr.updateSessionStage(sid, PipelineStage.COMPLETE);

            return { content: [{ type: 'text' as const, text: JSON.stringify({ success: true, stage: 'COMPLETE' }) }] };
        },
    );

    // ── priyu_get_status ────────────────────────────────────────────────────
    server.tool(
        'priyu_get_status',
        'Get the current pipeline status for a session.',
        {
            sessionId: z.string().optional(),
        },
        async ({ sessionId }) => {
            const { state } = getSessionState(sessionId);
            return {
                content: [{
                    type: 'text' as const, text: JSON.stringify({
                        sessionId: state.sessionId,
                        stage: state.stage,
                        progress: getStageProgress(state.stage),
                        appName: state.metadata.appName,
                        idea: state.metadata.idea,
                        fileCount: state.generatedFiles.length,
                        errorCount: state.errors.length,
                        startedAt: state.startedAt,
                        completedAt: state.completedAt,
                    })
                }],
            };
        },
    );

    // ── priyu_get_flow ──────────────────────────────────────────────────────
    server.tool(
        'priyu_get_flow',
        'Get React Flow graph data for the dashboard visualization.',
        {
            sessionId: z.string().optional(),
        },
        async ({ sessionId }) => {
            const { state } = getSessionState(sessionId);
            const nodes: Array<{ id: string; type: string; data: Record<string, unknown>; position: { x: number; y: number } }> = [];
            const edges: Array<{ id: string; source: string; target: string }> = [];

            // Screen nodes
            if (state.appSpec) {
                state.appSpec.screens.forEach((screen, i) => {
                    nodes.push({
                        id: `screen-${screen.name}`,
                        type: 'screenNode',
                        data: { label: screen.name, description: screen.description, protected: screen.protected },
                        position: { x: 50, y: i * 150 },
                    });
                });

                // API nodes
                state.appSpec.apiEndpoints.forEach((ep, i) => {
                    nodes.push({
                        id: `api-${ep.method}-${ep.path}`,
                        type: 'apiNode',
                        data: { method: ep.method, path: ep.path, auth: ep.auth },
                        position: { x: 400, y: i * 150 },
                    });
                });

                // DB nodes
                state.appSpec.dataModels.forEach((model, i) => {
                    nodes.push({
                        id: `db-${model.name}`,
                        type: 'dbNode',
                        data: { name: model.name, fields: model.fields.map((f) => f.name) },
                        position: { x: 750, y: i * 150 },
                    });
                });

                // Edges: Screen → API
                state.appSpec.screens.forEach((screen) => {
                    state.appSpec!.apiEndpoints.forEach((ep) => {
                        if (ep.path.toLowerCase().includes(screen.name.toLowerCase().replace('screen', ''))) {
                            edges.push({ id: `e-${screen.name}-${ep.path}`, source: `screen-${screen.name}`, target: `api-${ep.method}-${ep.path}` });
                        }
                    });
                });

                // Edges: API → DB
                state.appSpec.apiEndpoints.forEach((ep) => {
                    state.appSpec!.dataModels.forEach((model) => {
                        if (ep.path.toLowerCase().includes(model.name.toLowerCase())) {
                            edges.push({ id: `e-${ep.path}-${model.name}`, source: `api-${ep.method}-${ep.path}`, target: `db-${model.name}` });
                        }
                    });
                });
            }

            return { content: [{ type: 'text' as const, text: JSON.stringify({ nodes, edges }) }] };
        },
    );
}

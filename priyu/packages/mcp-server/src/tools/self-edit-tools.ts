// ─── Self-Edit Tools ─────────────────────────────────────────────────────────
// MCP tools that let the IDE AI modify Priyu's own config and output

import * as fs from 'node:fs';
import * as path from 'node:path';
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { loadConfig, writeConfig, StateManager, SessionManager, PriyuConfigSchema } from '@priyu/core';

function getProjectRoot(): string {
    return process.env.PRIYU_PROJECT_ROOT || process.cwd();
}

export function registerSelfEditTools(server: McpServer): void {
    // ── priyu_update_config ─────────────────────────────────────────────────
    server.tool(
        'priyu_update_config',
        'Update priyu.config.json fields. Pass partial config to merge.',
        {
            updates: z.record(z.any()).describe('Partial config object to merge into priyu.config.json'),
        },
        async ({ updates }) => {
            try {
                const currentConfig = loadConfig();
                const merged = deepMerge(currentConfig, updates);
                const validated = PriyuConfigSchema.parse(merged);
                const configPath = writeConfig(validated);

                return {
                    content: [{ type: 'text' as const, text: JSON.stringify({ success: true, configPath, updatedFields: Object.keys(updates) }) }],
                };
            } catch (err) {
                return {
                    content: [{ type: 'text' as const, text: JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }) }],
                };
            }
        },
    );

    // ── priyu_edit_generated_file ───────────────────────────────────────────
    server.tool(
        'priyu_edit_generated_file',
        'Edit a file in the active session\'s generated output directory.',
        {
            filePath: z.string().describe('Relative path within the generated output'),
            content: z.string().describe('New file content'),
            sessionId: z.string().optional(),
        },
        async ({ filePath, content, sessionId }) => {
            const root = getProjectRoot();
            const sessionMgr = new SessionManager(root);
            const sid = sessionId || sessionMgr.getActiveSession()?.id;
            if (!sid) {
                return { content: [{ type: 'text' as const, text: JSON.stringify({ success: false, error: 'No active session' }) }] };
            }

            const stateMgr = new StateManager(root, sid);
            const fullPath = stateMgr.writeGeneratedFile(filePath, content);

            return {
                content: [{ type: 'text' as const, text: JSON.stringify({ success: true, path: fullPath, sessionId: sid }) }],
            };
        },
    );

    // ── priyu_add_custom_stage ──────────────────────────────────────────────
    server.tool(
        'priyu_add_custom_stage',
        'Register a custom pipeline stage (stored as a script in .priyu/custom-stages/).',
        {
            name: z.string().describe('Stage name (e.g. "testing", "deployment")'),
            description: z.string().describe('What this stage does'),
            prompt: z.string().describe('System prompt for the IDE AI when running this stage'),
        },
        async ({ name, description, prompt }) => {
            const root = getProjectRoot();
            const stagesDir = path.join(root, '.priyu', 'custom-stages');
            fs.mkdirSync(stagesDir, { recursive: true });

            const stage = { name, description, prompt, createdAt: new Date().toISOString() };
            const stagePath = path.join(stagesDir, `${name}.json`);
            fs.writeFileSync(stagePath, JSON.stringify(stage, null, 2), 'utf-8');

            return {
                content: [{ type: 'text' as const, text: JSON.stringify({ success: true, stageName: name, stagePath }) }],
            };
        },
    );
}

// Deep merge utility
function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
    const result = { ...target };
    for (const key of Object.keys(source)) {
        if (
            source[key] &&
            typeof source[key] === 'object' &&
            !Array.isArray(source[key]) &&
            target[key] &&
            typeof target[key] === 'object' &&
            !Array.isArray(target[key])
        ) {
            result[key] = deepMerge(target[key] as Record<string, unknown>, source[key] as Record<string, unknown>);
        } else {
            result[key] = source[key];
        }
    }
    return result;
}

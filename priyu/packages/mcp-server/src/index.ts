#!/usr/bin/env node
// ─── Priyu MCP Server ────────────────────────────────────────────────────────
// Exposes Priyu as an MCP server for any AI IDE (Antigravity, Cursor, Claude Code, etc.)
// The IDE's AI does the thinking; these tools just orchestrate.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { registerPipelineTools } from './tools/pipeline-tools.js';
import { registerSessionTools } from './tools/session-tools.js';
import { registerSelfEditTools } from './tools/self-edit-tools.js';
import { registerPromptResources } from './resources/prompt-resources.js';

async function main() {
    const server = new McpServer({
        name: 'priyu',
        version: '1.0.0',
    });

    // Register all tools
    registerPipelineTools(server);
    registerSessionTools(server);
    registerSelfEditTools(server);

    // Register prompt resources
    registerPromptResources(server);

    // Start server on stdio
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Priyu MCP server started on stdio');
}

main().catch((err) => {
    console.error('Fatal error starting Priyu MCP server:', err);
    process.exit(1);
});

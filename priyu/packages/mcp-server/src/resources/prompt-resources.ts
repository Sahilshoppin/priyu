// ─── Prompt Resources ────────────────────────────────────────────────────────
// Exposes built-in prompts as MCP resources so any IDE AI can read them

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { PROMPTS, listPrompts } from '@priyu/core';

export function registerPromptResources(server: McpServer): void {
    // Register each prompt as an MCP resource
    for (const prompt of listPrompts()) {
        const uri = `priyu://prompts/${prompt.name}`;

        server.resource(
            prompt.name,
            uri,
            {
                description: prompt.description,
                mimeType: 'text/plain',
            },
            async () => ({
                contents: [
                    {
                        uri,
                        mimeType: 'text/plain',
                        text: `# ${prompt.name}\n\n${prompt.description}\n\n---\n\n${prompt.systemPrompt}`,
                    },
                ],
            }),
        );
    }
}

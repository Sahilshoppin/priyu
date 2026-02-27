// ─── Code Generation Stage ───────────────────────────────────────────────────
// Calls Gemini to generate complete Expo project code

import { type PriyuConfig, StateManager, PipelineStage, CODE_GEN_PROMPT, CODE_GEN_USER_TEMPLATE, type GeneratedFile } from '@priyu/core';
import { callGemini, extractJSON } from '../../integrations/gemini.js';

export async function codeGenStage(
    config: PriyuConfig,
    stateMgr: StateManager,
    sessionId: string,
): Promise<void> {
    const state = stateMgr.load()!;
    if (!state.appSpec) throw new Error('No AppSpec found — run analyze stage first');

    const specJson = JSON.stringify(state.appSpec, null, 2);
    const designTokensJson = state.stitchOutput?.designTokens
        ? JSON.stringify(state.stitchOutput.designTokens, null, 2)
        : undefined;

    const response = await callGemini(
        config,
        CODE_GEN_PROMPT,
        CODE_GEN_USER_TEMPLATE(specJson, designTokensJson),
    );

    const jsonStr = extractJSON(response);
    let files: GeneratedFile[];

    try {
        const parsed = JSON.parse(jsonStr);
        files = (Array.isArray(parsed) ? parsed : [parsed]).map((f: { path: string; content: string; language?: string }) => ({
            path: f.path,
            content: f.content,
            language: f.language || f.path.split('.').pop() || 'ts',
            stage: PipelineStage.CODE_GENERATION,
        }));
    } catch {
        throw new Error(`Failed to parse generated files from Gemini response`);
    }

    // Write files to disk
    for (const file of files) {
        stateMgr.writeGeneratedFile(file.path, file.content);
        stateMgr.addGeneratedFile(file);
    }

    stateMgr.appendApiCall({
        id: `code-gen-${Date.now()}`,
        stage: PipelineStage.CODE_GENERATION,
        service: 'gemini',
        method: 'generateContent',
        response: { filesGenerated: files.length },
        durationMs: 0,
        timestamp: new Date().toISOString(),
    });
}

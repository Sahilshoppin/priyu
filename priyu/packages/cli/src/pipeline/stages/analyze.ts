// ─── Analyze Stage ───────────────────────────────────────────────────────────
// Calls Gemini to convert user idea → AppSpec

import { type PriyuConfig, StateManager, PipelineStage, ANALYZE_PROMPT, ANALYZE_USER_TEMPLATE, type AppSpec } from '@priyu/core';
import { callGemini, extractJSON } from '../../integrations/gemini.js';

export async function analyzeStage(
    idea: string,
    config: PriyuConfig,
    stateMgr: StateManager,
    sessionId: string,
): Promise<void> {
    const response = await callGemini(config, ANALYZE_PROMPT, ANALYZE_USER_TEMPLATE(idea));
    const jsonStr = extractJSON(response);

    let appSpec: AppSpec;
    try {
        appSpec = JSON.parse(jsonStr) as AppSpec;
    } catch {
        throw new Error(`Failed to parse AppSpec from Gemini response. Raw: ${jsonStr.slice(0, 200)}...`);
    }

    // Validate essential fields
    if (!appSpec.name || !appSpec.screens || !appSpec.dataModels) {
        throw new Error('Incomplete AppSpec: missing name, screens, or dataModels');
    }

    const state = stateMgr.load()!;
    state.appSpec = appSpec;
    state.metadata.appName = appSpec.name;
    stateMgr.save(state);

    stateMgr.appendApiCall({
        id: `analyze-${Date.now()}`,
        stage: PipelineStage.ANALYZING,
        service: 'gemini',
        method: 'generateContent',
        request: { idea },
        response: { screenCount: appSpec.screens.length, modelCount: appSpec.dataModels.length },
        durationMs: 0,
        timestamp: new Date().toISOString(),
    });
}

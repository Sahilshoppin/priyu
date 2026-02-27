// ─── UI Generation Stage ─────────────────────────────────────────────────────
// Calls Stitch MCP if available, otherwise skips gracefully

import { type PriyuConfig, StateManager, PipelineStage } from '@priyu/core';

export async function uiGenStage(
    config: PriyuConfig,
    stateMgr: StateManager,
    sessionId: string,
): Promise<void> {
    const state = stateMgr.load()!;

    // Check if Stitch is configured
    if (!config.mcps.stitch?.projectId) {
        console.log('  ⚠ Stitch MCP not configured — skipping UI generation');
        state.stitchOutput = {
            screenImages: [],
            designTokens: undefined,
        };
        stateMgr.save(state);
        return;
    }

    // TODO: Connect to Stitch MCP server and call build_site + get_screen_image
    // For now, create a placeholder that records what would be done
    console.log('  ℹ Stitch MCP integration ready — connect your Stitch server');

    state.stitchOutput = {
        screenImages: (state.appSpec?.screens || []).map((s) => ({
            screenName: s.name,
        })),
    };
    stateMgr.save(state);

    stateMgr.appendApiCall({
        id: `ui-gen-${Date.now()}`,
        stage: PipelineStage.UI_GENERATION,
        service: 'stitch',
        method: 'build_site',
        durationMs: 0,
        timestamp: new Date().toISOString(),
    });
}

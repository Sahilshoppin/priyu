// ─── Security Stage ──────────────────────────────────────────────────────────
// Adds security hardening to generated code

import { type PriyuConfig, StateManager, PipelineStage, SECURITY_PROMPT, SECURITY_USER_TEMPLATE } from '@priyu/core';
import { callGemini, extractJSON } from '../../integrations/gemini.js';

export async function securityStage(
    config: PriyuConfig,
    stateMgr: StateManager,
    sessionId: string,
): Promise<void> {
    const state = stateMgr.load()!;
    if (!state.generatedFiles.length) {
        console.log('  ⚠ No generated files to secure — skipping');
        return;
    }

    // If Gemini is available, use it for security audit
    if (config.ai.geminiApiKey) {
        const filesJson = JSON.stringify(
            state.generatedFiles.slice(0, 10).map((f) => ({ path: f.path, content: f.content.slice(0, 500) })),
            null,
            2,
        );
        const schemaJson = JSON.stringify(state.supabaseSchema || {}, null, 2);

        try {
            const response = await callGemini(config, SECURITY_PROMPT, SECURITY_USER_TEMPLATE(filesJson, schemaJson));
            const jsonStr = extractJSON(response);
            const patches = JSON.parse(jsonStr);

            if (Array.isArray(patches)) {
                for (const patch of patches) {
                    if (patch.path && patch.content) {
                        stateMgr.writeGeneratedFile(patch.path, patch.content);
                        stateMgr.addGeneratedFile({
                            path: patch.path,
                            content: patch.content,
                            language: patch.path.split('.').pop() || 'ts',
                            stage: PipelineStage.SECURITY_SETUP,
                        });
                    }
                }
            }
        } catch {
            console.log('  ⚠ Gemini security audit skipped (parse error)');
        }
    }

    // Always add basic security utilities
    const secureStorageUtil = `// Secure storage utility using expo-secure-store
import * as SecureStore from 'expo-secure-store';

export async function saveSecure(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value);
}

export async function getSecure(key: string): Promise<string | null> {
  return await SecureStore.getItemAsync(key);
}

export async function deleteSecure(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}

export async function clearAllSecure(keys: string[]): Promise<void> {
  await Promise.all(keys.map((k) => deleteSecure(k)));
}`;

    stateMgr.writeGeneratedFile('src/utils/secureStorage.ts', secureStorageUtil);
    stateMgr.addGeneratedFile({
        path: 'src/utils/secureStorage.ts',
        content: secureStorageUtil,
        language: 'ts',
        stage: PipelineStage.SECURITY_SETUP,
    });

    stateMgr.appendApiCall({
        id: `security-${Date.now()}`,
        stage: PipelineStage.SECURITY_SETUP,
        service: 'gemini',
        method: 'securityAudit',
        durationMs: 0,
        timestamp: new Date().toISOString(),
    });
}

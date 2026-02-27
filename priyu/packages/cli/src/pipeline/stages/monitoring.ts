// ─── Monitoring Stage ────────────────────────────────────────────────────────
// Injects Sentry + PostHog SDKs if enabled

import { type PriyuConfig, StateManager, PipelineStage } from '@priyu/core';

export async function monitoringStage(
    config: PriyuConfig,
    stateMgr: StateManager,
    sessionId: string,
): Promise<void> {
    const state = stateMgr.load()!;
    const files: Array<{ path: string; content: string }> = [];

    if (config.monitoring.sentry.enabled) {
        const sentryInit = `// Sentry Error Tracking
import * as Sentry from '@sentry/react-native';

export function initSentry() {
  Sentry.init({
    dsn: '${config.monitoring.sentry.dsn || 'YOUR_SENTRY_DSN'}',
    tracesSampleRate: 1.0,
    debug: __DEV__,
  });
}

export { Sentry };`;

        files.push({ path: 'src/services/sentry.ts', content: sentryInit });
    }

    if (config.monitoring.posthog.enabled) {
        const posthogInit = `// PostHog Analytics
import PostHog from 'posthog-react-native';

export const posthog = new PostHog('${config.monitoring.posthog.apiKey || 'YOUR_POSTHOG_KEY'}', {
  host: 'https://us.i.posthog.com',
});

export function trackScreen(screenName: string) {
  posthog.screen(screenName);
}

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  posthog.capture(event, properties);
}`;

        files.push({ path: 'src/services/posthog.ts', content: posthogInit });
    }

    // Write files
    for (const file of files) {
        stateMgr.writeGeneratedFile(file.path, file.content);
        stateMgr.addGeneratedFile({
            path: file.path,
            content: file.content,
            language: 'ts',
            stage: PipelineStage.MONITORING_SETUP,
        });
    }

    stateMgr.appendApiCall({
        id: `monitoring-${Date.now()}`,
        stage: PipelineStage.MONITORING_SETUP,
        service: 'sentry',
        method: 'setup',
        response: { sentry: config.monitoring.sentry.enabled, posthog: config.monitoring.posthog.enabled },
        durationMs: 0,
        timestamp: new Date().toISOString(),
    });
}

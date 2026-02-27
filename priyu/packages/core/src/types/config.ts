// ─── Config Types ────────────────────────────────────────────────────────────
// Zod schema for priyu.config.json validation

import { z } from 'zod';

export const StitchConfigSchema = z.object({
    credentialsPath: z.string().optional(),
    projectId: z.string().optional(),
});

export const SupabaseConfigSchema = z.object({
    projectUrl: z.string().url(),
    serviceRoleKey: z.string().min(1),
});

export const AIConfigSchema = z.object({
    geminiApiKey: z.string().min(1).optional(),
    model: z.string().default('gemini-2.0-flash'),
});

export const SentryConfigSchema = z.object({
    dsn: z.string().default(''),
    enabled: z.boolean().default(false),
});

export const PostHogConfigSchema = z.object({
    apiKey: z.string().default(''),
    enabled: z.boolean().default(false),
});

export const MonitoringConfigSchema = z.object({
    sentry: SentryConfigSchema.default({}),
    posthog: PostHogConfigSchema.default({}),
});

export const PipelineConfigSchema = z.object({
    requireUIApproval: z.boolean().default(true),
    targetFramework: z.enum(['expo', 'react-native']).default('expo'),
    autoGenerateRLS: z.boolean().default(true),
    outputDir: z.string().default('./.priyu/generated'),
});

export const PriyuConfigSchema = z.object({
    mcps: z
        .object({
            stitch: StitchConfigSchema.optional(),
            supabase: SupabaseConfigSchema.optional(),
        })
        .default({}),
    ai: AIConfigSchema.default({}),
    monitoring: MonitoringConfigSchema.default({}),
    pipeline: PipelineConfigSchema.default({}),
});

export type PriyuConfig = z.infer<typeof PriyuConfigSchema>;
export type StitchConfig = z.infer<typeof StitchConfigSchema>;
export type SupabaseConfig = z.infer<typeof SupabaseConfigSchema>;
export type AIConfig = z.infer<typeof AIConfigSchema>;
export type MonitoringConfig = z.infer<typeof MonitoringConfigSchema>;
export type PipelineConfig = z.infer<typeof PipelineConfigSchema>;

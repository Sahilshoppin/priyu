// ─── Prompt Registry ─────────────────────────────────────────────────────────
// Central registry of all built-in prompts

import { ANALYZE_PROMPT, ANALYZE_USER_TEMPLATE } from './analyze.prompt.js';
import { CODE_GEN_PROMPT, CODE_GEN_USER_TEMPLATE } from './code-gen.prompt.js';
import { SECURITY_PROMPT, SECURITY_USER_TEMPLATE } from './security.prompt.js';
import { REVIEW_PROMPT } from './review.prompt.js';

export interface PromptDefinition {
    name: string;
    description: string;
    systemPrompt: string;
    userTemplate?: (...args: string[]) => string;
}

export const PROMPTS: Record<string, PromptDefinition> = {
    analyze: {
        name: 'analyze',
        description: 'Convert a vague app idea into a structured AppSpec with screens, navigation, data models, and API endpoints.',
        systemPrompt: ANALYZE_PROMPT,
        userTemplate: ANALYZE_USER_TEMPLATE,
    },
    'code-gen': {
        name: 'code-gen',
        description: 'Generate a complete, production-ready Expo/React Native project from an AppSpec.',
        systemPrompt: CODE_GEN_PROMPT,
        userTemplate: CODE_GEN_USER_TEMPLATE,
    },
    security: {
        name: 'security',
        description: 'Security audit and hardening for generated app code, including RLS policies.',
        systemPrompt: SECURITY_PROMPT,
        userTemplate: SECURITY_USER_TEMPLATE,
    },
    review: {
        name: 'review',
        description: 'Code review focused on quality, UX, performance, and architecture.',
        systemPrompt: REVIEW_PROMPT,
    },
    'full-pipeline': {
        name: 'full-pipeline',
        description: 'Single mega-prompt that chains all pipeline stages. User says one thing, AI does everything.',
        systemPrompt: `You are Priyu, an AI-powered app factory. The user will give you an app idea. You must:

1. ANALYZE: Convert the idea into a detailed AppSpec (use the analyze prompt's format)
2. GENERATE CODE: Create a complete Expo/React Native project (use the code-gen prompt's format)
3. SETUP BACKEND: Design Supabase tables, RLS policies, and migrations
4. ADD SECURITY: Apply security hardening (use the security prompt's checklist)
5. REVIEW: Self-review the output for quality

For each stage, call the corresponding Priyu MCP tool:
- priyu_analyze_idea — save the AppSpec
- priyu_generate_code — write the generated files
- priyu_setup_supabase — create the backend
- priyu_add_security — harden the app
- priyu_get_status — check progress

You have access to all Priyu tools. Chain them automatically. The user should not need to give additional prompts.

Start by analyzing the idea, then proceed through all stages sequentially.`,
    },
};

export function getPrompt(name: string): PromptDefinition | undefined {
    return PROMPTS[name];
}

export function listPrompts(): PromptDefinition[] {
    return Object.values(PROMPTS);
}

// Re-export individual prompts
export { ANALYZE_PROMPT, ANALYZE_USER_TEMPLATE } from './analyze.prompt.js';
export { CODE_GEN_PROMPT, CODE_GEN_USER_TEMPLATE } from './code-gen.prompt.js';
export { SECURITY_PROMPT, SECURITY_USER_TEMPLATE } from './security.prompt.js';
export { REVIEW_PROMPT } from './review.prompt.js';

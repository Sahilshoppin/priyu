// ─── @priyu/core ─────────────────────────────────────────────────────────────
// Barrel export — all types, state managers, config, and prompts

// Types
export type {
    AppSpec,
    Screen,
    NavigationConfig,
    NavigationNode,
    DataModel,
    FieldDefinition,
    Relationship,
    APIEndpoint,
    UIComponent,
    ComponentProp,
} from './types/app-spec.js';

export {
    PipelineStage,
    PIPELINE_STAGE_ORDER,
    getStageIndex,
    getStageProgress,
} from './types/pipeline.js';
export type {
    PipelineState,
    PipelineError,
    APICall,
    GeneratedFile,
    StitchOutput,
    SupabaseSchema,
    SupabaseTable,
    RLSPolicy,
} from './types/pipeline.js';

export { PriyuConfigSchema } from './types/config.js';
export type {
    PriyuConfig,
    StitchConfig,
    SupabaseConfig,
    AIConfig,
    MonitoringConfig,
    PipelineConfig,
} from './types/config.js';

export type {
    PipelineEvent,
    StageChangeEvent,
    LogEvent,
    ApiCallEvent,
    ErrorEvent,
    FileGeneratedEvent,
} from './types/events.js';

export type { Session, SessionIndex } from './types/session.js';

// State
export { StateManager } from './state/manager.js';
export { SessionManager } from './state/session-manager.js';
export { PipelineEmitter, globalEmitter } from './state/emitter.js';

// Config
export { loadConfig, findConfigPath, createDefaultConfig, writeConfig } from './config/loader.js';

// Prompts
export {
    PROMPTS,
    getPrompt,
    listPrompts,
    ANALYZE_PROMPT,
    ANALYZE_USER_TEMPLATE,
    CODE_GEN_PROMPT,
    CODE_GEN_USER_TEMPLATE,
    SECURITY_PROMPT,
    SECURITY_USER_TEMPLATE,
    REVIEW_PROMPT,
} from './prompts/index.js';
export type { PromptDefinition } from './prompts/index.js';

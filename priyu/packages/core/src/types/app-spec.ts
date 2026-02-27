// ─── App Specification Types ─────────────────────────────────────────────────
// The central data structure that flows through all pipeline stages.
// A vague user idea gets refined into this structured spec.

export interface ComponentProp {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'function';
    required?: boolean;
    description?: string;
}

export interface UIComponent {
    type: string; // e.g. 'Button', 'TextInput', 'FlatList', 'Card'
    props: ComponentProp[];
    children?: UIComponent[];
    description?: string;
}

export interface Screen {
    name: string;
    description: string;
    components: UIComponent[];
    route?: string;
    params?: Record<string, string>;
    protected?: boolean; // requires auth
}

export interface NavigationConfig {
    type: 'stack' | 'tab' | 'drawer' | 'mixed';
    structure: NavigationNode[];
}

export interface NavigationNode {
    name: string;
    type: 'stack' | 'tab' | 'drawer' | 'screen';
    children?: NavigationNode[];
    screenRef?: string; // references Screen.name
    icon?: string;
}

export interface FieldDefinition {
    name: string;
    type: 'text' | 'number' | 'boolean' | 'date' | 'json' | 'uuid' | 'timestamp' | 'enum';
    required?: boolean;
    unique?: boolean;
    defaultValue?: string;
    enumValues?: string[];
    description?: string;
}

export interface Relationship {
    type: 'one-to-one' | 'one-to-many' | 'many-to-many';
    target: string; // DataModel name
    foreignKey?: string;
}

export interface DataModel {
    name: string;
    fields: FieldDefinition[];
    relationships: Relationship[];
    timestamps?: boolean;
    softDelete?: boolean;
}

export interface APIEndpoint {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    path: string;
    description: string;
    auth: boolean;
    requestSchema?: Record<string, unknown>;
    responseSchema?: Record<string, unknown>;
    rateLimit?: number; // requests per minute
}

export interface AppSpec {
    name: string;
    description: string;
    screens: Screen[];
    navigation: NavigationConfig;
    dataModels: DataModel[];
    apiEndpoints: APIEndpoint[];
    authStrategy: 'email' | 'oauth' | 'phone' | 'magic_link';
    features: string[];
    colorScheme?: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        text: string;
    };
    targetPlatform?: 'ios' | 'android' | 'both';
}

// ─── Config Loader ───────────────────────────────────────────────────────────
// Load and validate priyu.config.json using Zod

import * as fs from 'node:fs';
import * as path from 'node:path';
import { PriyuConfigSchema, type PriyuConfig } from '../types/config.js';

const CONFIG_FILENAME = 'priyu.config.json';

export function findConfigPath(startDir: string = process.cwd()): string | null {
    let current = startDir;
    while (true) {
        const candidate = path.join(current, CONFIG_FILENAME);
        if (fs.existsSync(candidate)) return candidate;
        const parent = path.dirname(current);
        if (parent === current) break;
        current = parent;
    }
    return null;
}

export function loadConfig(configPath?: string): PriyuConfig {
    const resolvedPath = configPath ?? findConfigPath();
    if (!resolvedPath || !fs.existsSync(resolvedPath)) {
        throw new Error(
            `Config file not found. Run "priyu init" to create ${CONFIG_FILENAME}`,
        );
    }

    let raw: unknown;
    try {
        raw = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'));
    } catch (e) {
        throw new Error(`Failed to parse ${resolvedPath}: ${e instanceof Error ? e.message : e}`);
    }

    const result = PriyuConfigSchema.safeParse(raw);
    if (!result.success) {
        const issues = result.error.issues
            .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
            .join('\n');
        throw new Error(`Invalid config in ${resolvedPath}:\n${issues}`);
    }

    return result.data;
}

export function createDefaultConfig(): PriyuConfig {
    return PriyuConfigSchema.parse({});
}

export function writeConfig(config: PriyuConfig, outputPath?: string): string {
    const target = outputPath ?? path.join(process.cwd(), CONFIG_FILENAME);
    fs.writeFileSync(target, JSON.stringify(config, null, 2) + '\n', 'utf-8');
    return target;
}

// ─── Backend Setup Stage ─────────────────────────────────────────────────────
// Generates Supabase schema from AppSpec data models

import { type PriyuConfig, StateManager, PipelineStage, type SupabaseSchema, type AppSpec } from '@priyu/core';

export async function backendStage(
    config: PriyuConfig,
    stateMgr: StateManager,
    sessionId: string,
): Promise<void> {
    const state = stateMgr.load()!;
    if (!state.appSpec) throw new Error('No AppSpec found');

    const schema = generateSupabaseSchema(state.appSpec, config.pipeline.autoGenerateRLS);

    state.supabaseSchema = schema;
    stateMgr.save(state);

    // Write migration files
    for (let i = 0; i < schema.migrations.length; i++) {
        stateMgr.writeGeneratedFile(
            `migrations/${String(i + 1).padStart(4, '0')}_${schema.tables[i]?.name || 'migration'}.sql`,
            schema.migrations[i],
        );
    }

    stateMgr.appendApiCall({
        id: `backend-${Date.now()}`,
        stage: PipelineStage.BACKEND_SETUP,
        service: 'supabase',
        method: 'generateSchema',
        response: { tables: schema.tables.length, policies: schema.policies.length },
        durationMs: 0,
        timestamp: new Date().toISOString(),
    });
}

function generateSupabaseSchema(spec: AppSpec, autoRLS: boolean): SupabaseSchema {
    const migrations: string[] = [];
    const tables = spec.dataModels.map((model) => {
        const columns = model.fields.map((field) => ({
            name: field.name,
            type: mapFieldType(field.type),
            nullable: !field.required,
            defaultValue: field.defaultValue,
            isPrimaryKey: field.name === 'id',
        }));

        // Add timestamps if enabled
        if (model.timestamps !== false) {
            columns.push(
                { name: 'created_at', type: 'timestamptz', nullable: false, defaultValue: 'now()', isPrimaryKey: false },
                { name: 'updated_at', type: 'timestamptz', nullable: false, defaultValue: 'now()', isPrimaryKey: false },
            );
        }

        // Generate CREATE TABLE SQL
        const colDefs = columns.map((c) => {
            let def = `  "${c.name}" ${c.type}`;
            if (c.isPrimaryKey) def += ' PRIMARY KEY DEFAULT gen_random_uuid()';
            else if (c.defaultValue) def += ` DEFAULT ${c.defaultValue}`;
            if (!c.nullable && !c.isPrimaryKey) def += ' NOT NULL';
            return def;
        }).join(',\n');

        const migration = `CREATE TABLE IF NOT EXISTS "${model.name}" (\n${colDefs}\n);`;
        migrations.push(migration);

        return { name: model.name, columns };
    });

    // Generate RLS policies
    const policies = autoRLS
        ? spec.dataModels.map((model) => ({
            name: `${model.name}_user_access`,
            table: model.name,
            operation: 'ALL' as const,
            expression: `auth.uid() = user_id`,
            description: `Users can only access their own ${model.name}`,
        }))
        : [];

    if (autoRLS) {
        const rlsMigration = spec.dataModels
            .map((m) => `ALTER TABLE "${m.name}" ENABLE ROW LEVEL SECURITY;\nCREATE POLICY "${m.name}_user_access" ON "${m.name}" FOR ALL USING (auth.uid() = user_id);`)
            .join('\n\n');
        migrations.push(rlsMigration);
    }

    return { tables, policies, migrations };
}

function mapFieldType(type: string): string {
    const map: Record<string, string> = {
        text: 'text',
        number: 'integer',
        boolean: 'boolean',
        date: 'date',
        json: 'jsonb',
        uuid: 'uuid',
        timestamp: 'timestamptz',
        enum: 'text',
    };
    return map[type] || 'text';
}

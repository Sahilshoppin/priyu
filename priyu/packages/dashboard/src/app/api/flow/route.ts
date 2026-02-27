import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Returns React Flow nodes/edges from AppSpec
export async function GET(req: NextRequest) {
    const projectRoot = process.env.PRIYU_PROJECT_ROOT || process.cwd();
    const sessionId = req.nextUrl.searchParams.get('sessionId');

    try {
        const state = loadState(projectRoot, sessionId);
        if (!state?.appSpec) {
            return NextResponse.json({ nodes: [], edges: [] });
        }

        const nodes: Array<{ id: string; type: string; data: Record<string, unknown>; position: { x: number; y: number } }> = [];
        const edges: Array<{ id: string; source: string; target: string; animated?: boolean }> = [];

        // Screen nodes
        state.appSpec.screens?.forEach((screen: { name: string; description: string; protected?: boolean }, i: number) => {
            nodes.push({
                id: `screen-${screen.name}`,
                type: 'screenNode',
                data: { label: screen.name, description: screen.description, protected: screen.protected },
                position: { x: 50, y: i * 160 + 50 },
            });
        });

        // API nodes
        state.appSpec.apiEndpoints?.forEach((ep: { method: string; path: string; auth: boolean }, i: number) => {
            nodes.push({
                id: `api-${ep.method}-${ep.path}`,
                type: 'apiNode',
                data: { method: ep.method, path: ep.path, auth: ep.auth },
                position: { x: 450, y: i * 160 + 50 },
            });
        });

        // DB nodes
        state.appSpec.dataModels?.forEach((model: { name: string; fields: Array<{ name: string }> }, i: number) => {
            nodes.push({
                id: `db-${model.name}`,
                type: 'dbNode',
                data: { name: model.name, fields: model.fields?.map((f: { name: string }) => f.name) || [] },
                position: { x: 850, y: i * 160 + 50 },
            });
        });

        // Auto-generate edges
        state.appSpec.screens?.forEach((screen: { name: string }) => {
            state.appSpec?.apiEndpoints?.forEach((ep: { method: string; path: string }) => {
                if (ep.path.toLowerCase().includes(screen.name.toLowerCase().replace('screen', ''))) {
                    edges.push({ id: `e-s-${screen.name}-a-${ep.path}`, source: `screen-${screen.name}`, target: `api-${ep.method}-${ep.path}`, animated: true });
                }
            });
        });

        state.appSpec.apiEndpoints?.forEach((ep: { method: string; path: string }) => {
            state.appSpec?.dataModels?.forEach((model: { name: string }) => {
                if (ep.path.toLowerCase().includes(model.name.toLowerCase())) {
                    edges.push({ id: `e-a-${ep.path}-d-${model.name}`, source: `api-${ep.method}-${ep.path}`, target: `db-${model.name}`, animated: true });
                }
            });
        });

        return NextResponse.json({ nodes, edges });
    } catch {
        return NextResponse.json({ nodes: [], edges: [] });
    }
}

function loadState(root: string, sessionId: string | null) {
    try {
        if (sessionId) {
            const p = path.join(root, '.priyu', 'sessions', sessionId, 'state.json');
            if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf-8'));
        }
        const indexPath = path.join(root, '.priyu', 'sessions.json');
        if (fs.existsSync(indexPath)) {
            const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
            if (index.activeSessionId) {
                const p = path.join(root, '.priyu', 'sessions', index.activeSessionId, 'state.json');
                if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf-8'));
            }
        }
        return null;
    } catch { return null; }
}

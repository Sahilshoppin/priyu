import { NextRequest } from 'next/server';
import * as fs from 'node:fs';
import * as path from 'node:path';

// SSE endpoint: streams state.json changes
export async function GET(req: NextRequest) {
    const projectRoot = process.env.PRIYU_PROJECT_ROOT || process.cwd();
    const sessionId = req.nextUrl.searchParams.get('sessionId');

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        start(controller) {
            const send = (data: unknown) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            };

            // Initial state
            const state = loadState(projectRoot, sessionId);
            if (state) send(state);

            // Watch for changes
            const stateDir = sessionId
                ? path.join(projectRoot, '.priyu', 'sessions', sessionId)
                : path.join(projectRoot, '.priyu');

            let watcher: fs.FSWatcher | null = null;
            try {
                if (fs.existsSync(stateDir)) {
                    watcher = fs.watch(stateDir, { recursive: true }, () => {
                        const newState = loadState(projectRoot, sessionId);
                        if (newState) send(newState);
                    });
                }
            } catch {
                // Watching not supported or dir doesn't exist
            }

            // Heartbeat
            const heartbeat = setInterval(() => {
                try {
                    controller.enqueue(encoder.encode(': heartbeat\n\n'));
                } catch {
                    clearInterval(heartbeat);
                }
            }, 15000);

            // Cleanup on close
            req.signal.addEventListener('abort', () => {
                clearInterval(heartbeat);
                watcher?.close();
            });
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}

function loadState(root: string, sessionId: string | null) {
    try {
        if (sessionId) {
            const statePath = path.join(root, '.priyu', 'sessions', sessionId, 'state.json');
            if (fs.existsSync(statePath)) return JSON.parse(fs.readFileSync(statePath, 'utf-8'));
        }

        // Try to find active session
        const indexPath = path.join(root, '.priyu', 'sessions.json');
        if (fs.existsSync(indexPath)) {
            const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
            if (index.activeSessionId) {
                const statePath = path.join(root, '.priyu', 'sessions', index.activeSessionId, 'state.json');
                if (fs.existsSync(statePath)) return JSON.parse(fs.readFileSync(statePath, 'utf-8'));
            }
        }
        return null;
    } catch {
        return null;
    }
}

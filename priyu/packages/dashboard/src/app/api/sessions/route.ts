import { NextResponse } from 'next/server';
import * as fs from 'node:fs';
import * as path from 'node:path';

export async function GET() {
    const projectRoot = process.env.PRIYU_PROJECT_ROOT || process.cwd();

    try {
        const indexPath = path.join(projectRoot, '.priyu', 'sessions.json');
        if (!fs.existsSync(indexPath)) {
            return NextResponse.json({ sessions: [] });
        }
        const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
        return NextResponse.json(index);
    } catch {
        return NextResponse.json({ sessions: [] });
    }
}

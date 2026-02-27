// ─── Priyu CLI Program ───────────────────────────────────────────────────────

import { Command } from 'commander';
import { registerInitCommand } from './commands/init.js';
import { registerBuildCommand } from './commands/build.js';
import { registerDashboardCommand } from './commands/dashboard.js';
import { registerStatusCommand } from './commands/status.js';
import { registerSessionsCommand } from './commands/sessions.js';
import { registerResumeCommand } from './commands/resume.js';

export function createProgram(): Command {
    const program = new Command();

    program
        .name('priyu')
        .description('🚀 Priyu — AI-Powered App Factory')
        .version('1.0.0');

    registerInitCommand(program);
    registerBuildCommand(program);
    registerDashboardCommand(program);
    registerStatusCommand(program);
    registerSessionsCommand(program);
    registerResumeCommand(program);

    return program;
}

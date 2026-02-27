// ─── priyu status ────────────────────────────────────────────────────────────

import { Command } from 'commander';
import chalk from 'chalk';
import { SessionManager, StateManager, getStageProgress } from '@priyu/core';

export function registerStatusCommand(program: Command): void {
    program
        .command('status')
        .description('Show current pipeline status')
        .option('--all', 'Show all sessions')
        .option('-s, --session <id>', 'Session ID')
        .action(async (options: { all?: boolean; session?: string }) => {
            const sessionMgr = new SessionManager(process.cwd());

            if (options.all) {
                const sessions = sessionMgr.listSessions();
                if (sessions.length === 0) {
                    console.log(chalk.gray('\nNo sessions found. Run "priyu build" to start.\n'));
                    return;
                }

                console.log(chalk.bold.cyan('\n📊 All Sessions\n'));
                for (const s of sessions) {
                    const active = s.id === sessionMgr.getActiveSession()?.id;
                    const stageStr = getStageBar(s.stage);
                    console.log(
                        `  ${active ? chalk.green('▶') : ' '} ${chalk.white(s.id)} ${chalk.gray(s.name)} ${stageStr}`,
                    );
                }
                console.log('');
                return;
            }

            // Single session
            const sid = options.session || sessionMgr.getActiveSession()?.id;
            if (!sid) {
                console.log(chalk.gray('\nNo active session. Run "priyu build" to start.\n'));
                return;
            }

            const stateMgr = new StateManager(process.cwd(), sid);
            const state = stateMgr.load();
            if (!state) {
                console.log(chalk.red(`\nNo state for session ${sid}\n`));
                return;
            }

            const progress = getStageProgress(state.stage);
            console.log(chalk.bold.cyan(`\n📊 Session: ${sid}\n`));
            console.log(`  ${chalk.gray('App:')}      ${state.metadata.appName}`);
            console.log(`  ${chalk.gray('Idea:')}     ${state.metadata.idea}`);
            console.log(`  ${chalk.gray('Stage:')}    ${state.stage}`);
            console.log(`  ${chalk.gray('Progress:')} ${getProgressBar(progress)} ${progress}%`);
            console.log(`  ${chalk.gray('Files:')}    ${state.generatedFiles.length}`);
            console.log(`  ${chalk.gray('Errors:')}   ${state.errors.length}`);
            console.log(`  ${chalk.gray('Started:')}  ${state.startedAt}`);
            if (state.completedAt) {
                console.log(`  ${chalk.gray('Completed:')} ${state.completedAt}`);
            }
            console.log('');
        });
}

function getProgressBar(percent: number): string {
    const filled = Math.round(percent / 5);
    const empty = 20 - filled;
    return chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
}

function getStageBar(stage: string): string {
    const colors: Record<string, (s: string) => string> = {
        IDLE: chalk.gray,
        ANALYZING: chalk.yellow,
        UI_GENERATION: chalk.blue,
        UI_REVIEW: chalk.magenta,
        CODE_GENERATION: chalk.cyan,
        BACKEND_SETUP: chalk.blue,
        SECURITY_SETUP: chalk.red,
        MONITORING_SETUP: chalk.yellow,
        COMPLETE: chalk.green,
        FAILED: chalk.red,
    };
    const color = colors[stage] || chalk.white;
    return color(`[${stage}]`);
}

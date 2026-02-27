// ─── priyu sessions ──────────────────────────────────────────────────────────

import { Command } from 'commander';
import chalk from 'chalk';
import { SessionManager } from '@priyu/core';

export function registerSessionsCommand(program: Command): void {
    program
        .command('sessions')
        .description('List and manage sessions')
        .option('--switch <id>', 'Switch active session')
        .option('--delete <id>', 'Delete a session')
        .action(async (options: { switch?: string; delete?: string }) => {
            const sessionMgr = new SessionManager(process.cwd());

            if (options.switch) {
                const session = sessionMgr.switchSession(options.switch);
                if (session) {
                    console.log(chalk.green(`\n✅ Switched to session: ${session.name} (${session.id})\n`));
                } else {
                    console.log(chalk.red(`\n❌ Session ${options.switch} not found\n`));
                }
                return;
            }

            if (options.delete) {
                const deleted = sessionMgr.deleteSession(options.delete);
                if (deleted) {
                    console.log(chalk.green(`\n✅ Session ${options.delete} deleted\n`));
                } else {
                    console.log(chalk.red(`\n❌ Session ${options.delete} not found\n`));
                }
                return;
            }

            // List
            const sessions = sessionMgr.listSessions();
            const active = sessionMgr.getActiveSession();

            if (sessions.length === 0) {
                console.log(chalk.gray('\nNo sessions. Run "priyu build" to create one.\n'));
                return;
            }

            console.log(chalk.bold.cyan('\n📋 Sessions\n'));
            for (const s of sessions) {
                const isActive = s.id === active?.id;
                const icon = isActive ? chalk.green('▶') : ' ';
                console.log(`  ${icon} ${chalk.white(s.id)} — ${s.name} [${s.stage}] (${s.idea.slice(0, 40)})`);
            }
            console.log(chalk.gray(`\n  Total: ${sessions.length} session(s)\n`));
        });
}

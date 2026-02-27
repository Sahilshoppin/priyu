// ─── priyu resume ────────────────────────────────────────────────────────────

import { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig, SessionManager, StateManager, PipelineStage } from '@priyu/core';
import { Orchestrator } from '../pipeline/orchestrator.js';
import { createSpinner } from '../ui/spinner.js';

export function registerResumeCommand(program: Command): void {
    program
        .command('resume')
        .description('Resume pipeline from last checkpoint')
        .option('-s, --session <id>', 'Session ID to resume')
        .action(async (options: { session?: string }) => {
            const sessionMgr = new SessionManager(process.cwd());
            const sid = options.session || sessionMgr.getActiveSession()?.id;

            if (!sid) {
                console.log(chalk.red('\n❌ No session to resume. Specify --session <id>\n'));
                process.exit(1);
            }

            const stateMgr = new StateManager(process.cwd(), sid);
            const state = stateMgr.load();

            if (!state) {
                console.log(chalk.red(`\n❌ No state found for session ${sid}\n`));
                process.exit(1);
            }

            if (state.stage === PipelineStage.COMPLETE) {
                console.log(chalk.green(`\n✅ Session ${sid} is already complete\n`));
                return;
            }

            console.log(chalk.bold.cyan(`\n🔄 Resuming session ${sid} from ${state.stage}...\n`));

            const spinner = createSpinner('Loading configuration...');
            spinner.start();

            try {
                const config = loadConfig();
                spinner.succeed('Configuration loaded');

                const orchestrator = new Orchestrator(config, stateMgr, sessionMgr, sid);
                await orchestrator.resumeFrom(state.stage, state.metadata.idea);

                console.log(chalk.bold.green('\n✅ Build complete!'));
                console.log(chalk.gray(`Output: ${stateMgr.outputDir}\n`));
            } catch (err) {
                spinner.fail('Resume failed');
                console.error(chalk.red(`\n❌ ${err instanceof Error ? err.message : err}`));
                process.exit(1);
            }
        });
}

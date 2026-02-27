// ─── priyu build ─────────────────────────────────────────────────────────────
// Full pipeline runner using Gemini API for standalone CLI mode

import { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig, SessionManager, StateManager, PipelineStage } from '@priyu/core';
import { Orchestrator } from '../pipeline/orchestrator.js';
import { createSpinner } from '../ui/spinner.js';

export function registerBuildCommand(program: Command): void {
    program
        .command('build')
        .description('Build an app from an idea')
        .argument('<idea>', 'App idea description')
        .option('-s, --session <name>', 'Session name')
        .option('--no-ui', 'Skip UI generation via Stitch')
        .option('--no-security', 'Skip security hardening')
        .option('--no-monitoring', 'Skip monitoring setup')
        .action(async (idea: string, options: { session?: string; ui?: boolean; security?: boolean; monitoring?: boolean }) => {
            console.log(chalk.bold.cyan('\n🚀 Priyu — Building your app\n'));
            console.log(chalk.gray(`Idea: "${idea}"\n`));

            const spinner = createSpinner('Loading configuration...');
            spinner.start();

            try {
                const config = loadConfig();
                spinner.succeed('Configuration loaded');

                // Create session
                const sessionMgr = new SessionManager(process.cwd());
                const sessionName = options.session || idea.slice(0, 30).replace(/\s+/g, '-').toLowerCase();
                const session = sessionMgr.createSession(sessionName, idea);

                console.log(chalk.gray(`Session: ${session.id} (${session.name})\n`));

                // Initialize state
                const stateMgr = new StateManager(process.cwd(), session.id);
                stateMgr.createInitialState(idea, sessionName);

                // Run orchestrator
                const orchestrator = new Orchestrator(config, stateMgr, sessionMgr, session.id);
                await orchestrator.run(idea, {
                    skipUI: options.ui === false,
                    skipSecurity: options.security === false,
                    skipMonitoring: options.monitoring === false,
                });

                console.log(chalk.bold.green('\n✅ Build complete!'));
                console.log(chalk.gray(`Output: ${stateMgr.outputDir}`));
                console.log(chalk.gray(`Dashboard: http://localhost:3847\n`));
            } catch (err) {
                spinner.fail('Build failed');
                console.error(chalk.red(`\n❌ ${err instanceof Error ? err.message : err}`));
                process.exit(1);
            }
        });
}

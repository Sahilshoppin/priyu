// ─── priyu dashboard ─────────────────────────────────────────────────────────
// Starts the Next.js dashboard and opens the browser

import { Command } from 'commander';
import { spawn } from 'node:child_process';
import * as path from 'node:path';
import chalk from 'chalk';

export function registerDashboardCommand(program: Command): void {
    program
        .command('dashboard')
        .description('Open the Priyu dashboard (localhost:3847)')
        .option('-p, --port <port>', 'Port number', '3847')
        .action(async (options: { port: string }) => {
            const port = options.port;
            console.log(chalk.bold.cyan(`\n🎯 Starting Priyu Dashboard on port ${port}...\n`));

            // Find the dashboard package
            const dashboardDir = path.resolve(__dirname, '../../..', 'dashboard');

            try {
                const child = spawn('npm', ['run', 'dev', '--', '-p', port], {
                    cwd: dashboardDir,
                    stdio: 'inherit',
                    env: {
                        ...process.env,
                        PRIYU_PROJECT_ROOT: process.cwd(),
                        PORT: port,
                    },
                });

                // Open browser after a delay
                setTimeout(() => {
                    const url = `http://localhost:${port}`;
                    console.log(chalk.gray(`\nOpening ${url}...`));
                    spawn('open', [url], { stdio: 'ignore' });
                }, 3000);

                child.on('error', (err) => {
                    console.error(chalk.red(`Failed to start dashboard: ${err.message}`));
                    process.exit(1);
                });
            } catch (err) {
                console.error(chalk.red(`Dashboard error: ${err instanceof Error ? err.message : err}`));
                process.exit(1);
            }
        });
}

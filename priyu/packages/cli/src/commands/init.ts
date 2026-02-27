// ─── priyu init ──────────────────────────────────────────────────────────────
// Interactive setup wizard that creates priyu.config.json

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { createDefaultConfig, writeConfig, type PriyuConfig } from '@priyu/core';

export function registerInitCommand(program: Command): void {
    program
        .command('init')
        .description('Initialize Priyu in the current directory')
        .action(async () => {
            console.log(chalk.bold.cyan('\n🚀 Priyu — AI-Powered App Factory\n'));
            console.log(chalk.gray('Let\'s set up your project.\n'));

            const answers = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'geminiApiKey',
                    message: 'Gemini API key (optional for MCP mode, needed for CLI standalone):',
                    default: '',
                },
                {
                    type: 'input',
                    name: 'supabaseUrl',
                    message: 'Supabase project URL (optional):',
                    default: '',
                },
                {
                    type: 'input',
                    name: 'supabaseKey',
                    message: 'Supabase service role key (optional):',
                    default: '',
                },
                {
                    type: 'confirm',
                    name: 'requireUIApproval',
                    message: 'Require UI approval before code generation?',
                    default: true,
                },
                {
                    type: 'list',
                    name: 'targetFramework',
                    message: 'Target framework:',
                    choices: ['expo', 'react-native'],
                    default: 'expo',
                },
                {
                    type: 'confirm',
                    name: 'enableSentry',
                    message: 'Enable Sentry error tracking?',
                    default: false,
                },
                {
                    type: 'confirm',
                    name: 'enablePosthog',
                    message: 'Enable PostHog analytics?',
                    default: false,
                },
            ]);

            const config: PriyuConfig = createDefaultConfig();

            if (answers.geminiApiKey) {
                config.ai.geminiApiKey = answers.geminiApiKey;
            }
            config.ai.model = 'gemini-2.0-flash';

            if (answers.supabaseUrl && answers.supabaseKey) {
                config.mcps.supabase = {
                    projectUrl: answers.supabaseUrl,
                    serviceRoleKey: answers.supabaseKey,
                };
            }

            config.pipeline.requireUIApproval = answers.requireUIApproval;
            config.pipeline.targetFramework = answers.targetFramework;
            config.monitoring.sentry.enabled = answers.enableSentry;
            config.monitoring.posthog.enabled = answers.enablePosthog;

            const configPath = writeConfig(config);

            console.log(chalk.green(`\n✅ Config written to ${configPath}`));
            console.log(chalk.gray('\nNext steps:'));
            console.log(chalk.white('  priyu build "your app idea"'));
            console.log(chalk.white('  priyu dashboard'));
            console.log('');
        });
}

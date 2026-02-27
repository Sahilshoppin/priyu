// ─── Interactive Prompts ─────────────────────────────────────────────────────

import inquirer from 'inquirer';

export async function confirmAction(message: string, defaultValue = true): Promise<boolean> {
    const { confirmed } = await inquirer.prompt([
        { type: 'confirm', name: 'confirmed', message, default: defaultValue },
    ]);
    return confirmed;
}

export async function selectOption<T extends string>(
    message: string,
    choices: T[],
): Promise<T> {
    const { selected } = await inquirer.prompt([
        { type: 'list', name: 'selected', message, choices },
    ]);
    return selected;
}

export async function getInput(message: string, defaultValue?: string): Promise<string> {
    const { input } = await inquirer.prompt([
        { type: 'input', name: 'input', message, default: defaultValue },
    ]);
    return input;
}

export async function approveDesign(): Promise<'approve' | 'modify' | 'reject'> {
    const { action } = await inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'What do you think of the design?',
            choices: [
                { name: '✅ Approve — proceed to code generation', value: 'approve' },
                { name: '✏️  Modify — provide feedback for changes', value: 'modify' },
                { name: '❌ Reject — start over', value: 'reject' },
            ],
        },
    ]);
    return action;
}

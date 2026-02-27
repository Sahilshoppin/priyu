// ─── Color Helpers ───────────────────────────────────────────────────────────

import chalk from 'chalk';

export const colors = {
    primary: chalk.hex('#7C3AED'),
    success: chalk.green,
    error: chalk.red,
    warning: chalk.yellow,
    info: chalk.cyan,
    dim: chalk.gray,
    bold: chalk.bold,
    stage: (name: string) => chalk.bold.hex('#7C3AED')(name),
    file: (path: string) => chalk.underline.gray(path),
    logo: () => chalk.bold.hex('#7C3AED')('⚡ Priyu'),
};

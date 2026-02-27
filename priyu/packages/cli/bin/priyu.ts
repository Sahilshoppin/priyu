#!/usr/bin/env node
// ─── Priyu CLI Entry Point ───────────────────────────────────────────────────

import { createProgram } from '../src/index.js';

const program = createProgram();
program.parse(process.argv);

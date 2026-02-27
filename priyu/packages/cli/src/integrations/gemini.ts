// ─── Gemini Integration ──────────────────────────────────────────────────────
// Google Gemini API wrapper for standalone CLI mode

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { PriyuConfig } from '@priyu/core';

let genAI: GoogleGenerativeAI | null = null;

function getClient(config: PriyuConfig): GoogleGenerativeAI {
    if (!genAI) {
        if (!config.ai.geminiApiKey) {
            throw new Error(
                'Gemini API key not found. Set it in priyu.config.json or use Priyu as an MCP server in your IDE (zero cost).',
            );
        }
        genAI = new GoogleGenerativeAI(config.ai.geminiApiKey);
    }
    return genAI;
}

export async function callGemini(
    config: PriyuConfig,
    systemPrompt: string,
    userMessage: string,
): Promise<string> {
    const client = getClient(config);
    const model = client.getGenerativeModel({
        model: config.ai.model || 'gemini-2.0-flash',
        systemInstruction: systemPrompt,
    });

    const result = await model.generateContent(userMessage);
    const response = result.response;
    return response.text();
}

export function extractJSON(text: string): string {
    // Try to find JSON in the response (handles markdown code blocks)
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) return jsonMatch[1].trim();

    // Try direct parse
    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');
    const start = Math.min(
        firstBrace >= 0 ? firstBrace : Infinity,
        firstBracket >= 0 ? firstBracket : Infinity,
    );
    if (start === Infinity) return text.trim();

    // Find matching close
    const openChar = text[start];
    const closeChar = openChar === '{' ? '}' : ']';
    let depth = 0;
    for (let i = start; i < text.length; i++) {
        if (text[i] === openChar) depth++;
        if (text[i] === closeChar) depth--;
        if (depth === 0) return text.slice(start, i + 1);
    }

    return text.slice(start);
}

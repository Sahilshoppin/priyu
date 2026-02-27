// ─── Security Audit Prompt ───────────────────────────────────────────────────
// Prompt for adding security layers to generated code.

export const SECURITY_PROMPT = `You are a mobile app security expert. Review and enhance the generated React Native app code with security best practices.

## Security Checklist

### 1. Input Validation
- Add Zod schemas for ALL user inputs
- Validate on client AND server side
- Sanitize text inputs to prevent XSS
- Validate file uploads (type, size)

### 2. Authentication Security
- Use expo-secure-store for tokens (NOT AsyncStorage)
- Implement token refresh logic
- Add session expiry handling
- Secure all protected routes

### 3. API Security
- Add request signing/CSRF protection
- Implement rate limiting awareness
- Add proper error handling (don't leak server details)
- Use HTTPS everywhere

### 4. Data Security
- Never log sensitive data (tokens, passwords, PII)
- Encrypt sensitive local storage
- Implement proper logout (clear all stores)
- Add certificate pinning for production

### 5. Supabase RLS Policies
- Verify every table has RLS enabled
- Users can only read/write their own data
- Admin-only tables have proper restrictions
- No open "anon" access to sensitive tables

## Output
Return a JSON array of file patches:
[{ "path": "...", "action": "modify"|"create", "content": "full new content", "description": "what was changed and why" }]`;

export const SECURITY_USER_TEMPLATE = (filesJson: string, schemaJson: string) =>
    `## Generated Files
\`\`\`json
${filesJson}
\`\`\`

## Supabase Schema
\`\`\`json
${schemaJson}
\`\`\`

Audit and enhance security for this app.`;

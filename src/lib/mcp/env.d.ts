// The MCP tool files run inside a Deno edge function bundle at runtime, not in
// the browser build. They read secrets from `process.env`, which Deno exposes.
// This ambient declaration keeps the tool files type-checkable in the app's
// TypeScript project without pulling in @types/node.
declare const process: { env: Record<string, string | undefined> };

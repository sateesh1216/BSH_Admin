import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listTripsTool from "./tools/list-trips";
import createTripTool from "./tools/create-trip";
import listDriversTool from "./tools/list-drivers";
import listMaintenanceTool from "./tools/list-maintenance";
import financialSummaryTool from "./tools/financial-summary";

// The OAuth issuer MUST be the direct Supabase host, built from the project ref
// (never from SUPABASE_URL, which may be a proxy). Vite inlines this literal at
// build time so the entry stays import-safe.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "bsh-taxi-mcp",
  title: "BSH Taxi Service MCP",
  version: "0.1.0",
  instructions:
    "Tools for BSH Taxi Service management. Use these to list trips, drivers, and maintenance records, create new trip entries, and compute financial summaries (profit = trip - driver - commission - fuel - tolls). All calls act as the signed-in app user and respect the app's row-level security.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listTripsTool,
    createTripTool,
    listDriversTool,
    listMaintenanceTool,
    financialSummaryTool,
  ],
});

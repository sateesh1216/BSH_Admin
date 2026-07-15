import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

export default defineTool({
  name: "list_maintenance",
  title: "List maintenance records",
  description: "List vehicle maintenance/service records, optionally filtered by date range or car number.",
  inputSchema: {
    from_date: z.string().describe("YYYY-MM-DD").optional(),
    to_date: z.string().describe("YYYY-MM-DD").optional(),
    car_number: z.string().optional(),
    limit: z.number().int().optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const limit = Math.min(Math.max(input.limit ?? 50, 1), 500);
    let q = supabaseForUser(ctx)
      .from("maintenance")
      .select("*")
      .order("date", { ascending: false })
      .limit(limit);
    if (input.from_date) q = q.gte("date", input.from_date);
    if (input.to_date) q = q.lte("date", input.to_date);
    if (input.car_number) q = q.eq("car_number", input.car_number);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { maintenance: data ?? [] },
    };
  },
});

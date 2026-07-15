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
  name: "list_trips",
  title: "List trips",
  description:
    "List trip records for BSH Taxi Service, optionally filtered by date range, payment status, or driver name. Returns up to `limit` most recent trips.",
  inputSchema: {
    from_date: z
      .string()
      .describe("Optional inclusive start date in YYYY-MM-DD format.")
      .optional(),
    to_date: z
      .string()
      .describe("Optional inclusive end date in YYYY-MM-DD format.")
      .optional(),
    payment_status: z
      .enum(["Paid", "Pending"])
      .describe("Optional filter for payment status.")
      .optional(),
    driver_name: z
      .string()
      .describe("Optional case-insensitive driver name substring filter.")
      .optional(),
    limit: z
      .number()
      .int()
      .describe("Maximum rows to return. Defaults to 50, max 500.")
      .optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const limit = Math.min(Math.max(input.limit ?? 50, 1), 500);
    let q = supabaseForUser(ctx)
      .from("trips")
      .select("*")
      .order("date", { ascending: false })
      .limit(limit);
    if (input.from_date) q = q.gte("date", input.from_date);
    if (input.to_date) q = q.lte("date", input.to_date);
    if (input.payment_status) q = q.eq("payment_status", input.payment_status);
    if (input.driver_name) q = q.ilike("driver_name", `%${input.driver_name}%`);
    const { data, error } = await q;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { trips: data ?? [], count: data?.length ?? 0 },
    };
  },
});

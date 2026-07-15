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
  name: "financial_summary",
  title: "Financial summary",
  description:
    "Compute a financial summary for BSH Taxi Service in the given date range: totals for revenue, driver amounts, commission, fuel, tolls, profit, plus pending payments and trip count. Profit = Trip - Driver - Commission - Fuel - Tolls.",
  inputSchema: {
    from_date: z.string().describe("Inclusive start date YYYY-MM-DD."),
    to_date: z.string().describe("Inclusive end date YYYY-MM-DD."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ from_date, to_date }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const sb = supabaseForUser(ctx);
    const { data: trips, error } = await sb
      .from("trips")
      .select("trip_amount,driver_amount,commission,fuel_amount,tolls,payment_status")
      .gte("date", from_date)
      .lte("date", to_date);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const s = {
      trip_count: trips?.length ?? 0,
      total_revenue: 0,
      total_driver_amount: 0,
      total_commission: 0,
      total_fuel: 0,
      total_tolls: 0,
      total_profit: 0,
      pending_amount: 0,
    };
    for (const t of trips ?? []) {
      s.total_revenue += Number(t.trip_amount || 0);
      s.total_driver_amount += Number(t.driver_amount || 0);
      s.total_commission += Number(t.commission || 0);
      s.total_fuel += Number(t.fuel_amount || 0);
      s.total_tolls += Number(t.tolls || 0);
      if (t.payment_status === "Pending") s.pending_amount += Number(t.trip_amount || 0);
    }
    s.total_profit =
      s.total_revenue - s.total_driver_amount - s.total_commission - s.total_fuel - s.total_tolls;

    return {
      content: [{ type: "text", text: JSON.stringify(s, null, 2) }],
      structuredContent: s,
    };
  },
});

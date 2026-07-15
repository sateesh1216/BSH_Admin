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
  name: "create_trip",
  title: "Create trip",
  description:
    "Insert a new trip record for BSH Taxi Service. Amounts default to 0. Payment status must be 'Paid' or 'Pending'.",
  inputSchema: {
    date: z.string().describe("Trip date in YYYY-MM-DD format."),
    customer_name: z.string().describe("Customer full name."),
    customer_number: z.string().describe("Customer phone number."),
    driver_name: z.string().describe("Assigned driver name."),
    driver_number: z.string().describe("Assigned driver phone number."),
    from_location: z.string(),
    to_location: z.string(),
    fuel_type: z.string().describe("Fuel type, e.g. Petrol, Diesel, CNG."),
    payment_mode: z.string().describe("Payment mode, e.g. Cash, UPI, Bank."),
    payment_status: z.enum(["Paid", "Pending"]).optional(),
    trip_amount: z.number().optional(),
    driver_amount: z.number().optional(),
    commission: z.number().optional(),
    fuel_amount: z.number().optional(),
    tolls: z.number().optional(),
    car_number: z.string().optional(),
    company: z.string().optional(),
    starting_km: z.number().optional(),
    ending_km: z.number().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { data, error } = await supabaseForUser(ctx)
      .from("trips")
      .insert({ ...input, created_by: ctx.getUserId() })
      .select()
      .single();
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: `Trip created: ${data.id}` }],
      structuredContent: { trip: data },
    };
  },
});

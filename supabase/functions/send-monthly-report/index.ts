import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Determine which month to report on
    const now = new Date();
    // Default: previous month (for cron on last day, we report current month)
    let targetYear = now.getFullYear();
    let targetMonth = now.getMonth(); // 0-indexed, current month

    // Check if called with specific month
    let body: any = {};
    try {
      body = await req.json();
    } catch { /* no body is fine */ }

    if (body.month) {
      const [y, m] = body.month.split("-");
      targetYear = parseInt(y);
      targetMonth = parseInt(m) - 1; // convert to 0-indexed
    }

    const startDate = `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
    const endDate = `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}-${lastDay}`;
    const monthLabel = new Date(targetYear, targetMonth).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    // Fetch trips
    const { data: trips } = await supabase
      .from("trips")
      .select("date, driver_name, customer_name, from_location, to_location, trip_amount, driver_amount, commission, fuel_amount, tolls, profit, payment_mode, payment_status")
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });

    // Fetch maintenance
    const { data: maintenance } = await supabase
      .from("maintenance")
      .select("date, vehicle_number, maintenance_type, description, amount, payment_mode")
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });

    const tripsList = trips || [];
    const maintList = maintenance || [];

    // Calculate summary
    const totalTrips = tripsList.length;
    const totalRevenue = tripsList.reduce((s: number, t: any) => s + Number(t.trip_amount || 0), 0);
    const totalExpenses = tripsList.reduce(
      (s: number, t: any) =>
        s + Number(t.driver_amount || 0) + Number(t.commission || 0) + Number(t.fuel_amount || 0) + Number(t.tolls || 0),
      0
    );
    const tripProfit = totalRevenue - totalExpenses;
    const totalMaintenance = maintList.reduce((s: number, m: any) => s + Number(m.amount || 0), 0);
    const netProfit = tripProfit - totalMaintenance;
    const avgTripValue = totalTrips > 0 ? totalRevenue / totalTrips : 0;

    const fmt = (v: number) => `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Build trip rows HTML
    const tripRows = tripsList
      .map(
        (t: any, i: number) => `
      <tr style="background:${i % 2 === 0 ? "#fff" : "#f9f9f9"}">
        <td style="padding:6px 8px;border:1px solid #ddd;font-size:12px">${t.date}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;font-size:12px">${t.driver_name}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;font-size:12px">${t.customer_name}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;font-size:12px">${t.from_location} → ${t.to_location}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;font-size:12px;text-align:right">${fmt(Number(t.trip_amount))}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;font-size:12px;text-align:right">${fmt(Number(t.driver_amount) + Number(t.commission) + Number(t.fuel_amount) + Number(t.tolls))}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;font-size:12px;text-align:right">${fmt(Number(t.profit))}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;font-size:12px">${t.payment_status}</td>
      </tr>`
      )
      .join("");

    const maintRows = maintList
      .map(
        (m: any, i: number) => `
      <tr style="background:${i % 2 === 0 ? "#fff" : "#f9f9f9"}">
        <td style="padding:6px 8px;border:1px solid #ddd;font-size:12px">${m.date}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;font-size:12px">${m.vehicle_number}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;font-size:12px">${m.maintenance_type}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;font-size:12px">${m.description || "-"}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;font-size:12px;text-align:right">${fmt(Number(m.amount))}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;font-size:12px">${m.payment_mode}</td>
      </tr>`
      )
      .join("");

    const emailHtml = `
    <div style="font-family:Arial,sans-serif;max-width:900px;margin:0 auto;padding:20px">
      <div style="background:#2980b9;color:#fff;padding:20px;border-radius:8px 8px 0 0;text-align:center">
        <h1 style="margin:0;font-size:24px">BSH Taxi Service</h1>
        <p style="margin:5px 0 0;font-size:14px;opacity:0.9">Monthly Report - ${monthLabel}</p>
      </div>
      
      <div style="background:#fff;padding:20px;border:1px solid #ddd">
        <h2 style="color:#2980b9;margin-top:0">Summary</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
          <tr>
            <td style="padding:10px;background:#f0f7ff;border:1px solid #ddd;font-weight:bold;width:50%">Total Trips</td>
            <td style="padding:10px;background:#f0f7ff;border:1px solid #ddd;text-align:right">${totalTrips}</td>
          </tr>
          <tr>
            <td style="padding:10px;border:1px solid #ddd;font-weight:bold">Total Revenue</td>
            <td style="padding:10px;border:1px solid #ddd;text-align:right;color:#27ae60">${fmt(totalRevenue)}</td>
          </tr>
          <tr>
            <td style="padding:10px;background:#f0f7ff;border:1px solid #ddd;font-weight:bold">Trip Profit</td>
            <td style="padding:10px;background:#f0f7ff;border:1px solid #ddd;text-align:right;color:${tripProfit >= 0 ? "#27ae60" : "#e74c3c"}">${fmt(tripProfit)}</td>
          </tr>
          <tr>
            <td style="padding:10px;border:1px solid #ddd;font-weight:bold">Maintenance Cost</td>
            <td style="padding:10px;border:1px solid #ddd;text-align:right;color:#e67e22">${fmt(totalMaintenance)}</td>
          </tr>
          <tr>
            <td style="padding:10px;background:#f0f7ff;border:1px solid #ddd;font-weight:bold;font-size:16px">Net Profit</td>
            <td style="padding:10px;background:#f0f7ff;border:1px solid #ddd;text-align:right;font-weight:bold;font-size:16px;color:${netProfit >= 0 ? "#27ae60" : "#e74c3c"}">${fmt(netProfit)}</td>
          </tr>
          <tr>
            <td style="padding:10px;border:1px solid #ddd;font-weight:bold">Avg Trip Value</td>
            <td style="padding:10px;border:1px solid #ddd;text-align:right">${fmt(avgTripValue)}</td>
          </tr>
        </table>

        ${tripsList.length > 0 ? `
        <h2 style="color:#27ae60">Trip Details (${tripsList.length})</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
          <thead>
            <tr style="background:#27ae60;color:#fff">
              <th style="padding:8px;border:1px solid #ddd;font-size:11px">Date</th>
              <th style="padding:8px;border:1px solid #ddd;font-size:11px">Driver</th>
              <th style="padding:8px;border:1px solid #ddd;font-size:11px">Customer</th>
              <th style="padding:8px;border:1px solid #ddd;font-size:11px">Route</th>
              <th style="padding:8px;border:1px solid #ddd;font-size:11px">Amount</th>
              <th style="padding:8px;border:1px solid #ddd;font-size:11px">Expenses</th>
              <th style="padding:8px;border:1px solid #ddd;font-size:11px">Profit</th>
              <th style="padding:8px;border:1px solid #ddd;font-size:11px">Status</th>
            </tr>
          </thead>
          <tbody>${tripRows}</tbody>
        </table>
        ` : "<p>No trips recorded this month.</p>"}

        ${maintList.length > 0 ? `
        <h2 style="color:#e74c3c">Maintenance Details (${maintList.length})</h2>
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:#e74c3c;color:#fff">
              <th style="padding:8px;border:1px solid #ddd;font-size:11px">Date</th>
              <th style="padding:8px;border:1px solid #ddd;font-size:11px">Vehicle</th>
              <th style="padding:8px;border:1px solid #ddd;font-size:11px">Type</th>
              <th style="padding:8px;border:1px solid #ddd;font-size:11px">Description</th>
              <th style="padding:8px;border:1px solid #ddd;font-size:11px">Amount</th>
              <th style="padding:8px;border:1px solid #ddd;font-size:11px">Payment</th>
            </tr>
          </thead>
          <tbody>${maintRows}</tbody>
        </table>
        ` : "<p>No maintenance records this month.</p>"}
      </div>
      
      <div style="background:#2c3e50;color:#fff;padding:15px;border-radius:0 0 8px 8px;text-align:center;font-size:12px">
        <p style="margin:0">This is an automated monthly report from BSH Taxi Service</p>
        <p style="margin:5px 0 0;opacity:0.7">Generated on ${new Date().toLocaleDateString("en-IN")}</p>
      </div>
    </div>`;

    // Find admin users to send the report to
    const { data: adminProfiles } = await supabase
      .from("profiles")
      .select("id, username")
      .eq("role", "admin");

    const adminEmails = (adminProfiles || []).map((p: any) => p.username).filter((e: string) => e && e.includes("@"));

    if (adminEmails.length === 0) {
      return new Response(
        JSON.stringify({ error: "No admin email found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send email to each admin
    for (const email of adminEmails) {
      await resend.emails.send({
        from: "BSH Taxi Service <onboarding@resend.dev>",
        to: email,
        subject: `BSH Monthly Report - ${monthLabel}`,
        html: emailHtml,
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Monthly report for ${monthLabel} sent to ${adminEmails.join(", ")}`,
        summary: { totalTrips, totalRevenue, tripProfit, totalMaintenance, netProfit }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending monthly report:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);

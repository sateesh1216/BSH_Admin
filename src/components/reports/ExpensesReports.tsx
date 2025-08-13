import { useEffect, useMemo, useState } from "react";
import { format, startOfMonth, endOfMonth, subMonths, subDays } from "date-fns";
import { Calendar as CalendarIcon, Download, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import type { DateRange } from "react-day-picker";

interface ExpenseTotals {
  driverAmount: number;
  commission: number;
  fuelAmount: number;
  tolls: number;
  tripsCount: number;
}

const currency = (v: number) => `₹${v.toFixed(2)}`;

export const ExpensesReports = () => {
  const [preset, setPreset] = useState<"this_month" | "last_month" | "last_30" | "custom">("this_month");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => ({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  }));
  const [totals, setTotals] = useState<ExpenseTotals | null>(null);
  const [loading, setLoading] = useState(false);

  // Compute effective date range from preset
  const effectiveRange = useMemo<DateRange | undefined>(() => {
    if (preset === "custom") return dateRange;
    const now = new Date();
    if (preset === "this_month") {
      return { from: startOfMonth(now), to: endOfMonth(now) };
    }
    if (preset === "last_month") {
      const last = subMonths(now, 1);
      return { from: startOfMonth(last), to: endOfMonth(last) };
    }
    // last_30
    return { from: subDays(now, 29), to: now };
  }, [preset, dateRange]);

  useEffect(() => {
    const fetchData = async () => {
      if (!effectiveRange?.from || !effectiveRange?.to) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("trips")
          .select("date, driver_name, driver_number, driver_amount, commission, fuel_amount, tolls")
          .gte("date", format(effectiveRange.from, "yyyy-MM-dd"))
          .lte("date", format(effectiveRange.to, "yyyy-MM-dd"));

        if (error) throw error;
        const list = data || [];
        const totalsCalc: ExpenseTotals = {
          driverAmount: list.reduce((s, r: any) => s + Number(r.driver_amount || 0), 0),
          commission: list.reduce((s, r: any) => s + Number(r.commission || 0), 0),
          fuelAmount: list.reduce((s, r: any) => s + Number(r.fuel_amount || 0), 0),
          tolls: list.reduce((s, r: any) => s + Number(r.tolls || 0), 0),
          tripsCount: list.length,
        };
        setTotals(totalsCalc);
      } catch (err) {
        toast({ title: "Error", description: "Failed to fetch expenses", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [effectiveRange?.from, effectiveRange?.to]);

  const downloadExcel = async () => {
    if (!effectiveRange?.from || !effectiveRange?.to) return;
    try {
      const { data } = await supabase
        .from("trips")
        .select("date, driver_name, driver_number, driver_amount, commission, fuel_amount, tolls")
        .gte("date", format(effectiveRange.from, "yyyy-MM-dd"))
        .lte("date", format(effectiveRange.to, "yyyy-MM-dd"));

      const wb = XLSX.utils.book_new();

      const rangeLabel = `${format(effectiveRange.from, "dd MMM yyyy")} - ${format(effectiveRange.to, "dd MMM yyyy")}`;
      const summary = [
        ["Expenses Report", ""],
        ["Range", rangeLabel],
        ["", ""],
        ["Trips", totals?.tripsCount ?? 0],
        ["Driver Amount", currency(totals?.driverAmount ?? 0)],
        ["Commission", currency(totals?.commission ?? 0)],
        ["Fuel Amount", currency(totals?.fuelAmount ?? 0)],
        ["Tolls", currency(totals?.tolls ?? 0)],
      ];
      const summaryWs = XLSX.utils.aoa_to_sheet(summary);
      XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

      if (data && data.length) {
        const rows = data.map((r: any) => ({
          Date: r.date,
          Driver: r.driver_name,
          "Driver No": r.driver_number,
          "Driver Amount": Number(r.driver_amount || 0),
          Commission: Number(r.commission || 0),
          "Fuel Amount": Number(r.fuel_amount || 0),
          Tolls: Number(r.tolls || 0),
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, "Trips");
      }

      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], { type: "application/octet-stream" });
      const fname = `expenses-${format(effectiveRange.from, "yyyyMMdd")}-${format(effectiveRange.to, "yyyyMMdd")}.xlsx`;
      saveAs(blob, fname);

      toast({ title: "Success", description: "Expenses report downloaded" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to export report", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Wallet className="h-5 w-5" />
            Expenses Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Select value={preset} onValueChange={(v: any) => setPreset(v)}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Select preset" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="last_30">Last 30 Days</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            {preset === "custom" && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[280px] justify-start text-left font-normal",
                      !effectiveRange?.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {effectiveRange?.from ? (
                      effectiveRange.to ? (
                        <>
                          {format(effectiveRange.from, "PPP")} - {format(effectiveRange.to, "PPP")}
                        </>
                      ) : (
                        format(effectiveRange.from, "PPP")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={effectiveRange?.from}
                    selected={dateRange}
                    onSelect={(r) => setDateRange(r)}
                    numberOfMonths={2}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            )}

            <Button onClick={downloadExcel} disabled={loading || !effectiveRange?.from || !effectiveRange?.to} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download Excel
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : totals ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Trips</p>
                      <p className="text-2xl font-bold">{totals.tripsCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Driver Amount</p>
                      <p className="text-2xl font-bold">{currency(totals.driverAmount)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Commission</p>
                      <p className="text-2xl font-bold">{currency(totals.commission)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Fuel Amount</p>
                      <p className="text-2xl font-bold">{currency(totals.fuelAmount)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Tolls</p>
                      <p className="text-2xl font-bold">{currency(totals.tolls)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8">No data for selected range</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

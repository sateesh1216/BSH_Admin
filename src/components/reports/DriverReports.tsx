import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { Download, FileText, Users, Route, Gauge, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface TripRow {
  id: string;
  date: string;
  driver_name: string;
  car_number?: string | null;
  from_location: string;
  to_location: string;
  starting_km: number | null;
  ending_km: number | null;
  trip_amount: number;
  fuel_amount: number;
  fuel_litres: number | null;
  fuel_type: string;
}

interface DriverSummary {
  driver: string;
  trips: number;
  totalKm: number;
  avgKm: number;
  totalFuel: number;
  totalLitres: number;
  mileage: number; // km per litre — true mileage
  costPerKm: number;
  revenue: number;
}

type FilterMode = 'all' | 'monthly' | 'daily' | 'range';

export const DriverReports = () => {
  const { user, userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterMode>('monthly');
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [day, setDay] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-01'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [driverFilter, setDriverFilter] = useState<string>('all');
  const [vehicleFilter, setVehicleFilter] = useState<string>('all');

  const fetchTrips = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('trips')
        .select('id,date,driver_name,car_number,from_location,to_location,starting_km,ending_km,trip_amount,fuel_amount,fuel_type')
        .order('date', { ascending: false });

      if (!isAdmin && user) query = query.eq('created_by', user.id);

      if (filterMode === 'monthly' && month) {
        const [y, m] = month.split('-');
        const start = `${month}-01`;
        const end = format(new Date(parseInt(y), parseInt(m), 0), 'yyyy-MM-dd');
        query = query.gte('date', start).lte('date', end);
      } else if (filterMode === 'daily' && day) {
        query = query.eq('date', day);
      } else if (filterMode === 'range' && startDate && endDate) {
        query = query.gte('date', startDate).lte('date', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      setTrips((data as any) || []);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to fetch trips', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterMode, month, day, startDate, endDate]);

  const driverOptions = useMemo(() => {
    const set = new Set<string>();
    trips.forEach(t => t.driver_name && set.add(t.driver_name));
    return Array.from(set).sort();
  }, [trips]);

  const vehicleOptions = useMemo(() => {
    const set = new Set<string>();
    trips.forEach(t => {
      const v = t.car_number;
      if (v) set.add(v);
    });
    return Array.from(set).sort();
  }, [trips]);

  const filtered = useMemo(() => {
    return trips.filter(t => {
      if (driverFilter !== 'all' && t.driver_name !== driverFilter) return false;
      if (vehicleFilter !== 'all') {
        const v = t.car_number;
        if (v !== vehicleFilter) return false;
      }
      return true;
    });
  }, [trips, driverFilter, vehicleFilter]);

  const tripKm = (t: TripRow) =>
    t.starting_km != null && t.ending_km != null && t.ending_km >= t.starting_km
      ? t.ending_km - t.starting_km
      : 0;

  const summaries: DriverSummary[] = useMemo(() => {
    const map = new Map<string, DriverSummary>();
    filtered.forEach(t => {
      const km = tripKm(t);
      const cur = map.get(t.driver_name) || {
        driver: t.driver_name,
        trips: 0, totalKm: 0, avgKm: 0, totalFuel: 0, totalLitres: 0, mileage: 0, costPerKm: 0, revenue: 0,
      };
      cur.trips += 1;
      cur.totalKm += km;
      cur.totalFuel += t.fuel_amount || 0;
      cur.totalLitres += t.fuel_litres || 0;
      cur.revenue += t.trip_amount || 0;
      map.set(t.driver_name, cur);
    });
    const arr = Array.from(map.values()).map(s => ({
      ...s,
      avgKm: s.trips ? s.totalKm / s.trips : 0,
      mileage: s.totalLitres ? s.totalKm / s.totalLitres : 0,
      costPerKm: s.totalKm ? s.totalFuel / s.totalKm : 0,
    }));
    return arr.sort((a, b) => b.totalKm - a.totalKm);
  }, [filtered]);

  const totals = useMemo(() => {
    return summaries.reduce(
      (acc, s) => {
        acc.trips += s.trips;
        acc.totalKm += s.totalKm;
        acc.totalFuel += s.totalFuel;
        acc.totalLitres += s.totalLitres;
        acc.revenue += s.revenue;
        return acc;
      },
      { trips: 0, totalKm: 0, totalFuel: 0, totalLitres: 0, revenue: 0 }
    );
  }, [summaries]);

  const periodLabel = () => {
    if (filterMode === 'monthly') return month;
    if (filterMode === 'daily') return day;
    if (filterMode === 'range') return `${startDate} to ${endDate}`;
    return 'All time';
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const summarySheet = XLSX.utils.json_to_sheet(
      summaries.map(s => ({
        Driver: s.driver,
        'Total Trips': s.trips,
        'Total KM': s.totalKm,
        'Avg KM/Trip': Number(s.avgKm.toFixed(2)),
        'Fuel ₹': s.totalFuel,
        'Fuel Litres': Number(s.totalLitres.toFixed(2)),
        'Mileage (KM/L)': Number(s.mileage.toFixed(2)),
        'Cost per KM ₹': Number(s.costPerKm.toFixed(2)),
        'Revenue ₹': s.revenue,
      }))
    );
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Driver Summary');

    const detailSheet = XLSX.utils.json_to_sheet(
      filtered.map(t => {
        const km = tripKm(t);
        const litres = t.fuel_litres || 0;
        return {
          Date: t.date,
          Driver: t.driver_name,
          Vehicle: t.car_number || '',
          From: t.from_location,
          To: t.to_location,
          'Start KM': t.starting_km ?? '',
          'End KM': t.ending_km ?? '',
          'Trip KM': km,
          'Fuel ₹': t.fuel_amount,
          'Fuel Litres': litres,
          'Mileage (KM/L)': litres > 0 ? Number((km / litres).toFixed(2)) : '',
          'Fuel Type': t.fuel_type,
          'Trip ₹': t.trip_amount,
        };
      })
    );
    XLSX.utils.book_append_sheet(wb, detailSheet, 'Trip Details');

    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf], { type: 'application/octet-stream' }), `driver-report-${periodLabel()}.xlsx`);
    toast({ title: 'Exported', description: 'Excel file downloaded' });
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.text('Driver-wise Report', 14, 15);
    doc.setFontSize(10);
    doc.text(`Period: ${periodLabel()}`, 14, 22);
    doc.text(
      `Drivers: ${summaries.length}   Trips: ${totals.trips}   Total KM: ${totals.totalKm}   Revenue: ₹${totals.revenue.toLocaleString()}`,
      14, 28
    );

    autoTable(doc, {
      startY: 34,
      head: [['Driver', 'Trips', 'Total KM', 'Avg KM/Trip', 'Fuel ₹', 'Litres', 'KM/L', 'Revenue ₹']],
      body: summaries.map(s => [
        s.driver, s.trips, s.totalKm,
        s.avgKm.toFixed(2),
        s.totalFuel.toFixed(0),
        s.totalLitres.toFixed(2),
        s.mileage.toFixed(2),
        s.revenue.toFixed(0),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 58, 95] },
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      head: [['Date', 'Driver', 'Vehicle', 'From', 'To', 'Start KM', 'End KM', 'Trip KM', 'Fuel ₹', 'Litres', 'KM/L', 'Trip ₹']],
      body: filtered.map(t => {
        const km = tripKm(t);
        const litres = t.fuel_litres || 0;
        return [
          t.date, t.driver_name, t.car_number || '',
          t.from_location, t.to_location,
          t.starting_km ?? '', t.ending_km ?? '', km,
          (t.fuel_amount || 0).toFixed(0),
          litres ? litres.toFixed(2) : '-',
          litres > 0 ? (km / litres).toFixed(2) : '-',
          (t.trip_amount || 0).toFixed(0),
        ];
      }),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 58, 95] },
    });

    doc.save(`driver-report-${periodLabel()}.pdf`);
    toast({ title: 'Exported', description: 'PDF file downloaded' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Driver Reports
          </h2>
          <p className="text-sm text-muted-foreground">Driver-wise trips, distance, and mileage</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportExcel}>
            <Download className="h-4 w-4 mr-2" /> Excel
          </Button>
          <Button onClick={exportPDF}>
            <FileText className="h-4 w-4 mr-2" /> PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Period</label>
              <Select value={filterMode} onValueChange={(v: FilterMode) => setFilterMode(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="range">Date Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filterMode === 'monthly' && (
              <div>
                <label className="text-xs text-muted-foreground">Month</label>
                <Input type="month" value={month} onChange={e => setMonth(e.target.value)} />
              </div>
            )}
            {filterMode === 'daily' && (
              <div>
                <label className="text-xs text-muted-foreground">Date</label>
                <Input type="date" value={day} onChange={e => setDay(e.target.value)} />
              </div>
            )}
            {filterMode === 'range' && (
              <>
                <div>
                  <label className="text-xs text-muted-foreground">From</label>
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">To</label>
                  <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
              </>
            )}

            <div>
              <label className="text-xs text-muted-foreground">Driver</label>
              <Select value={driverFilter} onValueChange={setDriverFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Drivers</SelectItem>
                  {driverOptions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Vehicle</label>
              <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vehicles</SelectItem>
                  {vehicleOptions.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground flex items-center gap-2"><Users className="h-4 w-4" />Drivers</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{summaries.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground flex items-center gap-2"><TrendingUp className="h-4 w-4" />Total Trips</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totals.trips}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground flex items-center gap-2"><Route className="h-4 w-4" />Total KM</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totals.totalKm.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground flex items-center gap-2"><Gauge className="h-4 w-4" />Fuel ₹</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">₹{totals.totalFuel.toLocaleString()}</div></CardContent>
        </Card>
      </div>

      {/* Driver Summary Table */}
      <Card>
        <CardHeader><CardTitle>Driver Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver</TableHead>
                  <TableHead className="text-right">Trips</TableHead>
                  <TableHead className="text-right">Total KM</TableHead>
                  <TableHead className="text-right">Avg KM/Trip</TableHead>
                  <TableHead className="text-right">Fuel ₹</TableHead>
                  <TableHead className="text-right">KM per ₹ Fuel</TableHead>
                  <TableHead className="text-right">Revenue ₹</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-6">Loading…</TableCell></TableRow>
                ) : summaries.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">No data</TableCell></TableRow>
                ) : summaries.map(s => (
                  <TableRow key={s.driver}>
                    <TableCell className="font-medium">{s.driver}</TableCell>
                    <TableCell className="text-right">{s.trips}</TableCell>
                    <TableCell className="text-right">{s.totalKm.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{s.avgKm.toFixed(1)}</TableCell>
                    <TableCell className="text-right">₹{s.totalFuel.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{s.mileage.toFixed(3)}</TableCell>
                    <TableCell className="text-right">₹{s.revenue.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Trip-wise breakdown */}
      <Card>
        <CardHeader><CardTitle>Trip-wise KM Breakdown</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead className="text-right">Start KM</TableHead>
                  <TableHead className="text-right">End KM</TableHead>
                  <TableHead className="text-right">Trip KM</TableHead>
                  <TableHead className="text-right">Fuel ₹</TableHead>
                  <TableHead className="text-right">Trip ₹</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-6 text-muted-foreground">No trips</TableCell></TableRow>
                ) : filtered.map(t => (
                  <TableRow key={t.id}>
                    <TableCell>{t.date}</TableCell>
                    <TableCell>{t.driver_name}</TableCell>
                    <TableCell>{t.car_number || '—'}</TableCell>
                    <TableCell className="text-xs">{t.from_location} → {t.to_location}</TableCell>
                    <TableCell className="text-right">{t.starting_km ?? '—'}</TableCell>
                    <TableCell className="text-right">{t.ending_km ?? '—'}</TableCell>
                    <TableCell className="text-right font-medium">{tripKm(t)}</TableCell>
                    <TableCell className="text-right">₹{(t.fuel_amount || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right">₹{(t.trip_amount || 0).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

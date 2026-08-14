import { useMemo, useState } from 'react';
import { Download, FileText, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Driver } from './DriversList';
import { DriverExpense } from './DriverExpensesPage';
import { DriverPayment } from './DriverPaymentsPage';
import { TripAmount } from './DriverLedger';

interface Props {
  drivers: Driver[];
  tripAmounts: TripAmount[];
  expenses: DriverExpense[];
  payments: DriverPayment[];
}

interface Row {
  driver: string;
  trips: number;
  driverAmount: number;
  tripAmount: number;
  advances: number;
  otherExpenses: number;
  payments: number;
  paid: number;
  pending: number;
  avgDriverAmount: number;
  avgTripAmount: number;
  commission: number;
  commissionPct: number;
}

export const DriverModuleReports = ({ drivers, tripAmounts, expenses, payments }: Props) => {
  const [driverId, setDriverId] = useState<string>('all');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');

  const inRange = (date: string) => {
    if (from && date < from) return false;
    if (to && date > to) return false;
    return true;
  };

  const rows: Row[] = useMemo(() => {
    const activeDrivers = driverId === 'all' ? drivers : drivers.filter(d => d.id === driverId);
    return activeDrivers.map(d => {
      const t = tripAmounts.filter(x => x.driver_id === d.id && inRange((x.trip_date || x.created_at).slice(0, 10)));
      const e = expenses.filter(x => x.driver_id === d.id && inRange(x.expense_date));
      const p = payments.filter(x => x.driver_id === d.id && inRange(x.payment_date));

      const driverAmount = t.reduce((s, x) => s + Number(x.amount || 0), 0);
      const tripAmount = t.reduce((s, x) => s + Number(x.trip_amount || 0), 0);
      const advances = e.filter(x => x.expense_type === 'advance').reduce((s, x) => s + Number(x.amount || 0), 0);
      const otherExpenses = e.filter(x => x.expense_type !== 'advance').reduce((s, x) => s + Number(x.amount || 0), 0);
      const paymentsTotal = p.reduce((s, x) => s + Number(x.payment_amount || 0), 0);
      const paid = advances + otherExpenses + paymentsTotal;
      const commission = tripAmount - driverAmount;

      return {
        driver: d.name,
        trips: t.length,
        driverAmount,
        tripAmount,
        advances,
        otherExpenses,
        payments: paymentsTotal,
        paid,
        pending: driverAmount - paid,
        avgDriverAmount: t.length ? driverAmount / t.length : 0,
        avgTripAmount: t.length ? tripAmount / t.length : 0,
        commission,
        commissionPct: tripAmount > 0 ? (commission / tripAmount) * 100 : 0,
      };
    }).sort((a, b) => b.tripAmount - a.tripAmount);
  }, [drivers, tripAmounts, expenses, payments, driverId, from, to]);

  const totals = useMemo(() => {
    const base = rows.reduce((acc, r) => ({
      trips: acc.trips + r.trips,
      driverAmount: acc.driverAmount + r.driverAmount,
      tripAmount: acc.tripAmount + r.tripAmount,
      advances: acc.advances + r.advances,
      otherExpenses: acc.otherExpenses + r.otherExpenses,
      payments: acc.payments + r.payments,
      paid: acc.paid + r.paid,
      pending: acc.pending + r.pending,
    }), { trips: 0, driverAmount: 0, tripAmount: 0, advances: 0, otherExpenses: 0, payments: 0, paid: 0, pending: 0 });
    const commission = base.tripAmount - base.driverAmount;
    return {
      ...base,
      commission,
      commissionPct: base.tripAmount > 0 ? (commission / base.tripAmount) * 100 : 0,
      avgDriverAmount: base.trips ? base.driverAmount / base.trips : 0,
      avgTripAmount: base.trips ? base.tripAmount / base.trips : 0,
    };
  }, [rows]);

  const money = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
  const num = (n: number) => Math.round(n).toLocaleString('en-IN');

  const rangeLabel = from || to ? `${from || 'start'} to ${to || 'today'}` : 'All time';

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet([
      ...rows.map(r => ({
        Driver: r.driver,
        'Total Trips': r.trips,
        'Trip Amount': Math.round(r.tripAmount),
        'Driver Amount': Math.round(r.driverAmount),
        'Company Margin': Math.round(r.commission),
        'Margin %': Number(r.commissionPct.toFixed(1)),
        'Avg Trip Amount': Math.round(r.avgTripAmount),
        'Avg Driver Amount': Math.round(r.avgDriverAmount),
        Advances: Math.round(r.advances),
        'Other Expenses': Math.round(r.otherExpenses),
        Payments: Math.round(r.payments),
        'Total Settled': Math.round(r.paid),
        'Pending Balance': Math.round(r.pending),
      })),
      {
        Driver: 'TOTAL',
        'Total Trips': totals.trips,
        'Trip Amount': Math.round(totals.tripAmount),
        'Driver Amount': Math.round(totals.driverAmount),
        'Company Margin': Math.round(totals.commission),
        'Margin %': Number(totals.commissionPct.toFixed(1)),
        'Avg Trip Amount': Math.round(totals.avgTripAmount),
        'Avg Driver Amount': Math.round(totals.avgDriverAmount),
        Advances: Math.round(totals.advances),
        'Other Expenses': Math.round(totals.otherExpenses),
        Payments: Math.round(totals.payments),
        'Total Settled': Math.round(totals.paid),
        'Pending Balance': Math.round(totals.pending),
      },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Driver Report');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf]), `driver-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.text('Driver Report', 14, 14);
    doc.setFontSize(10);
    doc.text(`Range: ${rangeLabel}`, 14, 20);
    doc.text(
      `Trips: ${totals.trips}   Trip Amount: ${money(totals.tripAmount)}   Driver Amount: ${money(totals.driverAmount)}   Margin: ${money(totals.commission)}   Pending: ${money(totals.pending)}`,
      14, 26,
    );
    autoTable(doc, {
      startY: 32,
      styles: { fontSize: 8 },
      head: [['Driver', 'Trips', 'Trip Amt', 'Driver Amt', 'Margin', 'Margin %', 'Avg/Trip', 'Advances', 'Expenses', 'Payments', 'Settled', 'Pending']],
      body: rows.map(r => [
        r.driver, r.trips, num(r.tripAmount), num(r.driverAmount), num(r.commission), `${r.commissionPct.toFixed(1)}%`,
        num(r.avgTripAmount), num(r.advances), num(r.otherExpenses), num(r.payments), num(r.paid), num(r.pending),
      ]),
      foot: [[
        'Total', totals.trips, num(totals.tripAmount), num(totals.driverAmount), num(totals.commission), `${totals.commissionPct.toFixed(1)}%`,
        num(totals.avgTripAmount), num(totals.advances), num(totals.otherExpenses), num(totals.payments), num(totals.paid), num(totals.pending),
      ]],
    });
    doc.save(`driver-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const cards = [
    { label: 'Total Trips', value: String(totals.trips), color: 'text-primary' },
    { label: 'Trip Amount', value: money(totals.tripAmount), color: 'text-indigo-600' },
    { label: 'Driver Amount', value: money(totals.driverAmount), color: 'text-blue-600' },
    { label: 'Company Margin', value: `${money(totals.commission)} (${totals.commissionPct.toFixed(1)}%)`, color: 'text-green-600' },
    { label: 'Settled (Adv+Exp+Pay)', value: money(totals.paid), color: 'text-purple-600' },
    { label: 'Pending Balance', value: money(totals.pending), color: totals.pending > 0 ? 'text-red-600' : 'text-green-600' },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Driver</label>
              <Select value={driverId} onValueChange={setDriverId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All drivers</SelectItem>
                  {drivers.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">From</label>
              <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">To</label>
              <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
            </div>
            <div className="flex items-end gap-2">
              <Button size="sm" variant="outline" onClick={exportExcel}><Download className="h-4 w-4 mr-1" />Excel</Button>
              <Button size="sm" variant="outline" onClick={exportPDF}><FileText className="h-4 w-4 mr-1" />PDF</Button>
              <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1" />Print</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {cards.map(c => (
          <Card key={c.label}><CardContent className="p-3">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className={`text-lg font-bold ${c.color}`}>{c.value}</p>
          </CardContent></Card>
        ))}
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Driver</TableHead>
              <TableHead className="text-right">Trips</TableHead>
              <TableHead className="text-right">Trip Amount</TableHead>
              <TableHead className="text-right">Driver Amount</TableHead>
              <TableHead className="text-right">Margin</TableHead>
              <TableHead className="text-right">Margin %</TableHead>
              <TableHead className="text-right">Avg / Trip</TableHead>
              <TableHead className="text-right">Advances</TableHead>
              <TableHead className="text-right">Expenses</TableHead>
              <TableHead className="text-right">Payments</TableHead>
              <TableHead className="text-right">Settled</TableHead>
              <TableHead className="text-right">Pending</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={12} className="text-center text-muted-foreground py-6">No data</TableCell></TableRow>
            ) : rows.map((r, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{r.driver}</TableCell>
                <TableCell className="text-right">{r.trips}</TableCell>
                <TableCell className="text-right text-indigo-600">{money(r.tripAmount)}</TableCell>
                <TableCell className="text-right text-blue-600">{money(r.driverAmount)}</TableCell>
                <TableCell className="text-right text-green-600">{money(r.commission)}</TableCell>
                <TableCell className="text-right">{r.commissionPct.toFixed(1)}%</TableCell>
                <TableCell className="text-right">{money(r.avgTripAmount)}</TableCell>
                <TableCell className="text-right text-orange-600">{money(r.advances)}</TableCell>
                <TableCell className="text-right text-orange-600">{money(r.otherExpenses)}</TableCell>
                <TableCell className="text-right text-purple-600">{money(r.payments)}</TableCell>
                <TableCell className="text-right">{money(r.paid)}</TableCell>
                <TableCell className={`text-right font-semibold ${r.pending > 0 ? 'text-red-600' : 'text-green-600'}`}>{money(r.pending)}</TableCell>
              </TableRow>
            ))}
            {rows.length > 0 && (
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell>Total</TableCell>
                <TableCell className="text-right">{totals.trips}</TableCell>
                <TableCell className="text-right text-indigo-600">{money(totals.tripAmount)}</TableCell>
                <TableCell className="text-right text-blue-600">{money(totals.driverAmount)}</TableCell>
                <TableCell className="text-right text-green-600">{money(totals.commission)}</TableCell>
                <TableCell className="text-right">{totals.commissionPct.toFixed(1)}%</TableCell>
                <TableCell className="text-right">{money(totals.avgTripAmount)}</TableCell>
                <TableCell className="text-right text-orange-600">{money(totals.advances)}</TableCell>
                <TableCell className="text-right text-orange-600">{money(totals.otherExpenses)}</TableCell>
                <TableCell className="text-right text-purple-600">{money(totals.payments)}</TableCell>
                <TableCell className="text-right">{money(totals.paid)}</TableCell>
                <TableCell className={`text-right ${totals.pending > 0 ? 'text-red-600' : 'text-green-600'}`}>{money(totals.pending)}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

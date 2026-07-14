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
  tripAmount: number;
  expenses: number;
  payments: number;
  balance: number;
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
      const tripAmt = t.reduce((s, x) => s + Number(x.amount || 0), 0);
      const expAmt = e.reduce((s, x) => s + Number(x.amount || 0), 0);
      const payAmt = p.reduce((s, x) => s + Number(x.payment_amount || 0), 0);
      return { driver: d.name, trips: t.length, tripAmount: tripAmt, expenses: expAmt, payments: payAmt, balance: tripAmt - expAmt - payAmt };
    });
  }, [drivers, tripAmounts, expenses, payments, driverId, from, to]);

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(rows.map(r => ({
      Driver: r.driver,
      Trips: r.trips,
      'Trip Amount': r.tripAmount,
      Expenses: r.expenses,
      Payments: r.payments,
      Balance: r.balance,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Driver Report');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf]), `driver-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Driver Report', 14, 14);
    if (from || to) doc.setFontSize(10), doc.text(`Range: ${from || 'start'} to ${to || 'today'}`, 14, 20);
    autoTable(doc, {
      startY: 26,
      head: [['Driver', 'Trips', 'Trip Amt', 'Expenses', 'Payments', 'Balance']],
      body: rows.map(r => [r.driver, r.trips, r.tripAmount.toLocaleString('en-IN'), r.expenses.toLocaleString('en-IN'), r.payments.toLocaleString('en-IN'), r.balance.toLocaleString('en-IN')]),
    });
    doc.save(`driver-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

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

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Driver</TableHead>
              <TableHead className="text-right">Trips</TableHead>
              <TableHead className="text-right">Trip Amount</TableHead>
              <TableHead className="text-right">Expenses</TableHead>
              <TableHead className="text-right">Payments</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No data</TableCell></TableRow>
            ) : rows.map((r, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{r.driver}</TableCell>
                <TableCell className="text-right">{r.trips}</TableCell>
                <TableCell className="text-right">₹{r.tripAmount.toLocaleString('en-IN')}</TableCell>
                <TableCell className="text-right text-orange-600">₹{r.expenses.toLocaleString('en-IN')}</TableCell>
                <TableCell className="text-right text-purple-600">₹{r.payments.toLocaleString('en-IN')}</TableCell>
                <TableCell className={`text-right font-semibold ${r.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>₹{r.balance.toLocaleString('en-IN')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

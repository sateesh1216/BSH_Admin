import { useMemo, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loading } from '@/components/ui/loading';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Driver } from './DriversList';
import { DriverExpense } from './DriverExpensesPage';
import { DriverPayment } from './DriverPaymentsPage';

export interface TripAmount {
  id: string;
  driver_id: string;
  trip_id: string | null;
  amount: number;
  created_at: string;
  trip_date?: string;
}

interface Props {
  drivers: Driver[];
  tripAmounts: TripAmount[];
  expenses: DriverExpense[];
  payments: DriverPayment[];
}

interface LedgerRow {
  date: string;
  type: string;
  reference: string;
  driverName: string;
  tripId?: string | null;
  credit: number;
  debit: number;
  balance: number;
}

export const DriverLedger = ({ drivers, tripAmounts, expenses, payments }: Props) => {
  const [selectedId, setSelectedId] = useState<string>(drivers[0]?.id || '');
  const [tripDetails, setTripDetails] = useState<any | null>(null);
  const [loadingTrip, setLoadingTrip] = useState(false);
  const [tripOpen, setTripOpen] = useState(false);

  const { rows, totals, driver } = useMemo(() => {
    const driver = drivers.find(d => d.id === selectedId);
    const trips = tripAmounts.filter(t => t.driver_id === selectedId);
    const exps = expenses.filter(e => e.driver_id === selectedId);
    const pays = payments.filter(p => p.driver_id === selectedId);
    const driverName = driver?.name || '';

    const combined: Omit<LedgerRow, 'balance'>[] = [
      ...trips.map((t, i) => ({
        date: t.trip_date || t.created_at.slice(0, 10),
        type: 'Trip Amount',
        reference: `TRIP-${String(i + 1).padStart(3, '0')}`,
        driverName,
        tripId: t.trip_id,
        credit: Number(t.amount) || 0,
        debit: 0,
      })),
      ...exps.map((e, i) => ({
        date: e.expense_date,
        type: e.expense_type === 'advance' ? 'Advance' : e.expense_type.charAt(0).toUpperCase() + e.expense_type.slice(1),
        reference: e.expense_type === 'advance' ? `ADV-${String(i + 1).padStart(3, '0')}` : `EXP-${String(i + 1).padStart(3, '0')}`,
        driverName,
        credit: 0,
        debit: Number(e.amount) || 0,
      })),
      ...pays.map((p, i) => ({
        date: p.payment_date,
        type: 'Payment',
        reference: p.reference_number || `PAY-${String(i + 1).padStart(3, '0')}`,
        driverName,
        credit: 0,
        debit: Number(p.payment_amount) || 0,
      })),
    ].sort((a, b) => a.date.localeCompare(b.date));

    let balance = 0;
    const rows: LedgerRow[] = combined.map(r => {
      balance += r.credit - r.debit;
      return { ...r, balance };
    });

    const totalTripAmount = trips.reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const totalExpenses = exps.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const totalPayments = pays.reduce((s, p) => s + (Number(p.payment_amount) || 0), 0);

    return {
      rows,
      driver,
      totals: {
        trips: trips.length,
        tripAmount: totalTripAmount,
        expenses: totalExpenses,
        payments: totalPayments,
        pending: totalTripAmount - totalExpenses - totalPayments,
      },
    };
  }, [drivers, tripAmounts, expenses, payments, selectedId]);

  const openTrip = async (tripId: string) => {
    setTripOpen(true);
    setLoadingTrip(true);
    setTripDetails(null);
    try {
      const { data, error } = await supabase.from('trips').select('*').eq('id', tripId).maybeSingle();
      if (error) throw error;
      setTripDetails(data);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      setTripOpen(false);
    } finally {
      setLoadingTrip(false);
    }
  };

  if (drivers.length === 0) {
    return <p className="text-center text-muted-foreground py-10">Add a driver first to view the ledger.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-end sm:justify-between">
        <div className="space-y-2 max-w-sm w-full">
          <label className="text-sm font-medium">Select Driver</label>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger><SelectValue placeholder="Select driver" /></SelectTrigger>
            <SelectContent>
              {drivers.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {driver && <Badge variant={driver.status === 'active' ? 'default' : 'secondary'} className="capitalize">{driver.status}</Badge>}
      </div>

      {driver && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Total Trips', value: totals.trips, color: 'text-primary' },
              { label: 'Trip Amount', value: `₹${totals.tripAmount.toLocaleString('en-IN')}`, color: 'text-blue-600' },
              { label: 'Expenses', value: `₹${totals.expenses.toLocaleString('en-IN')}`, color: 'text-orange-600' },
              { label: 'Payments', value: `₹${totals.payments.toLocaleString('en-IN')}`, color: 'text-purple-600' },
              { label: 'Pending Balance', value: `₹${totals.pending.toLocaleString('en-IN')}`, color: totals.pending > 0 ? 'text-red-600' : 'text-green-600' },
            ].map(s => (
              <Card key={s.label}><CardContent className="p-3">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              </CardContent></Card>
            ))}
          </div>

          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">No transactions</TableCell></TableRow>
                ) : rows.map((r, i) => {
                  const clickable = r.type === 'Trip Amount' && r.tripId;
                  return (
                    <TableRow
                      key={i}
                      className={clickable ? 'cursor-pointer hover:bg-muted/50' : ''}
                      onClick={() => clickable && openTrip(r.tripId!)}
                    >
                      <TableCell>{r.date}</TableCell>
                      <TableCell><Badge variant="outline">{r.type}</Badge></TableCell>
                      <TableCell className="font-medium">{r.driverName}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {clickable ? <span className="text-primary underline underline-offset-2">{r.reference}</span> : r.reference}
                      </TableCell>
                      <TableCell className="text-right text-green-600">{r.credit > 0 ? `₹${r.credit.toLocaleString('en-IN')}` : '-'}</TableCell>
                      <TableCell className="text-right text-red-600">{r.debit > 0 ? `₹${r.debit.toLocaleString('en-IN')}` : '-'}</TableCell>
                      <TableCell className="text-right font-semibold">₹{r.balance.toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <Dialog open={tripOpen} onOpenChange={setTripOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Trip Details</DialogTitle>
          </DialogHeader>
          {loadingTrip ? (
            <Loading text="Loading trip..." />
          ) : tripDetails ? (
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Date', tripDetails.date],
                ['Driver Name', tripDetails.driver_name],
                ['Driver Number', tripDetails.driver_number],
                ['Customer', tripDetails.customer_name],
                ['Customer Number', tripDetails.customer_number],
                ['From', tripDetails.from_location],
                ['To', tripDetails.to_location],
                ['Company', tripDetails.company],
                ['Car Number', tripDetails.car_number],
                ['Fuel Type', tripDetails.fuel_type],
                ['Fuel Litres', tripDetails.fuel_litres],
                ['Fuel Amount', tripDetails.fuel_amount != null ? `₹${Number(tripDetails.fuel_amount).toLocaleString('en-IN')}` : null],
                ['Starting KM', tripDetails.starting_km],
                ['Ending KM', tripDetails.ending_km],
                ['Tolls', tripDetails.tolls != null ? `₹${Number(tripDetails.tolls).toLocaleString('en-IN')}` : null],
                ['Commission', tripDetails.commission != null ? `₹${Number(tripDetails.commission).toLocaleString('en-IN')}` : null],
                ['Driver Amount', tripDetails.driver_amount != null ? `₹${Number(tripDetails.driver_amount).toLocaleString('en-IN')}` : null],
                ['Trip Amount', tripDetails.trip_amount != null ? `₹${Number(tripDetails.trip_amount).toLocaleString('en-IN')}` : null],
                ['Profit', tripDetails.profit != null ? `₹${Number(tripDetails.profit).toLocaleString('en-IN')}` : null],
                ['Payment Mode', tripDetails.payment_mode],
                ['Payment Status', tripDetails.payment_status],
              ].map(([label, value]) => (
                <div key={label as string} className="border-b pb-2">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-medium">{value !== null && value !== undefined && value !== '' ? String(value) : '-'}</p>
                </div>
              ))}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

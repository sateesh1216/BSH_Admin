import { useMemo, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loading } from '@/components/ui/loading';
import { RefreshCw, Pencil, Trash2, CheckCircle2 } from 'lucide-react';
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
  trip_amount?: number;
}

interface Props {
  drivers: Driver[];
  tripAmounts: TripAmount[];
  expenses: DriverExpense[];
  payments: DriverPayment[];
  onChanged?: () => void;
}

interface LedgerRow {
  date: string;
  type: 'Trip' | 'Expense' | 'Advance' | 'Payment';
  reference: string;
  driverName: string;
  tripId?: string | null;
  driverAmount: number;
  tripAmount: number;
  source: 'trip' | 'expense' | 'payment';
  sourceId: string;
  raw?: any;
}

export const DriverLedger = ({ drivers, tripAmounts, expenses, payments, onChanged }: Props) => {
  const { user } = useAuth();
  const [selectedId, setSelectedId] = useState<string>(drivers[0]?.id || '');
  const [tripDetails, setTripDetails] = useState<any | null>(null);
  const [loadingTrip, setLoadingTrip] = useState(false);
  const [tripOpen, setTripOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [editRow, setEditRow] = useState<LedgerRow | null>(null);
  const [editValues, setEditValues] = useState<{ date: string; amount: string; note: string }>({ date: '', amount: '', note: '' });
  const [deleteRow, setDeleteRow] = useState<LedgerRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [settleOpen, setSettleOpen] = useState(false);
  const [settleAllOpen, setSettleAllOpen] = useState(false);
  const [settleValues, setSettleValues] = useState({ date: new Date().toISOString().slice(0, 10), amount: '', mode: 'cash', reference: '', notes: '' });


  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data: trips, error } = await supabase
        .from('trips')
        .select('id, driver_id, driver_name, driver_amount');
      if (error) throw error;

      const byName = new Map(drivers.map(d => [d.name.trim().toLowerCase(), d]));
      const existing = new Map(tripAmounts.map(t => [t.trip_id, t]));
      const toUpsert: any[] = [];
      let linked = 0;

      for (const t of trips || []) {
        let driverId = t.driver_id as string | null;
        if (!driverId) {
          const key = (t.driver_name || '').trim().toLowerCase();
          const drv = key ? byName.get(key) : null;
          if (drv) {
            driverId = drv.id;
            const { error: uErr } = await supabase.from('trips').update({ driver_id: drv.id }).eq('id', t.id);
            if (!uErr) linked++;
          }
        }
        const amt = Number(t.driver_amount) || 0;
        if (!driverId || amt <= 0) continue;
        const cur = existing.get(t.id);
        if (!cur || Number(cur.amount) !== amt || cur.driver_id !== driverId) {
          toUpsert.push({ trip_id: t.id, driver_id: driverId, amount: amt, created_by: user?.id });
        }
      }

      let synced = 0;
      if (toUpsert.length > 0) {
        const { error: upErr } = await supabase
          .from('driver_trip_amounts')
          .upsert(toUpsert, { onConflict: 'trip_id' });
        if (upErr) throw upErr;
        synced = toUpsert.length;
      }

      toast({ title: 'Ledger synced', description: `${synced} entries updated, ${linked} trip(s) linked.` });
      onChanged?.();
    } catch (err: any) {
      toast({ title: 'Sync failed', description: err.message, variant: 'destructive' });
    } finally {
      setSyncing(false);
    }
  };

  const { rows, totals, driver } = useMemo(() => {
    const driver = drivers.find(d => d.id === selectedId);
    const trips = tripAmounts.filter(t => t.driver_id === selectedId);
    const exps = expenses.filter(e => e.driver_id === selectedId);
    const pays = payments.filter(p => p.driver_id === selectedId);
    const driverName = driver?.name || '';

    const combined: LedgerRow[] = [
      ...trips.map((t, i) => ({
        date: t.trip_date || t.created_at.slice(0, 10),
        type: 'Trip' as const,
        reference: `TRIP-${String(i + 1).padStart(3, '0')}`,
        driverName,
        tripId: t.trip_id,
        driverAmount: Number(t.amount) || 0,
        tripAmount: Number(t.trip_amount) || 0,
        source: 'trip' as const,
        sourceId: t.id,
        raw: t,
      })),
      ...exps.map((e, i) => ({
        date: e.expense_date,
        type: (e.expense_type === 'advance' ? 'Advance' : 'Expense') as 'Advance' | 'Expense',
        reference: e.expense_type === 'advance' ? `ADV-${String(i + 1).padStart(3, '0')}` : `EXP-${String(i + 1).padStart(3, '0')}`,
        driverName,
        driverAmount: -(Number(e.amount) || 0),
        tripAmount: 0,
        source: 'expense' as const,
        sourceId: e.id,
        raw: e,
      })),
      ...pays.map((p, i) => ({
        date: p.payment_date,
        type: 'Payment' as const,
        reference: p.reference_number || `PAY-${String(i + 1).padStart(3, '0')}`,
        driverName,
        driverAmount: -(Number(p.payment_amount) || 0),
        tripAmount: 0,
        source: 'payment' as const,
        sourceId: p.id,
        raw: p,
      })),
    ].sort((a, b) => a.date.localeCompare(b.date));

    const totalTripAmount = trips.reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const totalTripRevenue = trips.reduce((s, t) => s + (Number(t.trip_amount) || 0), 0);
    const totalExpenses = exps.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const totalPayments = pays.reduce((s, p) => s + (Number(p.payment_amount) || 0), 0);

    return {
      rows: combined,
      driver,
      totals: {
        trips: trips.length,
        tripAmount: totalTripAmount,
        tripRevenue: totalTripRevenue,
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

  const startEdit = (row: LedgerRow) => {
    if (row.source === 'expense') {
      setEditValues({ date: row.raw.expense_date, amount: String(row.raw.amount), note: row.raw.description || '' });
    } else if (row.source === 'payment') {
      setEditValues({ date: row.raw.payment_date, amount: String(row.raw.payment_amount), note: row.raw.notes || '' });
    }
    setEditRow(row);
  };

  const saveEdit = async () => {
    if (!editRow) return;
    setBusy(true);
    try {
      const amt = Number(editValues.amount);
      if (!(amt > 0)) throw new Error('Amount must be greater than 0');
      if (editRow.source === 'expense') {
        const { error } = await supabase.from('driver_expenses').update({
          expense_date: editValues.date,
          amount: amt,
          description: editValues.note || null,
        }).eq('id', editRow.sourceId);
        if (error) throw error;
      } else if (editRow.source === 'payment') {
        const { error } = await supabase.from('driver_payments').update({
          payment_date: editValues.date,
          payment_amount: amt,
          notes: editValues.note || null,
        }).eq('id', editRow.sourceId);
        if (error) throw error;
      }
      toast({ title: 'Updated', description: 'Ledger entry updated.' });
      setEditRow(null);
      onChanged?.();
    } catch (err: any) {
      toast({ title: 'Update failed', description: err.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteRow) return;
    setBusy(true);
    try {
      const table = deleteRow.source === 'expense' ? 'driver_expenses'
        : deleteRow.source === 'payment' ? 'driver_payments'
        : 'driver_trip_amounts';
      const { error } = await supabase.from(table).delete().eq('id', deleteRow.sourceId);
      if (error) throw error;
      toast({ title: 'Deleted', description: 'Ledger entry removed.' });
      setDeleteRow(null);
      onChanged?.();
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const openSettle = () => {
    setSettleValues({
      date: new Date().toISOString().slice(0, 10),
      amount: totals.pending > 0 ? String(Math.round(totals.pending * 100) / 100) : '',
      mode: 'cash',
      reference: '',
      notes: 'Pending balance settlement',
    });
    setSettleOpen(true);
  };

  const saveSettle = async () => {
    if (!selectedId) return;
    const amt = Number(settleValues.amount);
    if (!(amt > 0)) {
      toast({ title: 'Invalid amount', description: 'Enter an amount greater than 0', variant: 'destructive' });
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.from('driver_payments').insert({
        driver_id: selectedId,
        payment_amount: amt,
        payment_mode: settleValues.mode,
        reference_number: settleValues.reference || null,
        payment_date: settleValues.date,
        notes: settleValues.notes || null,
        created_by: user?.id,
      });
      if (error) throw error;
      toast({ title: 'Balance settled', description: `₹${amt.toLocaleString('en-IN')} recorded as paid.` });
      setSettleOpen(false);
      onChanged?.();
    } catch (err: any) {
      toast({ title: 'Settlement failed', description: err.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };


  const allPending = useMemo(() => {
    return drivers.map(d => {
      const t = tripAmounts.filter(x => x.driver_id === d.id).reduce((s, x) => s + (Number(x.amount) || 0), 0);
      const e = expenses.filter(x => x.driver_id === d.id).reduce((s, x) => s + (Number(x.amount) || 0), 0);
      const p = payments.filter(x => x.driver_id === d.id).reduce((s, x) => s + (Number(x.payment_amount) || 0), 0);
      return { driver: d, pending: Math.round((t - e - p) * 100) / 100 };
    }).filter(x => x.pending > 0);
  }, [drivers, tripAmounts, expenses, payments]);

  const settleAllTotal = allPending.reduce((s, x) => s + x.pending, 0);

  const settleAll = async () => {
    if (allPending.length === 0) return;
    setBusy(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const { error } = await supabase.from('driver_payments').insert(
        allPending.map(x => ({
          driver_id: x.driver.id,
          payment_amount: x.pending,
          payment_mode: 'cash',
          payment_date: today,
          notes: 'Bulk pending balance settlement',
          created_by: user?.id,
        }))
      );
      if (error) throw error;
      toast({ title: 'All balances settled', description: `${allPending.length} driver(s), ₹${settleAllTotal.toLocaleString('en-IN')} recorded.` });
      setSettleAllOpen(false);
      onChanged?.();
    } catch (err: any) {
      toast({ title: 'Settlement failed', description: err.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  if (drivers.length === 0) {
    return <p className="text-center text-muted-foreground py-10">Add a driver first to view the ledger.</p>;
  }

  const fmt = (n: number) => `₹${Math.abs(n).toLocaleString('en-IN')}`;

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
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Ledger'}
          </Button>
          <Button onClick={openSettle} disabled={!selectedId}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Settle Pending
          </Button>
          <Button variant="secondary" onClick={() => setSettleAllOpen(true)} disabled={allPending.length === 0 || busy}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Settle All ({allPending.length})
          </Button>
        </div>
      </div>

      {driver && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {[
              { label: 'Total Trips', value: totals.trips, color: 'text-primary' },
              { label: 'Driver Amount', value: fmt(totals.tripAmount), color: 'text-blue-600' },
              { label: 'Trip Amount', value: fmt(totals.tripRevenue), color: 'text-indigo-600' },
              { label: 'Expenses', value: fmt(totals.expenses), color: 'text-orange-600' },
              { label: 'Payments', value: fmt(totals.payments), color: 'text-purple-600' },
              { label: 'Pending Balance', value: fmt(totals.pending), color: totals.pending > 0 ? 'text-red-600' : 'text-green-600' },
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
                  <TableHead className="text-right">Driver Amount</TableHead>
                  <TableHead className="text-right">Trip Amount</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-6">No transactions</TableCell></TableRow>
                ) : (() => { let run = 0; return rows.map((r, i) => {
                  const clickable = r.source === 'trip' && r.tripId;
                  run += r.driverAmount;
                  const balance = run;
                  return (
                    <TableRow key={i} className={clickable ? 'hover:bg-muted/50' : ''}>
                      <TableCell>{r.date}</TableCell>
                      <TableCell><Badge variant="outline">{r.type}</Badge></TableCell>
                      <TableCell className="font-medium">{r.driverName}</TableCell>
                      <TableCell
                        className={`font-mono text-xs ${clickable ? 'cursor-pointer' : ''}`}
                        onClick={() => clickable && openTrip(r.tripId!)}
                      >
                        {clickable ? <span className="text-primary underline underline-offset-2">{r.reference}</span> : r.reference}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${r.driverAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {r.driverAmount >= 0 ? '' : '-'}{fmt(r.driverAmount)}
                      </TableCell>
                      <TableCell className="text-right text-indigo-600">
                        {r.tripAmount > 0 ? fmt(r.tripAmount) : '-'}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {balance < 0 ? '-' : ''}{fmt(balance)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {r.source !== 'trip' && (
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(r)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setDeleteRow(r)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                }); })()}
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

      <Dialog open={!!editRow} onOpenChange={o => !o && setEditRow(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit {editRow?.type}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Date</Label>
              <Input type="date" value={editValues.date} onChange={e => setEditValues(v => ({ ...v, date: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Amount (₹)</Label>
              <Input type="number" step="0.01" value={editValues.amount} onChange={e => setEditValues(v => ({ ...v, amount: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>{editRow?.source === 'expense' ? 'Description' : 'Notes'}</Label>
              <Textarea value={editValues.note} onChange={e => setEditValues(v => ({ ...v, note: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRow(null)} disabled={busy}>Cancel</Button>
            <Button onClick={saveEdit} disabled={busy}>{busy ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteRow} onOpenChange={o => !o && setDeleteRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteRow?.source === 'trip'
                ? 'This will remove the trip amount from the ledger. The trip itself will not be deleted.'
                : 'This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={busy} className="bg-destructive text-destructive-foreground">
              {busy ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={settleOpen} onOpenChange={o => !o && setSettleOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Settle Pending Balance</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-md bg-muted p-3 text-sm">
              <span className="text-muted-foreground">Pending for {driver?.name}: </span>
              <span className={`font-bold ${totals.pending > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {totals.pending < 0 ? '-' : ''}{fmt(totals.pending)}
              </span>
            </div>
            <div className="space-y-1">
              <Label>Payment Date</Label>
              <Input type="date" value={settleValues.date} onChange={e => setSettleValues(v => ({ ...v, date: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Amount (₹)</Label>
              <Input type="number" step="0.01" value={settleValues.amount} onChange={e => setSettleValues(v => ({ ...v, amount: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Payment Mode</Label>
              <Select value={settleValues.mode} onValueChange={val => setSettleValues(v => ({ ...v, mode: val }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[{ v: 'cash', l: 'Cash' }, { v: 'upi', l: 'UPI' }, { v: 'bank', l: 'Bank Transfer' }].map(m => <SelectItem key={m.v} value={m.v}>{m.l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Reference (optional)</Label>
              <Input value={settleValues.reference} onChange={e => setSettleValues(v => ({ ...v, reference: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea value={settleValues.notes} onChange={e => setSettleValues(v => ({ ...v, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettleOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={saveSettle} disabled={busy}>{busy ? 'Saving...' : 'Record Payment'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={settleAllOpen} onOpenChange={o => !o && setSettleAllOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Settle all pending balances?</AlertDialogTitle>
            <AlertDialogDescription>
              This records a cash payment (dated today) for {allPending.length} driver(s), totalling {fmt(settleAllTotal)}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-56 overflow-y-auto text-sm space-y-1">
            {allPending.map(x => (
              <div key={x.driver.id} className="flex justify-between border-b pb-1">
                <span>{x.driver.name}</span>
                <span className="font-medium text-red-600">{fmt(x.pending)}</span>
              </div>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={settleAll} disabled={busy}>{busy ? 'Settling...' : 'Settle All'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

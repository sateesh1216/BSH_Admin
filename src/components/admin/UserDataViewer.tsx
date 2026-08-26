import { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Car, Wrench, Truck, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

type TableName = 'trips' | 'maintenance' | 'outside_vehicle_trips';
type Row = Record<string, any>;

const HIDDEN_FIELDS = ['id', 'created_by', 'created_at', 'updated_at', 'driver_id', 'profit'];

const rupee = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const COLUMNS: Record<TableName, { key: string; label: string }[]> = {
  trips: [
    { key: 'date', label: 'Date' },
    { key: 'driver_name', label: 'Driver' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'from_location', label: 'From' },
    { key: 'to_location', label: 'To' },
    { key: 'car_number', label: 'Vehicle' },
    { key: 'trip_amount', label: 'Trip Amount' },
    { key: 'payment_status', label: 'Status' },
  ],
  maintenance: [
    { key: 'date', label: 'Date' },
    { key: 'vehicle_number', label: 'Vehicle' },
    { key: 'driver_name', label: 'Driver' },
    { key: 'maintenance_type', label: 'Type' },
    { key: 'amount', label: 'Amount' },
    { key: 'payment_mode', label: 'Payment' },
  ],
  outside_vehicle_trips: [
    { key: 'date', label: 'Date' },
    { key: 'driver_name', label: 'Driver' },
    { key: 'travel_company', label: 'Company' },
    { key: 'from_location', label: 'From' },
    { key: 'to_location', label: 'To' },
    { key: 'vehicle_number', label: 'Vehicle' },
    { key: 'trip_amount', label: 'Amount' },
    { key: 'payment_status', label: 'Status' },
  ],
};

const AMOUNT_KEYS = ['trip_amount', 'amount', 'driver_amount', 'commission', 'fuel_amount', 'tolls', 'profit'];

interface Props {
  userId: string;
  userLabel: string;
}

export const UserDataViewer = ({ userId, userLabel }: Props) => {
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<Row[]>([]);
  const [maintenance, setMaintenance] = useState<Row[]>([]);
  const [outside, setOutside] = useState<Row[]>([]);
  const [editing, setEditing] = useState<{ table: TableName; row: Row } | null>(null);
  const [editForm, setEditForm] = useState<Row>({});
  const [deleting, setDeleting] = useState<{ table: TableName; id: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [t, m, o] = await Promise.all([
      supabase.from('trips').select('*').eq('created_by', userId).order('date', { ascending: false }),
      supabase.from('maintenance').select('*').eq('created_by', userId).order('date', { ascending: false }),
      supabase.from('outside_vehicle_trips').select('*').eq('created_by', userId).order('date', { ascending: false }),
    ]);
    const err = t.error || m.error || o.error;
    if (err) toast({ title: 'Error', description: err.message, variant: 'destructive' });
    setTrips(t.data || []);
    setMaintenance(m.data || []);
    setOutside(o.data || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const totals = useMemo(() => ({
    tripRevenue: trips.reduce((s, r) => s + Number(r.trip_amount || 0), 0),
    maintenanceCost: maintenance.reduce((s, r) => s + Number(r.amount || 0), 0),
    outsideRevenue: outside.reduce((s, r) => s + Number(r.trip_amount || 0), 0),
  }), [trips, maintenance, outside]);

  const openEdit = (table: TableName, row: Row) => {
    setEditing({ table, row });
    const clone: Row = {};
    Object.keys(row).forEach(k => {
      if (!HIDDEN_FIELDS.includes(k)) clone[k] = row[k] ?? '';
    });
    setEditForm(clone);
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    const payload: Row = {};
    Object.entries(editForm).forEach(([k, v]) => {
      const original = editing.row[k];
      if (typeof original === 'number' || AMOUNT_KEYS.includes(k)) {
        payload[k] = v === '' || v === null ? null : Number(v);
      } else {
        payload[k] = v === '' ? null : v;
      }
    });
    const { error } = await supabase.from(editing.table).update(payload).eq('id', editing.row.id);
    setSaving(false);
    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Saved', description: 'Record updated' });
    setEditing(null);
    fetchAll();
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const { error } = await supabase.from(deleting.table).delete().eq('id', deleting.id);
    setDeleting(null);
    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Deleted', description: 'Record removed' });
    fetchAll();
  };

  const renderTable = (table: TableName, rows: Row[]) => (
    <div className="overflow-x-auto max-h-[45vh] overflow-y-auto rounded-md border border-border">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-muted">
          <tr className="text-left text-muted-foreground">
            {COLUMNS[table].map(c => <th key={c.key} className="py-2 px-2 font-medium whitespace-nowrap">{c.label}</th>)}
            <th className="py-2 px-2 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={COLUMNS[table].length + 1} className="py-6 text-center text-muted-foreground">No records for this user.</td></tr>
          )}
          {rows.map(r => (
            <tr key={r.id} className="border-t border-border/50 hover:bg-muted/40">
              {COLUMNS[table].map(c => (
                <td key={c.key} className="py-2 px-2 whitespace-nowrap">
                  {c.key === 'date' && r[c.key]
                    ? format(new Date(r[c.key]), 'dd MMM yyyy')
                    : AMOUNT_KEYS.includes(c.key)
                      ? rupee(r[c.key])
                      : (r[c.key] ?? '-')}
                </td>
              ))}
              <td className="py-2 px-2 text-right whitespace-nowrap">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(table, r)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleting({ table, id: r.id })}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Records created by <span className="font-semibold text-foreground">{userLabel}</span></p>
        <Button size="sm" variant="outline" onClick={fetchAll} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground">Trips ({trips.length})</p>
          <p className="text-lg font-bold text-primary">{rupee(totals.tripRevenue)}</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground">Outside Vehicles ({outside.length})</p>
          <p className="text-lg font-bold text-primary">{rupee(totals.outsideRevenue)}</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground">Maintenance ({maintenance.length})</p>
          <p className="text-lg font-bold text-destructive">{rupee(totals.maintenanceCost)}</p>
        </div>
      </div>

      <Tabs defaultValue="trips">
        <TabsList>
          <TabsTrigger value="trips" className="text-xs"><Car className="h-3.5 w-3.5 mr-1" />Trips</TabsTrigger>
          <TabsTrigger value="outside" className="text-xs"><Truck className="h-3.5 w-3.5 mr-1" />Outside</TabsTrigger>
          <TabsTrigger value="maintenance" className="text-xs"><Wrench className="h-3.5 w-3.5 mr-1" />Maintenance</TabsTrigger>
        </TabsList>
        <TabsContent value="trips">{renderTable('trips', trips)}</TabsContent>
        <TabsContent value="outside">{renderTable('outside_vehicle_trips', outside)}</TabsContent>
        <TabsContent value="maintenance">{renderTable('maintenance', maintenance)}</TabsContent>
      </Tabs>

      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Record</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.keys(editForm).map(k => {
              const isNum = typeof editing?.row[k] === 'number' || AMOUNT_KEYS.includes(k);
              const isDate = k.endsWith('_date') || k === 'date';
              return (
                <div key={k} className="space-y-1">
                  <Label className="text-xs capitalize">{k.replace(/_/g, ' ')}</Label>
                  <Input
                    type={isDate ? 'date' : isNum ? 'number' : 'text'}
                    value={editForm[k] ?? ''}
                    onChange={e => setEditForm({ ...editForm, [k]: e.target.value })}
                  />
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={o => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this record?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

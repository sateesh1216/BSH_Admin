import { useCallback, useEffect, useMemo, useState } from 'react';
import { Car, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface VehicleRecord {
  id: string;
  vehicle_number: string;
  make: string | null;
  model: string | null;
  year: number | null;
  colour: string | null;
  fuel_type: string | null;
  owner_name: string | null;
  registration_date: string | null;
  purchase_date: string | null;
  chassis_number: string | null;
  engine_number: string | null;
  seating_capacity: number | null;
  status: string;
  notes: string | null;
}

const EMPTY = {
  vehicle_number: '', make: '', model: '', year: '', colour: '', fuel_type: 'petrol',
  owner_name: '', registration_date: '', purchase_date: '', chassis_number: '',
  engine_number: '', seating_capacity: '', status: 'active', notes: '',
};

export const VehiclesMaster = ({ onChanged }: { onChanged?: (v: VehicleRecord[]) => void }) => {
  const { user } = useAuth();
  const [rows, setRows] = useState<VehicleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('vehicles').select('*').order('vehicle_number');
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      const list = (data || []) as VehicleRecord[];
      setRows(list);
      onChanged?.(list);
    }
    setLoading(false);
  }, [onChanged]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r =>
      [r.vehicle_number, r.make, r.model, r.owner_name, r.status, r.fuel_type]
        .filter(Boolean).some(v => String(v).toLowerCase().includes(q))
    );
  }, [rows, search]);

  const openAdd = () => { setEditingId(null); setForm({ ...EMPTY }); setOpen(true); };

  const openEdit = (r: VehicleRecord) => {
    setEditingId(r.id);
    setForm({
      vehicle_number: r.vehicle_number,
      make: r.make || '', model: r.model || '', year: r.year ? String(r.year) : '',
      colour: r.colour || '', fuel_type: r.fuel_type || 'petrol', owner_name: r.owner_name || '',
      registration_date: r.registration_date || '', purchase_date: r.purchase_date || '',
      chassis_number: r.chassis_number || '', engine_number: r.engine_number || '',
      seating_capacity: r.seating_capacity ? String(r.seating_capacity) : '',
      status: r.status || 'active', notes: r.notes || '',
    });
    setOpen(true);
  };

  const save = async () => {
    const number = form.vehicle_number.trim().toUpperCase();
    if (!number) {
      toast({ title: 'Vehicle number required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload: Record<string, unknown> = {
      vehicle_number: number,
      make: form.make.trim() || null,
      model: form.model.trim() || null,
      year: form.year ? Number(form.year) : null,
      colour: form.colour.trim() || null,
      fuel_type: form.fuel_type || null,
      owner_name: form.owner_name.trim() || null,
      registration_date: form.registration_date || null,
      purchase_date: form.purchase_date || null,
      chassis_number: form.chassis_number.trim() || null,
      engine_number: form.engine_number.trim() || null,
      seating_capacity: form.seating_capacity ? Number(form.seating_capacity) : null,
      status: form.status,
      notes: form.notes.trim() || null,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from('vehicles').update(payload).eq('id', editingId));
    } else {
      ({ error } = await supabase.from('vehicles').insert([{ ...payload, created_by: user?.id }]));
    }
    setSaving(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Saved', description: `Vehicle ${editingId ? 'updated' : 'added'}` });
    setOpen(false);
    fetchRows();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('vehicles').delete().eq('id', deleteId);
    setDeleteId(null);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Deleted', description: 'Vehicle removed' });
    fetchRows();
  };

  return (
    <Card className="mb-6 border-primary/20 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base text-primary">
            <Car className="h-4 w-4" />
            Registered Vehicles ({rows.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search vehicles..."
                className="h-8 pl-7 w-full sm:w-52 text-xs"
              />
            </div>
            <Button size="sm" onClick={openAdd} className="h-8">
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Vehicle
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground py-4">Loading vehicles...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            No vehicles registered yet. Click "Add Vehicle" to create one.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Vehicle No.</th>
                  <th className="py-2 pr-3 font-medium">Make / Model</th>
                  <th className="py-2 pr-3 font-medium">Year</th>
                  <th className="py-2 pr-3 font-medium">Fuel</th>
                  <th className="py-2 pr-3 font-medium">Owner</th>
                  <th className="py-2 pr-3 font-medium">Reg. Date</th>
                  <th className="py-2 pr-3 font-medium">Seats</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 pr-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="border-b border-border/50 hover:bg-muted/40">
                    <td className="py-2 pr-3 font-semibold text-primary">{r.vehicle_number}</td>
                    <td className="py-2 pr-3">{[r.make, r.model].filter(Boolean).join(' ') || '-'}</td>
                    <td className="py-2 pr-3">{r.year ?? '-'}</td>
                    <td className="py-2 pr-3 capitalize">{r.fuel_type || '-'}</td>
                    <td className="py-2 pr-3">{r.owner_name || '-'}</td>
                    <td className="py-2 pr-3">
                      {r.registration_date ? format(new Date(r.registration_date), 'dd MMM yyyy') : '-'}
                    </td>
                    <td className="py-2 pr-3">{r.seating_capacity ?? '-'}</td>
                    <td className="py-2 pr-3">
                      <Badge variant={r.status === 'active' ? 'default' : 'secondary'} className="text-[10px] capitalize">
                        {r.status}
                      </Badge>
                    </td>
                    <td className="py-2 pr-0 text-right whitespace-nowrap">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(r)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(r.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Vehicle' : 'Add Vehicle'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Vehicle Number *</Label>
              <Input
                value={form.vehicle_number}
                onChange={e => setForm({ ...form, vehicle_number: e.target.value.toUpperCase() })}
                placeholder="AP39UF1216"
              />
            </div>
            <div className="space-y-2">
              <Label>Owner Name</Label>
              <Input value={form.owner_name} onChange={e => setForm({ ...form, owner_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Make</Label>
              <Input value={form.make} onChange={e => setForm({ ...form, make: e.target.value })} placeholder="Maruti Suzuki" />
            </div>
            <div className="space-y-2">
              <Label>Model</Label>
              <Input value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} placeholder="Dzire" />
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Input type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Colour</Label>
              <Input value={form.colour} onChange={e => setForm({ ...form, colour: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Fuel Type</Label>
              <Select value={form.fuel_type} onValueChange={v => setForm({ ...form, fuel_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="petrol">Petrol</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="cng">CNG</SelectItem>
                  <SelectItem value="ev">EV</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Seating Capacity</Label>
              <Input type="number" value={form.seating_capacity} onChange={e => setForm({ ...form, seating_capacity: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Registration Date</Label>
              <Input type="date" value={form.registration_date} onChange={e => setForm({ ...form, registration_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Purchase Date</Label>
              <Input type="date" value={form.purchase_date} onChange={e => setForm({ ...form, purchase_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Chassis Number</Label>
              <Input value={form.chassis_number} onChange={e => setForm({ ...form, chassis_number: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Engine Number</Label>
              <Input value={form.engine_number} onChange={e => setForm({ ...form, engine_number: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Notes</Label>
              <Textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update Vehicle' : 'Add Vehicle'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this vehicle?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the vehicle from your registry. Trip and maintenance records are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

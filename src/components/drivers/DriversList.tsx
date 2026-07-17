import { useEffect, useMemo, useRef, useState } from 'react';
import { Pencil, Trash2, Plus, Search, RefreshCw, GitMerge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';

import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { DriverForm } from './DriverForm';

export interface Driver {
  id: string;
  name: string;
  mobile: string | null;
  license_number: string | null;
  address: string | null;
  aadhaar: string | null;
  joining_date: string | null;
  status: 'active' | 'inactive';
  notes: string | null;
}

interface Props {
  drivers: Driver[];
  onChanged: () => void;
}

export const DriversList = ({ drivers, onChanged }: Props) => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<Driver | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return drivers;
    return drivers.filter(d =>
      d.name.toLowerCase().includes(s) ||
      (d.mobile || '').toLowerCase().includes(s) ||
      (d.license_number || '').toLowerCase().includes(s)
    );
  }, [drivers, search]);

  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('drivers').delete().eq('id', deleteId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: 'Driver removed' });
      onChanged();
    }
    setDeleteId(null);
  };

  const [syncing, setSyncing] = useState(false);
  const runSyncFromTrips = async (silent = false) => {
    if (!user?.id) return { created: 0, updated: 0, linked: 0 };
    setSyncing(true);
    try {
      const { data: trips, error: tErr } = await supabase
        .from('trips')
        .select('id, driver_id, driver_name, driver_number, date')
        .not('driver_name', 'is', null);
      if (tErr) throw tErr;

      const byName = new Map<string, { name: string; number: string | null; latest: string }>();
      (trips || []).forEach((t: any) => {
        const rawName = (t.driver_name || '').trim();
        if (!rawName) return;
        const key = rawName.toLowerCase();
        const existing = byName.get(key);
        const num = (t.driver_number || '').trim() || null;
        if (!existing) byName.set(key, { name: rawName, number: num, latest: t.date });
        else if (num && (!existing.number || (t.date && t.date > existing.latest))) {
          existing.number = num;
          existing.latest = t.date;
        }
      });

      const existingByName = new Map(drivers.map(d => [d.name.trim().toLowerCase(), d]));

      let created = 0;
      let updated = 0;
      const toInsert: any[] = [];
      for (const [key, info] of byName) {
        const existing = existingByName.get(key);
        if (!existing) {
          toInsert.push({ name: info.name, mobile: info.number, status: 'active', created_by: user.id });
        } else if (info.number && !existing.mobile) {
          const { error } = await supabase.from('drivers').update({ mobile: info.number }).eq('id', existing.id);
          if (!error) updated++;
        }
      }
      if (toInsert.length > 0) {
        const { data: ins, error: iErr } = await supabase.from('drivers').insert(toInsert).select('id, name');
        if (iErr) throw iErr;
        created = ins?.length || 0;
        (ins || []).forEach((d: any) => existingByName.set(d.name.trim().toLowerCase(), d as any));
      }

      let linked = 0;
      for (const t of trips || []) {
        if (t.driver_id) continue;
        const key = (t.driver_name || '').trim().toLowerCase();
        const drv = existingByName.get(key);
        if (!drv) continue;
        const { error } = await supabase.from('trips').update({ driver_id: drv.id }).eq('id', t.id);
        if (!error) linked++;
      }

      if (!silent) {
        toast({
          title: 'Sync complete',
          description: `Created ${created} driver(s), updated ${updated}, linked ${linked} trip(s).`,
        });
      } else if (created > 0 || linked > 0) {
        toast({
          title: 'Drivers auto-synced',
          description: `${created} added, ${linked} trip(s) linked.`,
        });
      }
      if (created > 0 || updated > 0 || linked > 0) onChanged();
      return { created, updated, linked };
    } catch (err: any) {
      if (!silent) toast({ title: 'Sync failed', description: err.message, variant: 'destructive' });
      return { created: 0, updated: 0, linked: 0 };
    } finally {
      setSyncing(false);
    }
  };

  // Auto-sync missing drivers on mount
  const autoRan = useRef(false);
  useEffect(() => {
    if (autoRan.current || !user?.id) return;
    autoRan.current = true;
    runSyncFromTrips(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Merge drivers
  const [mergeOpen, setMergeOpen] = useState(false);
  const [primaryId, setPrimaryId] = useState<string>('');
  const [duplicateId, setDuplicateId] = useState<string>('');
  const [merging, setMerging] = useState(false);

  const handleMerge = async () => {
    if (!primaryId || !duplicateId || primaryId === duplicateId) {
      toast({ title: 'Select two different drivers', variant: 'destructive' });
      return;
    }
    setMerging(true);
    try {
      const updates = await Promise.all([
        supabase.from('trips').update({ driver_id: primaryId }).eq('driver_id', duplicateId),
        supabase.from('driver_trip_amounts').update({ driver_id: primaryId }).eq('driver_id', duplicateId),
        supabase.from('driver_expenses').update({ driver_id: primaryId }).eq('driver_id', duplicateId),
        supabase.from('driver_payments').update({ driver_id: primaryId }).eq('driver_id', duplicateId),
      ]);
      const err = updates.find(u => u.error)?.error;
      if (err) throw err;
      const { error: dErr } = await supabase.from('drivers').delete().eq('id', duplicateId);
      if (dErr) throw dErr;
      toast({ title: 'Merged', description: 'Duplicate driver merged successfully.' });
      setMergeOpen(false);
      setPrimaryId('');
      setDuplicateId('');
      onChanged();
    } catch (err: any) {
      toast({ title: 'Merge failed', description: err.message, variant: 'destructive' });
    } finally {
      setMerging(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search drivers..." className="pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setMergeOpen(true)}>
            <GitMerge className="h-4 w-4 mr-2" />Merge Drivers
          </Button>
          <Button variant="outline" onClick={() => runSyncFromTrips(false)} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync from Trips'}
          </Button>
          <Button onClick={() => { setEditData(null); setShowForm(true); }}>
            <Plus className="h-4 w-4 mr-2" />Add Driver
          </Button>
        </div>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>License</TableHead>
              <TableHead>Joining</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No drivers found</TableCell></TableRow>
            ) : paged.map(d => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.name}</TableCell>
                <TableCell>{d.mobile || '-'}</TableCell>
                <TableCell>{d.license_number || '-'}</TableCell>
                <TableCell>{d.joining_date || '-'}</TableCell>
                <TableCell>
                  <Badge variant={d.status === 'active' ? 'default' : 'secondary'}>{d.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => { setEditData(d); setShowForm(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setDeleteId(d.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Page {page} of {totalPages}</span>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
            <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      <DriverForm open={showForm} onOpenChange={setShowForm} editData={editData} onSuccess={onChanged} />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete driver?</AlertDialogTitle>
            <AlertDialogDescription>This will also remove their ledger entries.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={mergeOpen} onOpenChange={setMergeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Merge Drivers</DialogTitle>
            <DialogDescription>
              Move all trips, expenses, payments and ledger entries from the duplicate driver into the primary driver. The duplicate will be deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Keep (Primary)</Label>
              <Select value={primaryId} onValueChange={setPrimaryId}>
                <SelectTrigger><SelectValue placeholder="Select primary driver" /></SelectTrigger>
                <SelectContent>
                  {drivers.map(d => <SelectItem key={d.id} value={d.id}>{d.name}{d.mobile ? ` — ${d.mobile}` : ''}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Merge & Delete (Duplicate)</Label>
              <Select value={duplicateId} onValueChange={setDuplicateId}>
                <SelectTrigger><SelectValue placeholder="Select duplicate driver" /></SelectTrigger>
                <SelectContent>
                  {drivers.filter(d => d.id !== primaryId).map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}{d.mobile ? ` — ${d.mobile}` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMergeOpen(false)}>Cancel</Button>
            <Button onClick={handleMerge} disabled={merging || !primaryId || !duplicateId}>
              {merging ? 'Merging...' : 'Merge Drivers'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

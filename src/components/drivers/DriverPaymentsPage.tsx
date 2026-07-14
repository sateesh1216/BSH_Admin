import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Driver } from './DriversList';

export interface DriverPayment {
  id: string;
  driver_id: string;
  payment_amount: number;
  payment_mode: string;
  reference_number: string | null;
  payment_date: string;
  notes: string | null;
}

const schema = z.object({
  driver_id: z.string().min(1, 'Driver required'),
  payment_amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  payment_mode: z.enum(['cash', 'bank', 'upi']),
  reference_number: z.string().max(100).optional(),
  payment_date: z.string().min(1),
  notes: z.string().max(500).optional(),
});
type FormData = z.infer<typeof schema>;

interface Props {
  drivers: Driver[];
  payments: DriverPayment[];
  onChanged: () => void;
}

export const DriverPaymentsPage = ({ drivers, payments, onChanged }: Props) => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      driver_id: '', payment_amount: 0, payment_mode: 'cash',
      reference_number: '', payment_date: new Date().toISOString().slice(0, 10), notes: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    const { error } = await supabase.from('driver_payments').insert([{
      driver_id: data.driver_id,
      payment_amount: data.payment_amount,
      payment_mode: data.payment_mode,
      reference_number: data.reference_number || null,
      payment_date: data.payment_date,
      notes: data.notes || null,
      created_by: user?.id,
    }]);
    if (error) return toast({ title: 'Error', description: error.message, variant: 'destructive' });
    toast({ title: 'Success', description: 'Payment recorded' });
    form.reset({ driver_id: '', payment_amount: 0, payment_mode: 'cash', reference_number: '', payment_date: new Date().toISOString().slice(0, 10), notes: '' });
    setShowForm(false);
    onChanged();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('driver_payments').delete().eq('id', id);
    if (error) return toast({ title: 'Error', description: error.message, variant: 'destructive' });
    toast({ title: 'Deleted' });
    onChanged();
  };

  const driverName = (id: string) => drivers.find(d => d.id === id)?.name || '-';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Driver Payments</h3>
        <Button onClick={() => setShowForm(s => !s)}><Plus className="h-4 w-4 mr-2" />Add Payment</Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Driver *</Label>
                <Select value={form.watch('driver_id')} onValueChange={v => form.setValue('driver_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Select driver" /></SelectTrigger>
                  <SelectContent>
                    {drivers.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {form.formState.errors.driver_id && <p className="text-xs text-destructive">{form.formState.errors.driver_id.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input type="date" {...form.register('payment_date')} />
              </div>
              <div className="space-y-2">
                <Label>Payment Amount (₹) *</Label>
                <Input type="number" step="0.01" {...form.register('payment_amount', { valueAsNumber: true })} />
                {form.formState.errors.payment_amount && <p className="text-xs text-destructive">{form.formState.errors.payment_amount.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Payment Mode *</Label>
                <Select value={form.watch('payment_mode')} onValueChange={(v: any) => form.setValue('payment_mode', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank">Bank</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reference Number</Label>
                <Input {...form.register('reference_number')} placeholder="Txn ID / cheque #" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Notes</Label>
                <Textarea rows={2} {...form.register('notes')} />
              </div>
              <div className="md:col-span-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit">Save Payment</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">No payments yet</TableCell></TableRow>
            ) : payments.map(p => (
              <TableRow key={p.id}>
                <TableCell>{p.payment_date}</TableCell>
                <TableCell>{driverName(p.driver_id)}</TableCell>
                <TableCell><Badge variant="outline" className="capitalize">{p.payment_mode}</Badge></TableCell>
                <TableCell>{p.reference_number || '-'}</TableCell>
                <TableCell className="max-w-xs truncate">{p.notes || '-'}</TableCell>
                <TableCell className="text-right font-medium">₹{p.payment_amount.toLocaleString('en-IN')}</TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(p.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

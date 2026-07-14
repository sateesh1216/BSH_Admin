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

export interface DriverExpense {
  id: string;
  driver_id: string;
  expense_type: string;
  amount: number;
  description: string | null;
  expense_date: string;
}

const schema = z.object({
  driver_id: z.string().min(1, 'Driver required'),
  expense_type: z.enum(['fuel', 'food', 'toll', 'advance', 'repair', 'other']),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  description: z.string().max(500).optional(),
  expense_date: z.string().min(1),
});
type FormData = z.infer<typeof schema>;

interface Props {
  drivers: Driver[];
  expenses: DriverExpense[];
  onChanged: () => void;
}

export const DriverExpensesPage = ({ drivers, expenses, onChanged }: Props) => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      driver_id: '',
      expense_type: 'fuel',
      amount: 0,
      description: '',
      expense_date: new Date().toISOString().slice(0, 10),
    },
  });

  const onSubmit = async (data: FormData) => {
    const { error } = await supabase.from('driver_expenses').insert([{
      driver_id: data.driver_id,
      expense_type: data.expense_type,
      amount: data.amount,
      description: data.description || null,
      expense_date: data.expense_date,
      created_by: user?.id,
    }]);
    if (error) return toast({ title: 'Error', description: error.message, variant: 'destructive' });
    toast({ title: 'Success', description: 'Expense added' });
    form.reset({ driver_id: '', expense_type: 'fuel', amount: 0, description: '', expense_date: new Date().toISOString().slice(0, 10) });
    setShowForm(false);
    onChanged();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('driver_expenses').delete().eq('id', id);
    if (error) return toast({ title: 'Error', description: error.message, variant: 'destructive' });
    toast({ title: 'Deleted' });
    onChanged();
  };

  const driverName = (id: string) => drivers.find(d => d.id === id)?.name || '-';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Driver Expenses</h3>
        <Button onClick={() => setShowForm(s => !s)}><Plus className="h-4 w-4 mr-2" />Add Expense</Button>
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
                <Input type="date" {...form.register('expense_date')} />
              </div>
              <div className="space-y-2">
                <Label>Expense Type *</Label>
                <Select value={form.watch('expense_type')} onValueChange={(v: any) => form.setValue('expense_type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['fuel', 'food', 'toll', 'advance', 'repair', 'other'].map(t =>
                      <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount (₹) *</Label>
                <Input type="number" step="0.01" {...form.register('amount', { valueAsNumber: true })} />
                {form.formState.errors.amount && <p className="text-xs text-destructive">{form.formState.errors.amount.message}</p>}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Description</Label>
                <Textarea rows={2} {...form.register('description')} />
              </div>
              <div className="md:col-span-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit">Save Expense</Button>
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
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No expenses yet</TableCell></TableRow>
            ) : expenses.map(e => (
              <TableRow key={e.id}>
                <TableCell>{e.expense_date}</TableCell>
                <TableCell>{driverName(e.driver_id)}</TableCell>
                <TableCell><Badge variant="outline" className="capitalize">{e.expense_type}</Badge></TableCell>
                <TableCell className="max-w-xs truncate">{e.description || '-'}</TableCell>
                <TableCell className="text-right font-medium">₹{e.amount.toLocaleString('en-IN')}</TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(e.id)}>
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

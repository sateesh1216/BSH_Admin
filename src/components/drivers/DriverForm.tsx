import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const schema = z.object({
  name: z.string().trim().min(1, 'Name required').max(100),
  mobile: z.string().trim().max(15).optional().or(z.literal('')),
  license_number: z.string().trim().max(50).optional().or(z.literal('')),
  address: z.string().trim().max(500).optional().or(z.literal('')),
  aadhaar: z.string().trim().max(20).optional().or(z.literal('')),
  joining_date: z.string().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: any;
  onSuccess: () => void;
}

export const DriverForm = ({ open, onOpenChange, editData, onSuccess }: Props) => {
  const { user } = useAuth();
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '', mobile: '', license_number: '', address: '', aadhaar: '',
      joining_date: '', status: 'active', notes: '',
    },
  });

  useEffect(() => {
    if (editData) {
      form.reset({
        name: editData.name || '',
        mobile: editData.mobile || '',
        license_number: editData.license_number || '',
        address: editData.address || '',
        aadhaar: editData.aadhaar || '',
        joining_date: editData.joining_date || '',
        status: editData.status || 'active',
        notes: editData.notes || '',
      });
    } else {
      form.reset({
        name: '', mobile: '', license_number: '', address: '', aadhaar: '',
        joining_date: '', status: 'active', notes: '',
      });
    }
  }, [editData, open]);

  const onSubmit = async (data: FormData) => {
    const payload: any = {
      name: data.name,
      mobile: data.mobile || null,
      license_number: data.license_number || null,
      address: data.address || null,
      aadhaar: data.aadhaar || null,
      joining_date: data.joining_date || null,
      status: data.status,
      notes: data.notes || null,
    };
    if (!editData) payload.created_by = user?.id;

    const res = editData
      ? await supabase.from('drivers').update(payload).eq('id', editData.id)
      : await supabase.from('drivers').insert([payload]);

    if (res.error) {
      toast({ title: 'Error', description: res.error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Success', description: `Driver ${editData ? 'updated' : 'added'}` });
    onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editData ? 'Edit Driver' : 'Add Driver'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Driver Name *</Label>
              <Input {...form.register('name')} />
              {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Mobile Number</Label>
              <Input {...form.register('mobile')} />
            </div>
            <div className="space-y-2">
              <Label>License Number</Label>
              <Input {...form.register('license_number')} />
            </div>
            <div className="space-y-2">
              <Label>Aadhaar Number</Label>
              <Input {...form.register('aadhaar')} />
            </div>
            <div className="space-y-2">
              <Label>Joining Date</Label>
              <Input type="date" {...form.register('joining_date')} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.watch('status')} onValueChange={(v: 'active' | 'inactive') => form.setValue('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Address</Label>
              <Textarea rows={2} {...form.register('address')} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Notes</Label>
              <Textarea rows={2} {...form.register('notes')} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{editData ? 'Update' : 'Add Driver'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

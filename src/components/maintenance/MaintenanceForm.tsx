import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const maintenanceSchema = z.object({
  date: z.date({ required_error: 'Date is required' }),
  vehicleNumber: z.string().min(1, 'Vehicle number is required'),
  driverName: z.string().min(1, 'Driver name is required'),
  driverNumber: z.string().min(10, 'Valid phone number is required'),
  customerName: z.string().min(1, 'Customer name is required'),
  customerNumber: z.string().min(10, 'Valid phone number is required'),
  company: z.string().optional(),
  maintenanceType: z.string().min(1, 'Maintenance type is required'),
  description: z.string().optional(),
  amount: z.number().min(0, 'Amount must be positive'),
  paymentMode: z.enum(['Cash', 'UPI', 'Online', 'Credit Card', 'Other']),
  fuelType: z.enum(['Petrol', 'Diesel', 'CNG']),
  commission: z.number().min(0, 'Amount must be positive'),
  fuelAmount: z.number().min(0, 'Amount must be positive'),
  tolls: z.number().min(0, 'Amount must be positive'),
  kmAtMaintenance: z.number().min(0, 'KM must be positive').optional(),
  nextOilChangeKm: z.number().min(0, 'KM must be positive').optional(),
  originalOdometerKm: z.number().min(0, 'KM must be positive').optional(),
});

type MaintenanceFormData = z.infer<typeof maintenanceSchema>;

interface MaintenanceFormProps {
  onSuccess?: () => void;
  editData?: any;
}

const maintenanceTypes = [
  'Oil Change',
  'Brake Service',
  'Tire Change',
  'AC Repair',
  'Engine Repair',
  'Battery Replacement',
  'Transmission Service',
  'General Service',
  'Other'
];

export const MaintenanceForm = ({ onSuccess, editData }: MaintenanceFormProps) => {
  const { user } = useAuth();
  
  const form = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      date: editData?.date ? new Date(editData.date) : new Date(),
      vehicleNumber: editData?.vehicle_number || '',
      driverName: editData?.driver_name || '',
      driverNumber: editData?.driver_number || '',
      customerName: editData?.customer_name || '',
      customerNumber: editData?.customer_number || '',
      company: editData?.company || '',
      maintenanceType: editData?.maintenance_type || '',
      description: editData?.description || '',
      amount: editData?.amount || 0,
      paymentMode: editData?.payment_mode || 'Cash',
      fuelType: editData?.fuel_type || 'Petrol',
      commission: editData?.commission || 0,
      fuelAmount: editData?.fuel_amount || 0,
      tolls: editData?.tolls || 0,
      kmAtMaintenance: editData?.km_at_maintenance || undefined,
      nextOilChangeKm: editData?.next_oil_change_km || undefined,
      originalOdometerKm: editData?.original_odometer_km || undefined,
    },
  });

  const onSubmit = async (data: MaintenanceFormData) => {
    try {
      const maintenanceData = {
        date: format(data.date, 'yyyy-MM-dd'),
        vehicle_number: data.vehicleNumber,
        driver_name: data.driverName,
        driver_number: data.driverNumber,
        customer_name: data.customerName,
        customer_number: data.customerNumber,
        company: data.company || null,
        maintenance_type: data.maintenanceType,
        description: data.description || null,
        amount: data.amount,
        payment_mode: data.paymentMode,
        fuel_type: data.fuelType,
        commission: data.commission,
        fuel_amount: data.fuelAmount,
        tolls: data.tolls,
        km_at_maintenance: data.kmAtMaintenance || null,
        next_oil_change_km: data.nextOilChangeKm || null,
        original_odometer_km: data.originalOdometerKm || null,
        created_by: user?.id,
      };

      let result;
      if (editData) {
        result = await supabase
          .from('maintenance')
          .update(maintenanceData)
          .eq('id', editData.id);
      } else {
        result = await supabase
          .from('maintenance')
          .insert([maintenanceData]);
      }

      if (result.error) {
        toast({
          title: "Error",
          description: result.error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `Maintenance record ${editData ? 'updated' : 'added'} successfully!`,
      });

      if (!editData) {
        form.reset();
      }
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Wrench className="h-5 w-5" />
          {editData ? 'Update Car Maintenance' : 'Add Car Maintenance'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !form.watch('date') && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch('date') ? format(form.watch('date'), "dd-MM-yyyy") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.watch('date')}
                    onSelect={(date) => form.setValue('date', date || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Maintenance Type *</Label>
              <Select onValueChange={(value) => form.setValue('maintenanceType', value)} value={form.watch('maintenanceType')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select maintenance type" />
                </SelectTrigger>
                <SelectContent>
                  {maintenanceTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenanceCost">Maintenance Cost (₹) *</Label>
              <Input
                id="maintenanceCost"
                type="number"
                step="0.01"
                {...form.register('amount', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicleNumber">Vehicle Number *</Label>
              <Input
                id="vehicleNumber"
                {...form.register('vehicleNumber')}
                placeholder="Enter vehicle number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="kmAtMaintenance">KM at Maintenance</Label>
              <Input
                id="kmAtMaintenance"
                type="number"
                {...form.register('kmAtMaintenance', { valueAsNumber: true })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nextOilChangeKm">Next Oil Change KM</Label>
              <Input
                id="nextOilChangeKm"
                type="number"
                {...form.register('nextOilChangeKm', { valueAsNumber: true })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="originalOdometerKm">Original Odometer KM</Label>
              <Input
                id="originalOdometerKm"
                type="number"
                {...form.register('originalOdometerKm', { valueAsNumber: true })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="driverName">Driver Name *</Label>
              <Input
                id="driverName"
                {...form.register('driverName')}
                placeholder="Enter driver name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="driverNumber">Driver Number *</Label>
              <Input
                id="driverNumber"
                {...form.register('driverNumber')}
                placeholder="Enter driver phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                {...form.register('customerName')}
                placeholder="Enter customer name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerNumber">Customer Number *</Label>
              <Input
                id="customerNumber"
                {...form.register('customerNumber')}
                placeholder="Enter customer phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                {...form.register('company')}
                placeholder="Company name (optional)"
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Mode</Label>
              <Select onValueChange={(value) => form.setValue('paymentMode', value as any)} value={form.watch('paymentMode')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="Online">Online</SelectItem>
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fuel Type</Label>
              <Select onValueChange={(value) => form.setValue('fuelType', value as any)} value={form.watch('fuelType')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select fuel type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Petrol">Petrol</SelectItem>
                  <SelectItem value="Diesel">Diesel</SelectItem>
                  <SelectItem value="CNG">CNG</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="commission">Commission (₹)</Label>
              <Input
                id="commission"
                type="number"
                step="0.01"
                {...form.register('commission', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fuelAmount">Fuel (₹)</Label>
              <Input
                id="fuelAmount"
                type="number"
                step="0.01"
                {...form.register('fuelAmount', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tolls">Tolls (₹)</Label>
              <Input
                id="tolls"
                type="number"
                step="0.01"
                {...form.register('tolls', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Enter maintenance description"
              rows={3}
            />
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="w-full"
            >
              <Wrench className="mr-2 h-4 w-4" />
              {editData ? 'Update Maintenance' : 'Add Maintenance'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
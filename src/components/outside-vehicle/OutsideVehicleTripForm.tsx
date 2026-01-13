import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

const vehicleTypes = [
  '4 Seater',
  '6 Seater',
  '7 Seater',
  '12 Seater',
  '17 Seater',
  '27 Seater',
  '40 Seater',
];

const paymentModes = ['Cash', 'UPI', 'Card'];
const paymentStatuses = ['pending', 'paid'];

const outsideVehicleTripSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  driver_name: z.string().min(1, 'Driver name is required'),
  driver_number: z.string().min(10, 'Valid phone number required'),
  travel_company: z.string().min(1, 'Travel company is required'),
  vehicle_type: z.string().min(1, 'Vehicle type is required'),
  from_location: z.string().min(1, 'From location is required'),
  to_location: z.string().min(1, 'To location is required'),
  vehicle_number: z.string().min(1, 'Vehicle number is required'),
  trip_given_company: z.string().min(1, 'Trip given company is required'),
  payment_mode: z.string().min(1, 'Payment mode is required'),
  payment_status: z.string().min(1, 'Payment status is required'),
  trip_amount: z.number().min(0, 'Trip amount must be positive'),
});

type OutsideVehicleTripFormData = z.infer<typeof outsideVehicleTripSchema>;

interface OutsideVehicleTripFormProps {
  onSuccess?: () => void;
  editData?: OutsideVehicleTripFormData & { id: string };
}

export function OutsideVehicleTripForm({ onSuccess, editData }: OutsideVehicleTripFormProps) {
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<OutsideVehicleTripFormData>({
    resolver: zodResolver(outsideVehicleTripSchema),
    defaultValues: editData || {
      date: new Date().toISOString().split('T')[0],
      driver_name: '',
      driver_number: '',
      travel_company: '',
      vehicle_type: '',
      from_location: '',
      to_location: '',
      vehicle_number: '',
      trip_given_company: '',
      payment_mode: 'Cash',
      payment_status: 'pending',
      trip_amount: 0,
    },
  });

  useEffect(() => {
    if (editData) {
      Object.entries(editData).forEach(([key, value]) => {
        if (key !== 'id') {
          setValue(key as keyof OutsideVehicleTripFormData, value);
        }
      });
    }
  }, [editData, setValue]);

  const onSubmit = async (data: OutsideVehicleTripFormData) => {
    try {
      if (editData?.id) {
        const { error } = await supabase
          .from('outside_vehicle_trips')
          .update({
            date: data.date,
            driver_name: data.driver_name,
            driver_number: data.driver_number,
            travel_company: data.travel_company,
            vehicle_type: data.vehicle_type,
            from_location: data.from_location,
            to_location: data.to_location,
            vehicle_number: data.vehicle_number,
            trip_given_company: data.trip_given_company,
            payment_mode: data.payment_mode,
            payment_status: data.payment_status,
            trip_amount: data.trip_amount,
          })
          .eq('id', editData.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Outside vehicle trip updated successfully',
        });
      } else {
        const { error } = await supabase
          .from('outside_vehicle_trips')
          .insert([{
            date: data.date,
            driver_name: data.driver_name,
            driver_number: data.driver_number,
            travel_company: data.travel_company,
            vehicle_type: data.vehicle_type,
            from_location: data.from_location,
            to_location: data.to_location,
            vehicle_number: data.vehicle_number,
            trip_given_company: data.trip_given_company,
            payment_mode: data.payment_mode,
            payment_status: data.payment_status,
            trip_amount: data.trip_amount,
            created_by: user?.id,
          }]);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Outside vehicle trip added successfully',
        });
        reset();
      }

      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save outside vehicle trip',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="border-primary/20 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
        <CardTitle className="text-primary">
          {editData ? 'Edit Outside Vehicle Trip' : 'Add Outside Vehicle Trip'}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input type="date" id="date" {...register('date')} />
              {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
            </div>

            {/* Driver Name */}
            <div className="space-y-2">
              <Label htmlFor="driver_name">Driver Name</Label>
              <Input id="driver_name" placeholder="Enter driver name" {...register('driver_name')} />
              {errors.driver_name && <p className="text-sm text-destructive">{errors.driver_name.message}</p>}
            </div>

            {/* Driver Number */}
            <div className="space-y-2">
              <Label htmlFor="driver_number">Driver Number</Label>
              <Input id="driver_number" placeholder="Enter driver number" {...register('driver_number')} />
              {errors.driver_number && <p className="text-sm text-destructive">{errors.driver_number.message}</p>}
            </div>

            {/* Travel Company */}
            <div className="space-y-2">
              <Label htmlFor="travel_company">Travel Company</Label>
              <Input id="travel_company" placeholder="Enter travel company" {...register('travel_company')} />
              {errors.travel_company && <p className="text-sm text-destructive">{errors.travel_company.message}</p>}
            </div>

            {/* Vehicle Type */}
            <div className="space-y-2">
              <Label htmlFor="vehicle_type">Vehicle Type</Label>
              <Select onValueChange={(value) => setValue('vehicle_type', value)} value={watch('vehicle_type')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  {vehicleTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vehicle_type && <p className="text-sm text-destructive">{errors.vehicle_type.message}</p>}
            </div>

            {/* From */}
            <div className="space-y-2">
              <Label htmlFor="from_location">From</Label>
              <Input id="from_location" placeholder="Enter from location" {...register('from_location')} />
              {errors.from_location && <p className="text-sm text-destructive">{errors.from_location.message}</p>}
            </div>

            {/* To */}
            <div className="space-y-2">
              <Label htmlFor="to_location">To</Label>
              <Input id="to_location" placeholder="Enter to location" {...register('to_location')} />
              {errors.to_location && <p className="text-sm text-destructive">{errors.to_location.message}</p>}
            </div>

            {/* Vehicle Number */}
            <div className="space-y-2">
              <Label htmlFor="vehicle_number">Vehicle Number</Label>
              <Input id="vehicle_number" placeholder="Enter vehicle number" {...register('vehicle_number')} />
              {errors.vehicle_number && <p className="text-sm text-destructive">{errors.vehicle_number.message}</p>}
            </div>

            {/* Trip Given Company */}
            <div className="space-y-2">
              <Label htmlFor="trip_given_company">Trip Given Company</Label>
              <Input id="trip_given_company" placeholder="Enter trip given company" {...register('trip_given_company')} />
              {errors.trip_given_company && <p className="text-sm text-destructive">{errors.trip_given_company.message}</p>}
            </div>

            {/* Payment Mode */}
            <div className="space-y-2">
              <Label htmlFor="payment_mode">Payment Mode</Label>
              <Select onValueChange={(value) => setValue('payment_mode', value)} value={watch('payment_mode')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment mode" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  {paymentModes.map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {mode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.payment_mode && <p className="text-sm text-destructive">{errors.payment_mode.message}</p>}
            </div>

            {/* Payment Status */}
            <div className="space-y-2">
              <Label htmlFor="payment_status">Payment Status</Label>
              <Select onValueChange={(value) => setValue('payment_status', value)} value={watch('payment_status')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment status" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  {paymentStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.payment_status && <p className="text-sm text-destructive">{errors.payment_status.message}</p>}
            </div>

            {/* Trip Amount */}
            <div className="space-y-2">
              <Label htmlFor="trip_amount">Trip Amount (₹)</Label>
              <Input
                type="number"
                id="trip_amount"
                placeholder="Enter trip amount"
                {...register('trip_amount', { valueAsNumber: true })}
              />
              {errors.trip_amount && <p className="text-sm text-destructive">{errors.trip_amount.message}</p>}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
              {isSubmitting ? 'Saving...' : editData ? 'Update Trip' : 'Add Trip'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

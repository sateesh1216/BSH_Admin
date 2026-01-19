import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const tripSchema = z.object({
  date: z.date({ required_error: 'Date is required' }),
  driverName: z.string().min(1, 'Driver name is required'),
  driverNumber: z.string().min(10, 'Valid phone number is required'),
  customerName: z.string().min(1, 'Customer name is required'),
  customerNumber: z.string().min(10, 'Valid phone number is required'),
  fromLocation: z.string().min(1, 'From location is required'),
  toLocation: z.string().min(1, 'To location is required'),
  company: z.string().optional(),
  carNumber: z.string().optional(),
  fuelType: z.enum(['Petrol', 'Diesel', 'CNG', 'EV']),
  paymentMode: z.enum(['Cash', 'UPI', 'Online', 'Credit Card', 'Other']),
  paymentStatus: z.enum(['paid', 'pending']),
  driverAmount: z.number().min(0, 'Amount must be positive'),
  commission: z.number().min(0, 'Amount must be positive'),
  fuelAmount: z.number().min(0, 'Amount must be positive'),
  tolls: z.number().min(0, 'Amount must be positive'),
  tripAmount: z.number().min(0, 'Amount must be positive'),
});

type TripFormData = z.infer<typeof tripSchema>;

interface TripFormProps {
  onSuccess?: () => void;
  editData?: any;
}

export const TripForm = ({ onSuccess, editData }: TripFormProps) => {
  const { user } = useAuth();
  const [profit, setProfit] = useState(0);
  
  const form = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      date: editData?.date ? new Date(editData.date) : new Date(),
      driverName: editData?.driver_name || '',
      driverNumber: editData?.driver_number || '',
      customerName: editData?.customer_name || '',
      customerNumber: editData?.customer_number || '',
      fromLocation: editData?.from_location || '',
      toLocation: editData?.to_location || '',
      company: editData?.company || '',
      carNumber: editData?.car_number || 'AP39UF1216',
      fuelType: editData?.fuel_type || 'Petrol',
      paymentMode: editData?.payment_mode || 'Cash',
      paymentStatus: editData?.payment_status || 'pending',
      driverAmount: editData?.driver_amount || 0,
      commission: editData?.commission || 0,
      fuelAmount: editData?.fuel_amount || 0,
      tolls: editData?.tolls || 0,
      tripAmount: editData?.trip_amount || 0,
    },
  });

  const watchedValues = form.watch(['driverAmount', 'commission', 'fuelAmount', 'tolls', 'tripAmount']);

  useEffect(() => {
    const [driverAmount, commission, fuelAmount, tolls, tripAmount] = watchedValues;
    const calculatedProfit = (tripAmount || 0) - ((driverAmount || 0) + (commission || 0) + (fuelAmount || 0) + (tolls || 0));
    setProfit(calculatedProfit);
  }, [watchedValues]);

  const onSubmit = async (data: TripFormData, withGST: boolean = false) => {
    try {
      const tripData = {
        date: format(data.date, 'yyyy-MM-dd'),
        driver_name: data.driverName,
        driver_number: data.driverNumber,
        customer_name: data.customerName,
        customer_number: data.customerNumber,
        from_location: data.fromLocation,
        to_location: data.toLocation,
        company: data.company || null,
        car_number: data.carNumber || null,
        fuel_type: data.fuelType,
        payment_mode: data.paymentMode,
        payment_status: data.paymentStatus,
        driver_amount: data.driverAmount,
        commission: data.commission,
        fuel_amount: data.fuelAmount,
        tolls: data.tolls,
        trip_amount: data.tripAmount,
        profit: profit,
        created_by: user?.id,
      };

      let result;
      if (editData) {
        result = await supabase
          .from('trips')
          .update(tripData)
          .eq('id', editData.id);
      } else {
        result = await supabase
          .from('trips')
          .insert([tripData]);
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
        description: `Trip ${editData ? 'updated' : 'added'} successfully! ${withGST ? 'Invoice with GST sent.' : 'Invoice without GST sent.'}`,
      });

      // Send WhatsApp messages (simulate for now)
      const driverMessage = `New Trip: Customer: ${data.customerName} (${data.customerNumber}), Route: ${data.fromLocation} → ${data.toLocation}`;
      const customerMessage = `Trip Details: Driver: ${data.driverName} (${data.driverNumber}), Route: ${data.fromLocation} → ${data.toLocation}`;
      
      console.log('WhatsApp to Driver:', driverMessage);
      console.log('WhatsApp to Customer:', customerMessage);

      if (!editData) {
        form.reset();
        setProfit(0);
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
        <CardTitle className="text-primary">
          {editData ? 'Update Trip' : 'Add New Trip'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
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
                    {form.watch('date') ? format(form.watch('date'), "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.watch('date')}
                    onSelect={(date) => form.setValue('date', date || new Date())}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="driverName">Driver Name</Label>
              <Input
                id="driverName"
                {...form.register('driverName')}
                placeholder="Enter driver name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="driverNumber">Driver Number</Label>
              <Input
                id="driverNumber"
                {...form.register('driverNumber')}
                placeholder="Enter driver phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                {...form.register('customerName')}
                placeholder="Enter customer name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerNumber">Customer Number</Label>
              <Input
                id="customerNumber"
                {...form.register('customerNumber')}
                placeholder="Enter customer phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fromLocation">From</Label>
              <Input
                id="fromLocation"
                {...form.register('fromLocation')}
                placeholder="Starting location"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="toLocation">To</Label>
              <Input
                id="toLocation"
                {...form.register('toLocation')}
                placeholder="Destination"
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
              <Label htmlFor="carNumber">Car Number</Label>
              <Input
                id="carNumber"
                {...form.register('carNumber')}
                placeholder="e.g., AP 31 AB 1234"
              />
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
                  <SelectItem value="EV">EV</SelectItem>
                </SelectContent>
              </Select>
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
              <Label>Payment Status</Label>
              <Select onValueChange={(value) => form.setValue('paymentStatus', value as any)} value={form.watch('paymentStatus')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="driverAmount">Driver Amount (₹)</Label>
              <Input
                id="driverAmount"
                type="number"
                step="0.01"
                {...form.register('driverAmount', { valueAsNumber: true })}
                placeholder="0.00"
              />
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

            <div className="space-y-2">
              <Label htmlFor="tripAmount">Trip Amount (₹)</Label>
              <Input
                id="tripAmount"
                type="number"
                step="0.01"
                {...form.register('tripAmount', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label>Total Profit</Label>
              <div className={`text-2xl font-bold p-3 rounded-lg border ${profit >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                ₹{profit.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button
              type="button"
              onClick={form.handleSubmit((data) => onSubmit(data, false))}
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {editData ? 'Update Trip' : 'Submit Trip'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
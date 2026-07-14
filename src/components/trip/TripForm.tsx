import { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Droplets, Gauge } from 'lucide-react';
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
import { CarNumberCombobox } from '@/components/ui/car-number-combobox';
import { DEFAULT_FUEL_RATES, FUEL_RATES_UPDATED_EVENT, FuelRates, FuelType, getFuelUnit, getStoredFuelRates } from '@/lib/fuelRates';

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
  fuelQuantity: z.number().min(0, 'Quantity must be positive').optional().or(z.literal(0)),
  tolls: z.number().min(0, 'Amount must be positive'),
  tripAmount: z.number().min(0, 'Amount must be positive'),
  startingKm: z.number().min(0, 'KM must be positive').optional().or(z.literal(0)),
  endingKm: z.number().min(0, 'KM must be positive').optional().or(z.literal(0)),
});

type TripFormData = z.infer<typeof tripSchema>;

interface TripFormProps {
  onSuccess?: () => void;
  editData?: any;
}

export const TripForm = ({ onSuccess, editData }: TripFormProps) => {
  const { user } = useAuth();
  const [profit, setProfit] = useState(0);
  const [fuelRates, setFuelRates] = useState<FuelRates>(DEFAULT_FUEL_RATES);
  const lastEditedFuelFieldRef = useRef<'amount' | 'quantity'>('amount');
  const [oilChangeInfo, setOilChangeInfo] = useState<{
    lastOilChangeKm: number;
    nextOilChangeKm: number | null;
    lastOilChangeDate: string;
    oilType: string | null;
  } | null>(null);
  const [alignmentInfo, setAlignmentInfo] = useState<{
    lastAlignmentKm: number;
    nextAlignmentKm: number;
  } | null>(null);

  const fetchVehicleTrackingInfo = useCallback(async (carNumber: string) => {
    if (!carNumber) {
      setOilChangeInfo(null);
      setAlignmentInfo(null);
      return;
    }

    const [oilRes, alignRes] = await Promise.all([
      supabase
        .from('vehicle_oil_change')
        .select('last_oil_change_km, next_oil_change_km, last_oil_change_date, oil_type')
        .eq('vehicle_number', carNumber)
        .order('last_oil_change_date', { ascending: false })
        .limit(1),
      supabase
        .from('vehicle_alignment')
        .select('last_alignment_km, alignment_interval_km')
        .eq('vehicle_number', carNumber)
        .order('created_at', { ascending: false })
        .limit(1),
    ]);

    if (oilRes.data && oilRes.data.length > 0) {
      const o = oilRes.data[0];
      setOilChangeInfo({
        lastOilChangeKm: o.last_oil_change_km,
        nextOilChangeKm: o.next_oil_change_km,
        lastOilChangeDate: o.last_oil_change_date,
        oilType: o.oil_type,
      });
    } else {
      setOilChangeInfo(null);
    }

    if (alignRes.data && alignRes.data.length > 0) {
      const a = alignRes.data[0];
      setAlignmentInfo({
        lastAlignmentKm: a.last_alignment_km,
        nextAlignmentKm: a.last_alignment_km + a.alignment_interval_km,
      });
    } else {
      setAlignmentInfo(null);
    }
  }, []);
  
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
        fuelQuantity: editData?.fuel_litres || 0,
      tolls: editData?.tolls || 0,
      tripAmount: editData?.trip_amount || 0,
      startingKm: editData?.starting_km || 0,
      endingKm: editData?.ending_km || 0,
    },
  });

  const watchedValues = form.watch(['driverAmount', 'commission', 'fuelAmount', 'tolls', 'tripAmount']);
  const watchedCarNumber = form.watch('carNumber');
  const watchedEndingKm = form.watch('endingKm');
  const watchedStartingKm = form.watch('startingKm');
  const watchedFuelType = form.watch('fuelType');
  const watchedFuelQuantity = form.watch('fuelQuantity');
  const watchedFuelAmount = form.watch('fuelAmount');
  const watchedDriverName = form.watch('driverName');
  const watchedDate = form.watch('date');
  const watchedCustomerName = form.watch('customerName');

  const totalKm = Math.max(0, (watchedEndingKm || 0) - (watchedStartingKm || 0));
  const selectedFuelRate = fuelRates[watchedFuelType as FuelType] || 0;
  const mileage = watchedFuelQuantity && watchedFuelQuantity > 0 ? totalKm / watchedFuelQuantity : 0;

  useEffect(() => {
    const [driverAmount, commission, fuelAmount, tolls, tripAmount] = watchedValues;
    const calculatedProfit = (tripAmount || 0) - ((driverAmount || 0) + (commission || 0) + (fuelAmount || 0) + (tolls || 0));
    setProfit(calculatedProfit);
  }, [watchedValues]);

  useEffect(() => {
    const syncFuelRates = () => setFuelRates(getStoredFuelRates());

    syncFuelRates();
    window.addEventListener(FUEL_RATES_UPDATED_EVENT, syncFuelRates);

    return () => window.removeEventListener(FUEL_RATES_UPDATED_EVENT, syncFuelRates);
  }, []);

  useEffect(() => {
    if (lastEditedFuelFieldRef.current !== 'quantity') return;
    if (!watchedFuelQuantity || watchedFuelQuantity <= 0) {
      form.setValue('fuelAmount', 0, { shouldDirty: true, shouldValidate: true });
      return;
    }
    if (!selectedFuelRate) return;

    form.setValue('fuelAmount', Number((watchedFuelQuantity * selectedFuelRate).toFixed(2)), {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [form, selectedFuelRate, watchedFuelQuantity, watchedFuelType]);

  useEffect(() => {
    if (lastEditedFuelFieldRef.current !== 'amount') return;
    if (!watchedFuelAmount || watchedFuelAmount <= 0) {
      form.setValue('fuelQuantity', 0, { shouldDirty: true, shouldValidate: true });
      return;
    }
    if (!selectedFuelRate) return;

    form.setValue('fuelQuantity', Number((watchedFuelAmount / selectedFuelRate).toFixed(2)), {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [form, selectedFuelRate, watchedFuelAmount, watchedFuelType]);

  useEffect(() => {
    const fillDriverNumberFromHistory = async () => {
      const driverName = watchedDriverName?.trim();

      if (!driverName || !watchedDate) return;

      const selectedDate = format(watchedDate, 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('trips')
        .select('driver_number, date, created_at')
        .ilike('driver_name', driverName)
        .lte('date', selectedDate)
        .not('driver_number', 'is', null)
        .neq('driver_number', '')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1);

      if (error || !data?.length) return;

      const latestDriverNumber = data[0].driver_number;
      if (!latestDriverNumber || form.getValues('driverNumber') === latestDriverNumber) return;

      form.setValue('driverNumber', latestDriverNumber, {
        shouldDirty: true,
        shouldValidate: true,
      });
    };

    void fillDriverNumberFromHistory();
  }, [form, watchedDate, watchedDriverName]);

  useEffect(() => {
    const fillCustomerDetailsFromHistory = async () => {
      const customerName = watchedCustomerName?.trim();
      if (!customerName) return;

      const { data, error } = await supabase
        .from('trips')
        .select('customer_number, company, from_location, to_location, date, created_at')
        .ilike('customer_name', customerName)
        .not('customer_number', 'is', null)
        .neq('customer_number', '')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1);

      if (error || !data?.length) return;

      const prev = data[0];

      if (prev.customer_number && form.getValues('customerNumber') !== prev.customer_number) {
        form.setValue('customerNumber', prev.customer_number, { shouldDirty: true, shouldValidate: true });
      }
      if (prev.company && !form.getValues('company')) {
        form.setValue('company', prev.company, { shouldDirty: true, shouldValidate: true });
      }
      if (prev.from_location && !form.getValues('fromLocation')) {
        form.setValue('fromLocation', prev.from_location, { shouldDirty: true, shouldValidate: true });
      }
      if (prev.to_location && !form.getValues('toLocation')) {
        form.setValue('toLocation', prev.to_location, { shouldDirty: true, shouldValidate: true });
      }
    };

    void fillCustomerDetailsFromHistory();
  }, [form, watchedCustomerName]);

  useEffect(() => {
    if (watchedCarNumber) {
      fetchVehicleTrackingInfo(watchedCarNumber);
    }
  }, [watchedCarNumber, fetchVehicleTrackingInfo]);

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
        fuel_litres: data.fuelQuantity || 0,
        tolls: data.tolls,
        trip_amount: data.tripAmount,
        profit: profit,
        starting_km: data.startingKm || null,
        ending_km: data.endingKm || null,
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

      // Sync to driver ledger if driver name matches a registered driver
      try {
        const savedTripId = editData?.id || (result as any).data?.[0]?.id;
        if (data.driverAmount > 0 && data.driverName) {
          const { data: matched } = await supabase
            .from('drivers')
            .select('id')
            .ilike('name', data.driverName.trim())
            .limit(1);
          const driverId = matched?.[0]?.id;
          if (driverId) {
            if (editData) {
              await supabase.from('trips').update({ driver_id: driverId }).eq('id', editData.id);
              await supabase.from('driver_trip_amounts')
                .upsert({ driver_id: driverId, trip_id: editData.id, amount: data.driverAmount, created_by: user?.id }, { onConflict: 'trip_id' });
            } else {
              // Find newly created trip by created_by + created recently
              const { data: newTrip } = await supabase
                .from('trips').select('id')
                .eq('created_by', user?.id)
                .order('created_at', { ascending: false })
                .limit(1);
              if (newTrip?.[0]?.id) {
                await supabase.from('trips').update({ driver_id: driverId }).eq('id', newTrip[0].id);
                await supabase.from('driver_trip_amounts')
                  .upsert({ driver_id: driverId, trip_id: newTrip[0].id, amount: data.driverAmount, created_by: user?.id }, { onConflict: 'trip_id' });
              }
            }
          }
        }
      } catch (e) { console.error('Driver ledger sync failed', e); }

      // Update vehicle oil change and alignment records with ending Odometer KM
      if (data.endingKm && data.carNumber) {
        // Update the latest oil change record's next_oil_change_km tracking
        const { data: oilRecords } = await supabase
          .from('vehicle_oil_change')
          .select('id, last_oil_change_km, next_oil_change_km')
          .eq('vehicle_number', data.carNumber)
          .order('last_oil_change_date', { ascending: false })
          .limit(1);

        if (oilRecords && oilRecords.length > 0) {
          const oilRecord = oilRecords[0];
          const remainingKm = (oilRecord.next_oil_change_km || 0) - data.endingKm;
          
          if (oilRecord.next_oil_change_km && data.endingKm >= oilRecord.next_oil_change_km) {
            toast({
              title: "⚠️ Oil Change Due!",
              description: `Vehicle ${data.carNumber} odometer ${data.endingKm} km has exceeded oil change due at ${oilRecord.next_oil_change_km} km. Please schedule an oil change immediately.`,
              variant: "destructive",
            });
          } else if (oilRecord.next_oil_change_km && remainingKm <= 500 && remainingKm > 0) {
            toast({
              title: "🔔 Oil Change Approaching",
              description: `Vehicle ${data.carNumber} is ${remainingKm} km away from oil change due at ${oilRecord.next_oil_change_km} km.`,
            });
          }
        }

        // Update alignment tracking  
        const { data: alignRecords } = await supabase
          .from('vehicle_alignment')
          .select('id, last_alignment_km, alignment_interval_km')
          .eq('vehicle_number', data.carNumber)
          .order('created_at', { ascending: false })
          .limit(1);

        if (alignRecords && alignRecords.length > 0) {
          const alignRecord = alignRecords[0];
          const nextAlignmentKm = alignRecord.last_alignment_km + alignRecord.alignment_interval_km;
          if (data.endingKm >= nextAlignmentKm) {
            toast({
              title: "⚠️ Alignment Due!",
              description: `Vehicle ${data.carNumber} odometer ${data.endingKm} km has exceeded alignment due at ${nextAlignmentKm} km.`,
              variant: "destructive",
            });
          }
        }
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
              <Label>Car Number</Label>
              <CarNumberCombobox
                value={form.watch('carNumber') || ''}
                onValueChange={(value) => form.setValue('carNumber', value)}
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
              <p className="text-xs text-muted-foreground">
                Current rate: ₹{selectedFuelRate.toFixed(2)}/{getFuelUnit(watchedFuelType as FuelType)}
              </p>
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
              <Label htmlFor="fuelQuantity">Fuel Quantity ({getFuelUnit(watchedFuelType as FuelType)})</Label>
              <Input
                id="fuelQuantity"
                type="number"
                step="0.01"
                {...form.register('fuelQuantity', {
                  valueAsNumber: true,
                  onChange: () => {
                    lastEditedFuelFieldRef.current = 'quantity';
                  },
                })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fuelAmount">Fuel (₹)</Label>
              <Input
                id="fuelAmount"
                type="number"
                step="0.01"
                {...form.register('fuelAmount', {
                  valueAsNumber: true,
                  onChange: () => {
                    lastEditedFuelFieldRef.current = 'amount';
                  },
                })}
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
              <Label htmlFor="startingKm">{"Starting Odometer KM's"}</Label>
              <Input
                id="startingKm"
                type="number"
                {...form.register('startingKm', { valueAsNumber: true })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endingKm">{"Ending Odometer KM's"}</Label>
              <Input
                id="endingKm"
                type="number"
                {...form.register('endingKm', { valueAsNumber: true })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label>{"Total KM's"}</Label>
              <div className="text-lg font-semibold p-3 rounded-lg border bg-muted/50">
                {totalKm > 0 
                  ? `${totalKm} km`
                  : '0 km'}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Mileage</Label>
              <div className="text-lg font-semibold p-3 rounded-lg border bg-muted/50">
                {mileage > 0 ? `${mileage.toFixed(2)} km/${getFuelUnit(watchedFuelType as FuelType)}` : '0'}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Total Profit</Label>
              <div className={`text-2xl font-bold p-3 rounded-lg border ${profit >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                ₹{profit.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Vehicle Oil Change & Alignment Tracking Info */}
          {watchedCarNumber && (oilChangeInfo || alignmentInfo) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg border bg-muted/30">
              {oilChangeInfo && (() => {
                const currentKm = watchedEndingKm || 0;
                const remaining = oilChangeInfo.nextOilChangeKm ? oilChangeInfo.nextOilChangeKm - currentKm : null;
                const interval = oilChangeInfo.nextOilChangeKm ? oilChangeInfo.nextOilChangeKm - oilChangeInfo.lastOilChangeKm : null;
                const progress = interval && interval > 0 ? Math.max(0, Math.min(100, ((currentKm - oilChangeInfo.lastOilChangeKm) / interval) * 100)) : 0;
                const isOverdue = remaining !== null && remaining <= 0;
                const isDueSoon = remaining !== null && remaining > 0 && remaining <= 1000;

                return (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-sm">
                      <Droplets className="h-4 w-4 text-blue-500" />
                      Oil Change Status
                    </div>
                    <div className="text-xs space-y-1">
                      <p>Last Oil Change: <span className="font-medium">{oilChangeInfo.lastOilChangeKm.toLocaleString()} km</span></p>
                      {oilChangeInfo.nextOilChangeKm && (
                        <p>Next Oil Change: <span className="font-medium">{oilChangeInfo.nextOilChangeKm.toLocaleString()} km</span></p>
                      )}
                      {remaining !== null && currentKm > 0 && (
                        <p className={isOverdue ? 'text-destructive font-bold' : isDueSoon ? 'text-orange-500 font-semibold' : 'text-green-600'}>
                          {isOverdue ? `⚠️ Overdue by ${Math.abs(remaining).toLocaleString()} km` : `${remaining.toLocaleString()} km remaining`}
                        </p>
                      )}
                      {interval && interval > 0 && currentKm > 0 && (
                        <div className="w-full bg-muted rounded-full h-2 mt-1">
                          <div 
                            className={`h-2 rounded-full ${isOverdue ? 'bg-destructive' : isDueSoon ? 'bg-orange-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {alignmentInfo && (() => {
                const currentKm = watchedEndingKm || 0;
                const remaining = alignmentInfo.nextAlignmentKm - currentKm;
                const isOverdue = remaining <= 0 && currentKm > 0;

                return (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-sm">
                      <Gauge className="h-4 w-4 text-purple-500" />
                      Alignment Status
                    </div>
                    <div className="text-xs space-y-1">
                      <p>Last Alignment: <span className="font-medium">{alignmentInfo.lastAlignmentKm.toLocaleString()} km</span></p>
                      <p>Next Alignment: <span className="font-medium">{alignmentInfo.nextAlignmentKm.toLocaleString()} km</span></p>
                      {currentKm > 0 && (
                        <p className={isOverdue ? 'text-destructive font-bold' : 'text-green-600'}>
                          {isOverdue ? `⚠️ Overdue by ${Math.abs(remaining).toLocaleString()} km` : `${remaining.toLocaleString()} km remaining`}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

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
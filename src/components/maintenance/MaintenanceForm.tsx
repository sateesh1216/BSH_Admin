import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Wrench, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const maintenanceSchema = z.object({
  date: z.date({ required_error: 'Date is required' }),
  vehicleNumber: z.string().min(1, 'Vehicle number is required'),
  driverName: z.string().min(1, 'Driver name is required'),
  driverNumber: z.string().min(10, 'Valid phone number is required'),
  company: z.string().optional(),
  maintenanceType: z.string().min(1, 'Maintenance type is required'),
  description: z.string().optional(),
  amount: z.number().min(0, 'Amount must be positive'),
  paymentMode: z.enum(['Cash', 'UPI', 'Online', 'Credit Card', 'Other']),
  kmAtMaintenance: z.number().min(0, 'KM must be positive').optional(),
  nextOilChangeKm: z.number().min(0, 'KM must be positive').optional(),
  originalOdometerKm: z.number().min(0, 'KM must be positive').optional(),
});

type MaintenanceFormData = z.infer<typeof maintenanceSchema>;

interface MaintenanceFormProps {
  onSuccess?: () => void;
  editData?: any;
}

interface Maintenance {
  id: string;
  date: string;
  vehicle_number: string;
  driver_name: string;
  driver_number: string;
  company: string | null;
  maintenance_type: string;
  description: string | null;
  amount: number;
  payment_mode: string;
  km_at_maintenance: number | null;
  next_oil_change_km: number | null;
  original_odometer_km: number | null;
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
  const [maintenanceRecords, setMaintenanceRecords] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);
  
  const form = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      date: editData?.date ? new Date(editData.date) : new Date(),
      vehicleNumber: editData?.vehicle_number || '',
      driverName: editData?.driver_name || '',
      driverNumber: editData?.driver_number || '',
      company: editData?.company || '',
      maintenanceType: editData?.maintenance_type || '',
      description: editData?.description || '',
      amount: editData?.amount || 0,
      paymentMode: editData?.payment_mode || 'Cash',
      kmAtMaintenance: editData?.km_at_maintenance || undefined,
      nextOilChangeKm: editData?.next_oil_change_km || undefined,
      originalOdometerKm: editData?.original_odometer_km || undefined,
    },
  });

  useEffect(() => {
    fetchMaintenance();
  }, [user]);

  const fetchMaintenance = async () => {
    try {
      setLoading(true);
      let query = supabase.from('maintenance').select('*');
      
      if (user) {
        query = query.eq('created_by', user.id);
      }
      
      const { data, error } = await query.order('date', { ascending: false });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setMaintenanceRecords(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch maintenance records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: MaintenanceFormData) => {
    try {
      const maintenanceData = {
        date: format(data.date, 'yyyy-MM-dd'),
        vehicle_number: data.vehicleNumber,
        driver_name: data.driverName,
        driver_number: data.driverNumber,
        company: data.company || null,
        maintenance_type: data.maintenanceType,
        description: data.description || null,
        amount: data.amount,
        payment_mode: data.paymentMode,
        km_at_maintenance: data.kmAtMaintenance || null,
        next_oil_change_km: data.nextOilChangeKm || null,
        original_odometer_km: data.originalOdometerKm || null,
        created_by: user?.id,
      };

      let result;
      const editId = form.getValues('id' as any) || editData?.id;
      if (editId) {
        result = await supabase
          .from('maintenance')
          .update(maintenanceData)
          .eq('id', editId);
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
        description: `Maintenance record ${editId ? 'updated' : 'added'} successfully!`,
      });

      if (!editId) {
        form.reset();
      } else {
        // Clear the edit ID after successful update
        form.setValue('id' as any, undefined);
      }
      fetchMaintenance();
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const totalExpenses = maintenanceRecords.reduce((sum, record) => sum + record.amount, 0);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('maintenance')
        .delete()
        .eq('id', id);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Maintenance record deleted successfully",
      });
      fetchMaintenance();
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (record: Maintenance) => {
    // Reset form with edit data
    form.reset({
      date: new Date(record.date),
      vehicleNumber: record.vehicle_number,
      driverName: record.driver_name,
      driverNumber: record.driver_number,
      company: record.company || '',
      maintenanceType: record.maintenance_type,
      description: record.description || '',
      amount: record.amount,
      paymentMode: record.payment_mode as any,
      kmAtMaintenance: record.km_at_maintenance || undefined,
      nextOilChangeKm: record.next_oil_change_km || undefined,
      originalOdometerKm: record.original_odometer_km || undefined,
    });
    // Store the ID for updating
    form.setValue('id' as any, record.id);
  };

  return (
    <div className="space-y-6">
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
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                {...form.register('company')}
                placeholder="Company name (optional)"
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Mode *</Label>
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

    {/* Maintenance Records Table */}
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-primary">
            <Wrench className="h-5 w-5" />
            Maintenance Records
          </span>
          <div className="text-sm space-y-1">
            <div className="text-lg font-semibold text-green-600">
              Total: ₹{totalExpenses.toLocaleString()}
            </div>
            <div className="text-muted-foreground text-xs">
              ({maintenanceRecords.length} record{maintenanceRecords.length !== 1 ? 's' : ''})
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading maintenance records...</p>
          </div>
        ) : maintenanceRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-4 py-2 text-left">Date</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Vehicle</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Driver</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Type</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Amount</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Payment</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {maintenanceRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-2">
                      {format(new Date(record.date), 'dd-MM-yyyy')}
                    </td>
                    <td className="border border-gray-200 px-4 py-2">{record.vehicle_number}</td>
                    <td className="border border-gray-200 px-4 py-2">{record.driver_name}</td>
                    <td className="border border-gray-200 px-4 py-2">{record.maintenance_type}</td>
                    <td className="border border-gray-200 px-4 py-2">₹{record.amount.toLocaleString()}</td>
                    <td className="border border-gray-200 px-4 py-2">{record.payment_mode}</td>
                    <td className="border border-gray-200 px-4 py-2">
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(record)}
                          title="Edit Maintenance"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" title="Delete Maintenance">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete this maintenance record.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(record.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">No maintenance records found</p>
        )}
      </CardContent>
    </Card>
    </div>
  );
};
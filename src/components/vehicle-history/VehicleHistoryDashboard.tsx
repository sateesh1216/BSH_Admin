import { useState, useMemo, useEffect } from 'react';
import { format, differenceInMonths, addMonths, isBefore, isAfter, startOfDay } from 'date-fns';
import { Car, AlertTriangle, ChevronDown, ChevronRight, Wrench, Gauge, CreditCard, AlignCenter, Plus, Trash2, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

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

interface VehicleHistoryDashboardProps {
  maintenance: Maintenance[];
}

interface VehicleSummary {
  vehicleNumber: string;
  totalSpent: number;
  recordCount: number;
  lastService: string;
  lastServiceType: string;
  latestKm: number | null;
  nextOilChangeKm: number | null;
  originalOdometerKm: number | null;
  records: Maintenance[];
}

interface VehicleEmi {
  id: string;
  vehicle_number: string;
  emi_amount: number;
  emi_day: number;
  start_date: string;
  end_date: string;
}

interface VehicleAlignment {
  id: string;
  vehicle_number: string;
  last_alignment_km: number;
  alignment_interval_km: number;
  last_alignment_date: string | null;
}

const getOilChangeStatus = (currentKm: number | null, nextOilChangeKm: number | null) => {
  if (!currentKm || !nextOilChangeKm) return null;
  const remaining = nextOilChangeKm - currentKm;
  const totalInterval = nextOilChangeKm - (currentKm - 10000);
  const progress = Math.max(0, Math.min(100, ((totalInterval - remaining) / totalInterval) * 100));
  
  if (remaining <= 0) return { status: 'overdue', remaining, progress: 100, color: 'text-destructive' };
  if (remaining <= 1000) return { status: 'due-soon', remaining, progress, color: 'text-orange-500' };
  return { status: 'ok', remaining, progress, color: 'text-green-600' };
};

const getEmiStatus = (emi: VehicleEmi) => {
  const today = new Date();
  const startDate = new Date(emi.start_date);
  const endDate = new Date(emi.end_date);
  const totalMonths = differenceInMonths(endDate, startDate);
  const paidMonths = Math.max(0, differenceInMonths(today, startDate));
  const remainingMonths = Math.max(0, totalMonths - paidMonths);
  const totalAmount = totalMonths * emi.emi_amount;
  const paidAmount = Math.min(paidMonths, totalMonths) * emi.emi_amount;
  const progress = Math.min(100, (paidMonths / totalMonths) * 100);
  
  // Next EMI date
  let nextEmiDate: Date | null = null;
  if (isBefore(today, endDate)) {
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), emi.emi_day);
    if (isAfter(currentMonth, today)) {
      nextEmiDate = currentMonth;
    } else {
      nextEmiDate = addMonths(currentMonth, 1);
    }
    if (isAfter(nextEmiDate, endDate)) nextEmiDate = null;
  }

  const isCompleted = isAfter(today, endDate) || paidMonths >= totalMonths;
  
  return { totalMonths, paidMonths: Math.min(paidMonths, totalMonths), remainingMonths, totalAmount, paidAmount, progress, nextEmiDate, isCompleted };
};

const getAlignmentStatus = (alignment: VehicleAlignment, currentKm: number | null) => {
  if (!currentKm) return null;
  const kmSinceAlignment = currentKm - alignment.last_alignment_km;
  const remaining = alignment.alignment_interval_km - kmSinceAlignment;
  const progress = Math.max(0, Math.min(100, (kmSinceAlignment / alignment.alignment_interval_km) * 100));
  
  if (remaining <= 0) return { status: 'overdue', remaining, progress: 100, color: 'text-destructive' };
  if (remaining <= 1000) return { status: 'due-soon', remaining, progress, color: 'text-orange-500' };
  return { status: 'ok', remaining, progress, color: 'text-green-600' };
};

export const VehicleHistoryDashboard = ({ maintenance }: VehicleHistoryDashboardProps) => {
  const { user } = useAuth();
  const [expandedVehicle, setExpandedVehicle] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState('vehicles');
  const [emiRecords, setEmiRecords] = useState<VehicleEmi[]>([]);
  const [alignmentRecords, setAlignmentRecords] = useState<VehicleAlignment[]>([]);
  const [showEmiForm, setShowEmiForm] = useState(false);
  const [showAlignmentForm, setShowAlignmentForm] = useState(false);
  
  // EMI form state
  const [emiVehicle, setEmiVehicle] = useState('');
  const [emiAmount, setEmiAmount] = useState('');
  const [emiStartDate, setEmiStartDate] = useState('2022-07-20');
  const [emiEndDate, setEmiEndDate] = useState('2026-06-20');
  const [editingEmiId, setEditingEmiId] = useState<string | null>(null);
  
  // Alignment form state
  const [alignVehicle, setAlignVehicle] = useState('');
  const [alignLastKm, setAlignLastKm] = useState('');
  const [alignInterval, setAlignInterval] = useState('10000');
  const [alignLastDate, setAlignLastDate] = useState('');
  const [editingAlignId, setEditingAlignId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchEmiRecords();
      fetchAlignmentRecords();
    }
  }, [user]);

  const fetchEmiRecords = async () => {
    const { data, error } = await supabase.from('vehicle_emi').select('*').order('vehicle_number');
    if (!error && data) setEmiRecords(data as VehicleEmi[]);
  };

  const fetchAlignmentRecords = async () => {
    const { data, error } = await supabase.from('vehicle_alignment').select('*').order('vehicle_number');
    if (!error && data) setAlignmentRecords(data as VehicleAlignment[]);
  };

  const handleEmiSubmit = async () => {
    if (!emiVehicle || !emiAmount) {
      toast({ title: 'Error', description: 'Vehicle number and EMI amount are required', variant: 'destructive' });
      return;
    }
    const payload = {
      vehicle_number: emiVehicle,
      emi_amount: parseFloat(emiAmount),
      emi_day: 20,
      start_date: emiStartDate,
      end_date: emiEndDate,
      created_by: user?.id,
    };
    
    let result;
    if (editingEmiId) {
      result = await supabase.from('vehicle_emi').update(payload).eq('id', editingEmiId);
    } else {
      result = await supabase.from('vehicle_emi').insert([payload]);
    }
    
    if (result.error) {
      toast({ title: 'Error', description: result.error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `EMI record ${editingEmiId ? 'updated' : 'added'} successfully` });
      resetEmiForm();
      fetchEmiRecords();
    }
  };

  const handleAlignmentSubmit = async () => {
    if (!alignVehicle || !alignLastKm) {
      toast({ title: 'Error', description: 'Vehicle number and last alignment KM are required', variant: 'destructive' });
      return;
    }
    const payload = {
      vehicle_number: alignVehicle,
      last_alignment_km: parseInt(alignLastKm),
      alignment_interval_km: parseInt(alignInterval),
      last_alignment_date: alignLastDate || null,
      created_by: user?.id,
    };
    
    let result;
    if (editingAlignId) {
      result = await supabase.from('vehicle_alignment').update(payload).eq('id', editingAlignId);
    } else {
      result = await supabase.from('vehicle_alignment').insert([payload]);
    }
    
    if (result.error) {
      toast({ title: 'Error', description: result.error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `Alignment record ${editingAlignId ? 'updated' : 'added'} successfully` });
      resetAlignmentForm();
      fetchAlignmentRecords();
    }
  };

  const resetEmiForm = () => {
    setEmiVehicle(''); setEmiAmount(''); setEmiStartDate('2022-07-20'); setEmiEndDate('2026-06-20'); setEditingEmiId(null); setShowEmiForm(false);
  };

  const resetAlignmentForm = () => {
    setAlignVehicle(''); setAlignLastKm(''); setAlignInterval('10000'); setAlignLastDate(''); setEditingAlignId(null); setShowAlignmentForm(false);
  };

  const handleDeleteEmi = async (id: string) => {
    const { error } = await supabase.from('vehicle_emi').delete().eq('id', id);
    if (!error) { toast({ title: 'Deleted', description: 'EMI record removed' }); fetchEmiRecords(); }
  };

  const handleDeleteAlignment = async (id: string) => {
    const { error } = await supabase.from('vehicle_alignment').delete().eq('id', id);
    if (!error) { toast({ title: 'Deleted', description: 'Alignment record removed' }); fetchAlignmentRecords(); }
  };

  const handleEditEmi = (emi: VehicleEmi) => {
    setEmiVehicle(emi.vehicle_number);
    setEmiAmount(String(emi.emi_amount));
    setEmiStartDate(emi.start_date);
    setEmiEndDate(emi.end_date);
    setEditingEmiId(emi.id);
    setShowEmiForm(true);
  };

  const handleEditAlignment = (a: VehicleAlignment) => {
    setAlignVehicle(a.vehicle_number);
    setAlignLastKm(String(a.last_alignment_km));
    setAlignInterval(String(a.alignment_interval_km));
    setAlignLastDate(a.last_alignment_date || '');
    setEditingAlignId(a.id);
    setShowAlignmentForm(true);
  };

  const vehicleSummaries = useMemo(() => {
    const vehicleMap: { [key: string]: VehicleSummary } = {};
    const sorted = [...maintenance].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sorted.forEach(record => {
      const vn = record.vehicle_number;
      if (!vehicleMap[vn]) {
        vehicleMap[vn] = { vehicleNumber: vn, totalSpent: 0, recordCount: 0, lastService: record.date, lastServiceType: record.maintenance_type, latestKm: null, nextOilChangeKm: null, originalOdometerKm: null, records: [] };
      }
      vehicleMap[vn].totalSpent += record.amount;
      vehicleMap[vn].recordCount += 1;
      vehicleMap[vn].lastService = record.date;
      vehicleMap[vn].lastServiceType = record.maintenance_type;
      if (record.km_at_maintenance) vehicleMap[vn].latestKm = record.km_at_maintenance;
      if (record.next_oil_change_km) vehicleMap[vn].nextOilChangeKm = record.next_oil_change_km;
      if (record.original_odometer_km) vehicleMap[vn].originalOdometerKm = record.original_odometer_km;
      vehicleMap[vn].records.push(record);
    });

    Object.values(vehicleMap).forEach(v => {
      v.records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });

    return Object.values(vehicleMap).sort((a, b) => a.vehicleNumber.localeCompare(b.vehicleNumber));
  }, [maintenance]);

  // Get latest KM for a vehicle from maintenance records
  const getLatestKmForVehicle = (vehicleNumber: string): number | null => {
    const vehicle = vehicleSummaries.find(v => v.vehicleNumber === vehicleNumber);
    return vehicle?.latestKm || null;
  };

  if (maintenance.length === 0 && emiRecords.length === 0 && alignmentRecords.length === 0) {
    return (
      <Card className="shadow-lg border-primary/20">
        <CardContent className="py-12">
          <div className="text-center">
            <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No vehicle records found</h3>
            <p className="text-sm text-muted-foreground">Add maintenance records, EMI, or alignment data to see vehicle history here.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="vehicles" className="flex items-center gap-1 text-xs sm:text-sm">
            <Car className="h-4 w-4" />
            <span>Vehicles</span>
          </TabsTrigger>
          <TabsTrigger value="emi" className="flex items-center gap-1 text-xs sm:text-sm">
            <CreditCard className="h-4 w-4" />
            <span>EMI Tracking</span>
          </TabsTrigger>
          <TabsTrigger value="alignment" className="flex items-center gap-1 text-xs sm:text-sm">
            <AlignCenter className="h-4 w-4" />
            <span>Alignment</span>
          </TabsTrigger>
        </TabsList>

        {/* Vehicles Sub-Tab */}
        <TabsContent value="vehicles">
          <h2 className="text-lg font-semibold text-primary flex items-center gap-2 mb-4">
            <Car className="h-5 w-5" />
            Vehicle History ({vehicleSummaries.length} vehicles)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicleSummaries.map((vehicle) => {
              const oilStatus = getOilChangeStatus(vehicle.latestKm, vehicle.nextOilChangeKm);
              const alignment = alignmentRecords.find(a => a.vehicle_number === vehicle.vehicleNumber);
              const alignStatus = alignment ? getAlignmentStatus(alignment, vehicle.latestKm) : null;
              const isExpanded = expandedVehicle === vehicle.vehicleNumber;

              return (
                <Card
                  key={vehicle.vehicleNumber}
                  className={`shadow-md border-primary/20 cursor-pointer transition-all hover:shadow-lg ${isExpanded ? 'col-span-1 md:col-span-2 lg:col-span-3' : ''} ${oilStatus?.status === 'overdue' ? 'border-destructive/50' : oilStatus?.status === 'due-soon' ? 'border-orange-400/50' : ''}`}
                  onClick={() => setExpandedVehicle(isExpanded ? null : vehicle.vehicleNumber)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-base font-bold text-primary">
                        <Car className="h-4 w-4" />
                        {vehicle.vehicleNumber}
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {oilStatus?.status === 'overdue' && (
                          <Badge variant="destructive" className="text-xs animate-pulse">
                            <AlertTriangle className="h-3 w-3 mr-1" />Oil Overdue
                          </Badge>
                        )}
                        {oilStatus?.status === 'due-soon' && (
                          <Badge className="bg-orange-500 text-white text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />Oil Soon
                          </Badge>
                        )}
                        {alignStatus?.status === 'overdue' && (
                          <Badge variant="destructive" className="text-xs animate-pulse">
                            <AlignCenter className="h-3 w-3 mr-1" />Align Overdue
                          </Badge>
                        )}
                        {alignStatus?.status === 'due-soon' && (
                          <Badge className="bg-orange-500 text-white text-xs">
                            <AlignCenter className="h-3 w-3 mr-1" />Align Soon
                          </Badge>
                        )}
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="text-center p-2 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground">Total Spent</p>
                        <p className="font-bold text-sm text-primary">₹{vehicle.totalSpent.toLocaleString()}</p>
                      </div>
                      <div className="text-center p-2 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground">Records</p>
                        <p className="font-bold text-sm">{vehicle.recordCount}</p>
                      </div>
                      <div className="text-center p-2 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground">Last Service</p>
                        <p className="font-bold text-sm">{format(new Date(vehicle.lastService), 'dd MMM yy')}</p>
                      </div>
                    </div>

                    {/* Oil Change KM Tracking */}
                    {(vehicle.latestKm || vehicle.nextOilChangeKm) && (
                      <div className="p-3 bg-muted/20 rounded-lg space-y-2 mb-2">
                        <div className="flex items-center gap-2 text-xs font-medium">
                          <Gauge className="h-3.5 w-3.5 text-primary" />
                          Oil Change KM
                        </div>
                        <div className="flex justify-between text-xs">
                          {vehicle.latestKm && <span>Current: <strong>{vehicle.latestKm.toLocaleString()} km</strong></span>}
                          {vehicle.nextOilChangeKm && <span>Next Oil: <strong>{vehicle.nextOilChangeKm.toLocaleString()} km</strong></span>}
                        </div>
                        {oilStatus && (
                          <div className="space-y-1">
                            <Progress value={oilStatus.progress} className="h-2" />
                            <p className={`text-xs font-medium ${oilStatus.color}`}>
                              {oilStatus.remaining <= 0 ? `Overdue by ${Math.abs(oilStatus.remaining).toLocaleString()} km` : `${oilStatus.remaining.toLocaleString()} km remaining`}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Alignment Tracking */}
                    {alignStatus && alignment && (
                      <div className="p-3 bg-muted/20 rounded-lg space-y-2 mb-2">
                        <div className="flex items-center gap-2 text-xs font-medium">
                          <AlignCenter className="h-3.5 w-3.5 text-primary" />
                          Wheel Alignment
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Last: <strong>{alignment.last_alignment_km.toLocaleString()} km</strong></span>
                          <span>Interval: <strong>{alignment.alignment_interval_km.toLocaleString()} km</strong></span>
                        </div>
                        <div className="space-y-1">
                          <Progress value={alignStatus.progress} className="h-2" />
                          <p className={`text-xs font-medium ${alignStatus.color}`}>
                            {alignStatus.remaining <= 0 ? `Overdue by ${Math.abs(alignStatus.remaining).toLocaleString()} km` : `${alignStatus.remaining.toLocaleString()} km remaining`}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Expanded Detail Table */}
                    {isExpanded && (
                      <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                          <Wrench className="h-4 w-4" />
                          Full Maintenance History
                        </h4>
                        <ScrollArea className="max-h-[400px]">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b bg-muted/30">
                                  <th className="text-left py-2 px-3 font-semibold">Date</th>
                                  <th className="text-left py-2 px-3 font-semibold">Type</th>
                                  <th className="text-right py-2 px-3 font-semibold">Amount</th>
                                  <th className="text-right py-2 px-3 font-semibold">KM</th>
                                  <th className="text-right py-2 px-3 font-semibold">Next Oil KM</th>
                                  <th className="text-left py-2 px-3 font-semibold">Description</th>
                                </tr>
                              </thead>
                              <tbody>
                                {vehicle.records.map((record, idx) => (
                                  <tr key={record.id} className={`border-b ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}>
                                    <td className="py-2 px-3">{format(new Date(record.date), 'dd-MMM-yyyy')}</td>
                                    <td className="py-2 px-3"><Badge variant="secondary" className="text-xs">{record.maintenance_type}</Badge></td>
                                    <td className="py-2 px-3 text-right font-semibold text-primary">₹{record.amount.toLocaleString()}</td>
                                    <td className="py-2 px-3 text-right">{record.km_at_maintenance?.toLocaleString() || '-'}</td>
                                    <td className="py-2 px-3 text-right">{record.next_oil_change_km?.toLocaleString() || '-'}</td>
                                    <td className="py-2 px-3 text-muted-foreground text-xs max-w-[200px] truncate" title={record.description || ''}>{record.description || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="border-t-2 bg-muted/30 font-bold">
                                  <td className="py-2 px-3" colSpan={2}>Total</td>
                                  <td className="py-2 px-3 text-right text-primary">₹{vehicle.totalSpent.toLocaleString()}</td>
                                  <td colSpan={3}></td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* EMI Tracking Sub-Tab */}
        <TabsContent value="emi">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Car EMI Tracking
              </h2>
              <Button size="sm" onClick={() => { resetEmiForm(); setShowEmiForm(true); }}>
                <Plus className="h-4 w-4 mr-1" />Add EMI
              </Button>
            </div>

            {/* EMI Form */}
            {showEmiForm && (
              <Card className="shadow-md border-primary/20">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Vehicle Number *</Label>
                      <Input value={emiVehicle} onChange={e => setEmiVehicle(e.target.value)} placeholder="e.g. MH12AB1234" />
                    </div>
                    <div className="space-y-2">
                      <Label>EMI Amount (₹) *</Label>
                      <Input type="number" value={emiAmount} onChange={e => setEmiAmount(e.target.value)} placeholder="0" />
                    </div>
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input type="date" value={emiStartDate} onChange={e => setEmiStartDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input type="date" value={emiEndDate} onChange={e => setEmiEndDate(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={handleEmiSubmit}>{editingEmiId ? 'Update' : 'Save'} EMI</Button>
                    <Button variant="outline" onClick={resetEmiForm}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* EMI Cards */}
            {emiRecords.length === 0 ? (
              <Card className="shadow-md border-primary/20">
                <CardContent className="py-8 text-center text-muted-foreground">
                  <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No EMI records yet. Click "Add EMI" to start tracking.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {emiRecords.map(emi => {
                  const status = getEmiStatus(emi);
                  return (
                    <Card key={emi.id} className={`shadow-md border-primary/20 ${status.isCompleted ? 'border-green-500/50' : ''}`}>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center justify-between text-base">
                          <span className="flex items-center gap-2 text-primary">
                            <Car className="h-4 w-4" />
                            {emi.vehicle_number}
                          </span>
                          <div className="flex items-center gap-1">
                            {status.isCompleted ? (
                              <Badge className="bg-green-600 text-white text-xs">Completed</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Active</Badge>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => handleEditEmi(emi)}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete EMI Record?</AlertDialogTitle>
                                  <AlertDialogDescription>This will permanently delete this EMI tracking record.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteEmi(emi.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-2 bg-muted/30 rounded-lg text-center">
                            <p className="text-xs text-muted-foreground">Monthly EMI</p>
                            <p className="font-bold text-sm text-primary">₹{emi.emi_amount.toLocaleString()}</p>
                          </div>
                          <div className="p-2 bg-muted/30 rounded-lg text-center">
                            <p className="text-xs text-muted-foreground">EMI Date</p>
                            <p className="font-bold text-sm">{emi.emi_day}th of month</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-xs text-muted-foreground">Total</p>
                            <p className="font-semibold text-xs">{status.totalMonths} months</p>
                            <p className="text-xs text-muted-foreground">₹{status.totalAmount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Paid</p>
                            <p className="font-semibold text-xs text-green-600">{status.paidMonths} months</p>
                            <p className="text-xs text-green-600">₹{status.paidAmount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Remaining</p>
                            <p className="font-semibold text-xs text-orange-600">{status.remainingMonths} months</p>
                            <p className="text-xs text-orange-600">₹{(status.totalAmount - status.paidAmount).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{format(new Date(emi.start_date), 'dd MMM yyyy')}</span>
                            <span>{format(new Date(emi.end_date), 'dd MMM yyyy')}</span>
                          </div>
                          <Progress value={status.progress} className="h-2" />
                          <p className="text-xs text-center font-medium">{Math.round(status.progress)}% completed</p>
                        </div>
                        {status.nextEmiDate && (
                          <div className="p-2 bg-primary/10 rounded-lg text-center">
                            <p className="text-xs text-muted-foreground">Next EMI Due</p>
                            <p className="font-bold text-sm text-primary">{format(status.nextEmiDate, 'dd MMM yyyy')}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Alignment Tracking Sub-Tab */}
        <TabsContent value="alignment">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
                <AlignCenter className="h-5 w-5" />
                Wheel Alignment Tracking
              </h2>
              <Button size="sm" onClick={() => { resetAlignmentForm(); setShowAlignmentForm(true); }}>
                <Plus className="h-4 w-4 mr-1" />Add Alignment
              </Button>
            </div>

            {/* Alignment Form */}
            {showAlignmentForm && (
              <Card className="shadow-md border-primary/20">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Vehicle Number *</Label>
                      <Input value={alignVehicle} onChange={e => setAlignVehicle(e.target.value)} placeholder="e.g. MH12AB1234" />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Alignment KM *</Label>
                      <Input type="number" value={alignLastKm} onChange={e => setAlignLastKm(e.target.value)} placeholder="0" />
                    </div>
                    <div className="space-y-2">
                      <Label>Interval KM</Label>
                      <Input type="number" value={alignInterval} onChange={e => setAlignInterval(e.target.value)} placeholder="10000" />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Alignment Date</Label>
                      <Input type="date" value={alignLastDate} onChange={e => setAlignLastDate(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={handleAlignmentSubmit}>{editingAlignId ? 'Update' : 'Save'} Alignment</Button>
                    <Button variant="outline" onClick={resetAlignmentForm}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Alignment Cards */}
            {alignmentRecords.length === 0 ? (
              <Card className="shadow-md border-primary/20">
                <CardContent className="py-8 text-center text-muted-foreground">
                  <AlignCenter className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No alignment records yet. Click "Add Alignment" to start tracking.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {alignmentRecords.map(a => {
                  const currentKm = getLatestKmForVehicle(a.vehicle_number);
                  const status = getAlignmentStatus(a, currentKm);
                  return (
                    <Card key={a.id} className={`shadow-md border-primary/20 ${status?.status === 'overdue' ? 'border-destructive/50' : status?.status === 'due-soon' ? 'border-orange-400/50' : ''}`}>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center justify-between text-base">
                          <span className="flex items-center gap-2 text-primary">
                            <Car className="h-4 w-4" />
                            {a.vehicle_number}
                          </span>
                          <div className="flex items-center gap-1">
                            {status?.status === 'overdue' && <Badge variant="destructive" className="text-xs animate-pulse">Overdue</Badge>}
                            {status?.status === 'due-soon' && <Badge className="bg-orange-500 text-white text-xs">Due Soon</Badge>}
                            {status?.status === 'ok' && <Badge className="bg-green-600 text-white text-xs">OK</Badge>}
                            <Button variant="ghost" size="sm" onClick={() => handleEditAlignment(a)}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Alignment Record?</AlertDialogTitle>
                                  <AlertDialogDescription>This will permanently delete this alignment tracking record.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteAlignment(a.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-2 bg-muted/30 rounded-lg text-center">
                            <p className="text-xs text-muted-foreground">Last Alignment</p>
                            <p className="font-bold text-sm">{a.last_alignment_km.toLocaleString()} km</p>
                          </div>
                          <div className="p-2 bg-muted/30 rounded-lg text-center">
                            <p className="text-xs text-muted-foreground">Interval</p>
                            <p className="font-bold text-sm">{a.alignment_interval_km.toLocaleString()} km</p>
                          </div>
                        </div>
                        {a.last_alignment_date && (
                          <p className="text-xs text-muted-foreground text-center">
                            Last done: {format(new Date(a.last_alignment_date), 'dd MMM yyyy')}
                          </p>
                        )}
                        {status ? (
                          <div className="space-y-1">
                            <Progress value={status.progress} className="h-2" />
                            <p className={`text-xs font-medium text-center ${status.color}`}>
                              {status.remaining <= 0 ? `Overdue by ${Math.abs(status.remaining).toLocaleString()} km` : `${status.remaining.toLocaleString()} km remaining`}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground text-center">
                            Add KM data in maintenance to enable tracking
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

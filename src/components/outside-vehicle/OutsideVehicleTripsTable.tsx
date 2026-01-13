import { useState, useMemo } from 'react';
import { Pencil, Trash2, Download, Phone, PhoneOff } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { OutsideVehicleTripForm } from './OutsideVehicleTripForm';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface OutsideVehicleTrip {
  id: string;
  date: string;
  driver_name: string;
  driver_number: string;
  travel_company: string;
  vehicle_type: string;
  from_location: string;
  to_location: string;
  vehicle_number: string;
  trip_given_company: string;
  payment_mode: string;
  payment_status: string;
  trip_amount: number;
}

interface OutsideVehicleTripsTableProps {
  trips: OutsideVehicleTrip[];
  onTripUpdated: () => void;
  canEdit: boolean;
}

export function OutsideVehicleTripsTable({ trips, onTripUpdated, canEdit }: OutsideVehicleTripsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [editingTrip, setEditingTrip] = useState<OutsideVehicleTrip | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showPhoneNumbers, setShowPhoneNumbers] = useState(false);

  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      const matchesSearch =
        trip.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.travel_company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.from_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.to_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.trip_given_company.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPayment = paymentFilter === 'all' || trip.payment_status === paymentFilter;

      return matchesSearch && matchesPayment;
    });
  }, [trips, searchTerm, paymentFilter]);

  const filteredTotals = useMemo(() => {
    return {
      tripAmount: filteredTrips.reduce((sum, t) => sum + t.trip_amount, 0),
    };
  }, [filteredTrips]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
      paid: 'default',
      pending: 'destructive',
    };
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this trip?')) return;

    try {
      const { error } = await supabase.from('outside_vehicle_trips').delete().eq('id', id);
      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Trip deleted successfully',
      });
      onTripUpdated();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete trip',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (trip: OutsideVehicleTrip) => {
    setEditingTrip(trip);
    setIsEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    setEditingTrip(null);
    onTripUpdated();
  };

  const exportToExcel = () => {
    const exportData = filteredTrips.map((trip) => ({
      Date: format(parseISO(trip.date), 'dd/MM/yyyy'),
      'Driver Name': trip.driver_name,
      'Driver Number': trip.driver_number,
      'Travel Company': trip.travel_company,
      'Vehicle Type': trip.vehicle_type,
      From: trip.from_location,
      To: trip.to_location,
      'Vehicle Number': trip.vehicle_number,
      'Trip Given Company': trip.trip_given_company,
      'Payment Mode': trip.payment_mode,
      'Payment Status': trip.payment_status,
      'Trip Amount': trip.trip_amount,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Outside Vehicle Trips');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `outside_vehicle_trips_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const updatePaymentStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('outside_vehicle_trips')
        .update({ payment_status: newStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Payment status updated',
      });
      onTripUpdated();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update payment status',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="border-primary/20 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="text-primary">Outside Vehicle Trips ({filteredTrips.length})</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Search trips..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-48"
            />
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-50">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => setShowPhoneNumbers(!showPhoneNumbers)}>
              {showPhoneNumbers ? <PhoneOff className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
            </Button>
            <Button onClick={exportToExcel} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 overflow-x-auto">
        {filteredTrips.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No outside vehicle trips found</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Date</TableHead>
                <TableHead>Driver</TableHead>
                {showPhoneNumbers && <TableHead>Phone</TableHead>}
                <TableHead>Travel Company</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Vehicle No.</TableHead>
                <TableHead>Given By</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                {canEdit && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Totals Row */}
              <TableRow className="bg-primary/10 font-bold">
                <TableCell colSpan={showPhoneNumbers ? 9 : 8}>Totals</TableCell>
                <TableCell></TableCell>
                <TableCell className="text-right">{formatCurrency(filteredTotals.tripAmount)}</TableCell>
                {canEdit && <TableCell></TableCell>}
              </TableRow>

              {filteredTrips.map((trip) => (
                <TableRow key={trip.id} className="hover:bg-muted/30">
                  <TableCell>{format(parseISO(trip.date), 'dd MMM yyyy')}</TableCell>
                  <TableCell className="font-medium">{trip.driver_name}</TableCell>
                  {showPhoneNumbers && <TableCell>{trip.driver_number}</TableCell>}
                  <TableCell>{trip.travel_company}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{trip.vehicle_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs">
                      {trip.from_location} → {trip.to_location}
                    </span>
                  </TableCell>
                  <TableCell>{trip.vehicle_number}</TableCell>
                  <TableCell>{trip.trip_given_company}</TableCell>
                  <TableCell>{trip.payment_mode}</TableCell>
                  <TableCell>
                    {canEdit ? (
                      <Select
                        value={trip.payment_status}
                        onValueChange={(value) => updatePaymentStatus(trip.id, value)}
                      >
                        <SelectTrigger className="w-24 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg z-50">
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      getStatusBadge(trip.payment_status)
                    )}
                  </TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(trip.trip_amount)}</TableCell>
                  {canEdit && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(trip)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(trip.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Outside Vehicle Trip</DialogTitle>
          </DialogHeader>
          {editingTrip && <OutsideVehicleTripForm editData={editingTrip} onSuccess={handleEditSuccess} />}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

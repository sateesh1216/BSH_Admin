import { useState, useMemo } from 'react';
import { Edit, Trash2, Search, Download, FileText, Receipt, Eye, EyeOff, AlertCircle, Clock } from 'lucide-react';
import { isAfter, startOfDay, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TripForm } from './TripForm';
import { InvoiceModal } from '../invoice/InvoiceModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface Trip {
  id: string;
  date: string;
  driver_name: string;
  driver_number: string;
  customer_name: string;
  customer_number: string;
  from_location: string;
  to_location: string;
  company: string;
  fuel_type: string;
  payment_mode: string;
  payment_status: string;
  driver_amount: number;
  commission: number;
  fuel_amount: number;
  tolls: number;
  trip_amount: number;
  profit: number;
}

interface TripsTableProps {
  trips: Trip[];
  onTripUpdated: () => void;
  canEdit: boolean;
  allPendingTotal?: number;
}

export const TripsTable = ({ trips, onTripUpdated, canEdit, allPendingTotal }: TripsTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [invoiceTrip, setInvoiceTrip] = useState<Trip | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceWithGST, setInvoiceWithGST] = useState(false);
  const [showPhoneNumbers, setShowPhoneNumbers] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  const filteredTrips = useMemo(() => {
    return trips.filter(trip => {
      const matchesSearch = 
        trip.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.from_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.to_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.company?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPayment = paymentFilter === 'all' || trip.payment_status === paymentFilter;
      
      return matchesSearch && matchesPayment;
    });
  }, [trips, searchTerm, paymentFilter]);

  // Calculate totals for filtered trips
  const filteredTotals = useMemo(() => {
    return {
      driver_amount: filteredTrips.reduce((sum, t) => sum + (t.driver_amount || 0), 0),
      commission: filteredTrips.reduce((sum, t) => sum + (t.commission || 0), 0),
      tolls: filteredTrips.reduce((sum, t) => sum + (t.tolls || 0), 0),
      fuel_amount: filteredTrips.reduce((sum, t) => sum + (t.fuel_amount || 0), 0),
      trip_amount: filteredTrips.reduce((sum, t) => sum + (t.trip_amount || 0), 0),
      profit: filteredTrips.reduce((sum, t) => sum + (t.profit || 0), 0),
    };
  }, [filteredTrips]);

  // Calculate local pending total from current trips (for fallback)
  const localPendingTotal = useMemo(() => {
    return trips
      .filter(t => t.payment_status === 'pending')
      .reduce((sum, t) => sum + (t.trip_amount || 0), 0);
  }, [trips]);

  // Use allPendingTotal from parent if provided (shows total across all dates), 
  // otherwise use local calculation
  const pendingTotal = allPendingTotal ?? localPendingTotal;

  const updatePaymentStatus = async (tripId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('trips')
        .update({ payment_status: status })
        .eq('id', tripId);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Success", description: "Payment status updated" });
      onTripUpdated();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'paid') {
      return <Badge className="bg-green-500 hover:bg-green-600">Paid</Badge>;
    }
    return <Badge className="bg-red-500 hover:bg-red-600">Pending</Badge>;
  };

  const isUpcomingTrip = (tripDate: string) => {
    const today = startOfDay(new Date());
    const tripDay = startOfDay(parseISO(tripDate));
    return isAfter(tripDay, today);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('trips')
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
        description: "Trip deleted successfully",
      });
      onTripUpdated();
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (trip: Trip) => {
    setEditingTrip(trip);
    setIsEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    setEditingTrip(null);
    onTripUpdated();
  };

  const handleInvoice = (trip: Trip, withGST: boolean = false) => {
    setInvoiceTrip(trip);
    setInvoiceWithGST(withGST);
    setIsInvoiceModalOpen(true);
  };

  const exportToExcel = () => {
    const exportData = filteredTrips.map((trip, index) => ({
      'S.No': index + 1,
      'Date': new Date(trip.date).toLocaleDateString(),
      'Driver': trip.driver_name,
      'Route': `${trip.from_location} → ${trip.to_location}`,
      'Company': trip.company || '',
      'Driver Amount (₹)': trip.driver_amount,
      'Commission (₹)': trip.commission,
      'Fuel Type': trip.fuel_type,
      'Payment Mode': trip.payment_mode,
      'Payment Status': trip.payment_status || 'pending',
      'Fuel (₹)': trip.fuel_amount,
      'Tolls (₹)': trip.tolls,
      'Trip Amount (₹)': trip.trip_amount,
      'Profit (₹)': trip.profit,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Trips');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, `trips_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({
      title: "Success",
      description: "Trips data exported to Excel successfully",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-primary">Trips Management</CardTitle>
          {pendingTotal > 0 && (
            <button
              onClick={() => setPaymentFilter("pending")}
              className="flex items-center gap-2 text-base font-extrabold text-white bg-gradient-to-r from-red-600 via-red-500 to-orange-500 px-5 py-3 rounded-xl shadow-xl ring-2 ring-red-300 animate-pulse hover:scale-105 transition-transform cursor-pointer"
            >
              <AlertCircle className="h-6 w-6 animate-bounce" />
              <span className="text-lg">Pending Bills: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(pendingTotal)}</span>
            </button>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search trips..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Payment Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportToExcel} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button 
            onClick={() => setShowPhoneNumbers(!showPhoneNumbers)} 
            variant="outline"
            className="flex items-center gap-2"
          >
            {showPhoneNumbers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPhoneNumbers ? 'Hide' : 'Show'} No.
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S.No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Driver</TableHead>
                {showPhoneNumbers && <TableHead>Driver No.</TableHead>}
                <TableHead>Customer</TableHead>
                {showPhoneNumbers && <TableHead>Customer No.</TableHead>}
                <TableHead>Route</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Driver ₹</TableHead>
                <TableHead>Commission ₹</TableHead>
                <TableHead>Tolls ₹</TableHead>
                <TableHead>Fuel ₹</TableHead>
                <TableHead>Trip ₹</TableHead>
                <TableHead>Profit ₹</TableHead>
                <TableHead>Status</TableHead>
                {canEdit && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Totals Row at Top */}
              {filteredTrips.length > 0 && (
                <TableRow className="bg-muted/50 font-bold border-b-2 border-primary">
                  <TableCell colSpan={showPhoneNumbers ? 8 : 6} className="text-right text-primary">
                    Total ({filteredTrips.length} trips):
                  </TableCell>
                  <TableCell className="text-primary">{formatCurrency(filteredTotals.driver_amount)}</TableCell>
                  <TableCell className="text-primary">{formatCurrency(filteredTotals.commission)}</TableCell>
                  <TableCell className="text-primary">{formatCurrency(filteredTotals.tolls)}</TableCell>
                  <TableCell className="text-primary">{formatCurrency(filteredTotals.fuel_amount)}</TableCell>
                  <TableCell className="text-primary">{formatCurrency(filteredTotals.trip_amount)}</TableCell>
                  <TableCell className={filteredTotals.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(filteredTotals.profit)}
                  </TableCell>
                  <TableCell></TableCell>
                  {canEdit && <TableCell></TableCell>}
                </TableRow>
              )}
              {filteredTrips.map((trip, index) => {
                const upcoming = isUpcomingTrip(trip.date);
                return (
                <TableRow 
                  key={trip.id}
                  className={upcoming ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-l-4 border-l-orange-500' : ''}
                >
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {upcoming && (
                        <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white animate-pulse flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Upcoming
                        </Badge>
                      )}
                      <span className={upcoming ? 'font-semibold text-orange-700 dark:text-orange-400' : ''}>
                        {new Date(trip.date).toLocaleDateString()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{trip.driver_name}</TableCell>
                  {showPhoneNumbers && <TableCell className="font-mono text-sm whitespace-nowrap">{trip.driver_number}</TableCell>}
                  <TableCell>{trip.customer_name}</TableCell>
                  {showPhoneNumbers && <TableCell className="font-mono text-sm whitespace-nowrap">{trip.customer_number}</TableCell>}
                  <TableCell>{trip.from_location} → {trip.to_location}</TableCell>
                  <TableCell>{trip.company || '-'}</TableCell>
                  <TableCell>{formatCurrency(trip.driver_amount)}</TableCell>
                  <TableCell>{formatCurrency(trip.commission)}</TableCell>
                  <TableCell>{formatCurrency(trip.tolls)}</TableCell>
                  <TableCell>{formatCurrency(trip.fuel_amount)}</TableCell>
                  <TableCell>{formatCurrency(trip.trip_amount)}</TableCell>
                  <TableCell className={trip.profit >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                    {formatCurrency(trip.profit)}
                  </TableCell>
                  <TableCell>
                    {canEdit ? (
                      <Select 
                        value={trip.payment_status || 'pending'} 
                        onValueChange={(val) => updatePaymentStatus(trip.id, val)}
                      >
                        <SelectTrigger className="w-[100px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      getStatusBadge(trip.payment_status || 'pending')
                    )}
                  </TableCell>
                  {canEdit && (
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(trip)}
                          title="Edit Trip"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleInvoice(trip, false)}
                          title="Send Invoice (No GST)"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleInvoice(trip, true)}
                          title="Send Invoice (With GST)"
                          className="text-green-600 hover:text-green-700"
                        >
                          <Receipt className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" title="Delete Trip">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete this trip record.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(trip.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {filteredTrips.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No trips found. {searchTerm && `Try adjusting your search term "${searchTerm}".`}
          </div>
        )}

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Trip</DialogTitle>
            </DialogHeader>
            {editingTrip && (
              <TripForm
                editData={editingTrip}
                onSuccess={handleEditSuccess}
              />
            )}
          </DialogContent>
        </Dialog>

        <InvoiceModal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          trip={invoiceTrip}
          withGST={invoiceWithGST}
        />
      </CardContent>
    </Card>
  );
};
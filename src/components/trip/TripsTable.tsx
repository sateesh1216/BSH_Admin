import { useState, useMemo } from 'react';
import { Pencil, Trash2, Download, FileText, Receipt, Phone, PhoneOff, AlertCircle, Clock } from 'lucide-react';
import { isAfter, startOfDay, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
    <Card className="border-primary/20 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <CardTitle className="text-primary">Trips Management ({filteredTrips.length})</CardTitle>
            {pendingTotal > 0 && (
              <button
                onClick={() => setPaymentFilter("pending")}
                className="flex items-center gap-2 text-sm font-bold text-white bg-gradient-to-r from-red-600 via-red-500 to-orange-500 px-3 py-2 rounded-lg shadow-lg animate-pulse hover:scale-105 transition-transform cursor-pointer"
              >
                <AlertCircle className="h-4 w-4" />
                <span>Pending: {formatCurrency(pendingTotal)}</span>
              </button>
            )}
          </div>
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
          <p className="text-center text-muted-foreground py-8">
            No trips found. {searchTerm && `Try adjusting your search term "${searchTerm}".`}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Date</TableHead>
                <TableHead>Driver</TableHead>
                {showPhoneNumbers && <TableHead>Phone</TableHead>}
                <TableHead>Customer</TableHead>
                {showPhoneNumbers && <TableHead>Phone</TableHead>}
                <TableHead>Route</TableHead>
                <TableHead>Company</TableHead>
                <TableHead className="text-right">Driver ₹</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead className="text-right">Tolls</TableHead>
                <TableHead className="text-right">Fuel</TableHead>
                <TableHead className="text-right">Trip ₹</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead>Status</TableHead>
                {canEdit && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Totals Row */}
              <TableRow className="bg-primary/10 font-bold">
                <TableCell colSpan={showPhoneNumbers ? 6 : 4}>Totals</TableCell>
                <TableCell></TableCell>
                <TableCell className="text-right">{formatCurrency(filteredTotals.driver_amount)}</TableCell>
                <TableCell className="text-right">{formatCurrency(filteredTotals.commission)}</TableCell>
                <TableCell className="text-right">{formatCurrency(filteredTotals.tolls)}</TableCell>
                <TableCell className="text-right">{formatCurrency(filteredTotals.fuel_amount)}</TableCell>
                <TableCell className="text-right">{formatCurrency(filteredTotals.trip_amount)}</TableCell>
                <TableCell className={`text-right ${filteredTotals.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(filteredTotals.profit)}
                </TableCell>
                <TableCell></TableCell>
                {canEdit && <TableCell></TableCell>}
              </TableRow>
              {filteredTrips.map((trip) => {
                const upcoming = isUpcomingTrip(trip.date);
                return (
                  <TableRow 
                    key={trip.id}
                    className={upcoming ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-l-4 border-l-orange-500 hover:bg-muted/30' : 'hover:bg-muted/30'}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {upcoming && (
                          <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white animate-pulse flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Upcoming
                          </Badge>
                        )}
                        <span className={upcoming ? 'font-semibold text-orange-700 dark:text-orange-400' : ''}>
                          {new Date(trip.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{trip.driver_name}</TableCell>
                    {showPhoneNumbers && <TableCell>{trip.driver_number}</TableCell>}
                    <TableCell>{trip.customer_name}</TableCell>
                    {showPhoneNumbers && <TableCell>{trip.customer_number}</TableCell>}
                    <TableCell>
                      <span className="text-xs">{trip.from_location} → {trip.to_location}</span>
                    </TableCell>
                    <TableCell>{trip.company || '-'}</TableCell>
                    <TableCell className="text-right">{formatCurrency(trip.driver_amount)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(trip.commission)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(trip.tolls)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(trip.fuel_amount)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(trip.trip_amount)}</TableCell>
                    <TableCell className={`text-right font-semibold ${trip.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(trip.profit)}
                    </TableCell>
                    <TableCell>
                      {canEdit ? (
                        <Select 
                          value={trip.payment_status || 'pending'} 
                          onValueChange={(val) => updatePaymentStatus(trip.id, val)}
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
                        getStatusBadge(trip.payment_status || 'pending')
                      )}
                    </TableCell>
                    {canEdit && (
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(trip)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleInvoice(trip, false)}
                            title="Invoice (No GST)"
                          >
                            <FileText className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleInvoice(trip, true)}
                            title="Invoice (With GST)"
                          >
                            <Receipt className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(trip.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
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
import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash2, Search, Receipt, AlertCircle, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { TripForm } from './TripForm';
import { InvoiceModal } from '@/components/invoice/InvoiceModal';

interface Trip {
  id: string;
  date: string;
  customer_name: string;
  customer_number: string;
  driver_name: string;
  driver_number: string;
  from_location: string;
  to_location: string;
  trip_amount: number;
  driver_amount: number;
  fuel_amount: number;
  fuel_type: string;
  tolls: number;
  commission: number;
  payment_mode: string;
  payment_status: string;
  profit: number | null;
  company: string | null;
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

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payment status updated",
      });
      onTripUpdated();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (tripId: string) => {
    if (!confirm('Are you sure you want to delete this trip?')) return;

    try {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Trip deleted successfully",
      });
      onTripUpdated();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
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

  const handleGenerateInvoice = (trip: Trip) => {
    setInvoiceTrip(trip);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleClearFilter = () => {
    setPaymentFilter('all');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search trips..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-[300px]"
            />
          </div>
          {pendingTotal > 0 && (
            <button
              onClick={() => setPaymentFilter("pending")}
              className="flex items-center gap-2 text-base font-extrabold text-white bg-gradient-to-r from-red-600 via-red-500 to-orange-500 px-5 py-3 rounded-xl shadow-xl ring-2 ring-red-300 animate-pulse hover:scale-105 transition-transform cursor-pointer"
            >
              <AlertCircle className="h-6 w-6 animate-bounce" />
              <span className="text-lg">Pending Bills: {formatCurrency(pendingTotal)}</span>
            </button>
          )}
          {paymentFilter !== 'all' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilter}
              className="flex items-center gap-2 bg-background border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground font-semibold"
            >
              <X className="h-4 w-4" />
              Show All Trips
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
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
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Trip Amount</TableHead>
              <TableHead>Driver Amount</TableHead>
              <TableHead>Fuel</TableHead>
              <TableHead>Tolls</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Profit</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              {canEdit && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTrips.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canEdit ? 14 : 13} className="text-center py-8 text-muted-foreground">
                  No trips found
                </TableCell>
              </TableRow>
            ) : (
              filteredTrips.map((trip) => (
                <TableRow key={trip.id}>
                  <TableCell>{format(new Date(trip.date), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>{trip.company || '-'}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{trip.customer_name}</div>
                      <div className="text-sm text-muted-foreground">{trip.customer_number}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{trip.driver_name}</div>
                      <div className="text-sm text-muted-foreground">{trip.driver_number}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{trip.from_location}</div>
                      <div className="text-muted-foreground">→ {trip.to_location}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{formatCurrency(trip.trip_amount)}</TableCell>
                  <TableCell>{formatCurrency(trip.driver_amount)}</TableCell>
                  <TableCell>
                    <div>
                      <div>{formatCurrency(trip.fuel_amount)}</div>
                      <div className="text-xs text-muted-foreground">{trip.fuel_type}</div>
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(trip.tolls)}</TableCell>
                  <TableCell>{formatCurrency(trip.commission)}</TableCell>
                  <TableCell className={trip.profit && trip.profit >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                    {formatCurrency(trip.profit || 0)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{trip.payment_mode}</Badge>
                  </TableCell>
                  <TableCell>
                    {canEdit ? (
                      <Select
                        value={trip.payment_status}
                        onValueChange={(value) => updatePaymentStatus(trip.id, value)}
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant={trip.payment_status === 'paid' ? 'default' : 'destructive'}>
                        {trip.payment_status}
                      </Badge>
                    )}
                  </TableCell>
                  {canEdit && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleGenerateInvoice(trip)}
                          title="Generate Invoice"
                        >
                          <Receipt className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(trip)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(trip.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Trip</DialogTitle>
          </DialogHeader>
          {editingTrip && (
            <TripForm 
              onSuccess={handleEditSuccess} 
              editData={editingTrip}
            />
          )}
        </DialogContent>
      </Dialog>

      {invoiceTrip && (
        <InvoiceModal
          trip={invoiceTrip}
          isOpen={!!invoiceTrip}
          onClose={() => setInvoiceTrip(null)}
          withGST={false}
        />
      )}
    </div>
  );
};

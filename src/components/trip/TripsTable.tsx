import { useState } from 'react';
import { Edit, Trash2, Search, Download, FileText, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { TripForm } from './TripForm';
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
}

export const TripsTable = ({ trips, onTripUpdated, canEdit }: TripsTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const filteredTrips = trips.filter(trip =>
    trip.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.from_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.to_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const handleInvoice = async (trip: Trip, withGST: boolean = false) => {
    try {
      // Simulate sending invoice
      const invoiceType = withGST ? 'with GST' : 'without GST';
      
      // Send WhatsApp messages (simulate for now)
      const driverMessage = `Invoice sent: Customer: ${trip.customer_name} (${trip.customer_number}), Route: ${trip.from_location} → ${trip.to_location}, Amount: ₹${trip.trip_amount} (${invoiceType})`;
      const customerMessage = `Invoice received: Driver: ${trip.driver_name} (${trip.driver_number}), Route: ${trip.from_location} → ${trip.to_location}, Amount: ₹${trip.trip_amount} (${invoiceType})`;
      
      console.log('WhatsApp to Driver:', driverMessage);
      console.log('WhatsApp to Customer:', customerMessage);

      toast({
        title: "Success",
        description: `Invoice ${invoiceType} sent successfully!`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send invoice",
        variant: "destructive",
      });
    }
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
        <CardTitle className="text-primary">Trips Management</CardTitle>
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
          <Button onClick={exportToExcel} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export to Excel
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
                <TableHead>Route</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Driver ₹</TableHead>
                <TableHead>Commission ₹</TableHead>
                <TableHead>Fuel Type</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Fuel ₹</TableHead>
                <TableHead>Tolls ₹</TableHead>
                <TableHead>Trip ₹</TableHead>
                <TableHead>Profit ₹</TableHead>
                {canEdit && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrips.map((trip, index) => (
                <TableRow key={trip.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{new Date(trip.date).toLocaleDateString()}</TableCell>
                  <TableCell>{trip.driver_name}</TableCell>
                  <TableCell>{trip.from_location} → {trip.to_location}</TableCell>
                  <TableCell>{trip.company || '-'}</TableCell>
                  <TableCell>{formatCurrency(trip.driver_amount)}</TableCell>
                  <TableCell>{formatCurrency(trip.commission)}</TableCell>
                  <TableCell>{trip.fuel_type}</TableCell>
                  <TableCell>{trip.payment_mode}</TableCell>
                  <TableCell>{formatCurrency(trip.fuel_amount)}</TableCell>
                  <TableCell>{formatCurrency(trip.tolls)}</TableCell>
                  <TableCell>{formatCurrency(trip.trip_amount)}</TableCell>
                  <TableCell className={trip.profit >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                    {formatCurrency(trip.profit)}
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
              ))}
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
      </CardContent>
    </Card>
  );
};
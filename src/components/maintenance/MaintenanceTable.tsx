import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Edit, Trash2, Wrench, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { MaintenanceForm } from './MaintenanceForm';
import { supabase } from '@/integrations/supabase/client';
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

interface MaintenanceTableProps {
  maintenance: Maintenance[];
  onMaintenanceUpdated: () => void;
  canEdit: boolean;
}

export const MaintenanceTable = ({ maintenance, onMaintenanceUpdated, canEdit }: MaintenanceTableProps) => {
  const [loading, setLoading] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Maintenance | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState<string[]>([]);

  const totalExpenses = maintenance.reduce((sum, record) => sum + record.amount, 0);

  // Group maintenance records by month
  const groupedByMonth = useMemo(() => {
    const groups: { [key: string]: { records: Maintenance[]; total: number } } = {};
    
    maintenance.forEach(record => {
      const monthKey = format(new Date(record.date), 'MMMM yyyy');
      if (!groups[monthKey]) {
        groups[monthKey] = { records: [], total: 0 };
      }
      groups[monthKey].records.push(record);
      groups[monthKey].total += record.amount;
    });

    // Sort months in descending order (most recent first)
    const sortedGroups = Object.entries(groups).sort((a, b) => {
      const dateA = new Date(a[1].records[0].date);
      const dateB = new Date(b[1].records[0].date);
      return dateB.getTime() - dateA.getTime();
    });

    return sortedGroups;
  }, [maintenance]);

  const toggleMonth = (month: string) => {
    setExpandedMonths(prev => 
      prev.includes(month) 
        ? prev.filter(m => m !== month)
        : [...prev, month]
    );
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
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
      onMaintenanceUpdated();
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record: Maintenance) => {
    setEditingRecord(record);
    setIsEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    setEditingRecord(null);
    onMaintenanceUpdated();
  };

  if (maintenance.length === 0) {
    return (
      <Card className="shadow-lg border-primary/20">
        <CardContent className="py-12">
          <div className="text-center">
            <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No maintenance records found</h3>
            <p className="text-sm text-muted-foreground">
              No maintenance records match your current filter criteria.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-lg border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-primary">
              <Wrench className="h-5 w-5" />
              Maintenance Records
            </span>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                ₹{totalExpenses.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                {maintenance.length} record{maintenance.length !== 1 ? 's' : ''}
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-2 p-4">
            {groupedByMonth.map(([month, { records, total }]) => (
              <Collapsible
                key={month}
                open={expandedMonths.includes(month)}
                onOpenChange={() => toggleMonth(month)}
              >
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      {expandedMonths.includes(month) ? (
                        <ChevronDown className="h-5 w-5 text-primary" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-primary" />
                      )}
                      <span className="font-semibold text-lg">{month}</span>
                      <span className="text-muted-foreground">
                        ({records.length} record{records.length !== 1 ? 's' : ''})
                      </span>
                    </div>
                    <span className="font-bold text-primary text-lg">
                      ₹{total.toLocaleString()}
                    </span>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="overflow-x-auto mt-2">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/20">
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Date</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Vehicle</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Driver</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Type</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Amount</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Payment</th>
                          {canEdit && <th className="text-left py-3 px-4 font-semibold text-foreground">Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {records.map((record, index) => (
                          <tr 
                            key={record.id} 
                            className={`border-b hover:bg-accent/20 transition-colors ${
                              index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                            }`}
                          >
                            <td className="py-3 px-4 font-medium">
                              {format(new Date(record.date), 'dd/MM/yyyy')}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-medium">{record.vehicle_number}</div>
                              {record.company && (
                                <div className="text-sm text-muted-foreground">{record.company}</div>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-medium">{record.driver_name}</div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                {record.maintenance_type}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-primary">
                                ₹{record.amount.toLocaleString()}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-sm">{record.payment_mode}</div>
                            </td>
                            {canEdit && (
                              <td className="py-3 px-4">
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEdit(record)}
                                    className="hover:bg-primary hover:text-primary-foreground"
                                    title="Edit Maintenance"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="hover:bg-destructive hover:text-destructive-foreground"
                                        title="Delete Maintenance"
                                        disabled={loading}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Maintenance Record</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete this maintenance record for {record.vehicle_number}? 
                                          This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDelete(record.id)}
                                          className="bg-destructive hover:bg-destructive/90"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Maintenance Record</DialogTitle>
          </DialogHeader>
          {editingRecord && (
            <MaintenanceForm
              editData={editingRecord}
              onSuccess={handleEditSuccess}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

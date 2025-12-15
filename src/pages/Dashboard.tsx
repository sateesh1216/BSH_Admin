import { useState, useEffect, useCallback, useMemo } from 'react';
import { LogOut, Car, Wrench, Upload, BarChart3, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardSummary } from '@/components/dashboard/DashboardSummary';
import { TripForm } from '@/components/trip/TripForm';
import { TripsTable } from '@/components/trip/TripsTable';
import { FileUpload } from '@/components/upload/FileUpload';
import { MonthlyReports } from '@/components/reports/MonthlyReports';
import { ExpensesReports } from '@/components/reports/ExpensesReports';
import { MaintenanceForm } from '@/components/maintenance/MaintenanceForm';
import { MaintenanceTable } from '@/components/maintenance/MaintenanceTable';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loading } from '@/components/ui/loading';

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

export const Dashboard = () => {
  const { user, userRole, signOut } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('trips');
  const [showTripForm, setShowTripForm] = useState(false);
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);

  const isAdmin = userRole === 'admin';

  const fetchTrips = useCallback(async () => {
    try {
      let query = supabase.from('trips_secure').select('*');
      
      if (!isAdmin && user) {
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

      setTrips(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch trips",
        variant: "destructive",
      });
    }
  }, [isAdmin, user]);

  const fetchMaintenance = useCallback(async () => {
    try {
      let query = supabase.from('maintenance_secure').select('*');
      
      if (!isAdmin && user) {
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

      setMaintenance(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch maintenance records",
        variant: "destructive",
      });
    }
  }, [isAdmin, user]);

  // Fetch data only once on mount - no auto-refresh
  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        setLoading(true);
        try {
          await Promise.all([fetchTrips(), fetchMaintenance()]);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [user]); // Removed fetchTrips and fetchMaintenance from dependencies to prevent auto-refresh

  const calculateSummary = useMemo(() => {
    const totalTrips = trips.length;
    const totalTripMoney = trips.reduce((sum, trip) => sum + trip.trip_amount, 0);
    const tripExpenses = trips.reduce((sum, trip) => 
      sum + trip.driver_amount + trip.commission + trip.fuel_amount + trip.tolls, 0);
    const maintenanceExpenses = maintenance.reduce((sum, record) => sum + record.amount, 0);
    const totalExpenses = tripExpenses + maintenanceExpenses;
    const totalProfit = trips.reduce((sum, trip) => sum + trip.profit, 0) - maintenanceExpenses;

    return {
      totalTrips,
      totalTripMoney,
      totalExpenses,
      totalProfit,
      totalMaintenance: maintenance.length,
      maintenanceExpenses,
    };
  }, [trips, maintenance]);

  const handleTripFormSuccess = useCallback(() => {
    setShowTripForm(false);
    fetchTrips();
  }, [fetchTrips]);

  const handleMaintenanceFormSuccess = useCallback(() => {
    setShowMaintenanceForm(false);
    fetchMaintenance();
  }, [fetchMaintenance]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    toast({
      title: "Success",
      description: "Signed out successfully",
    });
  }, [signOut]);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchTrips(), fetchMaintenance()]);
    } finally {
      setLoading(false);
    }
  }, [fetchTrips, fetchMaintenance]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loading size="lg" text="Loading dashboard data..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Header */}
      <header className="bg-background shadow-lg border-b border-primary/20 sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-primary">
                BSH Taxi Service
              </h1>
              <p className="text-sm text-muted-foreground">
                {user?.email} • {userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : 'Loading...'}
              </p>
            </div>
            <Button onClick={handleSignOut} variant="outline" size="sm" className="border-primary/30 hover:bg-primary hover:text-primary-foreground">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 max-w-7xl mx-auto">
        {/* Summary Cards */}
        <DashboardSummary data={calculateSummary} />

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="trips" className="flex items-center gap-1 text-xs sm:text-sm">
              <Car className="h-4 w-4" />
              <span className="hidden sm:inline">Trips</span>
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="flex items-center gap-1 text-xs sm:text-sm">
              <Wrench className="h-4 w-4" />
              <span className="hidden sm:inline">Maintenance</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-1 text-xs sm:text-sm">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Upload</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-1 text-xs sm:text-sm">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
          </TabsList>

          {/* Trips Tab */}
          <TabsContent value="trips" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-primary">Trips Management</h2>
              <Button onClick={() => setShowTripForm(!showTripForm)} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Trip
              </Button>
            </div>
            {showTripForm && <TripForm onSuccess={handleTripFormSuccess} />}
            <TripsTable 
              trips={trips} 
              onTripUpdated={fetchTrips}
              canEdit={true}
            />
          </TabsContent>

          {/* Maintenance Tab */}
          <TabsContent value="maintenance" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-primary">Maintenance Records</h2>
              <Button onClick={() => setShowMaintenanceForm(!showMaintenanceForm)} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Record
              </Button>
            </div>
            {showMaintenanceForm && <MaintenanceForm onSuccess={handleMaintenanceFormSuccess} />}
            <MaintenanceTable 
              maintenance={maintenance} 
              onMaintenanceUpdated={fetchMaintenance}
              canEdit={true}
            />
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload">
            <FileUpload onUploadSuccess={refreshData} />
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <MonthlyReports />
            <ExpensesReports />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

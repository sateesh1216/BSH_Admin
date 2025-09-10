import { useState, useEffect, useCallback, useMemo } from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';

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
import { format } from 'date-fns';

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
  const [activeSection, setActiveSection] = useState('trips');
  const [currentMonth, setCurrentMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [showAddForm, setShowAddForm] = useState(false);

  const isAdmin = userRole === 'admin';

  const fetchTrips = useCallback(async (month?: string) => {
    try {
      setLoading(true);
      let query = supabase.from('trips_secure').select('*');
      
      // If not admin, only fetch user's own trips
      if (!isAdmin && user) {
        query = query.eq('created_by', user.id);
      }

      // Apply month filtering
      const monthToUse = month || currentMonth;
      const startOfMonth = `${monthToUse}-01`;
      const year = parseInt(monthToUse.split('-')[0]);
      const monthNum = parseInt(monthToUse.split('-')[1]);
      const endOfMonth = format(new Date(year, monthNum, 0), 'yyyy-MM-dd');
      query = query.gte('date', startOfMonth).lte('date', endOfMonth);
      
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
    } finally {
      setLoading(false);
    }
  }, [isAdmin, user, currentMonth]);

  const fetchMaintenance = useCallback(async (month?: string) => {
    try {
      let query = supabase.from('maintenance_secure').select('*');
      
      // If not admin, only fetch user's own maintenance records
      if (!isAdmin && user) {
        query = query.eq('created_by', user.id);
      }

      // Apply month filtering
      const monthToUse = month || currentMonth;
      const startOfMonth = `${monthToUse}-01`;
      const year = parseInt(monthToUse.split('-')[0]);
      const monthNum = parseInt(monthToUse.split('-')[1]);
      const endOfMonth = format(new Date(year, monthNum, 0), 'yyyy-MM-dd');
      query = query.gte('date', startOfMonth).lte('date', endOfMonth);
      
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
  }, [isAdmin, user, currentMonth]);

  // Fetch data in parallel to improve loading speed
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
  }, [user, currentMonth, fetchTrips, fetchMaintenance]);

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

  const handleSectionChange = useCallback((section: string) => {
    setActiveSection(section);
    setShowAddForm(false);
  }, []);

  const handleAddNew = useCallback((section: string) => {
    setShowAddForm(true);
  }, []);

  const handleFormSuccess = useCallback(() => {
    setShowAddForm(false);
    const refreshData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchTrips(), fetchMaintenance()]);
      } finally {
        setLoading(false);
      }
    };
    refreshData();
  }, [fetchTrips, fetchMaintenance]);

  const handleFilterChange = useCallback((month: string) => {
    setCurrentMonth(month);
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut();
    toast({
      title: "Success",
      description: "Signed out successfully",
    });
  }, [signOut]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loading size="lg" text="Loading dashboard data..." />
      </div>
    );
  }

  const renderMainContent = () => {
    switch (activeSection) {
      case 'trips':
        return (
          <div className="space-y-6">
            {showAddForm && <TripForm onSuccess={handleFormSuccess} />}
            <TripsTable 
              trips={trips} 
              onTripUpdated={fetchTrips}
              canEdit={true}
            />
          </div>
        );
      case 'maintenance':
        return (
          <div className="space-y-6">
            {showAddForm && <MaintenanceForm onSuccess={handleFormSuccess} />}
            <MaintenanceTable 
              maintenance={maintenance} 
              onMaintenanceUpdated={() => fetchMaintenance()}
              canEdit={true}
            />
          </div>
        );
      case 'upload':
        return <FileUpload onUploadSuccess={fetchTrips} />;
      case 'reports':
        return (
          <div className="space-y-6">
            <MonthlyReports />
            <ExpensesReports />
          </div>
        );
      case 'settings':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Settings panel coming soon...</p>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background to-muted/30">
        <AppSidebar 
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          onAddNew={handleAddNew}
          onFilterChange={handleFilterChange}
        />
        
        <div className="flex-1 flex flex-col min-h-screen">
          <header className="bg-background shadow-lg border-b border-primary/20">
            <div className="px-6 py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <SidebarTrigger className="text-primary hover:bg-primary/10" />
                  <div>
                    <h1 className="text-3xl font-bold text-primary">
                      BSH Taxi Service Management
                    </h1>
                    <p className="text-muted-foreground mt-1">
                      Welcome back, {user?.email} • {userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : 'Loading...'}
                    </p>
                  </div>
                </div>
                <Button onClick={handleSignOut} variant="outline" className="border-primary/30 hover:bg-primary hover:text-primary-foreground">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-3 sm:px-6 py-4 sm:py-8 overflow-auto">
            <div className="w-full max-w-none space-y-4 sm:space-y-8">
              <DashboardSummary data={calculateSummary} />
              {renderMainContent()}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
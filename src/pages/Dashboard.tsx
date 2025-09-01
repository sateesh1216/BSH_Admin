import { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { DateRangeFilter, FilterOptions } from '@/components/filters/DateRangeFilter';
import { DashboardSummary } from '@/components/dashboard/DashboardSummary';
import { TripForm } from '@/components/trip/TripForm';
import { TripsTable } from '@/components/trip/TripsTable';
import { FileUpload } from '@/components/upload/FileUpload';
import { MonthlyReports } from '@/components/reports/MonthlyReports';
import { ExpensesReports } from '@/components/reports/ExpensesReports';
import { MaintenanceForm } from '@/components/maintenance/MaintenanceForm';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
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

export const Dashboard = () => {
  const { user, userRole, signOut } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('trips');
  const [currentFilter, setCurrentFilter] = useState<FilterOptions>({ 
    type: 'monthly', 
    month: format(new Date(), 'yyyy-MM') 
  });
  const [showAddForm, setShowAddForm] = useState(false);

  const isAdmin = userRole === 'admin';

  useEffect(() => {
    fetchTrips();
  }, [user, currentFilter]);

  const fetchTrips = async (filter?: FilterOptions) => {
    try {
      setLoading(true);
      let query = supabase.from('trips').select('*');
      
      // If not admin, only fetch user's own trips
      if (!isAdmin && user) {
        query = query.eq('created_by', user.id);
      }

      // Apply date filtering
      const filterToUse = filter || currentFilter;
      if (filterToUse.type === 'monthly' && filterToUse.month) {
        const startOfMonth = `${filterToUse.month}-01`;
        const year = parseInt(filterToUse.month.split('-')[0]);
        const month = parseInt(filterToUse.month.split('-')[1]);
        const endOfMonth = format(new Date(year, month, 0), 'yyyy-MM-dd');
        query = query.gte('date', startOfMonth).lte('date', endOfMonth);
      } else if (filterToUse.type === 'yearly' && filterToUse.year) {
        const startOfYear = `${filterToUse.year}-01-01`;
        const endOfYear = `${filterToUse.year}-12-31`;
        query = query.gte('date', startOfYear).lte('date', endOfYear);
      } else if (filterToUse.type === 'custom' && filterToUse.startDate && filterToUse.endDate) {
        query = query.gte('date', format(filterToUse.startDate, 'yyyy-MM-dd'))
                     .lte('date', format(filterToUse.endDate, 'yyyy-MM-dd'));
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
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = () => {
    const totalTrips = trips.length;
    const totalTripMoney = trips.reduce((sum, trip) => sum + trip.trip_amount, 0);
    const totalExpenses = trips.reduce((sum, trip) => 
      sum + trip.driver_amount + trip.commission + trip.fuel_amount + trip.tolls, 0);
    const totalProfit = trips.reduce((sum, trip) => sum + trip.profit, 0);

    return {
      totalTrips,
      totalTripMoney,
      totalExpenses,
      totalProfit,
    };
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    setShowAddForm(false);
  };

  const handleAddNew = (section: string) => {
    setShowAddForm(true);
  };

  const handleFormSuccess = () => {
    setShowAddForm(false);
    fetchTrips();
  };

  const handleFilterChange = (filter: FilterOptions) => {
    setCurrentFilter(filter);
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Success",
      description: "Signed out successfully",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
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
      <div className="min-h-screen flex w-full bg-gradient-to-br from-green-50 to-green-100">
        <AppSidebar 
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          onAddNew={handleAddNew}
        />
        
        <div className="flex-1 flex flex-col">
          <header className="bg-white shadow-md border-b">
            <div className="px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <SidebarTrigger />
                  <div>
                    <h1 className="text-2xl font-bold text-primary">
                      BSH Taxi Service Management
                    </h1>
                    <p className="text-muted-foreground">
                      Welcome back, {user?.email} ({userRole})
                    </p>
                  </div>
                </div>
                <Button onClick={handleSignOut} variant="outline">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              {/* Left sidebar - Filters */}
              <div className="xl:col-span-1 space-y-4">
                {(activeSection === 'trips' || activeSection === 'maintenance' || activeSection === 'reports') && (
                  <div className="sticky top-4">
                    <DateRangeFilter onFilterChange={handleFilterChange} />
                  </div>
                )}
              </div>
              
              {/* Main content area */}
              <div className="xl:col-span-3 space-y-6">
                <DashboardSummary data={calculateSummary()} />
                {renderMainContent()}
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
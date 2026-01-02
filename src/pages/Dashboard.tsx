import { useState, useEffect, useCallback, useMemo } from 'react';
import { LogOut, Car, Wrench, Upload, BarChart3, Plus, RefreshCw, Bell } from 'lucide-react';
import { startOfDay, parseISO, isAfter } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardSummary } from '@/components/dashboard/DashboardSummary';
import { TripForm } from '@/components/trip/TripForm';
import { TripsTable } from '@/components/trip/TripsTable';
import { FileUpload } from '@/components/upload/FileUpload';
import { MonthlyReports } from '@/components/reports/MonthlyReports';
import { ExpensesReports } from '@/components/reports/ExpensesReports';
import { MaintenanceForm } from '@/components/maintenance/MaintenanceForm';
import { MaintenanceTable } from '@/components/maintenance/MaintenanceTable';
import { DateFilter, DateFilterOptions } from '@/components/filters/DateFilter';
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
  payment_status: string;
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
  const [allPendingTotal, setAllPendingTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('trips');
  const [showTripForm, setShowTripForm] = useState(false);
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilterOptions>({ type: 'all' });

  const isAdmin = userRole === 'admin';

  const fetchTrips = useCallback(async () => {
    try {
      let query = supabase.from('trips').select('*');
      
      if (!isAdmin && user) {
        query = query.eq('created_by', user.id);
      }

      // Apply date filtering
      if (dateFilter.type === 'monthly' && dateFilter.month) {
        const [year, month] = dateFilter.month.split('-');
        const startOfMonth = `${dateFilter.month}-01`;
        const endOfMonth = format(new Date(parseInt(year), parseInt(month), 0), 'yyyy-MM-dd');
        query = query.gte('date', startOfMonth).lte('date', endOfMonth);
      } else if (dateFilter.type === 'yearly' && dateFilter.year) {
        query = query.gte('date', `${dateFilter.year}-01-01`).lte('date', `${dateFilter.year}-12-31`);
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
  }, [isAdmin, user, dateFilter]);

  // Fetch all pending bills total (regardless of date filter)
  const fetchAllPendingTotal = useCallback(async () => {
    try {
      let query = supabase
        .from('trips')
        .select('trip_amount')
        .eq('payment_status', 'pending');
      
      if (!isAdmin && user) {
        query = query.eq('created_by', user.id);
      }
      
      const { data, error } = await query;

      if (error) {
        console.error('Error fetching pending total:', error);
        return;
      }

      const total = (data || []).reduce((sum, t) => sum + (t.trip_amount || 0), 0);
      setAllPendingTotal(total);
    } catch (error) {
      console.error('Failed to fetch pending total:', error);
    }
  }, [isAdmin, user]);

  const fetchMaintenance = useCallback(async () => {
    try {
      let query = supabase.from('maintenance').select('*');
      
      if (!isAdmin && user) {
        query = query.eq('created_by', user.id);
      }

      // Apply date filtering
      if (dateFilter.type === 'monthly' && dateFilter.month) {
        const [year, month] = dateFilter.month.split('-');
        const startOfMonth = `${dateFilter.month}-01`;
        const endOfMonth = format(new Date(parseInt(year), parseInt(month), 0), 'yyyy-MM-dd');
        query = query.gte('date', startOfMonth).lte('date', endOfMonth);
      } else if (dateFilter.type === 'yearly' && dateFilter.year) {
        query = query.gte('date', `${dateFilter.year}-01-01`).lte('date', `${dateFilter.year}-12-31`);
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
  }, [isAdmin, user, dateFilter]);

  // Track if initial data has been loaded
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Fetch data on mount only
  useEffect(() => {
    if (user && !initialLoadComplete) {
      const fetchData = async () => {
        setLoading(true);
        try {
          await Promise.all([fetchTrips(), fetchMaintenance(), fetchAllPendingTotal()]);
        } finally {
          setLoading(false);
          setInitialLoadComplete(true);
        }
      };
      fetchData();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch data when filter changes (but not on initial load)
  useEffect(() => {
    if (user && initialLoadComplete) {
      const fetchData = async () => {
        try {
          await Promise.all([fetchTrips(), fetchMaintenance()]);
        } catch (error) {
          // Error handled in fetch functions
        }
      };
      fetchData();
    }
  }, [dateFilter]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Get upcoming trips
  const upcomingTrips = useMemo(() => {
    const today = startOfDay(new Date());
    return trips.filter(trip => {
      const tripDay = startOfDay(parseISO(trip.date));
      return isAfter(tripDay, today);
    }).sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
  }, [trips]);

  const upcomingTripsCount = upcomingTrips.length;

  const handleTripFormSuccess = useCallback(() => {
    setShowTripForm(false);
    fetchTrips();
    fetchAllPendingTotal();
  }, [fetchTrips, fetchAllPendingTotal]);

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
      await Promise.all([fetchTrips(), fetchMaintenance(), fetchAllPendingTotal()]);
      toast({
        title: "Refreshed",
        description: "Data updated successfully",
      });
    } finally {
      setLoading(false);
    }
  }, [fetchTrips, fetchMaintenance, fetchAllPendingTotal]);

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
            <div className="flex items-center gap-2">
              {/* Upcoming Trips Notification Bell with Dropdown */}
              {upcomingTripsCount > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className="relative flex items-center justify-center p-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg hover:scale-105 transition-transform animate-pulse"
                      title={`${upcomingTripsCount} upcoming trip${upcomingTripsCount > 1 ? 's' : ''}`}
                    >
                      <Bell className="h-5 w-5" />
                      <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold bg-red-600 text-white rounded-full shadow-md">
                        {upcomingTripsCount}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0 bg-background border shadow-xl z-50" align="end">
                    <div className="p-3 border-b bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-t-md">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Upcoming Trips ({upcomingTripsCount})
                      </h3>
                    </div>
                    <ScrollArea className="max-h-72">
                      <div className="p-2 space-y-2">
                        {upcomingTrips.slice(0, 10).map((trip) => (
                          <div 
                            key={trip.id} 
                            className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border-l-4 border-l-orange-500"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-foreground truncate">
                                  {trip.customer_name}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {trip.from_location} → {trip.to_location}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Driver: {trip.driver_name}
                                </p>
                              </div>
                              <div className="text-right ml-2 shrink-0">
                                <p className="text-xs font-medium text-orange-600 dark:text-orange-400">
                                  {format(parseISO(trip.date), 'dd MMM')}
                                </p>
                                <p className="text-xs font-semibold text-primary mt-0.5">
                                  ₹{trip.trip_amount.toLocaleString('en-IN')}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                        {upcomingTripsCount > 10 && (
                          <p className="text-center text-xs text-muted-foreground py-2">
                            +{upcomingTripsCount - 10} more upcoming trips
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                    <div className="p-2 border-t">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => setActiveTab('trips')}
                      >
                        View All Trips
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              <Button onClick={refreshData} variant="outline" size="sm" title="Refresh Data">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button onClick={handleSignOut} variant="outline" size="sm" className="border-primary/30 hover:bg-primary hover:text-primary-foreground">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 max-w-7xl mx-auto">
        {/* Date Filter */}
        <DateFilter currentFilter={dateFilter} onFilterChange={setDateFilter} />

        {/* Summary Cards */}
        <div className="mt-4">
          <DashboardSummary data={calculateSummary} />
        </div>

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
              onTripUpdated={() => { fetchTrips(); fetchAllPendingTotal(); }}
              canEdit={true}
              allPendingTotal={allPendingTotal}
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

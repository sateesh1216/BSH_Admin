import { useState, useEffect, useCallback, useMemo } from 'react';
import { LogOut, Car, Wrench, Upload, BarChart3, Plus, RefreshCw, Bell, Bus, Settings, History, ChevronRight, User, Menu, FileDown, Calendar, Eye, EyeOff } from 'lucide-react';
import { exportSummaryPdf } from '@/utils/exportSummaryPdf';
import { startOfDay, parseISO, isAfter } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DashboardSummary } from '@/components/dashboard/DashboardSummary';
import { SummaryDetailModal, DetailType } from '@/components/dashboard/SummaryDetailModal';
import { TripForm } from '@/components/trip/TripForm';
import { TripsTable } from '@/components/trip/TripsTable';
import { FileUpload } from '@/components/upload/FileUpload';
import { MonthlyReports } from '@/components/reports/MonthlyReports';
import { ExpensesReports } from '@/components/reports/ExpensesReports';
import { DriverReports } from '@/components/reports/DriverReports';
import { MaintenanceForm } from '@/components/maintenance/MaintenanceForm';
import { MaintenanceTable } from '@/components/maintenance/MaintenanceTable';
import { VehicleHistoryDashboard } from '@/components/vehicle-history/VehicleHistoryDashboard';
import { OutsideVehicleTripForm } from '@/components/outside-vehicle/OutsideVehicleTripForm';
import { OutsideVehicleTripsTable } from '@/components/outside-vehicle/OutsideVehicleTripsTable';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { DateFilter, DateFilterOptions } from '@/components/filters/DateFilter';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loading } from '@/components/ui/loading';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import bshLogo from '@/assets/bsh-logo.png';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';
import { MobileHeader } from '@/components/mobile/MobileHeader';

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

type Section = 'trips' | 'outside-vehicle' | 'maintenance' | 'vehicle-history' | 'monthly-breakdown' | 'upload' | 'reports' | 'admin';

const navItems: { key: Section; label: string; icon: React.ElementType; adminOnly?: boolean }[] = [
  { key: 'trips', label: 'Trips', icon: Car },
  { key: 'outside-vehicle', label: 'Outside Vehicles', icon: Bus },
  { key: 'maintenance', label: 'Maintenance', icon: Wrench },
  { key: 'vehicle-history', label: 'Vehicles', icon: History },
  { key: 'monthly-breakdown', label: 'Monthly Breakdown', icon: Calendar },
  { key: 'upload', label: 'Upload Data', icon: Upload },
  { key: 'reports', label: 'Reports', icon: BarChart3 },
  { key: 'admin', label: 'Admin Panel', icon: Settings, adminOnly: true },
];

export const Dashboard = () => {
  const { user, userRole, userName, signOut } = useAuth();
  const isMobile = useIsMobile();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  const [outsideVehicleTrips, setOutsideVehicleTrips] = useState<OutsideVehicleTrip[]>([]);
  const [allPendingTotal, setAllPendingTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<Section>('trips');
  const [showTripForm, setShowTripForm] = useState(false);
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [showOutsideVehicleTripForm, setShowOutsideVehicleTripForm] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilterOptions>({ type: 'all' });
  const [summaryDetailType, setSummaryDetailType] = useState<DetailType>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showMonthlyBreakdown, setShowMonthlyBreakdown] = useState(true);

  const isAdmin = userRole === 'admin';

  const fetchTrips = useCallback(async () => {
    try {
      let query = supabase.from('trips').select('*');
      if (!isAdmin && user) query = query.eq('created_by', user.id);
      if (dateFilter.type === 'monthly' && dateFilter.month) {
        const [year, month] = dateFilter.month.split('-');
        const startOfMonth = `${dateFilter.month}-01`;
        const endOfMonth = format(new Date(parseInt(year), parseInt(month), 0), 'yyyy-MM-dd');
        query = query.gte('date', startOfMonth).lte('date', endOfMonth);
      } else if (dateFilter.type === 'yearly' && dateFilter.year) {
        query = query.gte('date', `${dateFilter.year}-01-01`).lte('date', `${dateFilter.year}-12-31`);
      }
      const { data, error } = await query.order('date', { ascending: false });
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      setTrips(data || []);
    } catch { toast({ title: "Error", description: "Failed to fetch trips", variant: "destructive" }); }
  }, [isAdmin, user, dateFilter]);

  const fetchAllPendingTotal = useCallback(async () => {
    try {
      let query = supabase.from('trips').select('trip_amount').eq('payment_status', 'pending');
      if (!isAdmin && user) query = query.eq('created_by', user.id);
      const { data, error } = await query;
      if (error) { console.error('Error fetching pending total:', error); return; }
      setAllPendingTotal((data || []).reduce((sum, t) => sum + (t.trip_amount || 0), 0));
    } catch (error) { console.error('Failed to fetch pending total:', error); }
  }, [isAdmin, user]);

  const fetchMaintenance = useCallback(async () => {
    try {
      let query = supabase.from('maintenance').select('*');
      if (!isAdmin && user) query = query.eq('created_by', user.id);
      if (dateFilter.type === 'monthly' && dateFilter.month) {
        const [year, month] = dateFilter.month.split('-');
        const startOfMonth = `${dateFilter.month}-01`;
        const endOfMonth = format(new Date(parseInt(year), parseInt(month), 0), 'yyyy-MM-dd');
        query = query.gte('date', startOfMonth).lte('date', endOfMonth);
      } else if (dateFilter.type === 'yearly' && dateFilter.year) {
        query = query.gte('date', `${dateFilter.year}-01-01`).lte('date', `${dateFilter.year}-12-31`);
      }
      const { data, error } = await query.order('date', { ascending: false });
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      setMaintenance(data || []);
    } catch { toast({ title: "Error", description: "Failed to fetch maintenance records", variant: "destructive" }); }
  }, [isAdmin, user, dateFilter]);

  const fetchOutsideVehicleTrips = useCallback(async () => {
    try {
      let query = supabase.from('outside_vehicle_trips').select('*');
      if (!isAdmin && user) query = query.eq('created_by', user.id);
      if (dateFilter.type === 'monthly' && dateFilter.month) {
        const [year, month] = dateFilter.month.split('-');
        const startOfMonth = `${dateFilter.month}-01`;
        const endOfMonth = format(new Date(parseInt(year), parseInt(month), 0), 'yyyy-MM-dd');
        query = query.gte('date', startOfMonth).lte('date', endOfMonth);
      } else if (dateFilter.type === 'yearly' && dateFilter.year) {
        query = query.gte('date', `${dateFilter.year}-01-01`).lte('date', `${dateFilter.year}-12-31`);
      }
      const { data, error } = await query.order('date', { ascending: false });
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      setOutsideVehicleTrips(data || []);
    } catch { toast({ title: "Error", description: "Failed to fetch outside vehicle trips", variant: "destructive" }); }
  }, [isAdmin, user, dateFilter]);

  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useEffect(() => {
    if (user && !initialLoadComplete) {
      const fetchData = async () => {
        setLoading(true);
        try { await Promise.all([fetchTrips(), fetchMaintenance(), fetchOutsideVehicleTrips(), fetchAllPendingTotal()]); }
        finally { setLoading(false); setInitialLoadComplete(true); }
      };
      fetchData();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (user && initialLoadComplete) {
      Promise.all([fetchTrips(), fetchMaintenance(), fetchOutsideVehicleTrips()]).catch(() => {});
    }
  }, [dateFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const calculateSummary = useMemo(() => {
    const totalTrips = trips.length;
    const totalTripMoney = trips.reduce((sum, trip) => sum + trip.trip_amount, 0);
    const tripExpenses = trips.reduce((sum, trip) => sum + trip.driver_amount + trip.commission + trip.fuel_amount + trip.tolls, 0);
    const maintenanceExpenses = maintenance.reduce((sum, record) => sum + record.amount, 0);
    const totalExpenses = tripExpenses + maintenanceExpenses;
    const totalProfit = trips.reduce((sum, trip) => sum + trip.profit, 0) - maintenanceExpenses;
    const totalOutsideVehicleTrips = outsideVehicleTrips.length;
    const totalOutsideVehicleMoney = outsideVehicleTrips.reduce((sum, trip) => sum + trip.trip_amount, 0);
    const pendingOutsideVehicleMoney = outsideVehicleTrips.filter(trip => trip.payment_status === 'pending').reduce((sum, trip) => sum + trip.trip_amount, 0);
    return { totalTrips, totalTripMoney, totalExpenses, totalProfit, totalMaintenance: maintenance.length, maintenanceExpenses, totalOutsideVehicleTrips, totalOutsideVehicleMoney, pendingOutsideVehicleMoney };
  }, [trips, maintenance, outsideVehicleTrips]);

  const monthlyBreakdown = useMemo(() => {


    const map = new Map<string, {
      monthLabel: string;
      sortDate: Date;
      totalTrips: number;
      totalTripMoney: number;
      tripExpenses: number;
      maintenanceExpenses: number;
      totalOutsideVehicleTrips: number;
      totalOutsideVehicleMoney: number;
    }>();

    const ensureMonth = (dateStr: string) => {
      const d = parseISO(dateStr);
      const label = format(d, 'MMMM yyyy');
      if (!map.has(label)) {
        map.set(label, {
          monthLabel: label,
          sortDate: new Date(d.getFullYear(), d.getMonth(), 1),
          totalTrips: 0, totalTripMoney: 0, tripExpenses: 0, maintenanceExpenses: 0,
          totalOutsideVehicleTrips: 0, totalOutsideVehicleMoney: 0
        });
      }
      return map.get(label)!;
    };

    trips.forEach(t => {
      const m = ensureMonth(t.date);
      m.totalTrips++;
      m.totalTripMoney += t.trip_amount;
      m.tripExpenses += (t.driver_amount || 0) + (t.commission || 0) + (t.fuel_amount || 0) + (t.tolls || 0);
    });

    maintenance.forEach(mr => {
      const m = ensureMonth(mr.date);
      m.maintenanceExpenses += mr.amount;
    });

    outsideVehicleTrips.forEach(t => {
      const m = ensureMonth(t.date);
      m.totalOutsideVehicleTrips++;
      m.totalOutsideVehicleMoney += t.trip_amount;
    });

    return Array.from(map.values()).sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());
  }, [trips, maintenance, outsideVehicleTrips, dateFilter.type]);


  const upcomingTrips = useMemo(() => {
    const today = startOfDay(new Date());
    return trips.filter(trip => isAfter(startOfDay(parseISO(trip.date)), today)).sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
  }, [trips]);

  const upcomingTripsCount = upcomingTrips.length;

  const handleTripFormSuccess = useCallback(() => { setShowTripForm(false); fetchTrips(); fetchAllPendingTotal(); }, [fetchTrips, fetchAllPendingTotal]);
  const handleMaintenanceFormSuccess = useCallback(() => { setShowMaintenanceForm(false); fetchMaintenance(); }, [fetchMaintenance]);
  const handleOutsideVehicleTripFormSuccess = useCallback(() => { setShowOutsideVehicleTripForm(false); fetchOutsideVehicleTrips(); }, [fetchOutsideVehicleTrips]);
  const handleSignOut = useCallback(async () => { await signOut(); toast({ title: "Success", description: "Signed out successfully" }); }, [signOut]);
  const refreshData = useCallback(async () => {
    setLoading(true);
    try { await Promise.all([fetchTrips(), fetchMaintenance(), fetchOutsideVehicleTrips(), fetchAllPendingTotal()]); toast({ title: "Refreshed", description: "Data updated successfully" }); }
    finally { setLoading(false); }
  }, [fetchTrips, fetchMaintenance, fetchOutsideVehicleTrips, fetchAllPendingTotal]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loading size="lg" text="Loading dashboard data..." />
      </div>
    );
  }

  const visibleNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  const renderContent = () => {
    switch (activeSection) {
      case 'trips':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-foreground">Trips Management</h2>
                <p className="text-sm text-muted-foreground">Track and manage all trip records</p>
              </div>
              <Button onClick={() => setShowTripForm(!showTripForm)} className="shadow-md">
                <Plus className="h-4 w-4 mr-2" />
                Add Trip
              </Button>
            </div>
            {showTripForm && <TripForm onSuccess={handleTripFormSuccess} />}
            <TripsTable trips={trips} onTripUpdated={() => { fetchTrips(); fetchAllPendingTotal(); }} canEdit={true} allPendingTotal={allPendingTotal} />
          </div>
        );
      case 'outside-vehicle':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-foreground">Outside Vehicle Trips</h2>
                <p className="text-sm text-muted-foreground">Manage external vehicle trip records</p>
              </div>
              <Button onClick={() => setShowOutsideVehicleTripForm(!showOutsideVehicleTripForm)} className="shadow-md">
                <Plus className="h-4 w-4 mr-2" />
                Add Trip
              </Button>
            </div>
            {showOutsideVehicleTripForm && <OutsideVehicleTripForm onSuccess={handleOutsideVehicleTripFormSuccess} />}
            <OutsideVehicleTripsTable trips={outsideVehicleTrips} onTripUpdated={fetchOutsideVehicleTrips} canEdit={true} />
          </div>
        );
      case 'maintenance':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-foreground">Maintenance Records</h2>
                <p className="text-sm text-muted-foreground">Track vehicle maintenance and expenses</p>
              </div>
              <Button onClick={() => setShowMaintenanceForm(!showMaintenanceForm)} className="shadow-md">
                <Plus className="h-4 w-4 mr-2" />
                Add Record
              </Button>
            </div>
            {showMaintenanceForm && <MaintenanceForm onSuccess={handleMaintenanceFormSuccess} />}
            <MaintenanceTable maintenance={maintenance} onMaintenanceUpdated={fetchMaintenance} canEdit={true} />
          </div>
        );
      case 'vehicle-history':
        return <VehicleHistoryDashboard maintenance={maintenance} />;
      case 'upload':
        return <FileUpload onUploadSuccess={refreshData} />;
      case 'reports':
        return (
          <div className="space-y-6">
            <DriverReports />
            <MonthlyReports />
            <ExpensesReports />
          </div>
        );
      case 'admin':
        return <AdminPanel onNavigateToReports={() => setActiveSection('reports')} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className={cn(
          "fixed left-0 top-0 h-screen bg-card border-r border-border flex flex-col transition-all duration-300 z-40",
          sidebarCollapsed ? "w-[68px]" : "w-[260px]"
        )}>
          {/* Sidebar Header / Logo */}
          <div className={cn("p-4 border-b border-border flex items-center gap-3", sidebarCollapsed && "justify-center")}>
            <img src={bshLogo} alt="BSH" className="h-9 w-9 rounded-lg object-contain" />
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <h1 className="text-base font-bold text-foreground leading-tight truncate">BSH Taxi</h1>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Service Management</p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-3 px-2">
            <div className="space-y-1">
              {visibleNavItems.map((item) => {
                const isActive = activeSection === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => { setActiveSection(item.key); setMobileSidebarOpen(false); }}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200",
                      sidebarCollapsed ? "justify-center p-3" : "px-3 py-2.5",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <item.icon className={cn("h-[18px] w-[18px] shrink-0", isActive && "text-primary-foreground")} />
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 text-left truncate">{item.label}</span>
                        {isActive && <ChevronRight className="h-4 w-4 opacity-60" />}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Sidebar Footer - User Info */}
          <div className="border-t border-border p-3">
            <div className={cn("flex items-center gap-3", sidebarCollapsed && "justify-center")}>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-primary" />
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate">{userName || user?.email}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{userRole || 'User'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Collapse Toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-border bg-card shadow-sm flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ChevronRight className={cn("h-3 w-3 text-muted-foreground transition-transform", sidebarCollapsed ? "" : "rotate-180")} />
          </button>
        </aside>
      )}

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <MobileBottomNav
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          isAdmin={isAdmin}
        />
      )}

      {/* Main Content Area */}
      <div className={cn(
        "flex-1 flex flex-col min-h-screen transition-all duration-300",
        !isMobile && (sidebarCollapsed ? "ml-[68px]" : "ml-[260px]")
      )}>
        {/* Header */}
        {isMobile ? (
          <MobileHeader
            userName={userName}
            userRole={userRole}
            userEmail={user?.email}
            upcomingTrips={upcomingTrips}
            onSignOut={handleSignOut}
            onRefresh={refreshData}
            onNavigate={(section) => setActiveSection(section as Section)}
          />
        ) : (
          <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border">
            <div className="flex items-center justify-between px-4 lg:px-6 h-14">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="text-base font-semibold text-foreground leading-tight">
                    {visibleNavItems.find(i => i.key === activeSection)?.label || 'Dashboard'}
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    {userName || user?.email} • <span className="capitalize">{userRole}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {upcomingTripsCount > 0 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="relative flex items-center justify-center h-9 w-9 rounded-lg bg-accent hover:bg-accent/80 transition-colors">
                        <Bell className="h-4 w-4 text-foreground" />
                        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full">
                          {upcomingTripsCount}
                        </span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0 bg-card border shadow-xl" align="end">
                      <div className="p-3 border-b bg-primary text-primary-foreground rounded-t-md">
                        <h3 className="font-semibold flex items-center gap-2 text-sm">
                          <Bell className="h-4 w-4" />
                          Upcoming Trips ({upcomingTripsCount})
                        </h3>
                      </div>
                      <ScrollArea className="max-h-72">
                        <div className="p-2 space-y-1.5">
                          {upcomingTrips.slice(0, 10).map((trip) => (
                            <div key={trip.id} className="p-2.5 rounded-md bg-muted/50 hover:bg-muted transition-colors border-l-3 border-l-primary">
                              <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-xs text-foreground truncate">{trip.customer_name}</p>
                                  <p className="text-[11px] text-muted-foreground">{trip.from_location} → {trip.to_location}</p>
                                </div>
                                <div className="text-right ml-2 shrink-0">
                                  <p className="text-[11px] font-medium text-primary">{format(parseISO(trip.date), 'dd MMM')}</p>
                                  <p className="text-xs font-semibold">₹{trip.trip_amount.toLocaleString('en-IN')}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      <div className="p-2 border-t">
                        <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setActiveSection('trips')}>View All Trips</Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}

                <Button onClick={refreshData} variant="ghost" size="icon" className="h-9 w-9" title="Refresh">
                  <RefreshCw className="h-4 w-4" />
                </Button>

                <Button onClick={handleSignOut} variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <LogOut className="h-4 w-4" />
                  <span className="ml-1.5 text-xs">Sign Out</span>
                </Button>
              </div>
            </div>
          </header>
        )}

        {/* Page Content */}
        <main className={cn("flex-1 p-4 lg:p-6", isMobile && "pb-24")}>
          <div className="max-w-[1400px] mx-auto space-y-5">
            {/* Date Filter */}
            <DateFilter currentFilter={dateFilter} onFilterChange={setDateFilter} />

            {/* Summary Cards */}
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const label =
                    dateFilter.type === 'monthly' && dateFilter.month
                      ? format(parseISO(`${dateFilter.month}-01`), 'MMMM yyyy')
                      : dateFilter.type === 'yearly' && dateFilter.year
                      ? String(dateFilter.year)
                      : 'All Time';
                  exportSummaryPdf(calculateSummary, label, trips, outsideVehicleTrips, maintenance, monthlyBreakdown);
                  toast({ title: 'PDF exported', description: 'Summary PDF downloaded' });
                }}
                className="shadow-sm"
              >
                <FileDown className="h-4 w-4 mr-2" />
                Export Summary PDF
              </Button>
            </div>
            <DashboardSummary data={calculateSummary} onCardClick={setSummaryDetailType} />

            {/* Monthly Breakdown Cards (shown only when All is selected) */}
            {dateFilter.type === 'all' && monthlyBreakdown.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Monthly Breakdown
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowMonthlyBreakdown(v => !v)}
                  >
                    {showMonthlyBreakdown ? (
                      <><EyeOff className="h-4 w-4 mr-2" /> Hide</>
                    ) : (
                      <><Eye className="h-4 w-4 mr-2" /> View</>
                    )}
                  </Button>
                </div>
                {showMonthlyBreakdown && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {monthlyBreakdown.map((month) => {
                      const netProfit = month.totalTripMoney - month.tripExpenses - month.maintenanceExpenses;
                      const rows = [
                        { label: 'Trips', value: month.totalTrips.toString(), color: 'text-primary' },
                        { label: 'Trip Money', value: `₹${month.totalTripMoney.toLocaleString('en-IN')}`, color: 'text-blue-600' },
                        { label: 'Total Expenses', value: `₹${month.tripExpenses.toLocaleString('en-IN')}`, color: 'text-orange-600' },
                        { label: 'Maintenance', value: `₹${month.maintenanceExpenses.toLocaleString('en-IN')}`, color: 'text-orange-600' },
                        { label: 'Outside Vehicles', value: month.totalOutsideVehicleTrips.toString(), color: 'text-purple-600' },
                        { label: 'Outside Amount', value: `₹${month.totalOutsideVehicleMoney.toLocaleString('en-IN')}`, color: 'text-purple-600' },
                        { label: 'Net Profit', value: `₹${netProfit.toLocaleString('en-IN')}`, color: netProfit >= 0 ? 'text-green-600' : 'text-red-600', highlight: true },
                      ];
                      return (
                        <Card key={month.monthLabel} className="border-border bg-card hover:bg-accent/50 transition-all duration-200 shadow-sm">
                          <CardContent className="p-3 space-y-2">
                            <p className="text-sm font-bold text-foreground border-b border-border pb-1.5">{month.monthLabel}</p>
                            <div className="space-y-1.5 text-xs">
                              {rows.map((row) => (
                                <div
                                  key={row.label}
                                  className={cn(
                                    "flex items-center justify-between gap-2",
                                    row.highlight && "pt-1.5 border-t border-border mt-1 font-bold"
                                  )}
                                >
                                  <span className="text-muted-foreground text-left">{row.label}</span>
                                  <span className={cn("font-semibold text-right", row.color)}>{row.value}</span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                )}
              </div>
            )}

            {/* Summary Detail Modal */}
            <SummaryDetailModal
              open={summaryDetailType !== null}
              onOpenChange={(open) => !open && setSummaryDetailType(null)}
              detailType={summaryDetailType}
              trips={trips}
              maintenance={maintenance}
              outsideVehicleTrips={outsideVehicleTrips}
              summary={calculateSummary}
            />

            {/* Active Section Content */}
            <div className="bg-card rounded-xl border border-border shadow-sm p-4 lg:p-6">
              {renderContent()}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

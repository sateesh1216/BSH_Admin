import { useState, useEffect } from 'react';
import { LogOut, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DashboardSummary } from '@/components/dashboard/DashboardSummary';
import { TripForm } from '@/components/trip/TripForm';
import { TripsTable } from '@/components/trip/TripsTable';
import { FileUpload } from '@/components/upload/FileUpload';
import { MonthlyReports } from '@/components/reports/MonthlyReports';
import { MaintenanceForm } from '@/components/maintenance/MaintenanceForm';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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
  const [isAddTripDialogOpen, setIsAddTripDialogOpen] = useState(false);

  const isAdmin = userRole === 'admin';

  useEffect(() => {
    fetchTrips();
  }, [user]);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      let query = supabase.from('trips').select('*');
      
      // If not admin, only fetch user's own trips
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

  const handleAddTripSuccess = () => {
    setIsAddTripDialogOpen(false);
    fetchTrips();
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <header className="bg-white shadow-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-primary">
                Taxi Service Management
              </h1>
              <p className="text-muted-foreground">
                Welcome back, {user?.email} ({userRole})
              </p>
            </div>
            <Button onClick={handleSignOut} variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardSummary data={calculateSummary()} />

        <Tabs defaultValue="trips" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="trips">Trips</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="trips" className="space-y-6">
            <TripForm onSuccess={fetchTrips} />
            <TripsTable 
              trips={trips} 
              onTripUpdated={fetchTrips}
              canEdit={true}
            />
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-6">
            <MaintenanceForm onSuccess={fetchTrips} />
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            <FileUpload onUploadSuccess={fetchTrips} />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <MonthlyReports />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Settings panel coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};
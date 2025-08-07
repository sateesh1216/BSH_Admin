import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, Download, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface MonthlyData {
  totalTrips: number;
  totalRevenue: number;
  totalProfit: number;
  totalMaintenance: number;
  netProfit: number;
  avgTripValue: number;
}

export const MonthlyReports = () => {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [data, setData] = useState<MonthlyData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchMonthlyData = async () => {
    if (!selectedMonth) return;
    
    setLoading(true);
    try {
      const startDate = `${selectedMonth}-01`;
      const endDate = `${selectedMonth}-31`;

      // Fetch trips data
      const { data: trips, error: tripsError } = await supabase
        .from('trips')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);

      if (tripsError) throw tripsError;

      // Fetch maintenance data
      const { data: maintenance, error: maintenanceError } = await supabase
        .from('maintenance')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);

      if (maintenanceError) throw maintenanceError;

      // Calculate metrics
      const totalTrips = trips?.length || 0;
      const totalRevenue = trips?.reduce((sum, trip) => sum + (trip.trip_amount || 0), 0) || 0;
      const totalExpenses = trips?.reduce((sum, trip) => 
        sum + (trip.driver_amount || 0) + (trip.commission || 0) + (trip.fuel_amount || 0) + (trip.tolls || 0), 0) || 0;
      const totalProfit = totalRevenue - totalExpenses;
      const totalMaintenance = maintenance?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
      const netProfit = totalProfit - totalMaintenance;
      const avgTripValue = totalTrips > 0 ? totalRevenue / totalTrips : 0;

      setData({
        totalTrips,
        totalRevenue,
        totalProfit,
        totalMaintenance,
        netProfit,
        avgTripValue,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch monthly data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyData();
  }, [selectedMonth]);

  const downloadReport = async () => {
    if (!selectedMonth) return;

    try {
      const startDate = `${selectedMonth}-01`;
      const endDate = `${selectedMonth}-31`;

      // Fetch detailed data for export
      const { data: trips } = await supabase
        .from('trips')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);

      const { data: maintenance } = await supabase
        .from('maintenance')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        ['Monthly Report Summary', ''],
        ['Month', selectedMonth],
        ['', ''],
        ['Total Trips', data?.totalTrips || 0],
        ['Total Revenue', `₹${(data?.totalRevenue || 0).toFixed(2)}`],
        ['Total Profit', `₹${(data?.totalProfit || 0).toFixed(2)}`],
        ['Total Maintenance', `₹${(data?.totalMaintenance || 0).toFixed(2)}`],
        ['Net Profit', `₹${(data?.netProfit || 0).toFixed(2)}`],
        ['Average Trip Value', `₹${(data?.avgTripValue || 0).toFixed(2)}`],
      ];
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

      // Trips sheet
      if (trips && trips.length > 0) {
        const tripsWs = XLSX.utils.json_to_sheet(trips);
        XLSX.utils.book_append_sheet(wb, tripsWs, 'Trips');
      }

      // Maintenance sheet
      if (maintenance && maintenance.length > 0) {
        const maintenanceWs = XLSX.utils.json_to_sheet(maintenance);
        XLSX.utils.book_append_sheet(wb, maintenanceWs, 'Maintenance');
      }

      // Save file
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      saveAs(blob, `monthly-report-${selectedMonth}.xlsx`);

      toast({
        title: "Success",
        description: "Monthly report downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download report",
        variant: "destructive",
      });
    }
  };

  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = format(date, 'yyyy-MM');
      const label = format(date, 'MMMM yyyy');
      options.push({ value, label });
    }
    return options;
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Calendar className="h-5 w-5" />
            Monthly Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {generateMonthOptions().map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={downloadReport} 
              disabled={!data || loading}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Report
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : data ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Trips</p>
                      <p className="text-2xl font-bold">{data.totalTrips}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold text-green-600">₹{data.totalRevenue.toFixed(2)}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Trip Profit</p>
                      <p className={`text-2xl font-bold ${data.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{data.totalProfit.toFixed(2)}
                      </p>
                    </div>
                    {data.totalProfit >= 0 ? 
                      <TrendingUp className="h-8 w-8 text-green-600" /> : 
                      <TrendingDown className="h-8 w-8 text-red-600" />
                    }
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Maintenance Cost</p>
                      <p className="text-2xl font-bold text-orange-600">₹{data.totalMaintenance.toFixed(2)}</p>
                    </div>
                    <TrendingDown className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Net Profit</p>
                      <p className={`text-2xl font-bold ${data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{data.netProfit.toFixed(2)}
                      </p>
                    </div>
                    {data.netProfit >= 0 ? 
                      <TrendingUp className="h-8 w-8 text-green-600" /> : 
                      <TrendingDown className="h-8 w-8 text-red-600" />
                    }
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Trip Value</p>
                      <p className="text-2xl font-bold text-blue-600">₹{data.avgTripValue.toFixed(2)}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8">No data available for selected month</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
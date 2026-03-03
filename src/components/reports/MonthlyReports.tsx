import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, Download, TrendingUp, TrendingDown, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { ReportsCharts } from './ReportsCharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface MonthlyData {
  totalTrips: number;
  totalRevenue: number;
  totalProfit: number;
  totalMaintenance: number;
  netProfit: number;
  avgTripValue: number;
}

interface TripRecord {
  date: string;
  driver_name: string;
  customer_name: string;
  from_location: string;
  to_location: string;
  trip_amount: number;
  driver_amount: number;
  commission: number;
  fuel_amount: number;
  tolls: number;
  profit: number;
  payment_mode: string;
  payment_status: string;
}

interface MaintenanceRecord {
  date: string;
  vehicle_number: string;
  maintenance_type: string;
  description: string | null;
  amount: number;
  payment_mode: string;
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

      const { data: trips, error: tripsError } = await supabase
        .from('trips')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);

      if (tripsError) throw tripsError;

      const { data: maintenance, error: maintenanceError } = await supabase
        .from('maintenance')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);

      if (maintenanceError) throw maintenanceError;

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

      const wb = XLSX.utils.book_new();

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

      if (trips && trips.length > 0) {
        const tripsWs = XLSX.utils.json_to_sheet(trips);
        XLSX.utils.book_append_sheet(wb, tripsWs, 'Trips');
      }

      if (maintenance && maintenance.length > 0) {
        const maintenanceWs = XLSX.utils.json_to_sheet(maintenance);
        XLSX.utils.book_append_sheet(wb, maintenanceWs, 'Maintenance');
      }

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

  const downloadPDF = async () => {
    if (!selectedMonth || !data) return;

    try {
      const startDate = `${selectedMonth}-01`;
      const endDate = `${selectedMonth}-31`;
      const monthLabel = format(new Date(selectedMonth + '-01'), 'MMMM yyyy');

      const { data: trips } = await supabase
        .from('trips')
        .select('date, driver_name, customer_name, from_location, to_location, trip_amount, driver_amount, commission, fuel_amount, tolls, profit, payment_mode, payment_status')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      const { data: maintenance } = await supabase
        .from('maintenance')
        .select('date, vehicle_number, maintenance_type, description, amount, payment_mode')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      const doc = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();

      // Title
      doc.setFontSize(20);
      doc.setTextColor(33, 37, 41);
      doc.text('BSH Taxi Service', pageWidth / 2, 18, { align: 'center' });
      doc.setFontSize(14);
      doc.setTextColor(100, 100, 100);
      doc.text(`Monthly Report - ${monthLabel}`, pageWidth / 2, 26, { align: 'center' });

      // Summary section
      doc.setFontSize(11);
      doc.setTextColor(33, 37, 41);
      let y = 36;
      const summaryItems = [
        ['Total Trips', String(data.totalTrips)],
        ['Total Revenue', `₹${data.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
        ['Trip Profit', `₹${data.totalProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
        ['Maintenance Cost', `₹${data.totalMaintenance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
        ['Net Profit', `₹${data.netProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
        ['Avg Trip Value', `₹${data.avgTripValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
      ];

      // Summary table
      autoTable(doc, {
        startY: y,
        head: [['Metric', 'Value']],
        body: summaryItems,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 }, 1: { halign: 'right', cellWidth: 60 } },
        margin: { left: (pageWidth - 120) / 2 },
        tableWidth: 120,
      });

      // Trips table
      if (trips && trips.length > 0) {
        const tripsY = (doc as any).lastAutoTable?.finalY + 10 || y + 60;
        
        doc.setFontSize(13);
        doc.setTextColor(33, 37, 41);
        doc.text('Trip Details', 14, tripsY);

        autoTable(doc, {
          startY: tripsY + 4,
          head: [['Date', 'Driver', 'Customer', 'From', 'To', 'Amount', 'Expenses', 'Profit', 'Payment', 'Status']],
          body: (trips as TripRecord[]).map(t => [
            format(new Date(t.date), 'dd/MM/yy'),
            t.driver_name,
            t.customer_name,
            t.from_location,
            t.to_location,
            `₹${t.trip_amount.toLocaleString('en-IN')}`,
            `₹${(t.driver_amount + t.commission + t.fuel_amount + t.tolls).toLocaleString('en-IN')}`,
            `₹${t.profit.toLocaleString('en-IN')}`,
            t.payment_mode,
            t.payment_status,
          ]),
          theme: 'striped',
          headStyles: { fillColor: [39, 174, 96], textColor: 255, fontStyle: 'bold', fontSize: 8 },
          styles: { fontSize: 7, cellPadding: 2 },
          didDrawPage: (d) => {
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`BSH Taxi Service - ${monthLabel}`, 14, doc.internal.pageSize.getHeight() - 8);
            doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - 14, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
          },
        });
      }

      // Maintenance table
      if (maintenance && maintenance.length > 0) {
        const maintY = (doc as any).lastAutoTable?.finalY + 10 || 100;

        // Check if we need a new page
        if (maintY > doc.internal.pageSize.getHeight() - 40) {
          doc.addPage();
          doc.setFontSize(13);
          doc.text('Maintenance Details', 14, 18);
          autoTable(doc, {
            startY: 22,
            head: [['Date', 'Vehicle', 'Type', 'Description', 'Amount', 'Payment']],
            body: (maintenance as MaintenanceRecord[]).map(m => [
              format(new Date(m.date), 'dd/MM/yy'),
              m.vehicle_number,
              m.maintenance_type,
              m.description || '-',
              `₹${m.amount.toLocaleString('en-IN')}`,
              m.payment_mode,
            ]),
            theme: 'striped',
            headStyles: { fillColor: [231, 76, 60], textColor: 255, fontStyle: 'bold', fontSize: 8 },
            styles: { fontSize: 7, cellPadding: 2 },
          });
        } else {
          doc.setFontSize(13);
          doc.text('Maintenance Details', 14, maintY);
          autoTable(doc, {
            startY: maintY + 4,
            head: [['Date', 'Vehicle', 'Type', 'Description', 'Amount', 'Payment']],
            body: (maintenance as MaintenanceRecord[]).map(m => [
              format(new Date(m.date), 'dd/MM/yy'),
              m.vehicle_number,
              m.maintenance_type,
              m.description || '-',
              `₹${m.amount.toLocaleString('en-IN')}`,
              m.payment_mode,
            ]),
            theme: 'striped',
            headStyles: { fillColor: [231, 76, 60], textColor: 255, fontStyle: 'bold', fontSize: 8 },
            styles: { fontSize: 7, cellPadding: 2 },
          });
        }
      }

      // Footer on last page
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`BSH Taxi Service - ${monthLabel}`, 14, doc.internal.pageSize.getHeight() - 8);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
      }

      doc.save(`monthly-report-${selectedMonth}.pdf`);

      toast({
        title: "Success",
        description: "PDF report downloaded successfully",
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF report",
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
              variant="outline"
            >
              <Download className="h-4 w-4" />
              Excel
            </Button>
            <Button 
              onClick={downloadPDF} 
              disabled={!data || loading}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Download PDF
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

      {/* Graphical Reports Section */}
      <ReportsCharts />
    </div>
  );
};
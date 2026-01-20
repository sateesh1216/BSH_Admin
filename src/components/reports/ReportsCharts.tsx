import { useState, useEffect } from 'react';
import { format, subMonths } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { BarChart3, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';

interface MonthlyChartData {
  month: string;
  revenue: number;
  profit: number;
  maintenance: number;
  trips: number;
}

interface MaintenanceTypeData {
  name: string;
  value: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

export const ReportsCharts = () => {
  const [monthlyData, setMonthlyData] = useState<MonthlyChartData[]>([]);
  const [maintenanceByType, setMaintenanceByType] = useState<MaintenanceTypeData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('6');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
  }, [selectedPeriod]);

  const fetchChartData = async () => {
    setLoading(true);
    try {
      const months = parseInt(selectedPeriod);
      const monthlyStats: MonthlyChartData[] = [];
      const maintenanceTypes: { [key: string]: number } = {};

      for (let i = months - 1; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const startDate = format(new Date(date.getFullYear(), date.getMonth(), 1), 'yyyy-MM-dd');
        const endDate = format(new Date(date.getFullYear(), date.getMonth() + 1, 0), 'yyyy-MM-dd');

        // Fetch trips for this month
        const { data: trips } = await supabase
          .from('trips')
          .select('trip_amount, driver_amount, commission, fuel_amount, tolls')
          .gte('date', startDate)
          .lte('date', endDate);

        // Fetch maintenance for this month
        const { data: maintenance } = await supabase
          .from('maintenance')
          .select('amount, maintenance_type')
          .gte('date', startDate)
          .lte('date', endDate);

        const revenue = trips?.reduce((sum, t) => sum + (t.trip_amount || 0), 0) || 0;
        const expenses = trips?.reduce((sum, t) => 
          sum + (t.driver_amount || 0) + (t.commission || 0) + (t.fuel_amount || 0) + (t.tolls || 0), 0) || 0;
        const maintenanceCost = maintenance?.reduce((sum, m) => sum + (m.amount || 0), 0) || 0;

        monthlyStats.push({
          month: format(date, 'MMM yy'),
          revenue,
          profit: revenue - expenses,
          maintenance: maintenanceCost,
          trips: trips?.length || 0,
        });

        // Aggregate maintenance by type
        maintenance?.forEach(m => {
          if (m.maintenance_type) {
            maintenanceTypes[m.maintenance_type] = (maintenanceTypes[m.maintenance_type] || 0) + m.amount;
          }
        });
      }

      setMonthlyData(monthlyStats);
      setMaintenanceByType(
        Object.entries(maintenanceTypes)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch chart data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Loading charts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Graphical Reports
        </h3>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Last 3 Months</SelectItem>
            <SelectItem value="6">Last 6 Months</SelectItem>
            <SelectItem value="12">Last 12 Months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Revenue vs Profit Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <TrendingUp className="h-5 w-5" />
            Revenue & Profit Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
              />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" name="Revenue (₹)" strokeWidth={2} />
              <Line type="monotone" dataKey="profit" stroke="hsl(142 76% 36%)" name="Profit (₹)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Trips & Maintenance Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <BarChart3 className="h-5 w-5" />
            Monthly Trips & Maintenance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
              <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" />
              <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="trips" fill="hsl(var(--primary))" name="Trips" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="maintenance" fill="hsl(25 95% 53%)" name="Maintenance (₹)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Maintenance by Type Pie Chart */}
      {maintenanceByType.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <PieChartIcon className="h-5 w-5" />
              Maintenance by Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={maintenanceByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {maintenanceByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `₹${value.toLocaleString()}`}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

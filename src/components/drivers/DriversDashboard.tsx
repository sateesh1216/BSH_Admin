import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, UserCheck, Wallet, Receipt, Banknote, AlertCircle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Driver } from './DriversList';
import { DriverExpense } from './DriverExpensesPage';
import { DriverPayment } from './DriverPaymentsPage';
import { TripAmount } from './DriverLedger';

interface Props {
  drivers: Driver[];
  tripAmounts: TripAmount[];
  expenses: DriverExpense[];
  payments: DriverPayment[];
}

const COLORS = ['hsl(var(--primary))', '#3b82f6', '#f97316', '#a855f7', '#10b981', '#ef4444'];

export const DriversDashboard = ({ drivers, tripAmounts, expenses, payments }: Props) => {
  const summary = useMemo(() => {
    const totalTripAmount = tripAmounts.reduce((s, t) => s + Number(t.amount || 0), 0);
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const totalPayments = payments.reduce((s, p) => s + Number(p.payment_amount || 0), 0);
    return {
      totalDrivers: drivers.length,
      activeDrivers: drivers.filter(d => d.status === 'active').length,
      totalTripAmount,
      totalExpenses,
      totalPayments,
      outstanding: totalTripAmount - totalExpenses - totalPayments,
    };
  }, [drivers, tripAmounts, expenses, payments]);

  const monthlyData = useMemo(() => {
    const map = new Map<string, { month: string; payments: number; expenses: number }>();
    const ensure = (key: string) => {
      if (!map.has(key)) map.set(key, { month: key, payments: 0, expenses: 0 });
      return map.get(key)!;
    };
    payments.forEach(p => { ensure(p.payment_date.slice(0, 7)).payments += Number(p.payment_amount || 0); });
    expenses.forEach(e => { ensure(e.expense_date.slice(0, 7)).expenses += Number(e.amount || 0); });
    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [payments, expenses]);

  const topDrivers = useMemo(() => {
    const map = new Map<string, { driverAmount: number; tripAmount: number }>();
    tripAmounts.forEach(t => {
      const cur = map.get(t.driver_id) || { driverAmount: 0, tripAmount: 0 };
      cur.driverAmount += Number(t.amount || 0);
      cur.tripAmount += Number((t as any).trip_amount || 0);
      map.set(t.driver_id, cur);
    });
    return Array.from(map.entries())
      .map(([id, v]) => ({ name: drivers.find(d => d.id === id)?.name || 'Unknown', ...v }))
      .sort((a, b) => b.tripAmount - a.tripAmount)
      .slice(0, 5);
  }, [tripAmounts, drivers]);

  const cards = [
    { label: 'Total Drivers', value: summary.totalDrivers, icon: Users, color: 'from-blue-500 to-blue-600' },
    { label: 'Active Drivers', value: summary.activeDrivers, icon: UserCheck, color: 'from-green-500 to-green-600' },
    { label: 'Total Trip Amount', value: `₹${summary.totalTripAmount.toLocaleString('en-IN')}`, icon: Wallet, color: 'from-primary to-primary/70' },
    { label: 'Total Expenses', value: `₹${summary.totalExpenses.toLocaleString('en-IN')}`, icon: Receipt, color: 'from-orange-500 to-orange-600' },
    { label: 'Total Payments', value: `₹${summary.totalPayments.toLocaleString('en-IN')}`, icon: Banknote, color: 'from-purple-500 to-purple-600' },
    { label: 'Outstanding', value: `₹${summary.outstanding.toLocaleString('en-IN')}`, icon: AlertCircle, color: summary.outstanding > 0 ? 'from-red-500 to-red-600' : 'from-green-500 to-green-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map(c => (
          <Card key={c.label} className={`bg-gradient-to-br ${c.color} text-white border-0`}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1">
                <c.icon className="h-4 w-4 opacity-80" />
              </div>
              <p className="text-[11px] opacity-90">{c.label}</p>
              <p className="text-lg font-bold">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold mb-3">Monthly Payments vs Expenses</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="payments" stroke="#a855f7" strokeWidth={2} />
                <Line type="monotone" dataKey="expenses" stroke="#f97316" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold mb-3">Top Drivers by Earnings</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topDrivers}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="total" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

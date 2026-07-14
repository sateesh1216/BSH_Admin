import { useCallback, useEffect, useState } from 'react';
import { LayoutDashboard, Users, BookOpen, Receipt, Banknote, FileBarChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loading } from '@/components/ui/loading';
import { Driver, DriversList } from '@/components/drivers/DriversList';
import { DriverExpense, DriverExpensesPage } from '@/components/drivers/DriverExpensesPage';
import { DriverPayment, DriverPaymentsPage } from '@/components/drivers/DriverPaymentsPage';
import { DriverLedger, TripAmount } from '@/components/drivers/DriverLedger';
import { DriversDashboard } from '@/components/drivers/DriversDashboard';
import { DriverModuleReports } from '@/components/drivers/DriverModuleReports';

type Tab = 'dashboard' | 'drivers' | 'ledger' | 'expenses' | 'payments' | 'reports';

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'drivers', label: 'Drivers', icon: Users },
  { key: 'ledger', label: 'Ledger', icon: BookOpen },
  { key: 'expenses', label: 'Expenses', icon: Receipt },
  { key: 'payments', label: 'Payments', icon: Banknote },
  { key: 'reports', label: 'Reports', icon: FileBarChart },
];

export const DriversModule = () => {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [tripAmounts, setTripAmounts] = useState<TripAmount[]>([]);
  const [expenses, setExpenses] = useState<DriverExpense[]>([]);
  const [payments, setPayments] = useState<DriverPayment[]>([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [dRes, taRes, eRes, pRes] = await Promise.all([
        supabase.from('drivers').select('*').order('name'),
        supabase.from('driver_trip_amounts').select('*, trips(date)').order('created_at', { ascending: false }),
        supabase.from('driver_expenses').select('*').order('expense_date', { ascending: false }),
        supabase.from('driver_payments').select('*').order('payment_date', { ascending: false }),
      ]);
      if (dRes.error) throw dRes.error;
      if (taRes.error) throw taRes.error;
      if (eRes.error) throw eRes.error;
      if (pRes.error) throw pRes.error;
      setDrivers((dRes.data || []) as Driver[]);
      setTripAmounts((taRes.data || []).map((r: any) => ({ ...r, trip_date: r.trips?.date })));
      setExpenses((eRes.data || []) as DriverExpense[]);
      setPayments((pRes.data || []) as DriverPayment[]);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to load driver data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-foreground">Driver Management</h2>
        <p className="text-sm text-muted-foreground">Master, ledger, expenses, payments and reports</p>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
              tab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16"><Loading text="Loading driver data..." /></div>
      ) : (
        <>
          {tab === 'dashboard' && <DriversDashboard drivers={drivers} tripAmounts={tripAmounts} expenses={expenses} payments={payments} />}
          {tab === 'drivers' && <DriversList drivers={drivers} onChanged={fetchAll} />}
          {tab === 'ledger' && <DriverLedger drivers={drivers} tripAmounts={tripAmounts} expenses={expenses} payments={payments} />}
          {tab === 'expenses' && <DriverExpensesPage drivers={drivers} expenses={expenses} onChanged={fetchAll} />}
          {tab === 'payments' && <DriverPaymentsPage drivers={drivers} payments={payments} onChanged={fetchAll} />}
          {tab === 'reports' && <DriverModuleReports drivers={drivers} tripAmounts={tripAmounts} expenses={expenses} payments={payments} />}
        </>
      )}
    </div>
  );
};

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, UserCheck, UserX, LogIn, Activity, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, format } from 'date-fns';
import { CombinedBulkInvoiceModal } from '@/components/invoice/CombinedBulkInvoiceModal';

export const AdminDashboard = () => {
  const [isCombinedInvoiceOpen, setIsCombinedInvoiceOpen] = useState(false);
  // Fetch all users
  const { data: users = [] } = useQuery({
    queryKey: ['admin-users-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch today's logins
  const { data: todayLogins = [] } = useQuery({
    queryKey: ['admin-today-logins'],
    queryFn: async () => {
      const today = startOfDay(new Date()).toISOString();
      const { data, error } = await supabase
        .from('login_history')
        .select('*')
        .gte('login_at', today);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch pending access requests
  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['admin-pending-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('access_requests')
        .select('*')
        .eq('status', 'pending');
      if (error) throw error;
      return data || [];
    },
  });

  const totalUsers = users.length;
  const activeUsers = users.filter((u: any) => u.status === 'active' || !u.status).length;
  const inactiveUsers = users.filter((u: any) => u.status === 'inactive' || u.status === 'paused').length;
  const loginsToday = todayLogins.length;

  const stats = [
    {
      title: 'Total Users',
      value: totalUsers,
      icon: Users,
      gradient: 'from-blue-500 to-indigo-500',
      ring: 'ring-blue-500/20',
    },
    {
      title: 'Active Users',
      value: activeUsers,
      icon: UserCheck,
      gradient: 'from-emerald-500 to-green-500',
      ring: 'ring-emerald-500/20',
    },
    {
      title: 'Inactive Users',
      value: inactiveUsers,
      icon: UserX,
      gradient: 'from-rose-500 to-red-500',
      ring: 'ring-rose-500/20',
    },
    {
      title: 'Logins Today',
      value: loginsToday,
      icon: LogIn,
      gradient: 'from-violet-500 to-purple-500',
      ring: 'ring-violet-500/20',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">At a glance</h1>
          <p className="text-sm text-muted-foreground">Overview of your user management system</p>
        </div>
        <Button onClick={() => setIsCombinedInvoiceOpen(true)} className="gap-2">
          <FileText className="h-4 w-4" />
          Combined Bulk Invoice
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className={`relative overflow-hidden border-0 ring-1 ${stat.ring} shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-[0.08]`} />
            <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${stat.gradient} opacity-20 blur-2xl`} />
            <CardHeader className="relative flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.gradient} text-white shadow-sm`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-500" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-muted-foreground">All systems operational</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Pending Requests:</span>
              <span className="ml-2 font-semibold">{pendingRequests.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Last Updated:</span>
              <span className="ml-2 font-semibold">{format(new Date(), 'HH:mm:ss')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <CombinedBulkInvoiceModal isOpen={isCombinedInvoiceOpen} onClose={() => setIsCombinedInvoiceOpen(false)} />
    </div>
  );
};

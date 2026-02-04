import { useQuery } from '@tanstack/react-query';
import { Users, UserCheck, UserX, LogIn, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, format } from 'date-fns';

export const AdminDashboard = () => {
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
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    },
    {
      title: 'Active Users',
      value: activeUsers,
      icon: UserCheck,
      color: 'text-green-600 bg-green-100 dark:bg-green-900/30',
    },
    {
      title: 'Inactive Users',
      value: inactiveUsers,
      icon: UserX,
      color: 'text-red-600 bg-red-100 dark:bg-red-900/30',
    },
    {
      title: 'Logins Today',
      value: loginsToday,
      icon: LogIn,
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of your user management system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
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
    </div>
  );
};

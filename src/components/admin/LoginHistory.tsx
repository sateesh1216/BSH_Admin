import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { History, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface LoginRecord {
  id: string;
  user_id: string;
  login_at: string;
  ip_address: string | null;
  user_agent: string | null;
  user_name?: string;
  user_email?: string;
}

interface LoginHistoryProps {
  searchTerm?: string;
}

export const LoginHistory = ({ searchTerm = '' }: LoginHistoryProps) => {
  // Fetch login history with user details
  const { data: loginHistory = [], isLoading } = useQuery({
    queryKey: ['login-history'],
    queryFn: async () => {
      const { data: logins, error } = await supabase
        .from('login_history')
        .select('*')
        .order('login_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;

      // Fetch user profiles
      const userIds = [...new Set(logins?.map(l => l.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return (logins || []).map(login => ({
        ...login,
        user_name: profileMap.get(login.user_id)?.full_name || 'Unknown',
        user_email: profileMap.get(login.user_id)?.username || 'Unknown',
      })) as LoginRecord[];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Login History</h1>
        <p className="text-muted-foreground">Track user login activity and sessions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent Logins
          </CardTitle>
          <CardDescription>Last 100 login events across all users</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading login history...</div>
          ) : loginHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No login history available
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Login Time</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Device</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loginHistory.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{record.user_name}</p>
                          <p className="text-xs text-muted-foreground">{record.user_email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{format(new Date(record.login_at), 'MMM d, yyyy')}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(record.login_at), 'HH:mm:ss')}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{record.ip_address || 'Unknown'}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {record.user_agent ? (
                        record.user_agent.includes('Mobile') ? 'Mobile' : 
                        record.user_agent.includes('Windows') ? 'Windows' :
                        record.user_agent.includes('Mac') ? 'Mac' :
                        record.user_agent.includes('Linux') ? 'Linux' : 'Browser'
                      ) : 'Unknown'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

import { useState } from 'react';
import { LayoutDashboard, UserPlus, Users, History, BarChart3, Settings, Search, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AdminDashboard } from './AdminDashboard';
import { AccessRequests } from './AccessRequests';
import { UsersList } from './UsersList';
import { LoginHistory } from './LoginHistory';
import { FuelRateSettings } from './FuelRateSettings';

type AdminTab = 'dashboard' | 'access-requests' | 'users' | 'login-history' | 'reports' | 'settings';

interface AdminPanelProps {
  onNavigateToReports?: () => void;
}

const TAB_META: Record<AdminTab, { label: string; description: string; searchPlaceholder?: string }> = {
  dashboard: { label: 'Dashboard', description: 'System overview & quick actions' },
  'access-requests': { label: 'Access Requests', description: 'Approve or reject new sign-ups', searchPlaceholder: 'Search by name, email, or role...' },
  users: { label: 'Users', description: 'Manage user accounts and roles', searchPlaceholder: 'Search by name, email, or role...' },
  'login-history': { label: 'Login History', description: 'Recent sign-in activity', searchPlaceholder: 'Search by user, email, or IP...' },
  reports: { label: 'Reports', description: 'Generated business reports' },
  settings: { label: 'Settings', description: 'Fuel rates and preferences' },
};

export const AdminPanel = ({ onNavigateToReports }: AdminPanelProps) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');

  const navItems = [
    { id: 'dashboard' as AdminTab, icon: LayoutDashboard },
    { id: 'access-requests' as AdminTab, icon: UserPlus },
    { id: 'users' as AdminTab, icon: Users },
    { id: 'login-history' as AdminTab, icon: History },
    { id: 'reports' as AdminTab, icon: BarChart3 },
    { id: 'settings' as AdminTab, icon: Settings },
  ];

  const handleTabClick = (tabId: AdminTab) => {
    if (tabId === 'reports' && onNavigateToReports) {
      onNavigateToReports();
      return;
    }
    setActiveTab(tabId);
    setSearchTerm('');
  };

  const meta = TAB_META[activeTab];
  const showSearch = !!meta.searchPlaceholder;

  return (
    <div className="flex flex-col md:flex-row min-h-[600px] rounded-xl border bg-card overflow-hidden shadow-sm">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-60 border-b md:border-b-0 md:border-r bg-gradient-to-b from-primary/10 via-primary/5 to-transparent flex-shrink-0">
        <div className="p-4 border-b flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground shadow-sm">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Admin Panel</p>
            <p className="text-[11px] text-muted-foreground leading-tight">Control center</p>
          </div>
        </div>
        <nav className="p-2 space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={cn(
                  "group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative",
                  isActive
                    ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-primary-foreground/80" />
                )}
                <item.icon className={cn("h-4 w-4 flex-shrink-0 transition-transform", isActive ? "scale-110" : "group-hover:scale-110")} />
                <span>{TAB_META[item.id].label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="border-b bg-gradient-to-r from-background via-primary/5 to-background px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight">{meta.label}</h2>
              <p className="text-sm text-muted-foreground">{meta.description}</p>
            </div>
            {showSearch && (
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={meta.searchPlaceholder}
                  className="pl-9 pr-9 bg-background"
                />
                {searchTerm && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  >
                    ✕
                  </Button>
                )}
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 p-6 overflow-auto">
          {activeTab === 'dashboard' && <AdminDashboard />}
          {activeTab === 'access-requests' && <AccessRequests searchTerm={searchTerm} />}
          {activeTab === 'users' && <UsersList searchTerm={searchTerm} />}
          {activeTab === 'login-history' && <LoginHistory searchTerm={searchTerm} />}
          {activeTab === 'settings' && <FuelRateSettings />}
        </div>
      </main>
    </div>
  );
};

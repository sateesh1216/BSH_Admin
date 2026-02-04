import { useState } from 'react';
import { LayoutDashboard, UserPlus, Users, History, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdminDashboard } from './AdminDashboard';
import { AccessRequests } from './AccessRequests';
import { UsersList } from './UsersList';
import { LoginHistory } from './LoginHistory';

type AdminTab = 'dashboard' | 'access-requests' | 'users' | 'login-history' | 'reports' | 'settings';

interface AdminPanelProps {
  onNavigateToReports?: () => void;
}

export const AdminPanel = ({ onNavigateToReports }: AdminPanelProps) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  const navItems = [
    { id: 'dashboard' as AdminTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'access-requests' as AdminTab, label: 'Access Requests', icon: UserPlus },
    { id: 'users' as AdminTab, label: 'Users', icon: Users },
    { id: 'login-history' as AdminTab, label: 'Login History', icon: History },
    { id: 'reports' as AdminTab, label: 'Reports', icon: BarChart3 },
    { id: 'settings' as AdminTab, label: 'Settings', icon: Settings },
  ];

  const handleTabClick = (tabId: AdminTab) => {
    if (tabId === 'reports' && onNavigateToReports) {
      onNavigateToReports();
    } else {
      setActiveTab(tabId);
    }
  };

  return (
    <div className="flex min-h-[600px] rounded-lg border bg-card overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-56 border-r bg-muted/30 flex-shrink-0">
        <div className="p-4 border-b">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Admin Navigation
          </h2>
        </div>
        <nav className="p-2 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                activeTab === item.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        {activeTab === 'dashboard' && <AdminDashboard />}
        {activeTab === 'access-requests' && <AccessRequests />}
        {activeTab === 'users' && <UsersList />}
        {activeTab === 'login-history' && <LoginHistory />}
        {activeTab === 'settings' && (
          <div className="text-center py-12 text-muted-foreground">
            Settings coming soon...
          </div>
        )}
      </main>
    </div>
  );
};

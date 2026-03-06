import { memo, useMemo } from 'react';
import { LogOut, RefreshCw, Bell, History, Upload, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, parseISO } from 'date-fns';
import bshLogo from '@/assets/bsh-logo.png';

interface Trip {
  id: string;
  date: string;
  customer_name: string;
  from_location: string;
  to_location: string;
  trip_amount: number;
}

interface MobileHeaderProps {
  userName: string | null;
  userRole: string | null;
  userEmail?: string;
  upcomingTrips: Trip[];
  onSignOut: () => void;
  onRefresh: () => void;
  onNavigate: (section: string) => void;
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const getInitials = (name: string | null, email?: string) => {
  if (name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
  return email ? email[0].toUpperCase() : 'U';
};

const MobileHeaderComponent = ({ userName, userRole, userEmail, upcomingTrips, onSignOut, onRefresh, onNavigate }: MobileHeaderProps) => {
  const greeting = useMemo(() => getGreeting(), []);
  const initials = useMemo(() => getInitials(userName, userEmail), [userName, userEmail]);
  const displayName = userName || userEmail?.split('@')[0] || 'User';

  return (
    <header className="sticky top-0 z-30 bg-card border-b border-border">
      <div className="px-4 py-3">
        {/* Top row: Logo + actions */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <img src={bshLogo} alt="BSH" className="h-8 w-8 rounded-lg object-contain" />
            <span className="text-sm font-bold text-foreground tracking-tight">BSH Taxi</span>
          </div>
          <div className="flex items-center gap-1">
            {upcomingTrips.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="relative flex items-center justify-center h-9 w-9 rounded-lg hover:bg-accent transition-colors">
                    <Bell className="h-4 w-4 text-foreground" />
                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-bold bg-destructive text-destructive-foreground rounded-full">
                      {upcomingTrips.length}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-0 bg-card border shadow-xl" align="end">
                  <div className="p-2.5 border-b bg-primary text-primary-foreground rounded-t-md">
                    <h3 className="font-semibold flex items-center gap-2 text-xs">
                      <Bell className="h-3.5 w-3.5" />
                      Upcoming Trips ({upcomingTrips.length})
                    </h3>
                  </div>
                  <ScrollArea className="max-h-60">
                    <div className="p-1.5 space-y-1">
                      {upcomingTrips.slice(0, 8).map((trip) => (
                        <div key={trip.id} className="p-2 rounded-md bg-muted/50 border-l-2 border-l-primary">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-[11px] text-foreground truncate">{trip.customer_name}</p>
                              <p className="text-[10px] text-muted-foreground">{trip.from_location} → {trip.to_location}</p>
                            </div>
                            <div className="text-right ml-2 shrink-0">
                              <p className="text-[10px] font-medium text-primary">{format(parseISO(trip.date), 'dd MMM')}</p>
                              <p className="text-[11px] font-semibold">₹{trip.trip_amount.toLocaleString('en-IN')}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            )}
            <Button onClick={onRefresh} variant="ghost" size="icon" className="h-9 w-9">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={onSignOut} variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Greeting row */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-primary-foreground">{initials}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-muted-foreground font-medium">{greeting},</p>
            <p className="text-base font-bold text-foreground truncate leading-tight">{displayName}</p>
            <p className="text-[10px] text-muted-foreground capitalize">{userRole || 'User'}</p>
          </div>
        </div>
      </div>

      {/* Quick access row */}
      <div className="flex items-center gap-2 px-4 pb-3">
        <button
          onClick={() => onNavigate('vehicle-history')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent text-xs font-medium text-accent-foreground hover:bg-accent/80 transition-colors"
        >
          <History className="h-3 w-3" />
          Vehicles
        </button>
        <button
          onClick={() => onNavigate('upload')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent text-xs font-medium text-accent-foreground hover:bg-accent/80 transition-colors"
        >
          <Upload className="h-3 w-3" />
          Upload
        </button>
      </div>
    </header>
  );
};

export const MobileHeader = memo(MobileHeaderComponent);

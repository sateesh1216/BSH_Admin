import { Car, Wrench, Upload, BarChart3, Bus, History, Settings, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

type Section = 'trips' | 'outside-vehicle' | 'drivers' | 'maintenance' | 'vehicle-history' | 'monthly-breakdown' | 'upload' | 'reports' | 'admin';

interface MobileBottomNavProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
  isAdmin: boolean;
}

const navItems: { key: Section; label: string; icon: React.ElementType; adminOnly?: boolean }[] = [
  { key: 'trips', label: 'Trips', icon: Car },
  { key: 'outside-vehicle', label: 'Outside', icon: Bus },
  { key: 'drivers', label: 'Drivers', icon: Truck },
  { key: 'maintenance', label: 'Service', icon: Wrench },
  { key: 'reports', label: 'Reports', icon: BarChart3 },
  { key: 'admin', label: 'Admin', icon: Settings, adminOnly: true },
];

export const MobileBottomNav = ({ activeSection, onSectionChange, isAdmin }: MobileBottomNavProps) => {
  const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-1">
        {visibleItems.map((item) => {
          const isActive = activeSection === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onSectionChange(item.key)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-lg transition-all duration-200",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200",
                isActive && "bg-primary/10"
              )}>
                <item.icon className={cn("h-[18px] w-[18px]", isActive && "text-primary")} />
              </div>
              <span className={cn(
                "text-[10px] font-medium leading-tight",
                isActive && "font-semibold text-primary"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

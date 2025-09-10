import { useState } from 'react';
import { Car, Wrench, Upload, FileText, Settings, Plus, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { DateRangeFilter, FilterOptions } from '@/components/filters/DateRangeFilter';

const menuItems = [
  { 
    title: 'Trips', 
    icon: Car, 
    key: 'trips',
    description: 'Manage trip records'
  },
  { 
    title: 'Maintenance', 
    icon: Wrench, 
    key: 'maintenance',
    description: 'Vehicle maintenance logs'
  },
  { 
    title: 'Upload', 
    icon: Upload, 
    key: 'upload',
    description: 'Import data from files'
  },
  { 
    title: 'Reports', 
    icon: FileText, 
    key: 'reports',
    description: 'Generate reports'
  },
  { 
    title: 'Settings', 
    icon: Settings, 
    key: 'settings',
    description: 'Application settings'
  },
];

interface AppSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onAddNew: (section: string) => void;
  onFilterChange?: (filter: FilterOptions) => void;
}

export function AppSidebar({ activeSection, onSectionChange, onAddNew, onFilterChange }: AppSidebarProps) {
  const { state } = useSidebar();

  const isActive = (key: string) => activeSection === key;

  return (
    <Sidebar className={`${state === 'collapsed' ? 'w-14' : 'w-64'} bg-gradient-to-b from-green-light to-accent border-r border-primary/20`} collapsible="icon">
      <SidebarTrigger className="m-2 self-end text-primary hover:bg-accent" />
      
      <SidebarContent className="bg-transparent">
        {/* Date Filter Section */}
        {(activeSection === 'trips' || activeSection === 'maintenance' || activeSection === 'reports') && onFilterChange && (
          <SidebarGroup className="px-2 mb-4">
            <div className={state !== 'collapsed' ? 'block' : 'hidden'}>
              <DateRangeFilter onFilterChange={onFilterChange} />
            </div>
          </SidebarGroup>
        )}
        
        <SidebarGroup className="px-2">
          <SidebarGroupLabel className="text-primary font-bold text-lg mb-4 px-2">
            Navigation
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton 
                    asChild
                    className={`${isActive(item.key) 
                      ? 'bg-primary text-primary-foreground shadow-lg' 
                      : 'hover:bg-accent/70 text-foreground'
                    } cursor-pointer transition-all duration-200 rounded-lg mx-1`}
                  >
                    <div 
                      onClick={() => onSectionChange(item.key)}
                      className="flex items-center gap-3 p-3"
                    >
                      <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive(item.key) ? 'text-primary-foreground' : 'text-primary'}`} />
                      {state !== 'collapsed' && (
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm">{item.title}</div>
                          <div className={`text-xs truncate ${isActive(item.key) ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                            {item.description}
                          </div>
                        </div>
                      )}
                    </div>
                  </SidebarMenuButton>
                  
                  {state !== 'collapsed' && isActive(item.key) && (item.key === 'trips' || item.key === 'maintenance') && (
                    <div className="ml-8 mt-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onAddNew(item.key)}
                        className="h-8 text-xs bg-background/50 hover:bg-primary/10 text-primary border border-primary/20 rounded-md"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add New {item.title.slice(0, -1)}
                      </Button>
                    </div>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
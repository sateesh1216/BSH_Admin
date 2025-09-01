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
}

export function AppSidebar({ activeSection, onSectionChange, onAddNew }: AppSidebarProps) {
  const { state } = useSidebar();

  const isActive = (key: string) => activeSection === key;

  return (
    <Sidebar className={state === 'collapsed' ? 'w-14' : 'w-64'} collapsible="icon">
      <SidebarTrigger className="m-2 self-end" />
      
      <SidebarContent className="bg-sidebar">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground font-semibold">
            Navigation
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton 
                    asChild
                    className={`${isActive(item.key) 
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                      : 'hover:bg-sidebar-accent/50'
                    } cursor-pointer transition-colors`}
                  >
                    <div 
                      onClick={() => onSectionChange(item.key)}
                      className="flex items-center gap-3 p-2"
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {state !== 'collapsed' && (
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{item.title}</div>
                          <div className="text-xs text-sidebar-foreground/70 truncate">
                            {item.description}
                          </div>
                        </div>
                      )}
                    </div>
                  </SidebarMenuButton>
                  
                  {state !== 'collapsed' && isActive(item.key) && (item.key === 'trips' || item.key === 'maintenance') && (
                    <div className="ml-6 mt-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onAddNew(item.key)}
                        className="h-7 text-xs text-sidebar-foreground hover:bg-sidebar-accent"
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
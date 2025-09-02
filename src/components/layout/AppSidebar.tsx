import { useState } from 'react';
import { TrendingUp, TrendingDown, PiggyBank, BarChart3, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    icon: TrendingUp, 
    key: 'trips',
    description: 'Income'
  },
  { 
    title: 'Maintenance', 
    icon: TrendingDown, 
    key: 'maintenance',
    description: 'Expenses'
  },
  { 
    title: 'Upload', 
    icon: PiggyBank, 
    key: 'upload',
    description: 'Savings'
  },
  { 
    title: 'Reports', 
    icon: BarChart3, 
    key: 'reports',
    description: 'Reports'
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
    <Sidebar className={`${state === 'collapsed' ? 'w-14' : 'w-64'} bg-white border-r border-gray-200`} collapsible="icon">
      <SidebarTrigger className="m-2 self-end text-gray-600 hover:text-gray-800 hover:bg-gray-100" />
      
      <SidebarContent className="bg-white p-4">
        <div className="space-y-6">
          {/* Sections */}
          <Card className="bg-white border border-gray-200 shadow-sm rounded-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-gray-900 font-medium text-base">
                Sections
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {menuItems.map((item) => (
                <div
                  key={item.key}
                  onClick={() => onSectionChange(item.key)}
                  className={`${
                    isActive(item.key) 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } cursor-pointer transition-all duration-200 rounded-lg p-3 flex items-center gap-3`}
                >
                  <item.icon className={`h-4 w-4 flex-shrink-0 ${
                    isActive(item.key) ? 'text-white' : 'text-blue-500'
                  }`} />
                  {state !== 'collapsed' && (
                    <span className="font-medium text-sm">{item.description}</span>
                  )}
                </div>
              ))}
              
              {/* Add New Button */}
              {state !== 'collapsed' && (activeSection === 'trips' || activeSection === 'maintenance') && (
                <div className="pt-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onAddNew(activeSection)}
                    className="w-full h-8 text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-md"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add New {activeSection === 'trips' ? 'Trip' : 'Maintenance'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
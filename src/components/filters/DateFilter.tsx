import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Filter } from 'lucide-react';

export interface DateFilterOptions {
  type: 'all' | 'monthly' | 'yearly';
  month?: string;
  year?: string;
}

interface DateFilterProps {
  onFilterChange: (filter: DateFilterOptions) => void;
  currentFilter: DateFilterOptions;
}

export const DateFilter = ({ onFilterChange, currentFilter }: DateFilterProps) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleTypeChange = (type: 'all' | 'monthly' | 'yearly') => {
    if (type === 'all') {
      onFilterChange({ type: 'all' });
    } else if (type === 'monthly') {
      const month = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
      onFilterChange({ type: 'monthly', month });
    } else {
      onFilterChange({ type: 'yearly', year: String(currentYear) });
    }
  };

  const handleMonthChange = (month: string) => {
    const year = currentFilter.month?.split('-')[0] || String(currentYear);
    onFilterChange({ type: 'monthly', month: `${year}-${month}` });
  };

  const handleYearChange = (year: string) => {
    if (currentFilter.type === 'monthly') {
      const monthNum = currentFilter.month?.split('-')[1] || '01';
      onFilterChange({ type: 'monthly', month: `${year}-${monthNum}` });
    } else {
      onFilterChange({ type: 'yearly', year });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/30 rounded-lg border">
      <Filter className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-medium text-muted-foreground">Filter:</span>
      
      {/* Filter Type Buttons */}
      <div className="flex gap-1">
        <Button
          variant={currentFilter.type === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleTypeChange('all')}
          className="text-xs"
        >
          All
        </Button>
        <Button
          variant={currentFilter.type === 'monthly' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleTypeChange('monthly')}
          className="text-xs"
        >
          Monthly
        </Button>
        <Button
          variant={currentFilter.type === 'yearly' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleTypeChange('yearly')}
          className="text-xs"
        >
          Yearly
        </Button>
      </div>

      {/* Year Selector */}
      {(currentFilter.type === 'monthly' || currentFilter.type === 'yearly') && (
        <Select
          value={currentFilter.type === 'monthly' 
            ? currentFilter.month?.split('-')[0] || String(currentYear)
            : currentFilter.year || String(currentYear)
          }
          onValueChange={handleYearChange}
        >
          <SelectTrigger className="w-24 h-8 text-xs">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {years.map(year => (
              <SelectItem key={year} value={String(year)}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Month Selector */}
      {currentFilter.type === 'monthly' && (
        <Select
          value={currentFilter.month?.split('-')[1] || String(currentMonth + 1).padStart(2, '0')}
          onValueChange={handleMonthChange}
        >
          <SelectTrigger className="w-28 h-8 text-xs">
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            {months.map((month, index) => (
              <SelectItem key={month} value={String(index + 1).padStart(2, '0')}>
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

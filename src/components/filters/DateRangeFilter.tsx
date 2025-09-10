import { useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DateRangeFilterProps {
  onFilterChange: (filter: FilterOptions) => void;
}

export interface FilterOptions {
  type: 'monthly' | 'yearly' | 'custom';
  startDate?: Date;
  endDate?: Date;
  month?: string;
  year?: string;
}

export function DateRangeFilter({ onFilterChange }: DateRangeFilterProps) {
  const [filterType, setFilterType] = useState<'monthly' | 'yearly' | 'custom'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedYear, setSelectedYear] = useState(format(new Date(), 'yyyy'));
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = format(date, 'yyyy-MM');
      const label = format(date, 'MMMM yyyy');
      options.push({ value, label });
    }
    return options;
  };

  const generateYearOptions = () => {
    const options = [];
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 5; i++) {
      const year = currentYear - i;
      options.push({ value: year.toString(), label: year.toString() });
    }
    return options;
  };

  const handleFilterTypeChange = (type: 'monthly' | 'yearly' | 'custom') => {
    setFilterType(type);
    
    if (type === 'monthly') {
      onFilterChange({ type, month: selectedMonth });
    } else if (type === 'yearly') {
      onFilterChange({ type, year: selectedYear });
    } else {
      onFilterChange({ type, startDate, endDate });
    }
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    onFilterChange({ type: 'monthly', month });
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    onFilterChange({ type: 'yearly', year });
  };

  const handleCustomDateChange = () => {
    onFilterChange({ type: 'custom', startDate, endDate });
  };

  return (
    <Card className="mb-4 bg-gradient-to-r from-green-light to-accent border-primary/20 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-primary font-semibold text-sm">
          <CalendarIcon className="h-4 w-4 text-primary" />
          Date Filter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">Filter Type</label>
            <Select value={filterType} onValueChange={handleFilterTypeChange}>
              <SelectTrigger className="w-full bg-background border-primary/30 hover:border-primary focus:ring-primary h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-primary/20">
                <SelectItem value="yearly" className="hover:bg-accent">Year</SelectItem>
                <SelectItem value="monthly" className="hover:bg-accent">Month</SelectItem>
                <SelectItem value="custom" className="hover:bg-accent">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filterType === 'yearly' && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">Select Year</label>
              <Select value={selectedYear} onValueChange={handleYearChange}>
                <SelectTrigger className="w-full bg-background border-primary/30 hover:border-primary focus:ring-primary h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-primary/20">
                  {generateYearOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value} className="hover:bg-accent">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {filterType === 'monthly' && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">Select Month</label>
              <Select value={selectedMonth} onValueChange={handleMonthChange}>
                <SelectTrigger className="w-full bg-background border-primary/30 hover:border-primary focus:ring-primary h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-primary/20 max-h-60">
                  {generateMonthOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value} className="hover:bg-accent">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {filterType === 'custom' && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">Custom Date Range</label>
              <div className="space-y-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start bg-background border-primary/30 hover:border-primary hover:bg-accent h-8 text-xs"
                    >
                      <CalendarIcon className="mr-1 h-3 w-3 text-primary" />
                      {startDate ? format(startDate, 'MMM dd, yyyy') : 'Start date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover border-primary/20" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        setStartDate(date);
                        if (date && endDate) {
                          handleCustomDateChange();
                        }
                      }}
                      initialFocus
                      className="bg-popover pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start bg-background border-primary/30 hover:border-primary hover:bg-accent h-8 text-xs"
                    >
                      <CalendarIcon className="mr-1 h-3 w-3 text-primary" />
                      {endDate ? format(endDate, 'MMM dd, yyyy') : 'End date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover border-primary/20" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => {
                        setEndDate(date);
                        if (startDate && date) {
                          handleCustomDateChange();
                        }
                      }}
                      initialFocus
                      className="bg-popover pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>

                <Button 
                  onClick={handleCustomDateChange} 
                  size="sm"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-7 text-xs"
                  disabled={!startDate || !endDate}
                >
                  Apply Filter
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
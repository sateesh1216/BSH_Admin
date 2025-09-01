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
    <Card className="mb-6 bg-gradient-to-r from-green-light to-accent border-primary/20 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-primary font-semibold">
          <CalendarIcon className="h-5 w-5 text-primary" />
          Date Filter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">Filter Type</label>
            <Select value={filterType} onValueChange={handleFilterTypeChange}>
              <SelectTrigger className="w-40 bg-background border-primary/30 hover:border-primary focus:ring-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-primary/20">
                <SelectItem value="monthly" className="hover:bg-accent">Monthly</SelectItem>
                <SelectItem value="yearly" className="hover:bg-accent">Yearly</SelectItem>
                <SelectItem value="custom" className="hover:bg-accent">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filterType === 'monthly' && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">Select Month</label>
              <Select value={selectedMonth} onValueChange={handleMonthChange}>
                <SelectTrigger className="w-48 bg-background border-primary/30 hover:border-primary focus:ring-primary">
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

          {filterType === 'yearly' && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">Select Year</label>
              <Select value={selectedYear} onValueChange={handleYearChange}>
                <SelectTrigger className="w-32 bg-background border-primary/30 hover:border-primary focus:ring-primary">
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

          {filterType === 'custom' && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">Custom Date Range</label>
              <div className="flex flex-wrap gap-2 items-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-40 justify-start bg-background border-primary/30 hover:border-primary hover:bg-accent"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                      {startDate ? format(startDate, 'PPP') : 'Start date'}
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
                      className="bg-popover"
                    />
                  </PopoverContent>
                </Popover>

                <span className="text-muted-foreground font-medium">to</span>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-40 justify-start bg-background border-primary/30 hover:border-primary hover:bg-accent"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                      {endDate ? format(endDate, 'PPP') : 'End date'}
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
                      className="bg-popover"
                    />
                  </PopoverContent>
                </Popover>

                <Button 
                  onClick={handleCustomDateChange} 
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
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
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
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Date Filter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 items-center">
          <Select value={filterType} onValueChange={handleFilterTypeChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          {filterType === 'monthly' && (
            <Select value={selectedMonth} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {generateMonthOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {filterType === 'yearly' && (
            <Select value={selectedYear} onValueChange={handleYearChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {generateYearOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {filterType === 'custom' && (
            <div className="flex gap-2 items-center">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-40">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : 'Start date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <span className="text-muted-foreground">to</span>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-40">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP') : 'End date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Button onClick={handleCustomDateChange} size="sm">
                Apply
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
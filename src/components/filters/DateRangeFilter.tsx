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
  variant?: 'default' | 'year-month';
  compact?: boolean;
}

export interface FilterOptions {
  type: 'monthly' | 'yearly' | 'custom';
  startDate?: Date;
  endDate?: Date;
  month?: string;
  year?: string;
}

export function DateRangeFilter({ onFilterChange, variant = 'default', compact = false }: DateRangeFilterProps) {
  const [filterType, setFilterType] = useState<'monthly' | 'yearly' | 'custom'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedYear, setSelectedYear] = useState(format(new Date(), 'yyyy'));
const [startDate, setStartDate] = useState<Date | undefined>();
const [endDate, setEndDate] = useState<Date | undefined>();
const [selectedMonthYM, setSelectedMonthYM] = useState(format(new Date(), 'MM'));

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
    compact ? (
      variant === 'year-month' ? (
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-foreground">Year</label>
            <Select
              value={selectedYear}
              onValueChange={(year) => {
                setSelectedYear(year);
                if (selectedMonthYM) {
                  onFilterChange({ type: 'monthly', month: `${year}-${selectedMonthYM}` });
                } else {
                  onFilterChange({ type: 'yearly', year });
                }
              }}
            >
              <SelectTrigger className="w-28 bg-background border-primary/30">
                <SelectValue placeholder="Year" />
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

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-foreground">Month</label>
            <Select
              value={selectedMonthYM}
              onValueChange={(m) => {
                setSelectedMonthYM(m);
                if (selectedYear) {
                  onFilterChange({ type: 'monthly', month: `${selectedYear}-${m}` });
                }
              }}
            >
              <SelectTrigger className="w-32 bg-background border-primary/30">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-primary/20 max-h-60">
                {Array.from({ length: 12 }, (_, i) => {
                  const value = String(i + 1).padStart(2, '0');
                  const label = format(new Date(2000, i, 1), 'MMMM');
                  return (
                    <SelectItem key={value} value={value} className="hover:bg-accent">
                      {label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-foreground">Filter Type</label>
            <Select value={filterType} onValueChange={handleFilterTypeChange}>
              <SelectTrigger className="w-40 bg-background border-primary/30">
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
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-foreground">Select Month</label>
              <Select value={selectedMonth} onValueChange={handleMonthChange}>
                <SelectTrigger className="w-48 bg-background border-primary/30">
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
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-foreground">Select Year</label>
              <Select value={selectedYear} onValueChange={handleYearChange}>
                <SelectTrigger className="w-32 bg-background border-primary/30">
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
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-foreground">Custom Date Range</label>
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
                          onFilterChange({ type: 'custom', startDate: date, endDate });
                        }
                      }}
                      initialFocus
                      className="p-3 pointer-events-auto bg-popover"
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
                          onFilterChange({ type: 'custom', startDate, endDate: date });
                        }
                      }}
                      initialFocus
                      className="p-3 pointer-events-auto bg-popover"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
        </div>
      )
    ) : (
      variant === 'year-month' ? (
        <Card className="mb-6 bg-gradient-to-r from-green-light to-accent border-primary/20 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-primary font-semibold">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Date Filter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">Year</label>
                <Select
                  value={selectedYear}
                  onValueChange={(year) => {
                    setSelectedYear(year);
                    if (selectedMonthYM) {
                      onFilterChange({ type: 'monthly', month: `${year}-${selectedMonthYM}` });
                    } else {
                      onFilterChange({ type: 'yearly', year });
                    }
                  }}
                >
                  <SelectTrigger className="w-32 bg-background border-primary/30">
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

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">Month</label>
                <Select
                  value={selectedMonthYM}
                  onValueChange={(m) => {
                    setSelectedMonthYM(m);
                    if (selectedYear) {
                      onFilterChange({ type: 'monthly', month: `${selectedYear}-${m}` });
                    }
                  }}
                >
                  <SelectTrigger className="w-40 bg-background border-primary/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-primary/20 max-h-60">
                    {Array.from({ length: 12 }, (_, i) => {
                      const value = String(i + 1).padStart(2, '0');
                      const label = format(new Date(2000, i, 1), 'MMMM');
                      return (
                        <SelectItem key={value} value={value} className="hover:bg-accent">
                          {label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
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
                              onFilterChange({ type: 'custom', startDate: date, endDate });
                            }
                          }}
                          initialFocus
                          className="p-3 pointer-events-auto bg-popover"
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
                              onFilterChange({ type: 'custom', startDate, endDate: date });
                            }
                          }}
                          initialFocus
                          className="p-3 pointer-events-auto bg-popover"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )
    )
  );

}
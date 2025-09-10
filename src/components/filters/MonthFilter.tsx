import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MonthFilterProps {
  onFilterChange: (month: string) => void;
}

export function MonthFilter({ onFilterChange }: MonthFilterProps) {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

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

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    onFilterChange(month);
  };

  return (
    <Card className="mb-4 bg-gradient-to-r from-green-light to-accent border-primary/20 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-primary font-semibold text-sm">
          <Calendar className="h-4 w-4 text-primary" />
          Select Month
        </CardTitle>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}
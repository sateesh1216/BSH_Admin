import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Car, TrendingUp, Calculator } from 'lucide-react';
import { memo, useMemo } from 'react';

interface SummaryData {
  totalTrips: number;
  totalTripMoney: number;
  totalExpenses: number;
  totalProfit: number;
}

interface DashboardSummaryProps {
  data: SummaryData;
}

const DashboardSummaryComponent = ({ data }: DashboardSummaryProps) => {
  const formatCurrency = useMemo(() => 
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }), []
  );

  const summaryCards = useMemo(() => [
    {
      title: 'Total Trips',
      value: data.totalTrips.toString(),
      icon: Car,
      color: 'text-primary',
    },
    {
      title: 'Total Trip Money',
      value: formatCurrency.format(data.totalTripMoney),
      icon: DollarSign,
      color: 'text-blue-600',
    },
    {
      title: 'Total Expenses',
      value: formatCurrency.format(data.totalExpenses),
      icon: Calculator,
      color: 'text-orange-600',
    },
    {
      title: 'Total Profit',
      value: formatCurrency.format(data.totalProfit),
      icon: TrendingUp,
      color: 'text-green-600',
    },
  ], [data, formatCurrency]);

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {summaryCards.map((card, index) => (
          <Card key={index} className="border-primary/20 bg-card hover:bg-accent/50 transition-all duration-200 shadow-sm hover:shadow-md">
            <CardHeader className="flex flex-col items-start space-y-2 pb-2 p-3 sm:p-4">
              <div className="flex items-center justify-between w-full">
                <card.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${card.color}`} />
              </div>
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground leading-tight">
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className={`text-lg sm:text-xl lg:text-2xl font-bold ${card.color} leading-tight`}>
                {card.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const DashboardSummary = memo(DashboardSummaryComponent);
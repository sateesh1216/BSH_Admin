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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {summaryCards.map((card, index) => (
          <Card key={index} className="border-border bg-card hover:bg-accent/50 transition-all duration-200 shadow-sm hover:shadow-md">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">
                  {card.title}
                </p>
                <p className={`text-lg font-bold ${card.color} leading-tight`}>
                  {card.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const DashboardSummary = memo(DashboardSummaryComponent);
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Car, TrendingUp, Calculator } from 'lucide-react';

interface SummaryData {
  totalTrips: number;
  totalTripMoney: number;
  totalExpenses: number;
  totalProfit: number;
}

interface DashboardSummaryProps {
  data: SummaryData;
}

export const DashboardSummary = ({ data }: DashboardSummaryProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const summaryCards = [
    {
      title: 'Total Trips',
      value: data.totalTrips.toString(),
      icon: Car,
      color: 'text-primary',
    },
    {
      title: 'Total Trip Money',
      value: formatCurrency(data.totalTripMoney),
      icon: DollarSign,
      color: 'text-blue-600',
    },
    {
      title: 'Total Expenses',
      value: formatCurrency(data.totalExpenses),
      icon: Calculator,
      color: 'text-orange-600',
    },
    {
      title: 'Total Profit',
      value: formatCurrency(data.totalProfit),
      icon: TrendingUp,
      color: 'text-green-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {summaryCards.map((card, index) => (
        <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className={`h-5 w-5 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${card.color}`}>
              {card.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
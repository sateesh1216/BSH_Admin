import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Car, TrendingUp, Calculator, Bus, Clock } from 'lucide-react';
import { memo, useMemo } from 'react';
import { DetailType } from './SummaryDetailModal';

interface SummaryData {
  totalTrips: number;
  totalTripMoney: number;
  totalExpenses: number;
  totalProfit: number;
  totalOutsideVehicleTrips?: number;
  totalOutsideVehicleMoney?: number;
  pendingOutsideVehicleMoney?: number;
}

interface DashboardSummaryProps {
  data: SummaryData;
  onCardClick?: (type: DetailType) => void;
}

const DashboardSummaryComponent = ({ data, onCardClick }: DashboardSummaryProps) => {
  const formatCurrency = useMemo(() => 
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }), []
  );

  const mainSummaryCards = useMemo(() => [
    {
      title: 'Total Trips',
      value: data.totalTrips.toString(),
      icon: Car,
      color: 'text-primary',
      type: 'trips' as DetailType,
    },
    {
      title: 'Total Trip Money',
      value: formatCurrency.format(data.totalTripMoney),
      icon: DollarSign,
      color: 'text-blue-600',
      type: 'tripMoney' as DetailType,
    },
    {
      title: 'Total Expenses',
      value: formatCurrency.format(data.totalExpenses),
      icon: Calculator,
      color: 'text-orange-600',
      type: 'expenses' as DetailType,
    },
    {
      title: 'Total Profit',
      value: formatCurrency.format(data.totalProfit),
      icon: TrendingUp,
      color: 'text-green-600',
      type: 'profit' as DetailType,
    },
  ], [data.totalTrips, data.totalTripMoney, data.totalExpenses, data.totalProfit, formatCurrency]);

  const outsideVehicleCards = useMemo(() => [
    {
      title: 'Outside Vehicle Trips',
      value: (data.totalOutsideVehicleTrips ?? 0).toString(),
      icon: Bus,
      color: 'text-purple-600',
    },
    {
      title: 'Outside Vehicle Amount',
      value: formatCurrency.format(data.totalOutsideVehicleMoney ?? 0),
      icon: DollarSign,
      color: 'text-purple-600',
    },
    {
      title: 'Outside Pending',
      value: formatCurrency.format(data.pendingOutsideVehicleMoney ?? 0),
      icon: Clock,
      color: 'text-red-600',
    },
  ], [data.totalOutsideVehicleTrips, data.totalOutsideVehicleMoney, data.pendingOutsideVehicleMoney, formatCurrency]);

  return (
    <div className="w-full space-y-4">
      {/* Main Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {mainSummaryCards.map((card, index) => (
          <Card 
            key={index} 
            className="border-border bg-card hover:bg-accent/50 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer group"
            onClick={() => onCardClick?.(card.type)}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <card.icon className={`h-4 w-4 ${card.color} group-hover:scale-110 transition-transform`} />
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

      {/* Outside Vehicle Summary Cards */}
      {(data.totalOutsideVehicleTrips !== undefined && data.totalOutsideVehicleTrips > 0) && (
        <div className="grid grid-cols-3 gap-4">
          {outsideVehicleCards.map((card, index) => (
            <Card key={index} className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 hover:shadow-md transition-all duration-200">
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
      )}
    </div>
  );
};

export const DashboardSummary = memo(DashboardSummaryComponent);
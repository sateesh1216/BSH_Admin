import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Car, DollarSign, Calculator, TrendingUp, Fuel, Users, Receipt, Wrench, Search } from 'lucide-react';

interface Trip {
  id: string;
  date: string;
  driver_name: string;
  customer_name: string;
  from_location: string;
  to_location: string;
  trip_amount: number;
  driver_amount: number;
  commission: number;
  fuel_amount: number;
  tolls: number;
  profit: number;
}

interface Maintenance {
  id: string;
  date: string;
  vehicle_number: string;
  driver_name: string;
  maintenance_type: string;
  amount: number;
}

export type DetailType = 'trips' | 'tripMoney' | 'expenses' | 'profit' | null;

interface SummaryDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detailType: DetailType;
  trips: Trip[];
  maintenance: Maintenance[];
  summary: {
    totalTrips: number;
    totalTripMoney: number;
    totalExpenses: number;
    totalProfit: number;
    maintenanceExpenses: number;
  };
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);

export const SummaryDetailModal = ({
  open,
  onOpenChange,
  detailType,
  trips,
  maintenance,
  summary,
}: SummaryDetailModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Reset search when modal closes or detail type changes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) setSearchQuery('');
    onOpenChange(isOpen);
  };

  // Filter trips based on search query
  const filteredTrips = useMemo(() => {
    if (!searchQuery.trim()) return trips;
    const query = searchQuery.toLowerCase();
    return trips.filter(
      (t) =>
        t.customer_name.toLowerCase().includes(query) ||
        t.driver_name.toLowerCase().includes(query) ||
        t.from_location.toLowerCase().includes(query) ||
        t.to_location.toLowerCase().includes(query) ||
        t.date.includes(query)
    );
  }, [trips, searchQuery]);

  // Filter maintenance based on search query
  const filteredMaintenance = useMemo(() => {
    if (!searchQuery.trim()) return maintenance;
    const query = searchQuery.toLowerCase();
    return maintenance.filter(
      (m) =>
        m.vehicle_number.toLowerCase().includes(query) ||
        m.driver_name.toLowerCase().includes(query) ||
        m.maintenance_type.toLowerCase().includes(query) ||
        m.date.includes(query)
    );
  }, [maintenance, searchQuery]);

  const tripExpenses = useMemo(() => ({
    driverAmount: filteredTrips.reduce((sum, t) => sum + t.driver_amount, 0),
    commission: filteredTrips.reduce((sum, t) => sum + t.commission, 0),
    fuelAmount: filteredTrips.reduce((sum, t) => sum + t.fuel_amount, 0),
    tolls: filteredTrips.reduce((sum, t) => sum + t.tolls, 0),
  }), [filteredTrips]);

  const getTitle = () => {
    switch (detailType) {
      case 'trips':
        return 'Total Trips Details';
      case 'tripMoney':
        return 'Total Trip Money Details';
      case 'expenses':
        return 'Total Expenses Breakdown';
      case 'profit':
        return 'Profit Details';
      default:
        return '';
    }
  };

  const getIcon = () => {
    switch (detailType) {
      case 'trips':
        return <Car className="h-5 w-5 text-primary" />;
      case 'tripMoney':
        return <DollarSign className="h-5 w-5 text-blue-600" />;
      case 'expenses':
        return <Calculator className="h-5 w-5 text-orange-600" />;
      case 'profit':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      default:
        return null;
    }
  };

  const SearchInput = () => (
    <div className="relative mb-4">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search by name, location, date..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-9"
      />
    </div>
  );

  const renderTripsDetail = () => (
    <div className="space-y-4">
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Car className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'Filtered Trips' : 'Total Trips'}
              </p>
              <p className="text-2xl font-bold text-primary">{filteredTrips.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <SearchInput />
      <ScrollArea className="h-[300px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Route</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTrips.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No trips found matching "{searchQuery}"
                </TableCell>
              </TableRow>
            ) : (
              filteredTrips.map((trip) => (
                <TableRow key={trip.id}>
                  <TableCell className="font-medium">{trip.date}</TableCell>
                  <TableCell>{trip.customer_name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {trip.from_location} → {trip.to_location}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(trip.trip_amount)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );

  const renderTripMoneyDetail = () => {
    const filteredTotal = filteredTrips.reduce((sum, t) => sum + t.trip_amount, 0);
    return (
      <div className="space-y-4">
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? 'Filtered Trip Money' : 'Total Trip Money'}
                </p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(filteredTotal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <SearchInput />
        <ScrollArea className="h-[300px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No trips found matching "{searchQuery}"
                  </TableCell>
                </TableRow>
              ) : (
                filteredTrips.map((trip) => (
                  <TableRow key={trip.id}>
                    <TableCell className="font-medium">{trip.date}</TableCell>
                    <TableCell>{trip.customer_name}</TableCell>
                    <TableCell className="text-muted-foreground">{trip.driver_name}</TableCell>
                    <TableCell className="text-right font-semibold text-blue-600">
                      {formatCurrency(trip.trip_amount)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    );
  };

  const renderExpensesDetail = () => {
    const filteredMaintenanceTotal = filteredMaintenance.reduce((sum, m) => sum + m.amount, 0);
    const filteredTotalExpenses = tripExpenses.driverAmount + tripExpenses.commission + tripExpenses.fuelAmount + tripExpenses.tolls + filteredMaintenanceTotal;

    return (
      <div className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Driver Amount</p>
                  <p className="text-lg font-bold text-orange-600">{formatCurrency(tripExpenses.driverAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Commission</p>
                  <p className="text-lg font-bold text-purple-600">{formatCurrency(tripExpenses.commission)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Fuel className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Fuel Amount</p>
                  <p className="text-lg font-bold text-amber-600">{formatCurrency(tripExpenses.fuelAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-red-50 dark:bg-red-950/20 border-red-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Tolls</p>
                  <p className="text-lg font-bold text-red-600">{formatCurrency(tripExpenses.tolls)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Maintenance Expenses */}
        <Card className="bg-slate-50 dark:bg-slate-950/20 border-slate-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-slate-600" />
              <div>
                <p className="text-xs text-muted-foreground">Maintenance Expenses</p>
                <p className="text-lg font-bold text-slate-600">{formatCurrency(filteredMaintenanceTotal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total */}
        <Card className="bg-orange-100 dark:bg-orange-900/30 border-orange-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calculator className="h-8 w-8 text-orange-600" />
                <p className="text-lg font-semibold">{searchQuery ? 'Filtered Expenses' : 'Total Expenses'}</p>
              </div>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(filteredTotalExpenses)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Search & Maintenance Records */}
        <SearchInput />
        {filteredMaintenance.length > 0 && (
          <>
            <h4 className="font-semibold text-sm text-muted-foreground">Maintenance Records</h4>
            <ScrollArea className="h-[150px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaintenance.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.date}</TableCell>
                      <TableCell>{m.maintenance_type}</TableCell>
                      <TableCell className="text-muted-foreground">{m.vehicle_number}</TableCell>
                      <TableCell className="text-right">{formatCurrency(m.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </>
        )}
        {searchQuery && filteredMaintenance.length === 0 && (
          <p className="text-center text-muted-foreground py-4">No maintenance records found matching "{searchQuery}"</p>
        )}
      </div>
    );
  };

  const renderProfitDetail = () => {
    const filteredProfit = filteredTrips.reduce((sum, t) => sum + t.profit, 0);
    const filteredTripMoney = filteredTrips.reduce((sum, t) => sum + t.trip_amount, 0);
    const filteredExpenses = filteredTrips.reduce((sum, t) => sum + t.driver_amount + t.commission + t.fuel_amount + t.tolls, 0);

    return (
      <div className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Trip Money</p>
              <p className="text-lg font-bold text-blue-600">{formatCurrency(filteredTripMoney)}</p>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Expenses</p>
              <p className="text-lg font-bold text-orange-600">{formatCurrency(filteredExpenses)}</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 dark:bg-green-950/20 border-green-200">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">{searchQuery ? 'Filtered Profit' : 'Net Profit'}</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(filteredProfit)}</p>
            </CardContent>
          </Card>
        </div>

        <SearchInput />

        {/* Profit by Trip */}
        <ScrollArea className="h-[300px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Trip Amount</TableHead>
                <TableHead className="text-right">Expenses</TableHead>
                <TableHead className="text-right">Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No trips found matching "{searchQuery}"
                  </TableCell>
                </TableRow>
              ) : (
                filteredTrips.map((trip) => {
                  const tripExpense = trip.driver_amount + trip.commission + trip.fuel_amount + trip.tolls;
                  return (
                    <TableRow key={trip.id}>
                      <TableCell className="font-medium">{trip.date}</TableCell>
                      <TableCell>{trip.customer_name}</TableCell>
                      <TableCell className="text-right text-blue-600">{formatCurrency(trip.trip_amount)}</TableCell>
                      <TableCell className="text-right text-orange-600">{formatCurrency(tripExpense)}</TableCell>
                      <TableCell className={`text-right font-semibold ${trip.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(trip.profit)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    );
  };

  const renderContent = () => {
    switch (detailType) {
      case 'trips':
        return renderTripsDetail();
      case 'tripMoney':
        return renderTripMoneyDetail();
      case 'expenses':
        return renderExpensesDetail();
      case 'profit':
        return renderProfitDetail();
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {getTitle()}
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto">{renderContent()}</div>
      </DialogContent>
    </Dialog>
  );
};

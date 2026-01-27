import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Car, DollarSign, Calculator, TrendingUp, Fuel, Users, Receipt, Wrench, Search, Download, Bus, Clock } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { toast } from '@/hooks/use-toast';

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

interface OutsideVehicleTrip {
  id: string;
  date: string;
  driver_name: string;
  driver_number: string;
  travel_company: string;
  vehicle_type: string;
  from_location: string;
  to_location: string;
  vehicle_number: string;
  trip_given_company: string;
  payment_mode: string;
  payment_status: string;
  trip_amount: number;
}

export type DetailType = 'trips' | 'tripMoney' | 'expenses' | 'profit' | 'outsideTrips' | 'outsideAmount' | 'outsidePending' | null;

interface SummaryDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detailType: DetailType;
  trips: Trip[];
  maintenance: Maintenance[];
  outsideVehicleTrips?: OutsideVehicleTrip[];
  summary: {
    totalTrips: number;
    totalTripMoney: number;
    totalExpenses: number;
    totalProfit: number;
    maintenanceExpenses: number;
    totalOutsideVehicleTrips?: number;
    totalOutsideVehicleMoney?: number;
    pendingOutsideVehicleMoney?: number;
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
  outsideVehicleTrips = [],
  summary,
}: SummaryDetailModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) setSearchQuery('');
    onOpenChange(isOpen);
  };

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

  const filteredOutsideTrips = useMemo(() => {
    if (!searchQuery.trim()) return outsideVehicleTrips;
    const query = searchQuery.toLowerCase();
    return outsideVehicleTrips.filter(
      (t) =>
        t.driver_name.toLowerCase().includes(query) ||
        t.travel_company.toLowerCase().includes(query) ||
        t.vehicle_number.toLowerCase().includes(query) ||
        t.from_location.toLowerCase().includes(query) ||
        t.to_location.toLowerCase().includes(query) ||
        t.trip_given_company.toLowerCase().includes(query) ||
        t.date.includes(query)
    );
  }, [outsideVehicleTrips, searchQuery]);

  const pendingOutsideTrips = useMemo(() => 
    filteredOutsideTrips.filter(t => t.payment_status === 'pending'),
  [filteredOutsideTrips]);

  const tripExpenses = useMemo(() => ({
    driverAmount: filteredTrips.reduce((sum, t) => sum + t.driver_amount, 0),
    commission: filteredTrips.reduce((sum, t) => sum + t.commission, 0),
    fuelAmount: filteredTrips.reduce((sum, t) => sum + t.fuel_amount, 0),
    tolls: filteredTrips.reduce((sum, t) => sum + t.tolls, 0),
  }), [filteredTrips]);

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    let fileName = 'export';

    switch (detailType) {
      case 'trips':
      case 'tripMoney':
      case 'profit': {
        const data = filteredTrips.map(t => ({
          Date: t.date,
          Customer: t.customer_name,
          Driver: t.driver_name,
          From: t.from_location,
          To: t.to_location,
          'Trip Amount': t.trip_amount,
          'Driver Amount': t.driver_amount,
          Commission: t.commission,
          'Fuel Amount': t.fuel_amount,
          Tolls: t.tolls,
          Profit: t.profit,
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Trips');
        fileName = `trips-${detailType}`;
        break;
      }
      case 'expenses': {
        const tripData = filteredTrips.map(t => ({
          Date: t.date,
          Customer: t.customer_name,
          'Driver Amount': t.driver_amount,
          Commission: t.commission,
          'Fuel Amount': t.fuel_amount,
          Tolls: t.tolls,
        }));
        const ws1 = XLSX.utils.json_to_sheet(tripData);
        XLSX.utils.book_append_sheet(wb, ws1, 'Trip Expenses');

        const maintData = filteredMaintenance.map(m => ({
          Date: m.date,
          Vehicle: m.vehicle_number,
          Type: m.maintenance_type,
          Driver: m.driver_name,
          Amount: m.amount,
        }));
        const ws2 = XLSX.utils.json_to_sheet(maintData);
        XLSX.utils.book_append_sheet(wb, ws2, 'Maintenance');
        fileName = 'expenses';
        break;
      }
      case 'outsideTrips':
      case 'outsideAmount': {
        const data = filteredOutsideTrips.map(t => ({
          Date: t.date,
          Driver: t.driver_name,
          'Travel Company': t.travel_company,
          'Vehicle Type': t.vehicle_type,
          'Vehicle Number': t.vehicle_number,
          From: t.from_location,
          To: t.to_location,
          'Trip Given By': t.trip_given_company,
          'Payment Mode': t.payment_mode,
          'Payment Status': t.payment_status,
          Amount: t.trip_amount,
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Outside Trips');
        fileName = 'outside-vehicle-trips';
        break;
      }
      case 'outsidePending': {
        const data = pendingOutsideTrips.map(t => ({
          Date: t.date,
          Driver: t.driver_name,
          'Travel Company': t.travel_company,
          'Vehicle Number': t.vehicle_number,
          From: t.from_location,
          To: t.to_location,
          'Trip Given By': t.trip_given_company,
          Amount: t.trip_amount,
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Pending Payments');
        fileName = 'outside-pending';
        break;
      }
    }

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, `${fileName}-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast({ title: 'Success', description: 'Data exported successfully' });
  };

  const getTitle = () => {
    switch (detailType) {
      case 'trips': return 'Total Trips Details';
      case 'tripMoney': return 'Total Trip Money Details';
      case 'expenses': return 'Total Expenses Breakdown';
      case 'profit': return 'Profit Details';
      case 'outsideTrips': return 'Outside Vehicle Trips';
      case 'outsideAmount': return 'Outside Vehicle Amount';
      case 'outsidePending': return 'Outside Pending Payments';
      default: return '';
    }
  };

  const getIcon = () => {
    switch (detailType) {
      case 'trips': return <Car className="h-5 w-5 text-primary" />;
      case 'tripMoney': return <DollarSign className="h-5 w-5 text-blue-600" />;
      case 'expenses': return <Calculator className="h-5 w-5 text-orange-600" />;
      case 'profit': return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'outsideTrips': return <Bus className="h-5 w-5 text-purple-600" />;
      case 'outsideAmount': return <DollarSign className="h-5 w-5 text-purple-600" />;
      case 'outsidePending': return <Clock className="h-5 w-5 text-red-600" />;
      default: return null;
    }
  };

  const SearchInput = () => (
    <div className="relative">
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
              <p className="text-sm text-muted-foreground">{searchQuery ? 'Filtered Trips' : 'Total Trips'}</p>
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
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No trips found</TableCell></TableRow>
            ) : filteredTrips.map((trip) => (
              <TableRow key={trip.id}>
                <TableCell className="font-medium">{trip.date}</TableCell>
                <TableCell>{trip.customer_name}</TableCell>
                <TableCell className="text-muted-foreground">{trip.from_location} → {trip.to_location}</TableCell>
                <TableCell className="text-right">{formatCurrency(trip.trip_amount)}</TableCell>
              </TableRow>
            ))}
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
                <p className="text-sm text-muted-foreground">{searchQuery ? 'Filtered Trip Money' : 'Total Trip Money'}</p>
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
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No trips found</TableCell></TableRow>
              ) : filteredTrips.map((trip) => (
                <TableRow key={trip.id}>
                  <TableCell className="font-medium">{trip.date}</TableCell>
                  <TableCell>{trip.customer_name}</TableCell>
                  <TableCell className="text-muted-foreground">{trip.driver_name}</TableCell>
                  <TableCell className="text-right font-semibold text-blue-600">{formatCurrency(trip.trip_amount)}</TableCell>
                </TableRow>
              ))}
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
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200">
            <CardContent className="p-3"><div className="flex items-center gap-2"><Users className="h-5 w-5 text-orange-600" /><div><p className="text-xs text-muted-foreground">Driver Amount</p><p className="text-lg font-bold text-orange-600">{formatCurrency(tripExpenses.driverAmount)}</p></div></div></CardContent>
          </Card>
          <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200">
            <CardContent className="p-3"><div className="flex items-center gap-2"><Receipt className="h-5 w-5 text-purple-600" /><div><p className="text-xs text-muted-foreground">Commission</p><p className="text-lg font-bold text-purple-600">{formatCurrency(tripExpenses.commission)}</p></div></div></CardContent>
          </Card>
          <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200">
            <CardContent className="p-3"><div className="flex items-center gap-2"><Fuel className="h-5 w-5 text-amber-600" /><div><p className="text-xs text-muted-foreground">Fuel Amount</p><p className="text-lg font-bold text-amber-600">{formatCurrency(tripExpenses.fuelAmount)}</p></div></div></CardContent>
          </Card>
          <Card className="bg-red-50 dark:bg-red-950/20 border-red-200">
            <CardContent className="p-3"><div className="flex items-center gap-2"><Receipt className="h-5 w-5 text-red-600" /><div><p className="text-xs text-muted-foreground">Tolls</p><p className="text-lg font-bold text-red-600">{formatCurrency(tripExpenses.tolls)}</p></div></div></CardContent>
          </Card>
        </div>
        <Card className="bg-slate-50 dark:bg-slate-950/20 border-slate-200">
          <CardContent className="p-3"><div className="flex items-center gap-2"><Wrench className="h-5 w-5 text-slate-600" /><div><p className="text-xs text-muted-foreground">Maintenance</p><p className="text-lg font-bold text-slate-600">{formatCurrency(filteredMaintenanceTotal)}</p></div></div></CardContent>
        </Card>
        <Card className="bg-orange-100 dark:bg-orange-900/30 border-orange-300">
          <CardContent className="p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><Calculator className="h-8 w-8 text-orange-600" /><p className="text-lg font-semibold">{searchQuery ? 'Filtered' : 'Total'} Expenses</p></div><p className="text-2xl font-bold text-orange-600">{formatCurrency(filteredTotalExpenses)}</p></div></CardContent>
        </Card>
        <SearchInput />
        {filteredMaintenance.length > 0 && (
          <ScrollArea className="h-[120px]">
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Vehicle</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
              <TableBody>
                {filteredMaintenance.map((m) => (
                  <TableRow key={m.id}><TableCell>{m.date}</TableCell><TableCell>{m.maintenance_type}</TableCell><TableCell>{m.vehicle_number}</TableCell><TableCell className="text-right">{formatCurrency(m.amount)}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
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
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200"><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Trip Money</p><p className="text-lg font-bold text-blue-600">{formatCurrency(filteredTripMoney)}</p></CardContent></Card>
          <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200"><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Expenses</p><p className="text-lg font-bold text-orange-600">{formatCurrency(filteredExpenses)}</p></CardContent></Card>
          <Card className="bg-green-50 dark:bg-green-950/20 border-green-200"><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">{searchQuery ? 'Filtered' : 'Net'} Profit</p><p className="text-lg font-bold text-green-600">{formatCurrency(filteredProfit)}</p></CardContent></Card>
        </div>
        <SearchInput />
        <ScrollArea className="h-[280px]">
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Customer</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Expenses</TableHead><TableHead className="text-right">Profit</TableHead></TableRow></TableHeader>
            <TableBody>
              {filteredTrips.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No trips found</TableCell></TableRow>
              ) : filteredTrips.map((trip) => {
                const exp = trip.driver_amount + trip.commission + trip.fuel_amount + trip.tolls;
                return (
                  <TableRow key={trip.id}><TableCell>{trip.date}</TableCell><TableCell>{trip.customer_name}</TableCell><TableCell className="text-right text-blue-600">{formatCurrency(trip.trip_amount)}</TableCell><TableCell className="text-right text-orange-600">{formatCurrency(exp)}</TableCell><TableCell className={`text-right font-semibold ${trip.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(trip.profit)}</TableCell></TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    );
  };

  const renderOutsideTripsDetail = () => {
    const total = filteredOutsideTrips.reduce((sum, t) => sum + t.trip_amount, 0);
    return (
      <div className="space-y-4">
        <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200">
          <CardContent className="p-4"><div className="flex items-center gap-3"><Bus className="h-8 w-8 text-purple-600" /><div><p className="text-sm text-muted-foreground">{searchQuery ? 'Filtered' : 'Total'} Outside Trips</p><p className="text-2xl font-bold text-purple-600">{filteredOutsideTrips.length} trips • {formatCurrency(total)}</p></div></div></CardContent>
        </Card>
        <SearchInput />
        <ScrollArea className="h-[300px]">
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Driver</TableHead><TableHead>Route</TableHead><TableHead>Company</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
            <TableBody>
              {filteredOutsideTrips.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No trips found</TableCell></TableRow>
              ) : filteredOutsideTrips.map((trip) => (
                <TableRow key={trip.id}><TableCell>{trip.date}</TableCell><TableCell>{trip.driver_name}</TableCell><TableCell className="text-muted-foreground">{trip.from_location} → {trip.to_location}</TableCell><TableCell>{trip.trip_given_company}</TableCell><TableCell className="text-right font-semibold text-purple-600">{formatCurrency(trip.trip_amount)}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    );
  };

  const renderOutsidePendingDetail = () => {
    const total = pendingOutsideTrips.reduce((sum, t) => sum + t.trip_amount, 0);
    return (
      <div className="space-y-4">
        <Card className="bg-red-50 dark:bg-red-950/20 border-red-200">
          <CardContent className="p-4"><div className="flex items-center gap-3"><Clock className="h-8 w-8 text-red-600" /><div><p className="text-sm text-muted-foreground">{searchQuery ? 'Filtered' : 'Total'} Pending</p><p className="text-2xl font-bold text-red-600">{pendingOutsideTrips.length} trips • {formatCurrency(total)}</p></div></div></CardContent>
        </Card>
        <SearchInput />
        <ScrollArea className="h-[300px]">
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Driver</TableHead><TableHead>Route</TableHead><TableHead>Given By</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
            <TableBody>
              {pendingOutsideTrips.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No pending payments</TableCell></TableRow>
              ) : pendingOutsideTrips.map((trip) => (
                <TableRow key={trip.id}><TableCell>{trip.date}</TableCell><TableCell>{trip.driver_name}</TableCell><TableCell className="text-muted-foreground">{trip.from_location} → {trip.to_location}</TableCell><TableCell>{trip.trip_given_company}</TableCell><TableCell className="text-right font-semibold text-red-600">{formatCurrency(trip.trip_amount)}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    );
  };

  const renderContent = () => {
    switch (detailType) {
      case 'trips': return renderTripsDetail();
      case 'tripMoney': return renderTripMoneyDetail();
      case 'expenses': return renderExpensesDetail();
      case 'profit': return renderProfitDetail();
      case 'outsideTrips':
      case 'outsideAmount': return renderOutsideTripsDetail();
      case 'outsidePending': return renderOutsidePendingDetail();
      default: return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">{getIcon()}{getTitle()}</DialogTitle>
            <Button variant="outline" size="sm" onClick={exportToExcel} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </DialogHeader>
        <div className="overflow-y-auto">{renderContent()}</div>
      </DialogContent>
    </Dialog>
  );
};

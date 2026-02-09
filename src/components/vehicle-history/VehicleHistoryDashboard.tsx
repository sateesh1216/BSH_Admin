import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Car, AlertTriangle, ChevronDown, ChevronRight, Wrench, Gauge, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';

interface Maintenance {
  id: string;
  date: string;
  vehicle_number: string;
  driver_name: string;
  driver_number: string;
  company: string | null;
  maintenance_type: string;
  description: string | null;
  amount: number;
  payment_mode: string;
  km_at_maintenance: number | null;
  next_oil_change_km: number | null;
  original_odometer_km: number | null;
}

interface VehicleHistoryDashboardProps {
  maintenance: Maintenance[];
}

interface VehicleSummary {
  vehicleNumber: string;
  totalSpent: number;
  recordCount: number;
  lastService: string;
  lastServiceType: string;
  latestKm: number | null;
  nextOilChangeKm: number | null;
  originalOdometerKm: number | null;
  records: Maintenance[];
}

const getOilChangeStatus = (currentKm: number | null, nextOilChangeKm: number | null) => {
  if (!currentKm || !nextOilChangeKm) return null;
  const remaining = nextOilChangeKm - currentKm;
  const totalInterval = nextOilChangeKm - (currentKm - 10000); // assume ~10k interval
  const progress = Math.max(0, Math.min(100, ((totalInterval - remaining) / totalInterval) * 100));
  
  if (remaining <= 0) return { status: 'overdue', remaining, progress: 100, color: 'text-destructive' };
  if (remaining <= 1000) return { status: 'due-soon', remaining, progress, color: 'text-orange-500' };
  return { status: 'ok', remaining, progress, color: 'text-green-600' };
};

export const VehicleHistoryDashboard = ({ maintenance }: VehicleHistoryDashboardProps) => {
  const [expandedVehicle, setExpandedVehicle] = useState<string | null>(null);

  const vehicleSummaries = useMemo(() => {
    const vehicleMap: { [key: string]: VehicleSummary } = {};

    // Sort by date ascending to get latest values correctly
    const sorted = [...maintenance].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sorted.forEach(record => {
      const vn = record.vehicle_number;
      if (!vehicleMap[vn]) {
        vehicleMap[vn] = {
          vehicleNumber: vn,
          totalSpent: 0,
          recordCount: 0,
          lastService: record.date,
          lastServiceType: record.maintenance_type,
          latestKm: null,
          nextOilChangeKm: null,
          originalOdometerKm: null,
          records: [],
        };
      }
      vehicleMap[vn].totalSpent += record.amount;
      vehicleMap[vn].recordCount += 1;
      vehicleMap[vn].lastService = record.date;
      vehicleMap[vn].lastServiceType = record.maintenance_type;
      if (record.km_at_maintenance) vehicleMap[vn].latestKm = record.km_at_maintenance;
      if (record.next_oil_change_km) vehicleMap[vn].nextOilChangeKm = record.next_oil_change_km;
      if (record.original_odometer_km) vehicleMap[vn].originalOdometerKm = record.original_odometer_km;
      vehicleMap[vn].records.push(record);
    });

    // Sort records within each vehicle by date descending
    Object.values(vehicleMap).forEach(v => {
      v.records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });

    return Object.values(vehicleMap).sort((a, b) => a.vehicleNumber.localeCompare(b.vehicleNumber));
  }, [maintenance]);

  if (maintenance.length === 0) {
    return (
      <Card className="shadow-lg border-primary/20">
        <CardContent className="py-12">
          <div className="text-center">
            <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No vehicle records found</h3>
            <p className="text-sm text-muted-foreground">
              Add maintenance records to see vehicle history here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
        <Car className="h-5 w-5" />
        Vehicle History ({vehicleSummaries.length} vehicles)
      </h2>

      {/* Vehicle Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicleSummaries.map((vehicle) => {
          const oilStatus = getOilChangeStatus(vehicle.latestKm, vehicle.nextOilChangeKm);
          const isExpanded = expandedVehicle === vehicle.vehicleNumber;

          return (
            <Card
              key={vehicle.vehicleNumber}
              className={`shadow-md border-primary/20 cursor-pointer transition-all hover:shadow-lg ${
                isExpanded ? 'col-span-1 md:col-span-2 lg:col-span-3' : ''
              } ${oilStatus?.status === 'overdue' ? 'border-destructive/50' : oilStatus?.status === 'due-soon' ? 'border-orange-400/50' : ''}`}
              onClick={() => setExpandedVehicle(isExpanded ? null : vehicle.vehicleNumber)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-base font-bold text-primary">
                    <Car className="h-4 w-4" />
                    {vehicle.vehicleNumber}
                  </span>
                  <div className="flex items-center gap-2">
                    {oilStatus?.status === 'overdue' && (
                      <Badge variant="destructive" className="text-xs animate-pulse">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Oil Change Overdue
                      </Badge>
                    )}
                    {oilStatus?.status === 'due-soon' && (
                      <Badge className="bg-orange-500 text-white text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Oil Change Soon
                      </Badge>
                    )}
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="text-center p-2 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Total Spent</p>
                    <p className="font-bold text-sm text-primary">₹{vehicle.totalSpent.toLocaleString()}</p>
                  </div>
                  <div className="text-center p-2 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Records</p>
                    <p className="font-bold text-sm">{vehicle.recordCount}</p>
                  </div>
                  <div className="text-center p-2 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Last Service</p>
                    <p className="font-bold text-sm">{format(new Date(vehicle.lastService), 'dd MMM yy')}</p>
                  </div>
                </div>

                {/* KM Tracking */}
                {(vehicle.latestKm || vehicle.nextOilChangeKm) && (
                  <div className="p-3 bg-muted/20 rounded-lg space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium">
                      <Gauge className="h-3.5 w-3.5 text-primary" />
                      KM Tracking
                    </div>
                    <div className="flex justify-between text-xs">
                      {vehicle.latestKm && (
                        <span>Current: <strong>{vehicle.latestKm.toLocaleString()} km</strong></span>
                      )}
                      {vehicle.nextOilChangeKm && (
                        <span>Next Oil: <strong>{vehicle.nextOilChangeKm.toLocaleString()} km</strong></span>
                      )}
                    </div>
                    {oilStatus && (
                      <div className="space-y-1">
                        <Progress value={oilStatus.progress} className="h-2" />
                        <p className={`text-xs font-medium ${oilStatus.color}`}>
                          {oilStatus.remaining <= 0 
                            ? `Overdue by ${Math.abs(oilStatus.remaining).toLocaleString()} km` 
                            : `${oilStatus.remaining.toLocaleString()} km remaining`}
                        </p>
                      </div>
                    )}
                    {vehicle.originalOdometerKm && (
                      <p className="text-xs text-muted-foreground">
                        Original Odometer: {vehicle.originalOdometerKm.toLocaleString()} km
                      </p>
                    )}
                  </div>
                )}

                {/* Expanded Detail Table */}
                {isExpanded && (
                  <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                      <Wrench className="h-4 w-4" />
                      Full Maintenance History
                    </h4>
                    <ScrollArea className="max-h-[400px]">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-muted/30">
                              <th className="text-left py-2 px-3 font-semibold">Date</th>
                              <th className="text-left py-2 px-3 font-semibold">Type</th>
                              <th className="text-right py-2 px-3 font-semibold">Amount</th>
                              <th className="text-right py-2 px-3 font-semibold">KM</th>
                              <th className="text-right py-2 px-3 font-semibold">Next Oil KM</th>
                              <th className="text-right py-2 px-3 font-semibold">Original KM</th>
                              <th className="text-left py-2 px-3 font-semibold">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            {vehicle.records.map((record, idx) => (
                              <tr key={record.id} className={`border-b ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}>
                                <td className="py-2 px-3">{format(new Date(record.date), 'dd-MMM-yyyy')}</td>
                                <td className="py-2 px-3">
                                  <Badge variant="secondary" className="text-xs">{record.maintenance_type}</Badge>
                                </td>
                                <td className="py-2 px-3 text-right font-semibold text-primary">
                                  ₹{record.amount.toLocaleString()}
                                </td>
                                <td className="py-2 px-3 text-right">
                                  {record.km_at_maintenance?.toLocaleString() || '-'}
                                </td>
                                <td className="py-2 px-3 text-right">
                                  {record.next_oil_change_km?.toLocaleString() || '-'}
                                </td>
                                <td className="py-2 px-3 text-right">
                                  {record.original_odometer_km?.toLocaleString() || '-'}
                                </td>
                                <td className="py-2 px-3 text-muted-foreground text-xs max-w-[200px] truncate" title={record.description || ''}>
                                  {record.description || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="border-t-2 bg-muted/30 font-bold">
                              <td className="py-2 px-3" colSpan={2}>Total</td>
                              <td className="py-2 px-3 text-right text-primary">
                                ₹{vehicle.totalSpent.toLocaleString()}
                              </td>
                              <td colSpan={4}></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

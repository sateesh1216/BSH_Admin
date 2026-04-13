import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, CalendarIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import companySealImage from '@/assets/company-seal.png';
import bshLogo from '@/assets/bsh-logo.png';

interface CombinedBulkInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatCurrency = (v: number) =>
  `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export const CombinedBulkInvoiceModal = ({ isOpen, onClose }: CombinedBulkInvoiceModalProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const { data: trips = [] } = useQuery({
    queryKey: ['combined-invoice-trips'],
    queryFn: async () => {
      const { data, error } = await supabase.from('trips').select('*').order('date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: isOpen,
  });

  const { data: maintenance = [] } = useQuery({
    queryKey: ['combined-invoice-maintenance'],
    queryFn: async () => {
      const { data, error } = await supabase.from('maintenance').select('*').order('date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: isOpen,
  });

  const { data: outsideTrips = [] } = useQuery({
    queryKey: ['combined-invoice-outside-trips'],
    queryFn: async () => {
      const { data, error } = await supabase.from('outside_vehicle_trips').select('*').order('date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: isOpen,
  });

  const filterByDate = <T extends { date: string }>(items: T[]) => {
    let result = [...items];
    if (startDate) result = result.filter(r => new Date(r.date) >= startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(r => new Date(r.date) <= end);
    }
    return result;
  };

  const filteredTrips = useMemo(() => filterByDate(trips), [trips, startDate, endDate]);
  const filteredMaintenance = useMemo(() => filterByDate(maintenance), [maintenance, startDate, endDate]);
  const filteredOutside = useMemo(() => filterByDate(outsideTrips), [outsideTrips, startDate, endDate]);

  const tripsTotalAmount = filteredTrips.reduce((s, t) => s + (t.trip_amount || 0), 0);
  const tripsDriverAmount = filteredTrips.reduce((s, t) => s + (t.driver_amount || 0), 0);
  const tripsCommission = filteredTrips.reduce((s, t) => s + (t.commission || 0), 0);
  const tripsTolls = filteredTrips.reduce((s, t) => s + (t.tolls || 0), 0);
  const tripsFuel = filteredTrips.reduce((s, t) => s + (t.fuel_amount || 0), 0);
  const tripsProfit = filteredTrips.reduce((s, t) => s + (t.profit || 0), 0);
  const maintenanceTotal = filteredMaintenance.reduce((s, r) => s + (r.amount || 0), 0);
  const outsideTotal = filteredOutside.reduce((s, t) => s + (t.trip_amount || 0), 0);
  const grandTotal = tripsTotalAmount + maintenanceTotal + outsideTotal;

  const invoiceNumber = `COMBINED-${format(new Date(), 'yyyyMMdd-HHmm')}`;

  const allDates = [...filteredTrips, ...filteredMaintenance, ...filteredOutside].map(r => new Date(r.date).getTime());
  const dateRange = allDates.length
    ? `${format(new Date(Math.min(...allDates)), 'dd/MM/yyyy')} - ${format(new Date(Math.max(...allDates)), 'dd/MM/yyyy')}`
    : '-';

  const totalRecords = filteredTrips.length + filteredMaintenance.length + filteredOutside.length;

  const handleDownload = () => {
    setIsDownloading(true);
    try {
      const content = document.getElementById('combined-bulk-invoice-content');
      if (!content) return;
      const win = window.open('', '_blank');
      if (!win) return;
      win.document.write(`<html><head><title>Combined Invoice ${invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
          table { width: 100%; border-collapse: collapse; }
          th { background-color: #1e3a5f; color: white; font-size: 9px; padding: 6px 3px; text-align: left; }
          td { font-size: 9px; padding: 5px 3px; border-bottom: 1px solid #ddd; }
          .text-right { text-align: right; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } @page { size: landscape; margin: 8mm; } }
        </style>
      </head><body>${content.innerHTML}</body></html>`);
      win.document.close();
      win.print();
      toast({ title: 'Success', description: 'Combined invoice ready for download/print' });
    } catch {
      toast({ title: 'Error', description: 'Failed to generate', variant: 'destructive' });
    } finally {
      setIsDownloading(false);
    }
  };

  const headerHTML = `
    <div style="background-color:#1e3a5f;color:white;text-align:center;padding:8px 0;font-size:14px">www.bshtaxiservices.com</div>
    <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:3px solid #1e3a5f">
      <div style="display:flex;align-items:center;gap:16px">
        <img src="${bshLogo}" alt="BSH Logo" style="height:70px;width:70px;object-fit:contain" />
        <span style="font-size:24px;font-weight:bold;color:#1e3a5f">BSH TAXI SERVICES</span>
      </div>
      <div style="text-align:right;font-size:12px;color:#555">
        <p style="margin:2px 0">36-92-242-532/1, Palanati colony,</p>
        <p style="margin:2px 0">kancharapelam,</p>
        <p style="margin:2px 0">Visakhapatnam, 530008.</p>
        <p style="margin:2px 0">LIN: <span style="color:#2980b9">AP-03-46-005-03355176</span></p>
        <p style="margin:2px 0">Mob no: <span style="color:#2980b9">+91 8886803322, +91 9640241216</span></p>
      </div>
    </div>
  `;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>Combined Bulk Invoice ({totalRecords} Records)</DialogTitle>
          <DialogDescription>All Trips, Maintenance & Outside Vehicle records in one invoice</DialogDescription>
        </DialogHeader>

        {/* Date Range Filter */}
        <div className="flex flex-wrap gap-3 items-center px-4 py-2 border-b">
          <span className="text-sm font-medium">Filter by Date:</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("w-[140px] justify-start text-left text-xs", !startDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-1 h-3 w-3" />
                {startDate ? format(startDate, 'dd/MM/yyyy') : 'From date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("w-[140px] justify-start text-left text-xs", !endDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-1 h-3 w-3" />
                {endDate ? format(endDate, 'dd/MM/yyyy') : 'To date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
          {(startDate || endDate) && (
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setStartDate(undefined); setEndDate(undefined); }}>Clear</Button>
          )}
        </div>

        <div id="combined-bulk-invoice-content" style={{ backgroundColor: 'white', fontFamily: 'Arial, sans-serif' }}>
          {/* Header */}
          <div dangerouslySetInnerHTML={{ __html: '' }} style={{ display: 'none' }} />
          <div style={{ backgroundColor: '#1e3a5f', color: 'white', textAlign: 'center', padding: '8px 0', fontSize: '14px' }}>www.bshtaxiservices.com</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '3px solid #1e3a5f' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <img src={bshLogo} alt="BSH Logo" style={{ height: '70px', width: '70px', objectFit: 'contain' }} />
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e3a5f' }}>BSH TAXI SERVICES</span>
            </div>
            <div style={{ textAlign: 'right', fontSize: '12px', color: '#555' }}>
              <p style={{ margin: '2px 0' }}>36-92-242-532/1, Palanati colony,</p>
              <p style={{ margin: '2px 0' }}>kancharapelam,</p>
              <p style={{ margin: '2px 0' }}>Visakhapatnam, 530008.</p>
              <p style={{ margin: '2px 0' }}>LIN: <span style={{ color: '#2980b9' }}>AP-03-46-005-03355176</span></p>
              <p style={{ margin: '2px 0' }}>Mob no: <span style={{ color: '#2980b9' }}>+91 8886803322, +91 9640241216</span></p>
            </div>
          </div>

          {/* Invoice Meta */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', padding: '16px 20px', borderBottom: '1px solid #ddd' }}>
            <div><p style={{ color: '#1e3a5f', fontWeight: 'bold', fontSize: '13px', margin: '0 0 4px 0' }}>Invoice #</p><p style={{ color: '#c0392b', fontSize: '13px', margin: 0 }}>{invoiceNumber}</p></div>
            <div><p style={{ color: '#1e3a5f', fontWeight: 'bold', fontSize: '13px', margin: '0 0 4px 0' }}>Date Range</p><p style={{ color: '#555', fontSize: '13px', margin: 0 }}>{dateRange}</p></div>
            <div><p style={{ color: '#1e3a5f', fontWeight: 'bold', fontSize: '13px', margin: '0 0 4px 0' }}>Total Records</p><p style={{ color: '#c0392b', fontSize: '13px', margin: 0 }}>{totalRecords}</p></div>
          </div>

          {/* === SECTION 1: TRIPS === */}
          {filteredTrips.length > 0 && (
            <div style={{ padding: '12px 16px' }}>
              <div style={{ backgroundColor: '#1e3a5f', color: 'white', padding: '8px 12px', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>
                SECTION 1: TRIPS ({filteredTrips.length} records)
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['S.No','Date','Customer','Route','Driver','Car No'].map(h => (
                      <th key={h} style={{ backgroundColor: '#2c5282', color: 'white', fontSize: '9px', padding: '5px 3px', textAlign: 'left' }}>{h}</th>
                    ))}
                    {['Driver ₹','Comm ₹','Tolls ₹','Fuel ₹','Trip ₹','Profit ₹'].map(h => (
                      <th key={h} style={{ backgroundColor: '#2c5282', color: 'white', fontSize: '9px', padding: '5px 3px', textAlign: 'right' }}>{h}</th>
                    ))}
                    <th style={{ backgroundColor: '#2c5282', color: 'white', fontSize: '9px', padding: '5px 3px', textAlign: 'left' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrips.map((trip, i) => (
                    <tr key={trip.id} style={{ backgroundColor: i % 2 === 0 ? '#f9f9f9' : 'white' }}>
                      <td style={{ fontSize: '9px', padding: '4px 3px', borderBottom: '1px solid #ddd' }}>{i + 1}</td>
                      <td style={{ fontSize: '9px', padding: '4px 3px', borderBottom: '1px solid #ddd' }}>{format(new Date(trip.date), 'dd MMM yy')}</td>
                      <td style={{ fontSize: '9px', padding: '4px 3px', borderBottom: '1px solid #ddd' }}>{trip.customer_name}</td>
                      <td style={{ fontSize: '9px', padding: '4px 3px', borderBottom: '1px solid #ddd' }}>{trip.from_location} → {trip.to_location}</td>
                      <td style={{ fontSize: '9px', padding: '4px 3px', borderBottom: '1px solid #ddd' }}>{trip.driver_name}</td>
                      <td style={{ fontSize: '9px', padding: '4px 3px', borderBottom: '1px solid #ddd' }}>{trip.car_number || '-'}</td>
                      <td style={{ fontSize: '9px', padding: '4px 3px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>{formatCurrency(trip.driver_amount)}</td>
                      <td style={{ fontSize: '9px', padding: '4px 3px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>{formatCurrency(trip.commission)}</td>
                      <td style={{ fontSize: '9px', padding: '4px 3px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>{formatCurrency(trip.tolls)}</td>
                      <td style={{ fontSize: '9px', padding: '4px 3px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>{formatCurrency(trip.fuel_amount)}</td>
                      <td style={{ fontSize: '9px', padding: '4px 3px', borderBottom: '1px solid #ddd', textAlign: 'right', fontWeight: '600' }}>{formatCurrency(trip.trip_amount)}</td>
                      <td style={{ fontSize: '9px', padding: '4px 3px', borderBottom: '1px solid #ddd', textAlign: 'right', fontWeight: '600' }}>{formatCurrency(trip.profit || 0)}</td>
                      <td style={{ fontSize: '9px', padding: '4px 3px', borderBottom: '1px solid #ddd' }}>
                        <span style={{ padding: '1px 4px', borderRadius: '3px', fontSize: '8px', fontWeight: 'bold', backgroundColor: trip.payment_status === 'paid' ? '#d1fae5' : '#fee2e2', color: trip.payment_status === 'paid' ? '#15803d' : '#b91c1c' }}>
                          {(trip.payment_status || 'pending').toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor: '#e8eef5', fontWeight: 'bold' }}>
                    <td colSpan={6} style={{ fontSize: '9px', padding: '5px 3px', textAlign: 'right' }}>TRIPS TOTAL:</td>
                    <td style={{ fontSize: '9px', padding: '5px 3px', textAlign: 'right' }}>{formatCurrency(tripsDriverAmount)}</td>
                    <td style={{ fontSize: '9px', padding: '5px 3px', textAlign: 'right' }}>{formatCurrency(tripsCommission)}</td>
                    <td style={{ fontSize: '9px', padding: '5px 3px', textAlign: 'right' }}>{formatCurrency(tripsTolls)}</td>
                    <td style={{ fontSize: '9px', padding: '5px 3px', textAlign: 'right' }}>{formatCurrency(tripsFuel)}</td>
                    <td style={{ fontSize: '9px', padding: '5px 3px', textAlign: 'right' }}>{formatCurrency(tripsTotalAmount)}</td>
                    <td style={{ fontSize: '9px', padding: '5px 3px', textAlign: 'right' }}>{formatCurrency(tripsProfit)}</td>
                    <td style={{ fontSize: '9px', padding: '5px 3px' }}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* === SECTION 2: MAINTENANCE === */}
          {filteredMaintenance.length > 0 && (
            <div style={{ padding: '12px 16px' }}>
              <div style={{ backgroundColor: '#1e3a5f', color: 'white', padding: '8px 12px', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>
                SECTION 2: MAINTENANCE ({filteredMaintenance.length} records)
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['S.No','Date','Vehicle','Driver','Company','Type','Description','Payment'].map(h => (
                      <th key={h} style={{ backgroundColor: '#2c5282', color: 'white', fontSize: '9px', padding: '5px 3px', textAlign: 'left' }}>{h}</th>
                    ))}
                    {['KM','Amount ₹'].map(h => (
                      <th key={h} style={{ backgroundColor: '#2c5282', color: 'white', fontSize: '9px', padding: '5px 3px', textAlign: 'right' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredMaintenance.map((record, i) => (
                    <tr key={record.id} style={{ backgroundColor: i % 2 === 0 ? '#f9f9f9' : 'white' }}>
                      <td style={{ fontSize: '9px', padding: '4px 3px', borderBottom: '1px solid #ddd' }}>{i + 1}</td>
                      <td style={{ fontSize: '9px', padding: '4px 3px', borderBottom: '1px solid #ddd' }}>{format(new Date(record.date), 'dd MMM yy')}</td>
                      <td style={{ fontSize: '9px', padding: '4px 3px', borderBottom: '1px solid #ddd' }}>{record.vehicle_number}</td>
                      <td style={{ fontSize: '9px', padding: '4px 3px', borderBottom: '1px solid #ddd' }}>{record.driver_name}</td>
                      <td style={{ fontSize: '9px', padding: '4px 3px', borderBottom: '1px solid #ddd' }}>{record.company || '-'}</td>
                      <td style={{ fontSize: '9px', padding: '4px 3px', borderBottom: '1px solid #ddd' }}>{record.maintenance_type}</td>
                      <td style={{ fontSize: '9px', padding: '4px 3px', borderBottom: '1px solid #ddd', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{record.description || '-'}</td>
                      <td style={{ fontSize: '9px', padding: '4px 3px', borderBottom: '1px solid #ddd' }}>{record.payment_mode}</td>
                      <td style={{ fontSize: '9px', padding: '4px 3px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>{record.km_at_maintenance?.toLocaleString() || '-'}</td>
                      <td style={{ fontSize: '9px', padding: '4px 3px', borderBottom: '1px solid #ddd', textAlign: 'right', fontWeight: '600' }}>{formatCurrency(record.amount)}</td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor: '#e8eef5', fontWeight: 'bold' }}>
                    <td colSpan={9} style={{ fontSize: '9px', padding: '5px 3px', textAlign: 'right' }}>MAINTENANCE TOTAL:</td>
                    <td style={{ fontSize: '9px', padding: '5px 3px', textAlign: 'right' }}>{formatCurrency(maintenanceTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* === SECTION 3: OUTSIDE VEHICLES === */}
          {filteredOutside.length > 0 && (
            <div style={{ padding: '12px 16px' }}>
              <div style={{ backgroundColor: '#1e3a5f', color: 'white', padding: '8px 12px', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>
                SECTION 3: OUTSIDE VEHICLE TRIPS ({filteredOutside.length} records)
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['S.No','Date','Driver','Travel Co.','Vehicle Type','Route','Vehicle No.','Given By','Payment','Status'].map(h => (
                      <th key={h} style={{ backgroundColor: '#2c5282', color: 'white', fontSize: '9px', padding: '5px 3px', textAlign: 'left' }}>{h}</th>
                    ))}
                    <th style={{ backgroundColor: '#2c5282', color: 'white', fontSize: '9px', padding: '5px 3px', textAlign: 'right' }}>Amount ₹</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOutside.map((trip, i) => (
                    <tr key={trip.id} style={{ backgroundColor: i % 2 === 0 ? '#f9f9f9' : 'white' }}>
                      <td style={{ fontSize: '9px', padding: '4px 3px', borderBottom: '1px solid #ddd' }}>{i + 1}</td>
                      <td style={{ fontSize: '9px', padding: '4px 3px', borderBottom: '1px solid #ddd' }}>{format(new Date(trip.date), 'dd MMM yy')}</td>
                      <td style={{ fontSize: '9px', padding: '4px 3px', borderBottom: '1px solid #ddd' }}>{trip.driver_name}</td>
                      <td style={{ fontSize: '9px', padding: '4px 3px', borderBottom: '1px solid #ddd' }}>{trip.travel_company}</td>
                      <td style={{ fontSize: '9px', padding: '4px 3px', borderBottom: '1px solid #ddd' }}>{trip.vehicle_type}</td>
                      <td style={{ fontSize: '9px', padding: '4px 3px', borderBottom: '1px solid #ddd' }}>{trip.from_location} → {trip.to_location}</td>
                      <td style={{ fontSize: '9px', padding: '4px 3px', borderBottom: '1px solid #ddd' }}>{trip.vehicle_number}</td>
                      <td style={{ fontSize: '9px', padding: '4px 3px', borderBottom: '1px solid #ddd' }}>{trip.trip_given_company}</td>
                      <td style={{ fontSize: '9px', padding: '4px 3px', borderBottom: '1px solid #ddd' }}>{trip.payment_mode}</td>
                      <td style={{ fontSize: '9px', padding: '4px 3px', borderBottom: '1px solid #ddd' }}>
                        <span style={{ padding: '1px 4px', borderRadius: '3px', fontSize: '8px', fontWeight: 'bold', backgroundColor: trip.payment_status === 'paid' ? '#d1fae5' : '#fee2e2', color: trip.payment_status === 'paid' ? '#15803d' : '#b91c1c' }}>
                          {trip.payment_status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ fontSize: '9px', padding: '4px 3px', borderBottom: '1px solid #ddd', textAlign: 'right', fontWeight: '600' }}>{formatCurrency(trip.trip_amount)}</td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor: '#e8eef5', fontWeight: 'bold' }}>
                    <td colSpan={10} style={{ fontSize: '9px', padding: '5px 3px', textAlign: 'right' }}>OUTSIDE VEHICLES TOTAL:</td>
                    <td style={{ fontSize: '9px', padding: '5px 3px', textAlign: 'right' }}>{formatCurrency(outsideTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* === COMBINED SUMMARY === */}
          <div style={{ margin: '8px 16px', border: '2px solid #1e3a5f', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{ backgroundColor: '#1e3a5f', color: 'white', padding: '8px 12px', fontSize: '14px', fontWeight: 'bold' }}>
              COMBINED SUMMARY
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '8px 16px', fontSize: '12px', fontWeight: '600' }}>Trips Total ({filteredTrips.length} records)</td>
                  <td style={{ padding: '8px 16px', fontSize: '12px', fontWeight: '600', textAlign: 'right' }}>{formatCurrency(tripsTotalAmount)}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '8px 16px', fontSize: '12px', fontWeight: '600' }}>Maintenance Total ({filteredMaintenance.length} records)</td>
                  <td style={{ padding: '8px 16px', fontSize: '12px', fontWeight: '600', textAlign: 'right' }}>{formatCurrency(maintenanceTotal)}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '8px 16px', fontSize: '12px', fontWeight: '600' }}>Outside Vehicles Total ({filteredOutside.length} records)</td>
                  <td style={{ padding: '8px 16px', fontSize: '12px', fontWeight: '600', textAlign: 'right' }}>{formatCurrency(outsideTotal)}</td>
                </tr>
                <tr style={{ backgroundColor: '#1e3a5f' }}>
                  <td style={{ padding: '10px 16px', fontSize: '14px', fontWeight: 'bold', color: 'white' }}>GRAND TOTAL ({totalRecords} records)</td>
                  <td style={{ padding: '10px 16px', fontSize: '14px', fontWeight: 'bold', color: 'white', textAlign: 'right' }}>{formatCurrency(grandTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Bank Details & Seal */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px 20px' }}>
            <div style={{ fontSize: '13px', color: '#555' }}>
              <p style={{ fontWeight: 'bold', color: '#1e3a5f', marginBottom: '8px' }}>Bank Account Details:</p>
              <p style={{ margin: '2px 0' }}>Mode of Payment: IMPS/NEFT</p>
              <p style={{ margin: '2px 0' }}>Account Holder Name: BANDARU SATEESH</p>
              <p style={{ margin: '2px 0' }}>Branch Name: Saligramapuram Vizag</p>
              <p style={{ margin: '2px 0' }}>Bank Name: State Bank Of India</p>
              <p style={{ margin: '2px 0' }}>Current Account Number: 32647106168</p>
              <p style={{ margin: '2px 0' }}>IFSC: SBIN0020861</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <img src={companySealImage} alt="Company Seal" style={{ height: '80px', width: '80px', objectFit: 'contain', margin: '0 auto' }} />
              <p style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>Authorised Sign</p>
            </div>
          </div>

          {/* Footer */}
          <div style={{ backgroundColor: '#3498db', color: 'white', textAlign: 'center', padding: '12px 16px', fontSize: '11px' }}>
            <p style={{ margin: 0 }}>Customers are requested to check their belongings before leaving the cab. The Travel Office/Car Owner/Driver is not responsible for the loss of any belongings</p>
          </div>
        </div>

        <div className="flex gap-2 justify-end p-4 border-t">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handleDownload} disabled={isDownloading || totalRecords === 0}>
            <Download className="w-4 h-4 mr-2" />
            {isDownloading ? 'Generating...' : 'Download/Print'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

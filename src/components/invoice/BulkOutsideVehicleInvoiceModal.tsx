import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, CalendarIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import companySealImage from '@/assets/company-seal.png';
import bshLogo from '@/assets/bsh-logo.png';

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

interface BulkOutsideVehicleInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  trips: OutsideVehicleTrip[];
}

const formatCurrency = (v: number) =>
  `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export const BulkOutsideVehicleInvoiceModal = ({ isOpen, onClose, trips }: BulkOutsideVehicleInvoiceModalProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const filtered = useMemo(() => {
    if (!trips.length) return [];
    let result = [...trips];
    if (startDate) result = result.filter(t => new Date(t.date) >= startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(t => new Date(t.date) <= end);
    }
    return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [trips, startDate, endDate]);

  if (!trips.length) return null;

  const grandTotal = filtered.reduce((s, t) => s + t.trip_amount, 0);
  const dateRange = filtered.length ? `${format(new Date(filtered[0].date), 'dd/MM/yyyy')} - ${format(new Date(filtered[filtered.length - 1].date), 'dd/MM/yyyy')}` : '-';
  const invoiceNumber = `OV-${format(new Date(), 'yyyyMMdd-HHmm')}`;

  const handleDownload = () => {
    setIsDownloading(true);
    try {
      const content = document.getElementById('bulk-outside-vehicle-invoice-content');
      if (!content) return;
      const win = window.open('', '_blank');
      if (!win) return;
      win.document.write(`<html><head><title>Outside Vehicle Invoice ${invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
          table { width: 100%; border-collapse: collapse; }
          th { background-color: #1e3a5f; color: white; font-size: 10px; padding: 6px 4px; text-align: left; }
          td { font-size: 10px; padding: 5px 4px; border-bottom: 1px solid #ddd; }
          .text-right { text-align: right; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } @page { size: landscape; } }
        </style>
      </head><body>${content.innerHTML}</body></html>`);
      win.document.close();
      win.print();
      toast({ title: "Success", description: "Outside vehicle invoice ready for download/print" });
    } catch {
      toast({ title: "Error", description: "Failed to generate", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>Outside Vehicle Invoice ({filtered.length} Trips)</DialogTitle>
          <DialogDescription>Combined invoice for all filtered outside vehicle trips</DialogDescription>
        </DialogHeader>

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

        <div id="bulk-outside-vehicle-invoice-content" style={{ backgroundColor: 'white', fontFamily: 'Arial, sans-serif' }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', padding: '16px 20px', borderBottom: '1px solid #ddd' }}>
            <div><p style={{ color: '#1e3a5f', fontWeight: 'bold', fontSize: '13px', margin: '0 0 4px 0' }}>Invoice #</p><p style={{ color: '#c0392b', fontSize: '13px', margin: 0 }}>{invoiceNumber}</p></div>
            <div><p style={{ color: '#1e3a5f', fontWeight: 'bold', fontSize: '13px', margin: '0 0 4px 0' }}>Date Range</p><p style={{ color: '#555', fontSize: '13px', margin: 0 }}>{dateRange}</p></div>
            <div><p style={{ color: '#1e3a5f', fontWeight: 'bold', fontSize: '13px', margin: '0 0 4px 0' }}>Total Trips</p><p style={{ color: '#c0392b', fontSize: '13px', margin: 0 }}>{filtered.length}</p></div>
          </div>

          <div style={{ padding: '12px 16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['S.No','Date','Driver','Travel Co.','Vehicle Type','Route','Vehicle No.','Given By','Payment','Status'].map(h => (
                    <th key={h} style={{ backgroundColor: '#1e3a5f', color: 'white', fontSize: '10px', padding: '6px 4px', textAlign: 'left' }}>{h}</th>
                  ))}
                  <th style={{ backgroundColor: '#1e3a5f', color: 'white', fontSize: '10px', padding: '6px 4px', textAlign: 'right' }}>Amount ₹</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((trip, i) => (
                  <tr key={trip.id} style={{ backgroundColor: i % 2 === 0 ? '#f9f9f9' : 'white' }}>
                    <td style={{ fontSize: '10px', padding: '5px 4px', borderBottom: '1px solid #ddd' }}>{i + 1}</td>
                    <td style={{ fontSize: '10px', padding: '5px 4px', borderBottom: '1px solid #ddd' }}>{format(new Date(trip.date), 'dd MMM yyyy')}</td>
                    <td style={{ fontSize: '10px', padding: '5px 4px', borderBottom: '1px solid #ddd' }}>{trip.driver_name}</td>
                    <td style={{ fontSize: '10px', padding: '5px 4px', borderBottom: '1px solid #ddd' }}>{trip.travel_company}</td>
                    <td style={{ fontSize: '10px', padding: '5px 4px', borderBottom: '1px solid #ddd' }}>{trip.vehicle_type}</td>
                    <td style={{ fontSize: '10px', padding: '5px 4px', borderBottom: '1px solid #ddd' }}>{trip.from_location} → {trip.to_location}</td>
                    <td style={{ fontSize: '10px', padding: '5px 4px', borderBottom: '1px solid #ddd' }}>{trip.vehicle_number}</td>
                    <td style={{ fontSize: '10px', padding: '5px 4px', borderBottom: '1px solid #ddd' }}>{trip.trip_given_company}</td>
                    <td style={{ fontSize: '10px', padding: '5px 4px', borderBottom: '1px solid #ddd' }}>{trip.payment_mode}</td>
                    <td style={{ fontSize: '10px', padding: '5px 4px', borderBottom: '1px solid #ddd' }}>
                      <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '8px', fontWeight: 'bold', backgroundColor: trip.payment_status === 'paid' ? '#d1fae5' : '#fee2e2', color: trip.payment_status === 'paid' ? '#15803d' : '#b91c1c' }}>
                        {trip.payment_status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ fontSize: '10px', padding: '5px 4px', borderBottom: '1px solid #ddd', textAlign: 'right', fontWeight: '600' }}>{formatCurrency(trip.trip_amount)}</td>
                  </tr>
                ))}
                <tr style={{ backgroundColor: '#e8eef5', fontWeight: 'bold' }}>
                  <td colSpan={10} style={{ fontSize: '10px', padding: '6px 4px', textAlign: 'right' }}>TOTAL:</td>
                  <td style={{ fontSize: '10px', padding: '6px 4px', textAlign: 'right' }}>{formatCurrency(grandTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '3px solid #1e3a5f' }}>
            <span style={{ color: '#1e3a5f', fontWeight: 'bold', fontSize: '16px' }}>Grand Total ({filtered.length} Trips)</span>
            <span style={{ color: '#1e3a5f', fontWeight: 'bold', fontSize: '20px' }}>{formatCurrency(grandTotal)}</span>
          </div>

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

          <div style={{ backgroundColor: '#3498db', color: 'white', textAlign: 'center', padding: '12px 16px', fontSize: '11px' }}>
            <p style={{ margin: 0 }}>Customers are requested to check their belongings before leaving the cab. The Travel Office/Car Owner/Driver is not responsible for the loss of any belongings</p>
          </div>
        </div>

        <div className="flex gap-2 justify-end p-4 border-t">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handleDownload} disabled={isDownloading || !filtered.length}>
            <Download className="w-4 h-4 mr-2" />
            {isDownloading ? 'Generating...' : 'Download/Print'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
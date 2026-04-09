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

interface Trip {
  id: string;
  date: string;
  driver_name: string;
  driver_number: string;
  customer_name: string;
  customer_number: string;
  from_location: string;
  to_location: string;
  company?: string;
  car_number?: string;
  fuel_type: string;
  payment_mode: string;
  driver_amount: number;
  commission: number;
  fuel_amount: number;
  tolls: number;
  trip_amount: number;
  profit?: number;
  payment_status?: string;
}

interface BulkInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  trips: Trip[];
}

const formatCurrency = (v: number) =>
  `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export const BulkInvoiceModal = ({ isOpen, onClose, trips }: BulkInvoiceModalProps) => {
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

  const grandTotal = filtered.reduce((s, t) => s + (t.trip_amount || 0), 0);
  const totalDriverAmount = filtered.reduce((s, t) => s + (t.driver_amount || 0), 0);
  const totalCommission = filtered.reduce((s, t) => s + (t.commission || 0), 0);
  const totalTolls = filtered.reduce((s, t) => s + (t.tolls || 0), 0);
  const totalFuel = filtered.reduce((s, t) => s + (t.fuel_amount || 0), 0);
  const totalProfit = filtered.reduce((s, t) => s + (t.profit || 0), 0);
  const dateRange = filtered.length ? `${format(new Date(filtered[0].date), 'dd/MM/yyyy')} - ${format(new Date(filtered[filtered.length - 1].date), 'dd/MM/yyyy')}` : '-';
  const invoiceNumber = `BULK-${format(new Date(), 'yyyyMMdd-HHmm')}`;

  const handleDownload = () => {
    setIsDownloading(true);
    try {
      const content = document.getElementById('bulk-invoice-content');
      if (!content) return;
      const win = window.open('', '_blank');
      if (!win) return;
      win.document.write(`<html><head><title>Bulk Invoice ${invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
          table { width: 100%; border-collapse: collapse; }
          th { background-color: #1e3a5f; color: white; font-size: 9px; padding: 6px 3px; text-align: left; }
          td { font-size: 9px; padding: 5px 3px; border-bottom: 1px solid #ddd; }
          .text-right { text-align: right; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } @page { size: landscape; } }
        </style>
      </head><body>${content.innerHTML}</body></html>`);
      win.document.close();
      win.print();
      toast({ title: "Success", description: "Bulk invoice ready for download/print" });
    } catch {
      toast({ title: "Error", description: "Failed to generate", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>Bulk Invoice ({filtered.length} Trips)</DialogTitle>
          <DialogDescription>Combined invoice for all filtered trips</DialogDescription>
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

        <div id="bulk-invoice-content" style={{ backgroundColor: 'white', fontFamily: 'Arial, sans-serif' }}>
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

          <div className="px-3 py-4">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="bg-[#1e3a5f] text-white text-[9px] p-1.5 text-left">S.No</th>
                  <th className="bg-[#1e3a5f] text-white text-[9px] p-1.5 text-left">Date</th>
                  <th className="bg-[#1e3a5f] text-white text-[9px] p-1.5 text-left">Customer</th>
                  <th className="bg-[#1e3a5f] text-white text-[9px] p-1.5 text-left">Route</th>
                  <th className="bg-[#1e3a5f] text-white text-[9px] p-1.5 text-left">Driver</th>
                  <th className="bg-[#1e3a5f] text-white text-[9px] p-1.5 text-left">Car No</th>
                  <th className="bg-[#1e3a5f] text-white text-[9px] p-1.5 text-right">Driver ₹</th>
                  <th className="bg-[#1e3a5f] text-white text-[9px] p-1.5 text-right">Comm ₹</th>
                  <th className="bg-[#1e3a5f] text-white text-[9px] p-1.5 text-right">Tolls ₹</th>
                  <th className="bg-[#1e3a5f] text-white text-[9px] p-1.5 text-right">Fuel ₹</th>
                  <th className="bg-[#1e3a5f] text-white text-[9px] p-1.5 text-right">Trip ₹</th>
                  <th className="bg-[#1e3a5f] text-white text-[9px] p-1.5 text-right">Profit ₹</th>
                  <th className="bg-[#1e3a5f] text-white text-[9px] p-1.5 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((trip, i) => (
                  <tr key={trip.id} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="text-[9px] p-1.5">{i + 1}</td>
                    <td className="text-[9px] p-1.5">{format(new Date(trip.date), 'dd MMM yyyy')}</td>
                    <td className="text-[9px] p-1.5">{trip.customer_name}</td>
                    <td className="text-[9px] p-1.5">{trip.from_location} → {trip.to_location}</td>
                    <td className="text-[9px] p-1.5">{trip.driver_name}</td>
                    <td className="text-[9px] p-1.5">{trip.car_number || '-'}</td>
                    <td className="text-[9px] p-1.5 text-right">{formatCurrency(trip.driver_amount)}</td>
                    <td className="text-[9px] p-1.5 text-right">{formatCurrency(trip.commission)}</td>
                    <td className="text-[9px] p-1.5 text-right">{formatCurrency(trip.tolls)}</td>
                    <td className="text-[9px] p-1.5 text-right">{formatCurrency(trip.fuel_amount)}</td>
                    <td className="text-[9px] p-1.5 text-right font-semibold">{formatCurrency(trip.trip_amount)}</td>
                    <td className="text-[9px] p-1.5 text-right font-semibold">{formatCurrency(trip.profit || 0)}</td>
                    <td className="text-[9px] p-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${trip.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {(trip.payment_status || 'pending').toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
                <tr className="bg-[#1e3a5f]/10 font-bold">
                  <td colSpan={6} className="text-[9px] p-1.5 text-right">TOTALS:</td>
                  <td className="text-[9px] p-1.5 text-right">{formatCurrency(totalDriverAmount)}</td>
                  <td className="text-[9px] p-1.5 text-right">{formatCurrency(totalCommission)}</td>
                  <td className="text-[9px] p-1.5 text-right">{formatCurrency(totalTolls)}</td>
                  <td className="text-[9px] p-1.5 text-right">{formatCurrency(totalFuel)}</td>
                  <td className="text-[9px] p-1.5 text-right">{formatCurrency(grandTotal)}</td>
                  <td className="text-[9px] p-1.5 text-right">{formatCurrency(totalProfit)}</td>
                  <td className="text-[9px] p-1.5"></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center px-5 py-4 border-t-2 border-[#1e3a5f]">
            <span className="text-[#1e3a5f] font-bold text-lg">Grand Total ({filtered.length} Trips)</span>
            <span className="text-[#1e3a5f] font-bold text-xl">{formatCurrency(grandTotal)}</span>
          </div>

          <div className="flex justify-between items-start px-5 py-4">
            <div className="text-sm text-gray-700">
              <p className="font-bold text-[#1e3a5f] mb-2">Bank Account Details:</p>
              <p>Mode of Payment: IMPS/NEFT</p>
              <p>Account Holder Name: BANDARU SATEESH</p>
              <p>Branch Name: Saligramapuram Vizag</p>
              <p>Bank Name: State Bank Of India</p>
              <p>Current Account Number: 32647106168</p>
              <p>IFSC: SBIN0020861</p>
            </div>
            <div className="text-center">
              <img src={companySealImage} alt="Company Seal" style={{ height: '80px', width: '80px', objectFit: 'contain', margin: '0 auto' }} />
              <p className="text-sm text-gray-600 mt-1">Authorised Sign</p>
            </div>
          </div>

          <div className="bg-[#3498db] text-white text-center py-3 text-xs px-4">
            <p>Customers are requested to check their belongings before leaving the cab. The Travel Office/Car Owner/Driver is not responsible for the loss of any belongings</p>
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
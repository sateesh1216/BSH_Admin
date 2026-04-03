import { useState } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
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

  if (!trips.length) return null;

  const sorted = [...trips].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const grandTotal = sorted.reduce((s, t) => s + (t.trip_amount || 0), 0);
  const totalDriverAmount = sorted.reduce((s, t) => s + (t.driver_amount || 0), 0);
  const totalCommission = sorted.reduce((s, t) => s + (t.commission || 0), 0);
  const totalTolls = sorted.reduce((s, t) => s + (t.tolls || 0), 0);
  const totalFuel = sorted.reduce((s, t) => s + (t.fuel_amount || 0), 0);
  const totalProfit = sorted.reduce((s, t) => s + (t.profit || 0), 0);
  const dateRange = `${format(new Date(sorted[0].date), 'dd/MM/yyyy')} - ${format(new Date(sorted[sorted.length - 1].date), 'dd/MM/yyyy')}`;
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
          .invoice-container { max-width: 900px; margin: 0 auto; }
          .header-bar { background-color: #1e3a5f; color: white; text-align: center; padding: 8px; font-size: 14px; }
          .company-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 20px; border-bottom: 2px solid #1e3a5f; }
          .company-name { font-size: 28px; font-weight: bold; color: #1e3a5f; }
          table { width: 100%; border-collapse: collapse; }
          th { background-color: #1e3a5f; color: white; font-size: 9px; padding: 6px 3px; text-align: left; }
          td { font-size: 9px; padding: 5px 3px; border-bottom: 1px solid #ddd; }
          .text-right { text-align: right; }
          .grand-total { display: flex; justify-content: space-between; padding: 15px 20px; border-top: 2px solid #1e3a5f; margin-top: 10px; }
          .footer-bar { background-color: #3498db; color: white; text-align: center; padding: 10px; font-size: 11px; margin-top: 20px; }
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
          <DialogTitle>Bulk Invoice ({trips.length} Trips)</DialogTitle>
          <DialogDescription>Combined invoice for all filtered trips</DialogDescription>
        </DialogHeader>

        <div id="bulk-invoice-content" className="bg-white">
          {/* Header Bar */}
          <div className="bg-[#1e3a5f] text-white text-center py-2 text-sm">
            www.bshtaxiservices.com
          </div>

          {/* Company Header */}
          <div className="flex justify-between items-start p-5 border-b-2 border-[#1e3a5f]">
            <div className="flex items-center gap-4">
              <img src={bshLogo} alt="BSH Logo" className="h-24 w-24 object-contain" />
              <span className="text-3xl font-bold text-[#1e3a5f]">BSH TAXI SERVICES</span>
            </div>
            <div className="text-right text-sm text-gray-700">
              <p>36-92-242-532/1, Palanati colony,</p>
              <p>kancharapelam,</p>
              <p>Visakhapatnam, 530008.</p>
              <p>LIN: <span className="text-blue-600">AP-03-46-005-03355176</span></p>
              <p>Mob no: <span className="text-blue-600">+91 8886803322, +91 9640241216</span></p>
            </div>
          </div>

          {/* Invoice Info */}
          <div className="grid grid-cols-3 gap-4 px-5 py-4 border-b border-gray-200">
            <div>
              <p className="text-[#1e3a5f] font-bold text-sm">Invoice #</p>
              <p className="text-[#c0392b] text-sm">{invoiceNumber}</p>
            </div>
            <div>
              <p className="text-[#1e3a5f] font-bold text-sm">Date Range</p>
              <p className="text-gray-700 text-sm">{dateRange}</p>
            </div>
            <div>
              <p className="text-[#1e3a5f] font-bold text-sm">Total Trips</p>
              <p className="text-[#c0392b] text-sm">{sorted.length}</p>
            </div>
          </div>

          {/* Trips Table */}
          <div className="px-3 py-4">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="bg-[#1e3a5f] text-white text-xs p-2 text-left">S.No</th>
                  <th className="bg-[#1e3a5f] text-white text-xs p-2 text-left">Date</th>
                  <th className="bg-[#1e3a5f] text-white text-xs p-2 text-left">Customer</th>
                  <th className="bg-[#1e3a5f] text-white text-xs p-2 text-left">Route</th>
                  <th className="bg-[#1e3a5f] text-white text-xs p-2 text-left">Car No</th>
                  <th className="bg-[#1e3a5f] text-white text-xs p-2 text-left">Payment</th>
                  <th className="bg-[#1e3a5f] text-white text-xs p-2 text-left">Status</th>
                  <th className="bg-[#1e3a5f] text-white text-xs p-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((trip, i) => (
                  <tr key={trip.id} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="text-xs p-2">{i + 1}</td>
                    <td className="text-xs p-2">{format(new Date(trip.date), 'dd MMM yyyy')}</td>
                    <td className="text-xs p-2">{trip.customer_name}</td>
                    <td className="text-xs p-2">{trip.from_location} → {trip.to_location}</td>
                    <td className="text-xs p-2">{trip.car_number || '-'}</td>
                    <td className="text-xs p-2">{trip.payment_mode}</td>
                    <td className="text-xs p-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${trip.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {(trip.payment_status || 'pending').toUpperCase()}
                      </span>
                    </td>
                    <td className="text-xs p-2 text-right font-semibold">{formatCurrency(trip.trip_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Grand Total */}
          <div className="flex justify-between items-center px-5 py-4 border-t-2 border-[#1e3a5f]">
            <span className="text-[#1e3a5f] font-bold text-lg">Grand Total ({sorted.length} Trips)</span>
            <span className="text-[#1e3a5f] font-bold text-xl">{formatCurrency(grandTotal)}</span>
          </div>

          {/* Bank Details and Seal */}
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
              <img src={companySealImage} alt="Company Seal" className="h-24 w-24 object-contain mx-auto" />
              <p className="text-sm text-gray-600 mt-1">Authorised Sign</p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-[#3498db] text-white text-center py-3 text-xs px-4">
            <p>Customers are requested to check their belongings before leaving the cab. The Travel Office/Car Owner/Driver is not responsible for the loss of any belongings</p>
          </div>
        </div>

        <div className="flex gap-2 justify-end p-4 border-t">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handleDownload} disabled={isDownloading}>
            <Download className="w-4 h-4 mr-2" />
            {isDownloading ? 'Generating...' : 'Download/Print'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

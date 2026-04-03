import { useState } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
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

  if (!trips.length) return null;

  const sorted = [...trips].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const grandTotal = sorted.reduce((s, t) => s + t.trip_amount, 0);
  const dateRange = `${format(new Date(sorted[0].date), 'dd/MM/yyyy')} - ${format(new Date(sorted[sorted.length - 1].date), 'dd/MM/yyyy')}`;
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
          <DialogTitle>Outside Vehicle Invoice ({trips.length} Trips)</DialogTitle>
          <DialogDescription>Combined invoice for all filtered outside vehicle trips</DialogDescription>
        </DialogHeader>

        <div id="bulk-outside-vehicle-invoice-content" className="bg-white">
          <div className="bg-[#1e3a5f] text-white text-center py-2 text-sm">
            www.bshtaxiservices.com
          </div>

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

          <div className="px-3 py-4">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="bg-[#1e3a5f] text-white text-[10px] p-1.5 text-left">S.No</th>
                  <th className="bg-[#1e3a5f] text-white text-[10px] p-1.5 text-left">Date</th>
                  <th className="bg-[#1e3a5f] text-white text-[10px] p-1.5 text-left">Driver</th>
                  <th className="bg-[#1e3a5f] text-white text-[10px] p-1.5 text-left">Travel Co.</th>
                  <th className="bg-[#1e3a5f] text-white text-[10px] p-1.5 text-left">Vehicle Type</th>
                  <th className="bg-[#1e3a5f] text-white text-[10px] p-1.5 text-left">Route</th>
                  <th className="bg-[#1e3a5f] text-white text-[10px] p-1.5 text-left">Vehicle No.</th>
                  <th className="bg-[#1e3a5f] text-white text-[10px] p-1.5 text-left">Given By</th>
                  <th className="bg-[#1e3a5f] text-white text-[10px] p-1.5 text-left">Payment</th>
                  <th className="bg-[#1e3a5f] text-white text-[10px] p-1.5 text-left">Status</th>
                  <th className="bg-[#1e3a5f] text-white text-[10px] p-1.5 text-right">Amount ₹</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((trip, i) => (
                  <tr key={trip.id} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="text-[10px] p-1.5">{i + 1}</td>
                    <td className="text-[10px] p-1.5">{format(new Date(trip.date), 'dd MMM yyyy')}</td>
                    <td className="text-[10px] p-1.5">{trip.driver_name}</td>
                    <td className="text-[10px] p-1.5">{trip.travel_company}</td>
                    <td className="text-[10px] p-1.5">{trip.vehicle_type}</td>
                    <td className="text-[10px] p-1.5">{trip.from_location} → {trip.to_location}</td>
                    <td className="text-[10px] p-1.5">{trip.vehicle_number}</td>
                    <td className="text-[10px] p-1.5">{trip.trip_given_company}</td>
                    <td className="text-[10px] p-1.5">{trip.payment_mode}</td>
                    <td className="text-[10px] p-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${trip.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {trip.payment_status.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-[10px] p-1.5 text-right font-semibold">{formatCurrency(trip.trip_amount)}</td>
                  </tr>
                ))}
                <tr className="bg-[#1e3a5f]/10 font-bold">
                  <td colSpan={10} className="text-[10px] p-1.5 text-right">TOTAL:</td>
                  <td className="text-[10px] p-1.5 text-right">{formatCurrency(grandTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center px-5 py-4 border-t-2 border-[#1e3a5f]">
            <span className="text-[#1e3a5f] font-bold text-lg">Grand Total ({sorted.length} Trips)</span>
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
              <img src={companySealImage} alt="Company Seal" className="h-24 w-24 object-contain mx-auto" />
              <p className="text-sm text-gray-600 mt-1">Authorised Sign</p>
            </div>
          </div>

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

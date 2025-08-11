import { useState } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import signatureImage from '@/assets/signature.png';
import companySealImage from '@/assets/company-seal.png';

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
  fuel_type: string;
  payment_mode: string;
  driver_amount: number;
  commission: number;
  fuel_amount: number;
  tolls: number;
  trip_amount: number;
  profit?: number;
}

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip | null;
  withGST: boolean;
}

export const InvoiceModal = ({ isOpen, onClose, trip, withGST }: InvoiceModalProps) => {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!trip) return null;

  const gstAmount = withGST ? (trip.trip_amount * 0.18) : 0;
  const totalAmount = trip.trip_amount + gstAmount;
  const invoiceNumber = `BSH${format(new Date(trip.date), 'yyyyMMdd')}${trip.id.slice(-4).toUpperCase()}`;

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // Create a printable version
      const printContent = document.getElementById('invoice-content');
      if (printContent) {
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head>
                <title>Invoice ${invoiceNumber}</title>
                <style>
                  body { font-family: Arial, sans-serif; margin: 20px; }
                  .invoice-container { max-width: 800px; margin: 0 auto; }
                  .header { border-bottom: 3px solid #1e40af; padding-bottom: 20px; margin-bottom: 20px; }
                  .company-info { text-align: right; }
                  .company-name { font-size: 24px; font-weight: bold; color: #1e40af; }
                  .invoice-details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
                  .detail-box { border: 1px solid #ddd; padding: 15px; }
                  .detail-title { font-weight: bold; color: #1e40af; margin-bottom: 10px; }
                  .cost-breakdown { margin: 20px 0; }
                  .cost-table { width: 100%; border-collapse: collapse; }
                  .cost-table th, .cost-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                  .cost-table th { background-color: #f8f9fa; }
                  .total-row { font-weight: bold; background-color: #e3f2fd; }
                  .bank-details { margin-top: 30px; padding: 15px; border: 1px solid #ddd; background-color: #f8f9fa; }
                  @media print { .no-print { display: none; } }
                </style>
              </head>
              <body>
                ${printContent.innerHTML}
              </body>
            </html>
          `);
          newWindow.document.close();
          newWindow.print();
        }
      }
      toast({
        title: "Success",
        description: "Invoice ready for download/print",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate invoice",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invoice {withGST ? '(With GST)' : '(No GST)'}</DialogTitle>
          <DialogDescription>
            Invoice for trip from {trip.from_location} to {trip.to_location}
          </DialogDescription>
        </DialogHeader>
        
        <div id="invoice-content" className="p-6 bg-white">
          {/* Header */}
          <div className="border-b-4 border-primary pb-6 mb-6">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-2xl">
                  BSH
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-primary">BSH TAXI SERVICES</h1>
                  <p className="text-sm text-muted-foreground">Your Trusted Travel Partner</p>
                </div>
              </div>
              <div className="text-right text-sm">
                <p className="font-semibold">www.bshtaxiservices.com</p>
                <p>📞 +91 9886603322, +91 9663042216</p>
                <p>📧 bshtaxiservices@gmail.com</p>
                <p>📍 Vidhik Ganaon, S100004</p>
                <p>Bengaluru, Karnataka</p>
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="border p-4">
              <h3 className="font-bold text-primary mb-3">Invoice For</h3>
              <p className="font-semibold">{trip.customer_name}</p>
              <p>{trip.customer_number}</p>
              {trip.company && <p>{trip.company}</p>}
            </div>
            <div className="border p-4">
              <h3 className="font-bold text-primary mb-3">Invoice Details</h3>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Invoice Date:</span>
                  <span>{format(new Date(trip.date), 'dd/MM/yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Invoice #:</span>
                  <span className="font-semibold">{invoiceNumber}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trip Details */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="border p-4">
              <h3 className="font-bold text-primary mb-3">From & To</h3>
              <p><strong>From:</strong> {trip.from_location}</p>
              <p><strong>To:</strong> {trip.to_location}</p>
            </div>
            <div className="border p-4">
              <h3 className="font-bold text-primary mb-3">Starting & Ending Date</h3>
              <p>{format(new Date(trip.date), 'dd/MM/yyyy')}</p>
            </div>
          </div>

          {/* Service Details */}
          <div className="mb-6">
            <h3 className="font-bold text-primary mb-3">Description</h3>
            <table className="w-full border-collapse border">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border p-3 text-left">Service</th>
                  <th className="border p-3 text-left">Driver</th>
                  <th className="border p-3 text-left">Payment Mode</th>
                  <th className="border p-3 text-right">Total Price</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-3">Taxi Service ({trip.fuel_type})</td>
                  <td className="border p-3">{trip.driver_name}<br/>{trip.driver_number}</td>
                  <td className="border p-3">{trip.payment_mode}</td>
                  <td className="border p-3 text-right">₹{trip.trip_amount.toFixed(2)}</td>
                </tr>
                {withGST && (
                  <tr>
                    <td className="border p-3" colSpan={3}><strong>GST (18%)</strong></td>
                    <td className="border p-3 text-right"><strong>₹{gstAmount.toFixed(2)}</strong></td>
                  </tr>
                )}
                <tr className="bg-blue-50">
                  <td className="border p-3" colSpan={3}><strong>Grand Total</strong></td>
                  <td className="border p-3 text-right text-xl font-bold">₹{totalAmount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Bank Details */}
          <div className="border p-4 bg-gray-50 mb-6">
            <h3 className="font-bold text-primary mb-3">Bank Account Details:</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Mode of Payment:</strong> IMPS/NEFT</p>
                <p><strong>Account Holder Name:</strong> BANDARU SATEESH</p>
                <p><strong>Bank Name:</strong> State Bank Of India</p>
              </div>
              <div>
                <p><strong>A/C No:</strong> 32647106186</p>
                <p><strong>IFSC:</strong> SBIN0020861</p>
                <p><strong>Branch Name:</strong> Saligramapuram Vizag</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground border-t pt-4">
            <p><strong>Customers are requested to check their belongings before leaving the cab. The Travel Officer/Owner/Driver is not responsible for any loss.</strong></p>
            <div className="mt-4 flex justify-between items-end">
              <div className="flex flex-col items-center">
                <img src={signatureImage} alt="Signature" className="h-16 w-auto mb-2" />
                <div className="text-xs text-center">
                  <div className="font-bold">Authorized Signature</div>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <img src={companySealImage} alt="Company Seal" className="h-20 w-20 mb-2" />
                <div className="text-xs text-center">
                  <div className="font-bold">Company Seal</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end no-print">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleDownload} disabled={isDownloading}>
            <Download className="w-4 h-4 mr-2" />
            {isDownloading ? 'Generating...' : 'Download/Print'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
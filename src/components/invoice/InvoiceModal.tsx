import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Plus, Trash2, Edit2 } from 'lucide-react';
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
  fuel_type: string;
  payment_mode: string;
  driver_amount: number;
  commission: number;
  fuel_amount: number;
  tolls: number;
  trip_amount: number;
  profit?: number;
}

interface LineItem {
  id: string;
  description: string;
  quantity: string;
  cost: number;
}

interface InvoiceData {
  customerName: string;
  invoiceDate: string;
  invoiceNumber: string;
  fromTo: string;
  startDate: string;
  endDate: string;
  carNo: string;
  baseDescription: string;
  baseAmount: number;
  bankAccountHolder: string;
  bankBranch: string;
  bankName: string;
  bankAccountNumber: string;
  bankIFSC: string;
}

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip | null;
  withGST: boolean;
}

export const InvoiceModal = ({ isOpen, onClose, trip, withGST }: InvoiceModalProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    customerName: '',
    invoiceDate: '',
    invoiceNumber: '',
    fromTo: '',
    startDate: '',
    endDate: '',
    carNo: '',
    baseDescription: '',
    baseAmount: 0,
    bankAccountHolder: 'BANDARU SATEESH',
    bankBranch: 'Saligramapuram Vizag',
    bankName: 'State Bank Of India',
    bankAccountNumber: '32647106168',
    bankIFSC: 'SBIN0020861',
  });

  // Initialize invoice data when trip changes
  useEffect(() => {
    if (trip) {
      setInvoiceData({
        customerName: trip.customer_name,
        invoiceDate: format(new Date(trip.date), 'dd/MM/yyyy'),
        invoiceNumber: trip.id.slice(-4).toUpperCase(),
        fromTo: `${trip.from_location} to ${trip.to_location}`,
        startDate: format(new Date(trip.date), 'dd/MM/yyyy'),
        endDate: format(new Date(trip.date), 'dd/MM/yyyy'),
        carNo: trip.company || 'N/A',
        baseDescription: `Taxi Service (${trip.fuel_type})`,
        baseAmount: trip.trip_amount,
        bankAccountHolder: 'BANDARU SATEESH',
        bankBranch: 'Saligramapuram Vizag',
        bankName: 'State Bank Of India',
        bankAccountNumber: '32647106168',
        bankIFSC: 'SBIN0020861',
      });
    }
  }, [trip]);

  const updateInvoiceData = (field: keyof InvoiceData, value: string | number) => {
    setInvoiceData(prev => ({ ...prev, [field]: value }));
  };

  if (!trip) return null;

  const extraChargesTotal = lineItems.reduce((sum, item) => sum + item.cost, 0);
  const subtotal = invoiceData.baseAmount + extraChargesTotal;
  const gstAmount = withGST ? (subtotal * 0.18) : 0;
  const totalAmount = subtotal + gstAmount;

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { id: Date.now().toString(), description: '', quantity: '', cost: 0 }
    ]);
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(lineItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const printContent = document.getElementById('invoice-content');
      if (printContent) {
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head>
                <title>Invoice ${invoiceData.invoiceNumber}</title>
                <style>
                  body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
                  .invoice-container { max-width: 800px; margin: 0 auto; }
                  .header-bar { background-color: #1e3a5f; color: white; text-align: center; padding: 8px; font-size: 14px; }
                  .company-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 20px; border-bottom: 2px solid #1e3a5f; }
                  .company-name { font-size: 28px; font-weight: bold; color: #1e3a5f; }
                  .company-details { text-align: right; font-size: 13px; color: #333; }
                  .section-title { color: #1e3a5f; font-weight: bold; font-size: 18px; margin-bottom: 5px; }
                  .info-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; padding: 15px 20px; border-bottom: 1px solid #ddd; }
                  .info-label { color: #1e3a5f; font-weight: bold; font-size: 13px; }
                  .info-value { color: #c0392b; font-size: 13px; }
                  .description-table { width: 100%; border-collapse: collapse; margin: 0 20px; }
                  .description-table th { color: #1e3a5f; font-size: 12px; text-align: left; padding: 10px 5px; }
                  .description-table td { color: #c0392b; font-size: 12px; padding: 5px; }
                  .grand-total-row { display: flex; justify-content: space-between; padding: 15px 20px; border-top: 2px solid #1e3a5f; margin-top: 20px; }
                  .grand-total-label { color: #1e3a5f; font-weight: bold; font-size: 18px; }
                  .grand-total-value { color: #1e3a5f; font-weight: bold; font-size: 20px; }
                  .bank-seal-row { display: flex; justify-content: space-between; padding: 20px; }
                  .bank-details { font-size: 12px; color: #333; }
                  .seal-section { text-align: center; }
                  .seal-image { width: 100px; height: 100px; }
                  .footer-bar { background-color: #3498db; color: white; text-align: center; padding: 10px; font-size: 11px; margin-top: 20px; }
                  .no-print { display: none !important; }
                  @media print { .no-print { display: none !important; } }
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-4 pb-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Invoice {withGST ? '(With GST)' : '(No GST)'}</DialogTitle>
              <DialogDescription>
                Invoice for trip from {trip.from_location} to {trip.to_location}
              </DialogDescription>
            </div>
            <Button 
              variant={isEditing ? "default" : "outline"} 
              size="sm" 
              onClick={() => setIsEditing(!isEditing)}
              className="gap-1"
            >
              <Edit2 className="w-4 h-4" />
              {isEditing ? 'Done Editing' : 'Edit Invoice'}
            </Button>
          </div>
        </DialogHeader>
        
        <div id="invoice-content" className="bg-white">
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

          {/* Invoice Section Title */}
          <div className="px-5 pt-4">
            <h2 className="text-[#1e3a5f] font-bold text-xl">Invoice</h2>
            <p className="text-gray-500 text-sm">Submitted on</p>
          </div>

          {/* Invoice For, Date, Number Row */}
          <div className="grid grid-cols-3 gap-4 px-5 py-4 border-b border-gray-200">
            <div>
              <p className="text-[#1e3a5f] font-bold text-sm">Invoice For</p>
              {isEditing ? (
                <Input 
                  value={invoiceData.customerName} 
                  onChange={(e) => updateInvoiceData('customerName', e.target.value)}
                  className="h-7 text-sm mt-1"
                />
              ) : (
                <p className="text-[#c0392b] text-sm">{invoiceData.customerName}</p>
              )}
            </div>
            <div>
              <p className="text-[#1e3a5f] font-bold text-sm">Invoice Date</p>
              {isEditing ? (
                <Input 
                  value={invoiceData.invoiceDate} 
                  onChange={(e) => updateInvoiceData('invoiceDate', e.target.value)}
                  className="h-7 text-sm mt-1"
                  placeholder="dd/mm/yyyy"
                />
              ) : (
                <p className="text-gray-700 text-sm">{invoiceData.invoiceDate}</p>
              )}
            </div>
            <div>
              <p className="text-[#1e3a5f] font-bold text-sm">Invoice #</p>
              {isEditing ? (
                <Input 
                  value={invoiceData.invoiceNumber} 
                  onChange={(e) => updateInvoiceData('invoiceNumber', e.target.value)}
                  className="h-7 text-sm mt-1"
                />
              ) : (
                <p className="text-[#c0392b] text-sm">{invoiceData.invoiceNumber}</p>
              )}
            </div>
          </div>

          {/* From & To, Starting & Ending Date, Car No Row */}
          <div className="grid grid-cols-3 gap-4 px-5 py-4 border-b border-gray-200">
            <div>
              <p className="text-[#1e3a5f] font-bold text-sm">From & To</p>
              {isEditing ? (
                <Input 
                  value={invoiceData.fromTo} 
                  onChange={(e) => updateInvoiceData('fromTo', e.target.value)}
                  className="h-7 text-sm mt-1"
                />
              ) : (
                <p className="text-[#c0392b] text-sm">{invoiceData.fromTo}</p>
              )}
            </div>
            <div>
              <p className="text-[#1e3a5f] font-bold text-sm">Starting & Ending Date</p>
              {isEditing ? (
                <div className="flex gap-1 mt-1">
                  <Input 
                    value={invoiceData.startDate} 
                    onChange={(e) => updateInvoiceData('startDate', e.target.value)}
                    className="h-7 text-sm"
                    placeholder="Start"
                  />
                  <span className="text-sm self-center">to</span>
                  <Input 
                    value={invoiceData.endDate} 
                    onChange={(e) => updateInvoiceData('endDate', e.target.value)}
                    className="h-7 text-sm"
                    placeholder="End"
                  />
                </div>
              ) : (
                <p className="text-gray-700 text-sm">{invoiceData.startDate} to {invoiceData.endDate}</p>
              )}
            </div>
            <div>
              <p className="text-[#1e3a5f] font-bold text-sm">Car No</p>
              {isEditing ? (
                <Input 
                  value={invoiceData.carNo} 
                  onChange={(e) => updateInvoiceData('carNo', e.target.value)}
                  className="h-7 text-sm mt-1"
                />
              ) : (
                <p className="text-[#c0392b] text-sm">{invoiceData.carNo}</p>
              )}
            </div>
          </div>

          {/* Description Table */}
          <div className="px-5 py-4">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-[#1e3a5f] font-bold text-sm text-left py-2">Description</th>
                  <th className="text-[#1e3a5f] font-bold text-sm text-left py-2">Total HR's or km's</th>
                  <th className="text-[#1e3a5f] font-bold text-sm text-left py-2">Cost</th>
                  <th className="text-[#1e3a5f] font-bold text-sm text-right py-2">Total Price</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="text-[#c0392b] text-sm py-2">
                    {isEditing ? (
                      <Input 
                        value={invoiceData.baseDescription} 
                        onChange={(e) => updateInvoiceData('baseDescription', e.target.value)}
                        className="h-7 text-sm"
                      />
                    ) : (
                      invoiceData.baseDescription
                    )}
                  </td>
                  <td className="text-[#c0392b] text-sm py-2">-</td>
                  <td className="text-[#c0392b] text-sm py-2">
                    {isEditing ? (
                      <Input 
                        type="number"
                        value={invoiceData.baseAmount || ''} 
                        onChange={(e) => updateInvoiceData('baseAmount', Number(e.target.value))}
                        className="h-7 text-sm w-28"
                      />
                    ) : (
                      `₹${invoiceData.baseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                    )}
                  </td>
                  <td className="text-[#c0392b] text-sm text-right py-2">₹{invoiceData.baseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
                {lineItems.map((item) => (
                  <tr key={item.id}>
                    <td className="text-[#c0392b] text-sm py-2">{item.description || 'Custom Item'}</td>
                    <td className="text-[#c0392b] text-sm py-2">{item.quantity || '-'}</td>
                    <td className="text-[#c0392b] text-sm py-2">₹{item.cost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="text-[#c0392b] text-sm text-right py-2">₹{item.cost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
                {withGST && (
                  <tr>
                    <td className="text-[#c0392b] text-sm py-2">GST (18%)</td>
                    <td className="text-[#c0392b] text-sm py-2">-</td>
                    <td className="text-[#c0392b] text-sm py-2">₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="text-[#c0392b] text-sm text-right py-2">₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Add Line Item Section - Hidden in Print */}
          <div className="px-5 py-2 no-print">
            <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Add Extra Charges</h3>
                <Button variant="outline" size="sm" onClick={addLineItem} className="gap-1">
                  <Plus className="w-4 h-4" />
                  Add Item
                </Button>
              </div>
              {lineItems.length > 0 && (
                <div className="space-y-2">
                  {lineItems.map((item) => (
                    <div key={item.id} className="flex gap-2 items-center">
                      <Input
                        placeholder="Description (e.g., Extra Hours, Km's)"
                        value={item.description}
                        onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        placeholder="Qty/Hrs/Kms"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(item.id, 'quantity', e.target.value)}
                        className="w-28"
                      />
                      <Input
                        type="number"
                        placeholder="Cost"
                        value={item.cost || ''}
                        onChange={(e) => updateLineItem(item.id, 'cost', Number(e.target.value))}
                        className="w-28"
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeLineItem(item.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {lineItems.length === 0 && (
                <p className="text-sm text-gray-500 text-center">Click "Add Item" to add extra charges like hours, kilometers, or other fees</p>
              )}
            </div>
          </div>

          {/* Grand Total */}
          <div className="flex justify-between items-center px-5 py-4 border-t-2 border-[#1e3a5f] mt-4">
            <span className="text-[#1e3a5f] font-bold text-lg">Grand Total</span>
            <span className="text-[#1e3a5f] font-bold text-xl">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>

          {/* Bank Details and Seal */}
          <div className="flex justify-between items-start px-5 py-4">
            <div className="text-sm text-gray-700">
              <p className="font-bold text-[#1e3a5f] mb-2">Bank Account Details:</p>
              <p>Mode of Payment: IMPS/NEFT</p>
              {isEditing ? (
                <div className="space-y-1 mt-2">
                  <div className="flex gap-2 items-center">
                    <span className="w-32">Account Holder:</span>
                    <Input 
                      value={invoiceData.bankAccountHolder} 
                      onChange={(e) => updateInvoiceData('bankAccountHolder', e.target.value)}
                      className="h-7 text-sm"
                    />
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="w-32">Branch Name:</span>
                    <Input 
                      value={invoiceData.bankBranch} 
                      onChange={(e) => updateInvoiceData('bankBranch', e.target.value)}
                      className="h-7 text-sm"
                    />
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="w-32">Bank Name:</span>
                    <Input 
                      value={invoiceData.bankName} 
                      onChange={(e) => updateInvoiceData('bankName', e.target.value)}
                      className="h-7 text-sm"
                    />
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="w-32">Account Number:</span>
                    <Input 
                      value={invoiceData.bankAccountNumber} 
                      onChange={(e) => updateInvoiceData('bankAccountNumber', e.target.value)}
                      className="h-7 text-sm"
                    />
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="w-32">IFSC:</span>
                    <Input 
                      value={invoiceData.bankIFSC} 
                      onChange={(e) => updateInvoiceData('bankIFSC', e.target.value)}
                      className="h-7 text-sm"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <p>Account Holder Name: {invoiceData.bankAccountHolder}</p>
                  <p>Branch Name: {invoiceData.bankBranch}</p>
                  <p>Bank Name: {invoiceData.bankName}</p>
                  <p>Current Account Number: {invoiceData.bankAccountNumber}</p>
                  <p>IFSC: {invoiceData.bankIFSC}</p>
                </>
              )}
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

        <div className="flex gap-2 justify-end p-4 no-print">
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

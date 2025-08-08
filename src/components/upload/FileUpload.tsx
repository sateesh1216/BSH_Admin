import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface FileUploadProps {
  onUploadSuccess: () => void;
}

export const FileUpload = ({ onUploadSuccess }: FileUploadProps) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const tripsFileRef = useRef<HTMLInputElement>(null);
  const maintenanceFileRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = (type: 'trips' | 'maintenance') => {
    const templates = {
      trips: [
        ['Date', 'Driver Name', 'Driver Number', 'Customer Name', 'Customer Number', 'From', 'To', 'Company', 'Fuel Type', 'Payment Mode', 'Driver Amount', 'Commission', 'Fuel', 'Tolls', 'Trip Amount'],
        ['2024-01-15', 'Rajesh Kumar', '9876543210', 'Amit Sharma', '9123456789', 'Mumbai', 'Pune', 'TechCorp', 'Petrol', 'Cash', '2500', '300', '800', '200', '4000']
      ],
      maintenance: [
        ['Date', 'Vehicle Number', 'Driver Name', 'Driver Number', 'Company', 'Maintenance Type', 'Description', 'Amount', 'Payment Mode', 'KM at Maintenance', 'Next Oil Change KM', 'Original Odometer KM'],
        ['2024-01-10', 'MH12AB1234', 'Rajesh Kumar', '9876543210', 'AutoServe', 'Oil Change', 'Engine oil and filter replacement', '1500', 'Cash', '45000', '50000', '40000']
      ]
    };

    const ws = XLSX.utils.aoa_to_sheet(templates[type]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, type);
    
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-template.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Success",
      description: `${type} template downloaded successfully`,
    });
  };

  const handleFileUpload = async (file: File, type: 'trips' | 'maintenance') => {
    if (!file) return;

    setIsUploading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (type === 'trips') {
        await uploadTrips(jsonData);
      } else {
        await uploadMaintenance(jsonData);
      }

      toast({
        title: "Success",
        description: `${type} data uploaded successfully`,
      });
      onUploadSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to upload ${type} data`,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const uploadTrips = async (data: any[]) => {
    const tripsData = data.map((row: any) => ({
      date: new Date(row.Date || row.date).toISOString().split('T')[0],
      driver_name: row['Driver Name'] || row.driver_name || '',
      driver_number: row['Driver Number'] || row.driver_number || '',
      customer_name: row['Customer Name'] || row.customer_name || '',
      customer_number: row['Customer Number'] || row.customer_number || '',
      from_location: row['From'] || row.from_location || '',
      to_location: row['To'] || row.to_location || '',
      company: row['Company'] || row.company || null,
      fuel_type: row['Fuel Type'] || row.fuel_type || 'Petrol',
      payment_mode: row['Payment Mode'] || row.payment_mode || 'Cash',
      driver_amount: parseFloat(row['Driver Amount'] || row.driver_amount || 0),
      commission: parseFloat(row['Commission'] || row.commission || 0),
      fuel_amount: parseFloat(row['Fuel'] || row.fuel_amount || 0),
      tolls: parseFloat(row['Tolls'] || row.tolls || 0),
      trip_amount: parseFloat(row['Trip Amount'] || row.trip_amount || 0),
      created_by: user?.id,
    }));

    const { error } = await supabase
      .from('trips')
      .insert(tripsData);

    if (error) throw error;
  };

  const uploadMaintenance = async (data: any[]) => {
    const maintenanceData = data.map((row: any) => ({
      date: new Date(row.Date || row.date).toISOString().split('T')[0],
      vehicle_number: row['Vehicle Number'] || row.vehicle_number || '',
      driver_name: row['Driver Name'] || row.driver_name || '',
      driver_number: row['Driver Number'] || row.driver_number || '',
      company: row['Company'] || row.company || null,
      maintenance_type: row['Maintenance Type'] || row.maintenance_type || '',
      description: row['Description'] || row.description || null,
      amount: parseFloat(row['Amount'] || row.amount || 0),
      payment_mode: row['Payment Mode'] || row.payment_mode || 'Cash',
      km_at_maintenance: parseFloat(row['KM at Maintenance'] || row.km_at_maintenance || 0) || null,
      next_oil_change_km: parseFloat(row['Next Oil Change KM'] || row.next_oil_change_km || 0) || null,
      original_odometer_km: parseFloat(row['Original Odometer KM'] || row.original_odometer_km || 0) || null,
      created_by: user?.id,
    }));

    const { error } = await supabase
      .from('maintenance')
      .insert(maintenanceData);

    if (error) throw error;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <FileSpreadsheet className="h-5 w-5" />
            Upload Trips Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload an Excel file with trip data. Use the template for correct format.
            </p>
            <input
              ref={tripsFileRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file, 'trips');
              }}
            />
            <div className="space-y-2">
              <label className="block text-sm font-medium">Select Trips Excel File</label>
              <Button
                onClick={() => tripsFileRef.current?.click()}
                disabled={isUploading}
                variant="outline"
                className="w-full justify-start"
              >
                Choose File
              </Button>
            </div>
            <Button
              onClick={() => downloadTemplate('trips')}
              variant="outline"
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <FileSpreadsheet className="h-5 w-5" />
            Upload Maintenance Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload an Excel file with maintenance data. Use the template for correct format.
            </p>
            <input
              ref={maintenanceFileRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file, 'maintenance');
              }}
            />
            <div className="space-y-2">
              <label className="block text-sm font-medium">Select Maintenance Excel File</label>
              <Button
                onClick={() => maintenanceFileRef.current?.click()}
                disabled={isUploading}
                variant="outline"
                className="w-full justify-start"
              >
                Choose File
              </Button>
            </div>
            <Button
              onClick={() => downloadTemplate('maintenance')}
              variant="outline"
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
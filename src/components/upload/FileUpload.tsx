import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
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
      maintenance_type: row['Maintenance Type'] || row.maintenance_type || '',
      description: row['Description'] || row.description || null,
      amount: parseFloat(row['Amount'] || row.amount || 0),
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
              Upload Excel file with trip data. Expected columns: Date, Driver Name, Driver Number, Customer Name, Customer Number, From, To, Company, Fuel Type, Payment Mode, Driver Amount, Commission, Fuel, Tolls, Trip Amount.
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
            <Button
              onClick={() => tripsFileRef.current?.click()}
              disabled={isUploading}
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              {isUploading ? 'Uploading...' : 'Upload Trips Excel'}
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
              Upload Excel file with maintenance data. Expected columns: Date, Vehicle Number, Driver Name, Maintenance Type, Description, Amount.
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
            <Button
              onClick={() => maintenanceFileRef.current?.click()}
              disabled={isUploading}
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              {isUploading ? 'Uploading...' : 'Upload Maintenance Excel'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
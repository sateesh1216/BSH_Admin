import { useEffect, useState } from 'react';
import { Settings2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { DEFAULT_FUEL_RATES, FuelRates, FuelType, getFuelUnit, getStoredFuelRates, saveFuelRates } from '@/lib/fuelRates';

const fuelTypes: FuelType[] = ['Petrol', 'Diesel', 'CNG', 'EV'];

export const FuelRateSettings = () => {
  const [rates, setRates] = useState<FuelRates>(DEFAULT_FUEL_RATES);

  useEffect(() => {
    setRates(getStoredFuelRates());
  }, []);

  const handleRateChange = (fuelType: FuelType, value: string) => {
    setRates((prev) => ({
      ...prev,
      [fuelType]: Number(value) || 0,
    }));
  };

  const handleSave = () => {
    saveFuelRates(rates);
    toast({
      title: 'Fuel rates saved',
      description: 'Trip form will now use the updated rates for auto fuel calculations.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Settings2 className="h-5 w-5" />
          Fuel Rate Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Manage fuel rates here. Trip fuel amount and mileage will use these values automatically.
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {fuelTypes.map((fuelType) => (
            <div key={fuelType} className="space-y-2">
              <Label htmlFor={`fuel-rate-${fuelType}`}>{fuelType} Rate (₹/{getFuelUnit(fuelType)})</Label>
              <Input
                id={`fuel-rate-${fuelType}`}
                type="number"
                step="0.01"
                value={rates[fuelType]}
                onChange={(event) => handleRateChange(fuelType, event.target.value)}
                placeholder="0.00"
              />
            </div>
          ))}
        </div>

        <Button type="button" onClick={handleSave}>
          Save Fuel Rates
        </Button>
      </CardContent>
    </Card>
  );
};
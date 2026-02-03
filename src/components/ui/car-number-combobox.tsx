import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CarNumberComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function CarNumberCombobox({ value, onValueChange }: CarNumberComboboxProps) {
  const [open, setOpen] = useState(false);
  const [carNumbers, setCarNumbers] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCarNumbers();
  }, []);

  const fetchCarNumbers = async () => {
    const { data, error } = await supabase
      .from('car_numbers')
      .select('car_number')
      .order('car_number');
    
    if (error) {
      console.error('Error fetching car numbers:', error);
      return;
    }
    
    setCarNumbers(data.map(item => item.car_number));
  };

  const handleAddNewCarNumber = async (newCarNumber: string) => {
    if (!newCarNumber.trim()) return;
    
    const upperCarNumber = newCarNumber.trim().toUpperCase();
    
    // Check if already exists
    if (carNumbers.includes(upperCarNumber)) {
      onValueChange(upperCarNumber);
      setOpen(false);
      return;
    }

    setIsLoading(true);
    
    const { error } = await supabase
      .from('car_numbers')
      .insert([{ car_number: upperCarNumber }]);
    
    if (error) {
      if (error.code === '23505') {
        // Duplicate - just select it
        onValueChange(upperCarNumber);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to save car number',
          variant: 'destructive',
        });
      }
    } else {
      setCarNumbers(prev => [...prev, upperCarNumber].sort());
      onValueChange(upperCarNumber);
      toast({
        title: 'Success',
        description: 'Car number saved for future use',
      });
    }
    
    setIsLoading(false);
    setOpen(false);
    setInputValue('');
  };

  const filteredCarNumbers = carNumbers.filter(cn =>
    cn.toLowerCase().includes(inputValue.toLowerCase())
  );

  const showAddOption = inputValue.trim() && 
    !carNumbers.some(cn => cn.toLowerCase() === inputValue.toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value || "Select or enter car number..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search or enter new car number..."
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandEmpty>
              {inputValue.trim() ? (
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => handleAddNewCarNumber(inputValue)}
                  disabled={isLoading}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add "{inputValue.toUpperCase()}"
                </Button>
              ) : (
                "No car number found."
              )}
            </CommandEmpty>
            <CommandGroup>
              {filteredCarNumbers.map((carNumber) => (
                <CommandItem
                  key={carNumber}
                  value={carNumber}
                  onSelect={() => {
                    onValueChange(carNumber);
                    setOpen(false);
                    setInputValue('');
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === carNumber ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {carNumber}
                </CommandItem>
              ))}
              {showAddOption && (
                <CommandItem
                  value={`add-${inputValue}`}
                  onSelect={() => handleAddNewCarNumber(inputValue)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add "{inputValue.toUpperCase()}"
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

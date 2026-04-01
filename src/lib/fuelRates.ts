export type FuelType = 'Petrol' | 'Diesel' | 'CNG' | 'EV';

export type FuelRates = Record<FuelType, number>;

export const FUEL_RATES_STORAGE_KEY = 'fuel_rates';
export const FUEL_RATES_UPDATED_EVENT = 'fuel-rates-updated';

export const DEFAULT_FUEL_RATES: FuelRates = {
  Petrol: 108.35,
  Diesel: 0,
  CNG: 92.2,
  EV: 0,
};

export const getStoredFuelRates = (): FuelRates => {
  if (typeof window === 'undefined') return DEFAULT_FUEL_RATES;

  try {
    const raw = window.localStorage.getItem(FUEL_RATES_STORAGE_KEY);
    if (!raw) return DEFAULT_FUEL_RATES;

    const parsed = JSON.parse(raw) as Partial<FuelRates>;

    return {
      ...DEFAULT_FUEL_RATES,
      ...Object.fromEntries(
        Object.entries(parsed).map(([key, value]) => [key, Number(value) || 0])
      ),
    } as FuelRates;
  } catch {
    return DEFAULT_FUEL_RATES;
  }
};

export const saveFuelRates = (rates: FuelRates) => {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(FUEL_RATES_STORAGE_KEY, JSON.stringify(rates));
  window.dispatchEvent(new Event(FUEL_RATES_UPDATED_EVENT));
};

export const getFuelUnit = (fuelType: FuelType) => (fuelType === 'CNG' ? 'kg' : fuelType === 'EV' ? 'unit' : 'liter');
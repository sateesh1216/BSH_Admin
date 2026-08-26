export interface InvoiceBranding {
  website: string;
  companyName: string;
  addressLines: string[];
  lin: string;
  mobile: string;
  logoDataUrl: string | null;
  footerText: string;
}

const STORAGE_KEY = 'bsh_invoice_branding';

export const DEFAULT_BRANDING: InvoiceBranding = {
  website: 'www.bshtaxiservices.com',
  companyName: 'BSH TAXI SERVICES',
  addressLines: [
    '36-92-242-532/1, Palanati colony,',
    'kancharapelam,',
    'Visakhapatnam, 530008.',
  ],
  lin: 'AP-03-46-005-03355176',
  mobile: '+91 8886803322, +91 9640241216',
  logoDataUrl: null,
  footerText: '',
};

export const getInvoiceBranding = (): InvoiceBranding => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_BRANDING };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_BRANDING,
      ...parsed,
      addressLines: Array.isArray(parsed.addressLines) ? parsed.addressLines : DEFAULT_BRANDING.addressLines,
    };
  } catch {
    return { ...DEFAULT_BRANDING };
  }
};

export const saveInvoiceBranding = (branding: InvoiceBranding) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(branding));
  } catch {
    /* storage unavailable */
  }
};

export const resetInvoiceBranding = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable */
  }
};

export const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read image file'));
    reader.readAsDataURL(file);
  });

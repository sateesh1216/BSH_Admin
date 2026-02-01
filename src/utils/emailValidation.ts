// Common email domain typos and their corrections
const EMAIL_TYPOS: Record<string, string> = {
  'gmal.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmil.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yhaoo.com': 'yahoo.com',
  'hotmal.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmial.com': 'hotmail.com',
  'outloo.com': 'outlook.com',
  'outlok.com': 'outlook.com',
};

export const detectEmailTypo = (email: string): string | null => {
  const parts = email.toLowerCase().split('@');
  if (parts.length !== 2) return null;
  
  const domain = parts[1];
  
  if (EMAIL_TYPOS[domain]) {
    return `${parts[0]}@${EMAIL_TYPOS[domain]}`;
  }
  
  return null;
};

export const validateEmailDomain = (email: string): { isValid: boolean; suggestion?: string } => {
  const suggestion = detectEmailTypo(email);
  
  if (suggestion) {
    return { isValid: false, suggestion };
  }
  
  return { isValid: true };
};

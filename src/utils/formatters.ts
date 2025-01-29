export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export const parseCurrencyInput = (value: string): number => {
  // Remove currency symbol, commas and spaces
  const cleanValue = value.replace(/[$,\s]/g, '');
  // Convert to number, default to 0 if invalid
  return Number(cleanValue) || 0;
};

export const formatCurrencyInput = (value: string | number): string => {
  const numericValue = typeof value === 'string' ? parseCurrencyInput(value) : value;
  // Format without the currency symbol for input fields
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numericValue);
};
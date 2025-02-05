import { Input } from "./input";
import { formatCurrency, parseCurrencyInput } from "@/utils/formatters";

interface CurrencyInputProps {
  value: string | number;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export const CurrencyInput = ({ value, onChange, className, placeholder }: CurrencyInputProps) => {
  // Format the display value
  const displayValue = typeof value === 'number' 
    ? value.toFixed(2)
    : value;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    
    // Remove any non-numeric characters except decimal point
    newValue = newValue.replace(/[^\d.]/g, '');
    
    // Ensure only one decimal point
    const parts = newValue.split('.');
    if (parts.length > 2) {
      newValue = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit to 2 decimal places
    if (parts[1]?.length > 2) {
      newValue = parts[0] + '.' + parts[1].slice(0, 2);
    }
    
    onChange(newValue);
  };

  const handleBlur = () => {
    // On blur, format the number to always show 2 decimal places
    if (value) {
      const numValue = parseCurrencyInput(value.toString());
      onChange(numValue.toFixed(2));
    }
  };

  return (
    <Input
      type="text"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
      placeholder={placeholder}
    />
  );
}; 
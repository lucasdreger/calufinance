import { Input } from "@/components/ui/input";

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
}

export const CurrencyInput = ({
  value,
  onChange,
  placeholder = "Enter amount",
  className,
}: CurrencyInputProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove any non-numeric characters except decimal point
    const cleanValue = e.target.value.replace(/[^0-9.]/g, '');
    
    // Convert to number, handling both integers and decimals
    let numericValue = parseFloat(cleanValue);
    
    // If it's not a valid number, set to 0
    if (isNaN(numericValue)) {
      numericValue = 0;
    }
    
    onChange(numericValue);
  };

  // Format the value to always show 2 decimal places
  const formattedValue = value.toFixed(2);

  return (
    <Input
      type="text"
      value={formattedValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      inputMode="decimal"
    />
  );
};
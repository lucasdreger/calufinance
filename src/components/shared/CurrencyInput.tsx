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
    // Get raw input value
    let inputValue = e.target.value;
    
    // Remove all non-numeric characters except decimal point
    inputValue = inputValue.replace(/[^0-9.]/g, '');
    
    // Handle empty or invalid input
    if (!inputValue) {
      onChange(0);
      return;
    }

    // Ensure only one decimal point
    const parts = inputValue.split('.');
    if (parts.length > 2) {
      inputValue = parts[0] + '.' + parts.slice(1).join('');
    }

    // Convert to number
    const numericValue = parseFloat(inputValue);
    
    // Update if it's a valid number
    if (!isNaN(numericValue)) {
      onChange(numericValue);
    }
  };

  // Only format the display value, not the input value
  const displayValue = value === 0 && document.activeElement === document.getElementById('currency-input') 
    ? ''  // Show empty string while editing if value is 0
    : value.toFixed(2);  // Otherwise show formatted value

  return (
    <Input
      id="currency-input"
      type="text"
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      inputMode="decimal"
    />
  );
};
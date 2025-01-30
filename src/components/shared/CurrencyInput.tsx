import { useState } from "react";
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
  const [isFocused, setIsFocused] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Get raw input value
    let inputValue = e.target.value;
    
    // Remove all non-numeric characters
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

  const formatValue = (val: number): string => {
    if (isFocused) {
      // When focused, show the plain number for easier editing
      return val.toString();
    }
    // When not focused, show formatted currency
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  return (
    <Input
      type="text"
      value={formatValue(value)}
      onChange={handleChange}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      placeholder={placeholder}
      className={className}
      inputMode="decimal"
    />
  );
};
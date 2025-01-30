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
  const [inputValue, setInputValue] = useState(value.toString());
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Get raw input value
    let newValue = e.target.value;
    
    // Allow only numbers and one decimal point
    if (newValue === '' || newValue === '.') {
      setInputValue(newValue);
      return;
    }

    // Validate decimal format (only one decimal point, max 2 decimal places)
    const decimalRegex = /^\d*\.?\d{0,2}$/;
    if (!decimalRegex.test(newValue)) {
      return;
    }

    setInputValue(newValue);
    
    // Convert to number for onChange
    const numericValue = parseFloat(newValue || '0');
    if (!isNaN(numericValue)) {
      onChange(numericValue);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    
    // If empty or just a decimal point, set to 0
    if (inputValue === '' || inputValue === '.') {
      setInputValue('0');
      onChange(0);
      return;
    }

    // Ensure proper decimal formatting
    const numericValue = parseFloat(inputValue);
    if (!isNaN(numericValue)) {
      // Format with 2 decimal places
      const formattedValue = numericValue.toFixed(2);
      setInputValue(formattedValue);
      onChange(parseFloat(formattedValue));
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    // If value is 0, clear the input
    if (parseFloat(inputValue) === 0) {
      setInputValue('');
    }
  };

  const formatValue = (): string => {
    if (isFocused) {
      return inputValue;
    }
    // When not focused, show formatted currency
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(parseFloat(inputValue || '0'));
  };

  return (
    <Input
      type="text"
      value={formatValue()}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
      inputMode="decimal"
    />
  );
};
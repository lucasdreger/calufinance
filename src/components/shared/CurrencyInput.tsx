import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  label?: string;
}

export const CurrencyInput = ({
  value,
  onChange,
  placeholder = "Enter amount",
  className,
  label
}: CurrencyInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState(value.toString());
  
  // Sync input value with external value changes
  useEffect(() => {
    if (!isFocused) {
      const formattedValue = value.toFixed(2);
      setInputValue(formattedValue);
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    
    // Handle empty or decimal point input
    if (newValue === '' || newValue === '.') {
      setInputValue(newValue);
      return;
    }

    // Validate decimal format (up to 2 decimal places)
    const decimalRegex = /^\d*\.?\d{0,2}$/;
    if (!decimalRegex.test(newValue)) {
      return;
    }

    setInputValue(newValue);
    
    // Only update parent if we have a valid number
    const numericValue = parseFloat(newValue || '0');
    if (!isNaN(numericValue)) {
      onChange(numericValue);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    
    // Handle empty or invalid input
    if (inputValue === '' || inputValue === '.') {
      setInputValue('0.00');
      onChange(0);
      return;
    }

    // Format value on blur
    const numericValue = parseFloat(inputValue);
    if (!isNaN(numericValue)) {
      const formattedValue = numericValue.toFixed(2);
      setInputValue(formattedValue);
      onChange(numericValue);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Remove any formatting when focusing
    const numericValue = parseFloat(inputValue);
    if (!isNaN(numericValue)) {
      setInputValue(numericValue.toString());
    } else {
      setInputValue('');
    }
  };

  const formatValue = (): string => {
    if (isFocused) {
      return inputValue;
    }

    const numericValue = parseFloat(inputValue || '0');
    if (isNaN(numericValue)) {
      return '0.00';
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numericValue);
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="relative">
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
      </div>
    </div>
  );
};
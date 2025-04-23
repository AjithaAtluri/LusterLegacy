import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Globe } from 'lucide-react';

interface CurrencySelectorProps {
  currency: string;
  onChange: (currency: 'USD' | 'INR') => void;
  disabled?: boolean;
}

// Map currency to country details
const currencyCountryMap = {
  USD: {
    name: 'United States',
    flag: '🇺🇸',
    shippingNote: 'Ships to US addresses',
  },
  INR: {
    name: 'India',
    flag: '🇮🇳',
    shippingNote: 'Ships to India addresses',
  }
};

export function CurrencySelector({ 
  currency, 
  onChange, 
  disabled = false 
}: CurrencySelectorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <Label htmlFor="currency-selector">Currency & Shipping Location</Label>
      </div>
      
      <Select
        disabled={disabled}
        value={currency}
        onValueChange={(val) => onChange(val as 'USD' | 'INR')}
      >
        <SelectTrigger id="currency-selector" className="w-full">
          <SelectValue placeholder="Select currency" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="USD">
            <div className="flex items-center">
              <span className="mr-2">{currencyCountryMap.USD.flag}</span>
              <span>USD - US Dollar</span>
            </div>
          </SelectItem>
          <SelectItem value="INR">
            <div className="flex items-center">
              <span className="mr-2">{currencyCountryMap.INR.flag}</span>
              <span>INR - Indian Rupee</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
      
      <p className="text-sm text-muted-foreground">
        {currency && currencyCountryMap[currency as keyof typeof currencyCountryMap].shippingNote}
      </p>
    </div>
  );
}
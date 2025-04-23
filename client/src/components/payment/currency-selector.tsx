import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DollarSign, IndianRupee } from 'lucide-react';

interface CurrencySelectorProps {
  currency: string;
  onChange: (currency: 'USD' | 'INR') => void;
  disabled?: boolean;
}

export function CurrencySelector({ 
  currency, 
  onChange,
  disabled = false
}: CurrencySelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-base font-medium">Select Currency</Label>
      <RadioGroup
        defaultValue={currency}
        value={currency}
        onValueChange={(value) => onChange(value as 'USD' | 'INR')}
        className="flex space-x-4"
        disabled={disabled}
      >
        <div className={`flex items-center space-x-2 border rounded-md p-2 ${currency === 'USD' ? 'border-primary bg-primary/5' : 'border-input'} ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
          <RadioGroupItem value="USD" id="usd" disabled={disabled} />
          <Label htmlFor="usd" className={`flex items-center space-x-1 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
            <DollarSign className="h-4 w-4" />
            <span>USD</span>
            <span className="text-xs text-muted-foreground">(US Shipping)</span>
          </Label>
        </div>
        
        <div className={`flex items-center space-x-2 border rounded-md p-2 ${currency === 'INR' ? 'border-primary bg-primary/5' : 'border-input'} ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
          <RadioGroupItem value="INR" id="inr" disabled={disabled} />
          <Label htmlFor="inr" className={`flex items-center space-x-1 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
            <IndianRupee className="h-4 w-4" />
            <span>INR</span>
            <span className="text-xs text-muted-foreground">(India Shipping)</span>
          </Label>
        </div>
      </RadioGroup>
      
      <p className="text-xs text-muted-foreground">
        {currency === 'USD' 
          ? 'Your order will be shipped to the United States with pricing in US Dollars'
          : 'Your order will be shipped within India with pricing in Indian Rupees'}
      </p>
    </div>
  );
}
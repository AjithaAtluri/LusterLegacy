import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PAYMENT_TERMS } from '@/lib/constants';

interface PaymentSummaryProps {
  items: Array<{
    id: number;
    name: string;
    price: number;
    metalTypeId?: string;
    stoneTypeId?: string;
  }>;
  currency: 'USD' | 'INR';
  showAdvancePayment?: boolean;
}

// Exchange rate (approximate - would use actual API in production)
const USD_TO_INR = 75;

// Shipping rates
const SHIPPING_RATES = {
  USD: 30,
  INR: 1500,
};

export function PaymentSummary({ 
  items, 
  currency, 
  showAdvancePayment = true 
}: PaymentSummaryProps) {
  // Calculate subtotal
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  
  // Get shipping cost for selected currency
  const shipping = SHIPPING_RATES[currency];
  
  // Calculate total
  const total = subtotal + shipping;
  
  // Calculate advance payment (50%)
  const advancePayment = showAdvancePayment ? total * PAYMENT_TERMS.ADVANCE_PERCENTAGE : total;
  
  // Format currency
  const formatCurrency = (amount: number) => {
    if (currency === 'USD') {
      return `$${amount.toFixed(2)}`;
    } else {
      return `₹${amount.toFixed(2)}`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
        <CardDescription>
          {showAdvancePayment
            ? `${PAYMENT_TERMS.ADVANCE_PERCENTAGE * 100}% advance payment required`
            : 'Your order details'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Items */}
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between">
              <span className="text-sm">{item.name}</span>
              <span className="text-sm font-medium">{formatCurrency(item.price)}</span>
            </div>
          ))}
        </div>
        
        <Separator />
        
        {/* Subtotal */}
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="font-medium">{formatCurrency(subtotal)}</span>
        </div>
        
        {/* Shipping */}
        <div className="flex justify-between">
          <span>Shipping</span>
          <span className="font-medium">{formatCurrency(shipping)}</span>
        </div>
        
        <Separator />
        
        {/* Total */}
        <div className="flex justify-between text-lg">
          <span className="font-semibold">Total</span>
          <span className="font-semibold">{formatCurrency(total)}</span>
        </div>
        
        {/* Show advance payment details if needed */}
        {showAdvancePayment && (
          <>
            <div className="pt-2 pb-1">
              <div className="flex justify-between text-md bg-primary/10 p-2 rounded-md">
                <span className="font-medium">Advance Payment (Now)</span>
                <span className="font-bold">{formatCurrency(advancePayment)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {PAYMENT_TERMS.ADVANCE_DESCRIPTION}
              </p>
            </div>
            
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Remaining Payment</span>
              <span>{formatCurrency(total - advancePayment)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {PAYMENT_TERMS.REMAINING_DESCRIPTION}
            </p>
          </>
        )}
      </CardContent>
      <CardFooter className="flex flex-col">
        <p className="text-xs text-muted-foreground">
          Paying in {currency} · Shipping to {currency === 'USD' ? 'United States' : 'India'}
        </p>
      </CardFooter>
    </Card>
  );
}
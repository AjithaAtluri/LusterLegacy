import { useEffect, useState } from 'react';
import {
  PayPalScriptProvider,
  PayPalButtons,
  usePayPalScriptReducer
} from '@paypal/react-paypal-js';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { PAYMENT_TERMS } from '@/lib/constants';

interface PayPalButtonProps {
  cartItems: Array<{
    id: number;
    name: string;
    price: number;
    metalTypeId?: string;
    stoneTypeId?: string;
  }>;
  currency: 'USD' | 'INR';
  shippingAddress: any;
  onSuccess: (orderId: number) => void;
  onError: (error: any) => void;
}

// Exchange rate (approximate - would use actual API in production)
const USD_TO_INR = 75;

// Shipping rates
const SHIPPING_RATES = {
  USD: 30,
  INR: 1500,
};

export function PayPalButton({
  cartItems,
  currency,
  shippingAddress,
  onSuccess,
  onError
}: PayPalButtonProps) {
  const { toast } = useToast();
  
  // Calculate total price
  const calculateTotal = () => {
    const subtotal = cartItems.reduce((total, item) => total + item.price, 0);
    return subtotal + SHIPPING_RATES[currency];
  };
  
  // Calculate advance payment (50%)
  const calculateAdvancePayment = () => {
    return calculateTotal() * PAYMENT_TERMS.ADVANCE_PERCENTAGE;
  };
  
  return (
    <PayPalScriptProvider
      options={{
        clientId: process.env.PAYPAL_CLIENT_ID || '',
        currency,
        intent: "capture",
      }}
    >
      <PayPalButtonContent
        cartItems={cartItems}
        currency={currency}
        shippingAddress={shippingAddress}
        onSuccess={onSuccess}
        onError={onError}
        amount={calculateAdvancePayment()}
      />
    </PayPalScriptProvider>
  );
}

interface PayPalButtonContentProps extends PayPalButtonProps {
  amount: number;
}

function PayPalButtonContent({
  cartItems,
  currency,
  shippingAddress,
  onSuccess,
  onError,
  amount
}: PayPalButtonContentProps) {
  const [{ isPending }] = usePayPalScriptReducer();
  const { toast } = useToast();
  const [orderID, setOrderID] = useState<string | null>(null);
  
  // Format currency amount for display
  const formatCurrencyValue = (value: number) => {
    return value.toFixed(2);
  };
  
  // Display loading state while PayPal script is loading
  if (isPending) {
    return (
      <div className="flex justify-center items-center p-6 border rounded-md">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading PayPal...</span>
      </div>
    );
  }
  
  // Create a PayPal order
  const createOrder = async () => {
    try {
      // Make a call to the server to create the order
      const response = await apiRequest("POST", "/api/payment/create-paypal-order", {
        cartItems,
        currency,
        amount: amount,
        shippingAddress
      });
      
      // Store the order ID
      setOrderID(response.orderID);
      
      // Return the order ID
      return response.orderID;
    } catch (error) {
      console.error("Error creating PayPal order:", error);
      onError(error);
      throw error;
    }
  };
  
  // Capture a PayPal order
  const onApprove = async (data: { orderID: string }) => {
    try {
      // Make a call to the server to capture the order
      const response = await apiRequest("POST", "/api/payment/capture-paypal-order", {
        orderID: data.orderID,
        shippingAddress
      });
      
      if (response.success) {
        // Show success message
        toast({
          title: "Payment Successful",
          description: "Your order has been placed successfully. Thank you for your purchase!",
        });
        
        // Call the success callback
        onSuccess(response.orderId);
      } else {
        throw new Error("Failed to capture order");
      }
    } catch (error) {
      console.error("Error capturing PayPal order:", error);
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
      onError(error);
    }
  };
  
  // Handle payment cancellation
  const onCancel = async () => {
    try {
      if (orderID) {
        // Make a call to the server to cancel the order
        await apiRequest("POST", "/api/paypal/cancel-order", {
          orderID,
        });
      }
      
      toast({
        title: "Payment Cancelled",
        description: "You've cancelled the payment process. Your order was not placed.",
      });
    } catch (error) {
      console.error("Error cancelling PayPal order:", error);
    }
  };
  
  return (
    <div className="p-4 border rounded-md">
      <PayPalButtons
        style={{
          layout: "vertical",
          shape: "rect",
          color: "gold",
        }}
        createOrder={createOrder}
        onApprove={onApprove}
        onCancel={onCancel}
        onError={(err) => {
          console.error("PayPal Error:", err);
          toast({
            title: "Payment Error",
            description: "There was an error processing your payment. Please try again.",
            variant: "destructive",
          });
          onError(err);
        }}
      />
      <p className="text-xs text-center text-muted-foreground mt-4">
        By clicking "Pay now", you agree to our terms and advance payment policy. Your payment of {currency} {formatCurrencyValue(amount)} represents {PAYMENT_TERMS.ADVANCE_PERCENTAGE * 100}% of the total order value.
      </p>
    </div>
  );
}
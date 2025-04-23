import { useEffect, useState } from 'react';
import {
  PayPalScriptProvider,
  PayPalButtons,
  usePayPalScriptReducer
} from '@paypal/react-paypal-js';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { PAYMENT_TERMS } from '@/lib/constants';
import { getPayPalClientId, createPayPalOrder, capturePayPalOrder, cancelPayPalOrder } from '@/lib/paypal-client';

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
  const [clientId, setClientId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [initError, setInitError] = useState<string | null>(null);
  
  // Fetch PayPal client ID on component mount
  useEffect(() => {
    const fetchClientId = async () => {
      try {
        // Log the attempt to fetch client ID
        console.log("Attempting to fetch PayPal client ID...");
        
        const id = await getPayPalClientId();
        console.log("PayPal client ID fetched successfully");
        setClientId(id);
      } catch (error) {
        console.error("Failed to load PayPal client ID:", error);
        setInitError("Failed to initialize PayPal. Please try again later or contact support.");
        onError(error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchClientId();
  }, [onError]);
  
  // Calculate total price
  const calculateTotal = () => {
    const subtotal = cartItems.reduce((total, item) => total + item.price, 0);
    return subtotal + SHIPPING_RATES[currency];
  };
  
  // Calculate advance payment (50%)
  const calculateAdvancePayment = () => {
    return calculateTotal() * PAYMENT_TERMS.ADVANCE_PERCENTAGE;
  };
  
  // Show loading while fetching client ID
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-6 border rounded-md">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Initializing payment...</span>
      </div>
    );
  }
  
  // If client ID not available or error occurred, show error
  if (initError || !clientId) {
    return (
      <div className="p-4 border border-destructive rounded-md text-destructive">
        <p className="text-center">{initError || "Unable to initialize PayPal. Please try again later."}</p>
      </div>
    );
  }
  
  return (
    <PayPalScriptProvider
      options={{
        clientId,
        currency,
        intent: "capture",
        components: "buttons"
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
      // Use the helper function to create the order
      const orderID = await createPayPalOrder({
        cartItems,
        currency,
        shippingAddress
      });
      
      // Store the order ID
      setOrderID(orderID);
      
      // Return the order ID
      return orderID;
    } catch (error) {
      console.error("Error creating PayPal order:", error);
      onError(error);
      throw error;
    }
  };
  
  // Capture a PayPal order
  const onApprove = async (data: { orderID: string }) => {
    try {
      // Use the helper function to capture the order
      const result = await capturePayPalOrder({
        orderID: data.orderID,
        shippingAddress,
        currency
      });
      
      if (result.success) {
        // Show success message
        toast({
          title: "Payment Successful",
          description: "Your order has been placed successfully. Thank you for your purchase!",
        });
        
        // Call the success callback
        onSuccess(result.orderId);
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
        // Use the helper function to cancel the order
        await cancelPayPalOrder(orderID);
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
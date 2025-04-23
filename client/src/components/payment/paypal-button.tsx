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
      console.log("PayPal Button: Creating order with cart items:", cartItems.length);
      
      // Use the helper function to create the order
      const orderID = await createPayPalOrder({
        cartItems,
        currency,
        shippingAddress
      });
      
      // Store the order ID
      setOrderID(orderID);
      console.log("PayPal Button: Order created successfully:", orderID);
      
      // Return the order ID
      return orderID;
    } catch (error) {
      console.error("PayPal Button: Error creating order:", error);
      
      // Show toast with error message
      toast({
        title: "Payment Error",
        description: error instanceof Error 
          ? error.message 
          : "Failed to create payment. Please try again later.",
        variant: "destructive",
      });
      
      onError(error);
      throw error;
    }
  };
  
  // Capture a PayPal order
  const onApprove = async (data: { orderID: string }) => {
    try {
      console.log("PayPal Button: Capturing order:", data.orderID);
      
      // Use the helper function to capture the order
      const result = await capturePayPalOrder({
        orderID: data.orderID,
        shippingAddress,
        currency
      });
      
      if (result.success) {
        console.log("PayPal Button: Order captured successfully, order ID:", result.orderId);
        
        // Show success message
        toast({
          title: "Payment Successful",
          description: "Your order has been placed successfully. Thank you for your purchase!",
        });
        
        // Call the success callback
        onSuccess(result.orderId);
      } else {
        console.error("PayPal Button: Order capture failed with result:", result);
        throw new Error("Failed to complete the payment process");
      }
    } catch (error) {
      console.error("PayPal Button: Error capturing order:", error);
      
      toast({
        title: "Payment Failed",
        description: error instanceof Error 
          ? `Payment error: ${error.message}`
          : "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
      
      onError(error);
    }
  };
  
  // Handle payment cancellation
  const onCancel = async () => {
    console.log("PayPal Button: Payment cancelled by user");
    
    try {
      if (orderID) {
        console.log("PayPal Button: Cancelling order:", orderID);
        
        // Use the helper function to cancel the order
        const success = await cancelPayPalOrder(orderID);
        
        if (success) {
          console.log("PayPal Button: Order cancelled successfully");
        } else {
          console.log("PayPal Button: Order cancellation returned false");
        }
      } else {
        console.log("PayPal Button: No orderID to cancel");
      }
      
      // Show cancellation message regardless of the API call result
      toast({
        title: "Payment Cancelled",
        description: "You've cancelled the payment process. Your order was not placed.",
      });
    } catch (error) {
      console.error("PayPal Button: Error cancelling order:", error);
      // We don't show error toast for cancellation errors to avoid confusion
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
          console.error("PayPal Button: SDK reported error:", err);
          
          // Extract a more descriptive error message if possible
          let errorMessage = "There was an error processing your payment. Please try again.";
          
          if (err && typeof err === 'object') {
            if ('message' in err) {
              errorMessage = String(err.message);
            } else if ('details' in err && Array.isArray(err.details) && err.details.length > 0) {
              errorMessage = String(err.details[0].description || err.details[0].issue || "Unknown PayPal error");
            }
          }
          
          toast({
            title: "Payment Error",
            description: errorMessage,
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
import React, { useState, useEffect } from 'react';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface PayPalButtonProps {
  cartItems: any[];
  currency: 'USD' | 'INR';
  shippingAddress: any;
  onSuccess: (orderId: number) => void;
  onError: (error: any) => void;
}

export function PayPalButton({
  cartItems,
  currency,
  shippingAddress,
  onSuccess,
  onError
}: PayPalButtonProps) {
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const { toast } = useToast();

  // Fetch PayPal client ID
  useEffect(() => {
    const fetchClientId = async () => {
      try {
        const response = await fetch('/api/payment/paypal-client-id');
        const data = await response.json();
        setClientId(data.clientId);
      } catch (error) {
        console.error('Failed to fetch PayPal client ID:', error);
        toast({
          title: 'Error',
          description: 'Failed to initialize payment system. Please try again later.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchClientId();
  }, [toast]);

  // Create order
  const createOrder = async () => {
    setOrderLoading(true);
    try {
      const response = await apiRequest('/api/payment/create-paypal-order', {
        method: 'POST',
        body: JSON.stringify({
          cartItems,
          currency,
          shippingAddress
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const data = await response.json();
      return data.orderDetails.value;
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: 'Error',
        description: 'Failed to create order. Please try again.',
        variant: 'destructive'
      });
      onError(error);
      throw error;
    } finally {
      setOrderLoading(false);
    }
  };

  // Capture payment
  const onApprove = async (data: any) => {
    try {
      const captureResponse = await apiRequest('/api/payment/capture-paypal-order', {
        method: 'POST',
        body: JSON.stringify({
          orderID: data.orderID,
          shippingAddress,
          currency
        })
      });

      if (!captureResponse.ok) {
        throw new Error('Failed to capture payment');
      }

      const captureData = await captureResponse.json();
      toast({
        title: 'Success!',
        description: 'Your payment was successful.',
        variant: 'default'
      });
      
      onSuccess(captureData.orderId);
    } catch (error) {
      console.error('Error capturing payment:', error);
      toast({
        title: 'Payment Error',
        description: 'We couldn\'t process your payment. Please try again.',
        variant: 'destructive'
      });
      onError(error);
    }
  };

  // Handle payment cancellation
  const onCancel = async () => {
    try {
      await apiRequest('/api/payment/cancel-paypal-order', {
        method: 'POST'
      });
      
      toast({
        title: 'Payment Cancelled',
        description: 'You\'ve cancelled the payment process.',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error canceling payment:', error);
    }
  };

  // Handle payment errors
  const onPaymentError = (err: Record<string, unknown>) => {
    console.error('Payment error:', err);
    toast({
      title: 'Payment Error',
      description: 'There was a problem with your payment. Please try again.',
      variant: 'destructive'
    });
    onError(err);
  };

  if (loading || !clientId) {
    return (
      <div className="flex justify-center items-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2">Loading payment options...</span>
      </div>
    );
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId: clientId,
        currency,
        intent: "capture",
      }}
    >
      {orderLoading ? (
        <div className="flex justify-center items-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2">Preparing your order...</span>
        </div>
      ) : (
        <PayPalButtons
          style={{
            layout: "vertical",
            color: "gold",
            shape: "rect",
            label: "pay"
          }}
          createOrder={createOrder}
          onApprove={onApprove}
          onCancel={onCancel}
          onError={onPaymentError}
        />
      )}
    </PayPalScriptProvider>
  );
}
import { apiRequest } from "./queryClient";

/**
 * Get PayPal client ID from the server
 */
export async function getPayPalClientId(): Promise<string> {
  try {
    const response = await apiRequest("GET", "/api/payment/paypal-client-id");
    return response.clientId || '';
  } catch (error) {
    console.error("Error fetching PayPal client ID:", error);
    return '';
  }
}

/**
 * Create a PayPal order
 */
export async function createPayPalOrder(data: {
  cartItems: any[];
  currency: 'USD' | 'INR';
  shippingAddress: any;
}): Promise<string> {
  try {
    const response = await apiRequest("POST", "/api/payment/create-paypal-order", data);
    return response.orderID;
  } catch (error) {
    console.error("Error creating PayPal order:", error);
    throw error;
  }
}

/**
 * Capture a PayPal order
 */
export async function capturePayPalOrder(data: {
  orderID: string;
  shippingAddress: any;
  currency: 'USD' | 'INR';
}): Promise<{ success: boolean; orderId: number }> {
  try {
    const response = await apiRequest("POST", "/api/payment/capture-paypal-order", data);
    return {
      success: response.success,
      orderId: response.orderId
    };
  } catch (error) {
    console.error("Error capturing PayPal order:", error);
    throw error;
  }
}

/**
 * Cancel a PayPal order
 */
export async function cancelPayPalOrder(orderID: string): Promise<boolean> {
  try {
    const response = await apiRequest("POST", "/api/payment/cancel-paypal-order", { orderID });
    return response.success;
  } catch (error) {
    console.error("Error canceling PayPal order:", error);
    return false;
  }
}
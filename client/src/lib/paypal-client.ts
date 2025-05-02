import { apiRequest } from "./queryClient";

/**
 * Get PayPal client ID from the server
 */
export async function getPayPalClientId(): Promise<string> {
  try {
    const response = await apiRequest("GET", "/api/payment/paypal-client-id");
    
    if (!response) {
      console.error("Empty response from PayPal client ID endpoint");
      throw new Error("Empty response from server");
    }
    
    // Parse the response JSON
    const clientData = await response.json();
    console.log("PayPal client ID response data:", clientData);
    
    if (!clientData.clientId) {
      if (clientData.error) {
        console.error("PayPal client ID error:", clientData.error, clientData.message);
        throw new Error(clientData.message || "Failed to initialize PayPal");
      }
      console.error("Missing client ID in response", clientData);
      throw new Error("Missing PayPal client ID in server response");
    }
    
    return clientData.clientId;
  } catch (error) {
    console.error("Error fetching PayPal client ID:", error);
    throw error instanceof Error ? error : new Error("Failed to retrieve PayPal client ID");
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
    console.log("Creating PayPal order with data:", {
      ...data,
      cartItems: data.cartItems.length + " items"
    });
    
    const response = await apiRequest("POST", "/api/payment/create-paypal-order", data);
    const responseData = await response.json();
    console.log("PayPal create order response:", responseData);
    
    if (!responseData || !responseData.orderID) {
      console.error("Invalid response from create-paypal-order:", responseData);
      throw new Error("Failed to create PayPal order: Invalid response from server");
    }
    
    console.log("PayPal order created successfully:", responseData.orderID);
    return responseData.orderID;
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
    console.log("Capturing PayPal order:", data.orderID);
    
    const response = await apiRequest("POST", "/api/payment/capture-paypal-order", data);
    const responseData = await response.json();
    console.log("PayPal capture order response:", responseData);
    
    if (!responseData || typeof responseData.success !== 'boolean') {
      console.error("Invalid response from capture-paypal-order:", responseData);
      throw new Error("Failed to capture PayPal order: Invalid response from server");
    }
    
    console.log("PayPal order capture result:", responseData.success ? "Success" : "Failed");
    return {
      success: responseData.success,
      orderId: responseData.orderId
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
    console.log("Cancelling PayPal order:", orderID);
    
    const response = await apiRequest("POST", "/api/payment/cancel-paypal-order", { orderID });
    const responseData = await response.json();
    console.log("PayPal cancel order response:", responseData);
    
    if (!responseData || typeof responseData.success !== 'boolean') {
      console.error("Invalid response from cancel-paypal-order:", responseData);
      return false;
    }
    
    console.log("PayPal order cancellation result:", responseData.success ? "Success" : "Failed");
    return responseData.success;
  } catch (error) {
    console.error("Error canceling PayPal order:", error);
    return false;
  }
}
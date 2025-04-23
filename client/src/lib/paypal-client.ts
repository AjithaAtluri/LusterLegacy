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
    
    // Handle the case where response might be a string
    let clientData;
    if (typeof response === 'string') {
      try {
        clientData = JSON.parse(response);
      } catch (e) {
        console.error("Invalid JSON in PayPal response", response);
        throw new Error("Invalid response format");
      }
    } else {
      clientData = response;
    }
    
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
    
    if (!response || !response.orderID) {
      console.error("Invalid response from create-paypal-order:", response);
      throw new Error("Failed to create PayPal order: Invalid response from server");
    }
    
    console.log("PayPal order created successfully:", response.orderID);
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
    console.log("Capturing PayPal order:", data.orderID);
    
    const response = await apiRequest("POST", "/api/payment/capture-paypal-order", data);
    
    if (!response || typeof response.success !== 'boolean') {
      console.error("Invalid response from capture-paypal-order:", response);
      throw new Error("Failed to capture PayPal order: Invalid response from server");
    }
    
    console.log("PayPal order capture result:", response.success ? "Success" : "Failed");
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
    console.log("Cancelling PayPal order:", orderID);
    
    const response = await apiRequest("POST", "/api/payment/cancel-paypal-order", { orderID });
    
    if (!response || typeof response.success !== 'boolean') {
      console.error("Invalid response from cancel-paypal-order:", response);
      return false;
    }
    
    console.log("PayPal order cancellation result:", response.success ? "Success" : "Failed");
    return response.success;
  } catch (error) {
    console.error("Error canceling PayPal order:", error);
    return false;
  }
}
import { Request, Response } from 'express';
import { storage } from './storage';

// Check if PayPal credentials are available
if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
  console.error('Missing PayPal API credentials. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET environment variables.');
}

export const paypalClientId = process.env.PAYPAL_CLIENT_ID;

// Log PayPal environment setup
console.log('PayPal Environment:',
  paypalClientId ? 'Client ID is configured' : 'Missing Client ID',
  process.env.PAYPAL_CLIENT_SECRET ? 'Client Secret is configured' : 'Missing Client Secret'
);

/**
 * Create an order in PayPal
 */
export const createOrder = async (req: Request, res: Response) => {
  try {
    const { cartItems, currency = 'USD', shippingAddress = {} } = req.body;
    
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ error: 'Invalid cart items' });
    }

    // Get session ID from request
    const sessionId = req.cookies.sessionId || '';
    
    // Validate currency
    if (currency !== 'USD' && currency !== 'INR') {
      return res.status(400).json({ error: 'Currency must be USD or INR' });
    }

    // Skip shipping address validation for design consultation payments
    const isConsultationFee = cartItems.some(item => {
      // First check if it's marked as a custom design
      if (item.isCustomDesign) return true;
      
      // If we have a design request ID, it's likely a consultation fee
      if (item.designRequestId) return true;
      
      // This check might not work directly since 'name' isn't in the cart item type
      // But we keep it for backward compatibility with older code that might set a name
      const itemAny = item as any;
      return itemAny.name && typeof itemAny.name === 'string' && 
        itemAny.name.toLowerCase().includes('consultation fee');
    });
    
    if (!isConsultationFee) {
      // Only validate shipping for regular product orders
      // Skip for consultation fees and custom design requests
      if (!shippingAddress || !shippingAddress.country) {
        return res.status(400).json({ error: 'Shipping address is required for product orders' });
      }

      // Check country and currency match
      if (
        (currency === 'USD' && shippingAddress.country !== 'US') ||
        (currency === 'INR' && shippingAddress.country !== 'IN')
      ) {
        return res.status(400).json({ 
          error: 'Currency and shipping country mismatch. USD for US addresses and INR for India addresses only.'
        });
      }
    }

    // Calculate totals
    let itemTotal = 0;
    const items = [];

    for (const item of cartItems) {
      const product = await storage.getProduct(item.productId);
      
      if (!product) {
        return res.status(404).json({ error: `Product not found: ${item.productId}` });
      }

      const price = item.isCustomDesign 
        ? (await storage.getDesignRequest(item.designRequestId || 0))?.estimatedPrice || product.basePrice
        : product.basePrice;
      
      itemTotal += price;
      
      items.push({
        name: product.name,
        unit_amount: {
          currency_code: currency,
          value: price.toString()
        },
        quantity: 1
      });
    }

    // Determine shipping cost based on currency
    // For demonstration: INR shipping is 1500, USD shipping is 30
    const shippingCost = currency === 'USD' ? 30 : 1500;
    const totalAmount = itemTotal + shippingCost;

    // Generate a mock order ID for development purposes
    // In production, this would come from the actual PayPal API
    const mockOrderId = `ORDER-${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;
    
    console.log('Creating PayPal order:', mockOrderId, 'with total amount:', totalAmount, currency);
    
    // Return order details to client with the expected orderID format
    res.status(200).json({
      orderID: mockOrderId, // This is the key format the PayPal component expects
      orderDetails: {
        currency_code: currency,
        value: totalAmount.toString(),
        items,
        shipping: {
          currency_code: currency,
          value: shippingCost.toString()
        },
        item_total: {
          currency_code: currency,
          value: itemTotal.toString()
        }
      }
    });
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

/**
 * Capture an order payment
 */
export const captureOrder = async (req: Request, res: Response) => {
  try {
    const { orderID, shippingAddress = {}, currency } = req.body;
    
    if (!orderID) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Get cart items from session
    const sessionId = req.cookies.sessionId || '';
    const cartItems = await storage.getCartItemsBySession(sessionId);
    
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ error: 'No items in cart' });
    }
    
    // Check if this is a design consultation fee payment
    const isConsultationFee = cartItems.some(item => {
      // First check if it's marked as a custom design
      if (item.isCustomDesign) return true;
      
      // If we have a design request ID, it's likely a consultation fee
      if (item.designRequestId) return true;
      
      // This check might not work directly since 'name' isn't in the cart item type
      // But we keep it for backward compatibility with older code that might set a name
      const itemAny = item as any;
      return itemAny.name && typeof itemAny.name === 'string' && 
        itemAny.name.toLowerCase().includes('consultation fee');
    });
    
    // Record the order in the database (simplified version)
    const totalAmount = cartItems.reduce((sum, item) => sum + item.price, 0);
    
    // Get authenticated user if available
    let userId = null;
    if (req.user && req.user.id) {
      userId = req.user.id;
    }
    
    // If this is a consultation fee payment, handle it differently
    if (isConsultationFee && userId) {
      // For consultation fees, mark the associated design request as paid
      const designRequestId = cartItems[0].designRequestId;
      if (designRequestId) {
        // Update the design request status to indicate fee has been paid
        await storage.updateDesignRequest(designRequestId, {
          status: 'design-fee-paid',
          consultationFeePaid: true
        });
        console.log(`Design consultation fee paid for request #${designRequestId}`);
      }
    }
    
    const orderDetails = {
      sessionId,
      userId, // Use authenticated user ID if available
      orderStatus: 'pending',
      paymentStatus: 'completed',
      totalAmount: totalAmount,
      advanceAmount: totalAmount * 0.5, // 50% advance payment
      balanceAmount: totalAmount * 0.5, // 50% remaining payment
      customerName: shippingAddress.name || (req.user ? req.user.username : 'Guest User'),
      customerEmail: shippingAddress.email || (req.user ? req.user.email : 'customer@example.com'),
      customerPhone: shippingAddress.phone || '',
      shippingAddress,
      paymentMethod: 'paypal',
      paymentId: orderID,
      currency: currency || 'USD'
    };

    // Create order in database
    const order = await storage.createOrder(orderDetails);

    // Create order items
    for (const item of cartItems) {
      await storage.createOrderItem({
        orderId: order.id,
        productId: item.productId,
        metalTypeId: item.metalTypeId,
        stoneTypeId: item.stoneTypeId,
        price: item.price,
        isCustomDesign: item.isCustomDesign || false,
        designRequestId: item.designRequestId
      });
    }

    // Clear cart after successful order
    await storage.clearCart(sessionId);

    // Return success response
    res.status(200).json({
      success: true,
      orderId: order.id
    });
  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    res.status(500).json({ error: 'Failed to capture order' });
  }
};

/**
 * Cancel an order
 */
export const cancelOrder = async (req: Request, res: Response) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Order was canceled'
    });
  } catch (error) {
    console.error('Error canceling order:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
};
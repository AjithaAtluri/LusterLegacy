import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CurrencySelector } from "@/components/payment/currency-selector";
import { ShippingAddressForm, type ShippingAddressFormValues } from "@/components/payment/shipping-address-form";
import { PaymentSummary } from "@/components/payment/payment-summary";
import { PayPalButton } from "@/components/payment/paypal-button";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface PayPalCheckoutFormProps {
  cart: {
    items: Array<{
      id: number;
      product: {
        id: number;
        name: string;
        imageUrl: string;
      };
      metalType: {
        id: string;
        name: string;
      };
      stoneType: {
        id: string;
        name: string;
      };
      price: number;
      metalTypeId: string;
      stoneTypeId: string;
      productId: number;
    }>;
    total: number;
  };
}

export default function PayPalCheckoutForm({ cart }: PayPalCheckoutFormProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // State for the checkout process
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');
  const [shippingAddress, setShippingAddress] = useState<ShippingAddressFormValues | null>(null);
  const [activeTab, setActiveTab] = useState<string>("shipping");
  const [paymentError, setPaymentError] = useState<string | null>(null);
  
  // Handle successful payment
  const handlePaymentSuccess = (orderId: number) => {
    setLocation("/checkout/success");
  };
  
  // Handle payment error
  const handlePaymentError = (error: any) => {
    console.error("Payment error:", error);
    setPaymentError("There was an error processing your payment. Please try again.");
  };
  
  // Handle shipping form submission
  const handleShippingSubmit = (data: ShippingAddressFormValues) => {
    setShippingAddress(data);
    setActiveTab("payment");
  };
  
  // Reset shipping form to edit
  const handleEditShipping = () => {
    setActiveTab("shipping");
  };
  
  // Simplified cart items for payment components
  const paymentItems = cart.items.map(item => ({
    id: item.id,
    name: item.product.name,
    price: item.price,
    metalTypeId: item.metalTypeId,
    stoneTypeId: item.stoneTypeId,
    productId: item.productId
  }));
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Checkout Form */}
      <div className="lg:col-span-7">
        <Card>
          <CardHeader>
            <CardTitle className="font-playfair text-2xl">Checkout</CardTitle>
            <CardDescription>
              Complete your order with secure payment
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Currency Selection */}
            <div className="mb-6">
              <CurrencySelector 
                currency={currency} 
                onChange={setCurrency}
                disabled={activeTab === "payment" && shippingAddress !== null}
              />
            </div>
            
            {/* Tabs for multi-step checkout */}
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="w-full"
            >
              {/* Tab List */}
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="shipping">Shipping</TabsTrigger>
                <TabsTrigger 
                  value="payment" 
                  disabled={!shippingAddress}
                >
                  Payment
                </TabsTrigger>
              </TabsList>
              
              {/* Shipping Address Tab */}
              <TabsContent value="shipping" className="pt-4">
                <ShippingAddressForm 
                  currency={currency}
                  onSubmit={handleShippingSubmit}
                  initialValues={shippingAddress || undefined}
                  submitButtonText="Continue to Payment"
                />
              </TabsContent>
              
              {/* Payment Tab */}
              <TabsContent value="payment" className="pt-4">
                {shippingAddress ? (
                  <div className="space-y-6">
                    <div className="bg-secondary/30 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <h3 className="font-playfair font-medium">Shipping To:</h3>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={handleEditShipping}
                        >
                          Edit
                        </Button>
                      </div>
                      <div className="text-sm space-y-1">
                        <p>{shippingAddress.name}</p>
                        <p>{shippingAddress.street}</p>
                        <p>
                          {shippingAddress.city}, {shippingAddress.state} {' '}
                          {currency === 'USD' ? shippingAddress.zipCode : shippingAddress.pinCode}
                        </p>
                        <p>{currency === 'USD' ? 'United States' : 'India'}</p>
                        <p>{shippingAddress.phone}</p>
                        <p>{shippingAddress.email}</p>
                      </div>
                    </div>
                    
                    {/* Payment Error */}
                    {paymentError && (
                      <div className="bg-destructive/10 p-4 rounded-lg flex items-start space-x-2">
                        <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-medium text-destructive">Payment Error</p>
                          <p className="text-sm">{paymentError}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* PayPal Payment Button */}
                    <div className="space-y-2">
                      <h3 className="font-playfair font-medium">Pay with PayPal</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Secure payment via PayPal. You can use your PayPal account or pay with a credit card.
                      </p>
                      <PayPalButton 
                        cartItems={paymentItems}
                        currency={currency}
                        shippingAddress={shippingAddress}
                        onSuccess={handlePaymentSuccess}
                        onError={handlePaymentError}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="mb-4">Please complete your shipping information first.</p>
                    <Button onClick={() => setActiveTab("shipping")}>
                      Enter Shipping Details
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* Order Summary */}
      <div className="lg:col-span-5">
        <PaymentSummary 
          items={paymentItems}
          currency={currency}
          showAdvancePayment={true}
        />
      </div>
    </div>
  );
}
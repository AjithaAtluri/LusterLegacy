import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CreditCard, DollarSign, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import ReliableProductImage from "@/components/ui/reliable-product-image";
import { ProductSpecifications } from "@/components/products/product-specifications";

export default function FinalizeOrder() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  
  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("USA");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("paypal");
  const [currency, setCurrency] = useState("USD");
  
  // Fetch product data to display in the form
  const { data: product, isLoading, error } = useQuery({
    queryKey: [`/api/products/${id}`],
    enabled: !!id,
  });

  // Update country based on currency selection
  useEffect(() => {
    // If INR, default country is India, if USD, default country is USA
    if (currency === "INR") {
      setCountry("India");
    } else {
      setCountry("USA");
    }
  }, [currency]);
  
  // Pre-fill form with user data if available
  useEffect(() => {
    if (user) {
      setName(user.username);
      setEmail(user.email || "");
    }
  }, [user]);

  // Handle form submission
  const orderMutation = useMutation({
    mutationFn: async (formData: {
      productId: number;
      name: string;
      email: string;
      phone: string;
      address: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      additionalNotes: string;
      paymentMethod: string;
      currency: string;
      action: string; // request_quote or make_payment
    }) => {
      const response = await apiRequest("POST", "/api/orders", formData);
      if (!response.ok) {
        throw new Error("Failed to submit order request");
      }
      return { data: await response.json(), action: formData.action };
    },
    onSuccess: (result) => {
      const { action } = result;
      
      if (action === "request_quote") {
        toast({
          title: "Quote Request Submitted!",
          description: "We've received your request for a final quote and will contact you shortly with details.",
          variant: "default",
        });
      } else {
        toast({
          title: "Order Request Successful!",
          description: "We've received your order request. Please proceed to make the 50% advance payment to begin crafting your piece.",
          variant: "default",
        });
      }
      
      // Navigate back to product detail page after successful submission
      setTimeout(() => {
        setLocation(`/product-detail/${id}`);
      }, 2500);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Get the form element to extract which button was clicked
    const form = e.currentTarget;
    const formData = new FormData(form);
    const action = formData.get('action')?.toString() || 'request_quote';
    
    // Validate form fields
    if (!name || !email || !address || !city || !state || !postalCode || !country) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate country-currency matching
    if ((currency === "INR" && country !== "India") || 
        (currency === "USD" && country === "India")) {
      toast({
        title: "Invalid Selection",
        description: "USD payments must be shipped to the USA, and INR payments must be shipped to India.",
        variant: "destructive",
      });
      return;
    }
    
    // Submit the form
    orderMutation.mutate({
      productId: Number(id),
      name,
      email,
      phone,
      address,
      city,
      state,
      postalCode,
      country,
      additionalNotes,
      paymentMethod,
      currency,
      action, // Add the action parameter
    });
  };

  // Navigate back to product detail
  const handleBack = () => {
    setLocation(`/product-detail/${id}`);
  };

  const getProductPrice = () => {
    if (!product) return 0;
    
    if (currency === "USD") {
      return product.calculatedPriceUSD || product.basePrice;
    } else {
      return product.calculatedPriceINR || product.basePrice;
    }
  };
  
  // Redirect to login if not authenticated
  const handleLoginRedirect = () => {
    // Store the current URL to redirect back after login
    localStorage.setItem('redirectAfterLogin', `/finalize-order/${id}`);
    setLocation('/auth');
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  // If not authenticated, show login prompt
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="font-playfair text-2xl font-bold mb-4">Authentication Required</h1>
        <p className="mb-6">You need to be logged in to place an order for our products.</p>
        <p className="mb-6 text-sm text-foreground/70">
          Creating an account allows you to track your orders in your dashboard.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button onClick={handleLoginRedirect} className="bg-primary">
            <LogIn className="mr-2 h-4 w-4" />
            Login or Create Account
          </Button>
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Product
          </Button>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
        <p className="mb-6">We couldn't find the product you're looking for.</p>
        <Button onClick={() => setLocation("/collections")}>
          Back to Collections
        </Button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Finalize Order for {product.name} | Luster Legacy</title>
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={handleBack} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Product
          </Button>
          <h1 className="font-playfair text-3xl font-bold mb-2">Finalyse Order</h1>
          <p className="text-foreground/70 mb-3">
            Complete your information below to request final quotation for {product.name}
          </p>
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md p-4 mb-6">
            <h3 className="font-playfair text-lg font-semibold mb-2">Our Order Process</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Request a final quotation or proceed with 50% advance payment</li>
              <li>Your order will be crafted to perfection over 3-4 weeks</li>
              <li>The item will be shipped after the remaining 50% payment is made</li>
              <li>All custom pieces are handcrafted to order with the finest materials</li>
            </ul>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Order Summary Card */}
          <div className="md:col-span-1 space-y-6">
            <Card className="h-fit">
              <CardContent className="p-6">
                <h2 className="font-playfair text-xl font-semibold mb-4">Order Summary</h2>
                <div className="mb-4 rounded-md overflow-hidden">
                  <ReliableProductImage
                    productId={product.id}
                    alt={product.name}
                    className="w-full h-auto object-cover"
                  />
                </div>
                <h3 className="font-playfair text-lg font-semibold">{product.name}</h3>
                <p className="text-foreground/70 text-sm my-2">{product.description}</p>
                
                {/* Product Specifications Component */}
                {product.details && (
                  <>
                    {(() => {
                      try {
                        const details = JSON.parse(product.details);
                        const additionalData = details.additionalData || {};
                        const aiInputs = additionalData.aiInputs || {};
                        
                        const metalType = aiInputs.metalType || additionalData.metalType || "";
                        const metalWeight = aiInputs.metalWeight || additionalData.metalWeight || 0;
                        const mainStoneType = aiInputs.mainStoneType || additionalData.mainStoneType || "";
                        const mainStoneWeight = aiInputs.mainStoneWeight || additionalData.mainStoneWeight || 0;
                        const secondaryStoneType = aiInputs.secondaryStoneType || additionalData.secondaryStoneType || "";
                        const secondaryStoneWeight = aiInputs.secondaryStoneWeight || additionalData.secondaryStoneWeight || 0;
                        const otherStoneType = aiInputs.otherStoneType || additionalData.otherStoneType || "";
                        const otherStoneWeight = aiInputs.otherStoneWeight || additionalData.otherStoneWeight || 0;
                        
                        return (
                          <ProductSpecifications
                            productMetalType={metalType}
                            productMetalWeight={metalWeight}
                            mainStoneType={mainStoneType}
                            mainStoneWeight={mainStoneWeight}
                            secondaryStoneType={secondaryStoneType}
                            secondaryStoneWeight={secondaryStoneWeight}
                            otherStoneType={otherStoneType}
                            otherStoneWeight={otherStoneWeight}
                            currentPrice={getProductPrice()}
                            formatCurrency={(value) => formatCurrency(value, currency)}
                            className="mt-4"
                          />
                        );
                      } catch (e) {
                        console.error("Error parsing product details:", e);
                        return null;
                      }
                    })()}
                  </>
                )}
              </CardContent>
              <CardFooter className="flex flex-col p-6 pt-0 space-y-4">
                <Separator />
                <div className="flex justify-between items-center w-full">
                  <span className="font-medium">Price:</span>
                  <span className="font-semibold text-lg">
                    {formatCurrency(getProductPrice(), currency)}
                  </span>
                </div>
                <div className="flex justify-between items-center w-full">
                  <span className="font-medium">Shipping:</span>
                  <span className="font-semibold">Free</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-xl text-primary">
                    {formatCurrency(getProductPrice(), currency)}
                  </span>
                </div>
              </CardFooter>
            </Card>
            
{/* Payment Method Card removed and moved into the shipping form */}
          </div>
          
          {/* Order Form */}
          <div className="md:col-span-2">
            <Card>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit}>
                  <h2 className="font-playfair text-xl font-semibold mb-6">Shipping Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name*</Label>
                      <Input
                        id="name"
                        placeholder="Enter your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address*</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        readOnly={!!user?.email}
                        className={user?.email ? "bg-gray-100 dark:bg-gray-800 cursor-not-allowed" : ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number*</Label>
                      <Input
                        id="phone"
                        placeholder="Your contact number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country*</Label>
                      <Select 
                        value={country} 
                        onValueChange={setCountry}
                        disabled={currency === "USD" || currency === "INR"} // Lock based on currency
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your country" />
                        </SelectTrigger>
                        <SelectContent>
                          {currency === "USD" ? (
                            <SelectItem value="USA">United States</SelectItem>
                          ) : currency === "INR" ? (
                            <SelectItem value="India">India</SelectItem>
                          ) : (
                            <>
                              <SelectItem value="USA">United States</SelectItem>
                              <SelectItem value="India">India</SelectItem>
                              <SelectItem value="Canada">Canada</SelectItem>
                              <SelectItem value="UK">United Kingdom</SelectItem>
                              <SelectItem value="Australia">Australia</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address*</Label>
                      <Input
                        id="address"
                        placeholder="Street address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City*</Label>
                      <Input
                        id="city"
                        placeholder="City"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State/Province*</Label>
                      <Input
                        id="state"
                        placeholder="State or province"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Postal Code*</Label>
                      <Input
                        id="postalCode"
                        placeholder="Postal or ZIP code"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-6">
                    <Label htmlFor="additionalNotes">Additional Notes</Label>
                    <Textarea
                      id="additionalNotes"
                      placeholder="Any special instructions or requests"
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      className="h-32"
                    />
                  </div>
                  
                  {/* Payment Method section (moved from sidebar) */}
                  <div className="mb-6 border border-slate-200 dark:border-slate-800 rounded-md p-6">
                    <h2 className="font-playfair text-xl font-semibold mb-4">Payment Method</h2>
                    
                    {/* Currency selection - moved from sidebar */}
                    <div className="mb-6">
                      <Label htmlFor="currency" className="mb-2 block">Currency</Label>
                      <Select 
                        value={currency} 
                        onValueChange={(value) => setCurrency(value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD (Ship to USA)</SelectItem>
                          <SelectItem value="INR">INR (Ship to India)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-foreground/60 mt-1">
                        * USD payments will ship to the USA, INR payments will ship to India
                      </p>
                    </div>
                    
                    <RadioGroup 
                      defaultValue={paymentMethod} 
                      onValueChange={setPaymentMethod}
                      className="space-y-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="paypal" id="paypal" />
                        <Label htmlFor="paypal" className="flex items-center">
                          <CreditCard className="mr-2 h-4 w-4" />
                          PayPal / Credit Card
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                        <Label htmlFor="bank_transfer" className="flex items-center">
                          <DollarSign className="mr-2 h-4 w-4" />
                          Bank Transfer
                        </Label>
                      </div>
                    </RadioGroup>
                    <p className="text-sm text-foreground/60 mt-4">
                      * Payment instructions will be sent after your order is confirmed
                    </p>
                  </div>
                  
                  <div className="space-y-6 mt-6">
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4">
                      <h3 className="font-playfair text-base font-semibold mb-2">Payment & Shipping Terms</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>50% advance payment secures your order and initiates crafting</li>
                        <li>Your piece will be handcrafted over 3-4 weeks</li>
                        <li>Remaining 50% payment is due before shipping</li>
                        <li>Free shipping with insurance and tracking</li>
                      </ul>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-end">
                      <Button 
                        type="submit" 
                        variant="outline"
                        name="action"
                        value="request_quote"
                        disabled={orderMutation.isPending}
                        className="border-primary text-primary hover:bg-primary/5"
                      >
                        {orderMutation.isPending ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </span>
                        ) : (
                          <>Request Final Quote</>
                        )}
                      </Button>
                      
                      <Button 
                        type="submit" 
                        name="action"
                        value="make_payment"
                        className="bg-primary hover:bg-primary/90"
                        disabled={orderMutation.isPending}
                      >
                        {orderMutation.isPending ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-background" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </span>
                        ) : (
                          <>Make 50% Payment</>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
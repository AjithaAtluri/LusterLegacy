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
      setName(user.name || user.loginID);
      setEmail(user.email || "");
      setPhone(user.phone || "");
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
    
    // Validate form fields - for quote requests, we only need contact info, not shipping address
    if (user) {
      // For logged-in users, all contact info is available from their profile
      // No validation needed as we use their account info
    } else {
      // For guest users, validate basic contact information
      if (!name || !email || !phone || !country) {
        toast({
          title: "Required Fields Missing",
          description: "Please fill in all required contact information fields.",
          variant: "destructive",
        });
        return;
      }
    }
    
    // Set placeholder values for address fields since we're not collecting them for quote requests
    // but they're still required by the API
    if (!address) setAddress("Quote Request - No Address Needed");
    if (!city) setCity("Quote Request - No City Needed");
    if (!state) setState("Quote Request - No State Needed");
    if (!postalCode) setPostalCode("00000");
    
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
        <title>Request Final Quote for {product.name} | Luster Legacy</title>
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={handleBack} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Product
          </Button>
          <h1 className="font-playfair text-3xl font-bold mb-2">Request Final Quote</h1>
          <p className="text-foreground/70 mb-3">
            You've selected this exact piece without customization. Complete your information below to receive a final quote.
          </p>
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
            <h3 className="font-playfair text-lg font-medium mb-1 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              About This Process
            </h3>
            <ol className="list-decimal list-inside space-y-1 text-sm pl-2">
              <li>This form is for requesting a final quote for <span className="font-medium">{product.name}</span> exactly as shown</li>
              <li>After submitting, our team will verify pricing based on current metal rates and materials</li>
              <li>You'll receive the final quote within 24 hours</li>
              <li>Once you approve the quote, you'll pay 50% advance to begin production</li>
            </ol>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md p-4 mb-6">
            <h3 className="font-playfair text-lg font-semibold mb-2">Important Quote Information</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Each piece is custom-made; exact weights and colors may vary slightly based on stone sizes</li>
              <li>Gold price will be locked on the day your 50% advance payment is received</li>
              <li>Your quote will be valid for 7 days after we send it</li>
              <li>Production time is typically 3-4 weeks after advance payment</li>
              <li>Final shipping occurs after the remaining 50% payment is completed</li>
              <li>Note: Selecting PayPal or Bank Transfer only indicates your preferred payment method for future reference</li>
            </ul>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Order Summary Card */}
          <div className="md:col-span-1 space-y-6">
            <Card className="h-fit">
              <CardContent className="p-6">
                <h2 className="font-playfair text-xl font-semibold mb-4">Quote Request Summary</h2>
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
                  <span className="font-medium">Shipping:</span>
                  <span className="font-semibold">Free</span>
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
                  <h2 className="font-playfair text-xl font-semibold mb-6">Request Information</h2>
                  
                  {user && (
                    <div className="mb-6 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md p-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-green-100 dark:bg-green-800 rounded-full p-1.5 mt-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600 dark:text-green-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6L9 17l-5-5"></path>
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-green-800 dark:text-green-200">
                            Using your account information
                          </p>
                          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                            Your contact details from your Luster Legacy account will be used for this request. Just add any questions or notes you have below.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {!user ? (
                      <>
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
                      </>
                    ) : (
                      <>
                        <input type="hidden" name="name" value={name} />
                        <input type="hidden" name="email" value={email} />
                        <input type="hidden" name="phone" value={phone} />
                        <input type="hidden" name="country" value={country} />
                      </>
                    )}
                  </div>
                  
                  {/* Hidden fields for address that we're not collecting */}
                  <input type="hidden" name="address" value={address} />
                  <input type="hidden" name="city" value={city} />
                  <input type="hidden" name="state" value={state} />
                  <input type="hidden" name="postalCode" value={postalCode} />
                  
                  <div className="space-y-2 mb-6">
                    <Label htmlFor="additionalNotes">Questions/Notes</Label>
                    <Textarea
                      id="additionalNotes"
                      placeholder="Any questions or special instructions for your order..."
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      className="h-32"
                    />
                  </div>
                  
                  {/* Payment Method section (moved from sidebar) */}
                  <div className="mb-6 border border-slate-200 dark:border-slate-800 rounded-md p-6">
                    <h2 className="font-playfair text-xl font-semibold mb-4">Payment Preferences</h2>
                    <p className="text-sm text-foreground/70 mb-4">
                      Please indicate your preferred currency and payment method. These will be used when preparing your final quote.
                    </p>
                    
                    {/* Currency selection - moved from sidebar */}
                    <div className="mb-6">
                      <Label htmlFor="currency" className="mb-2 block">Preferred Currency</Label>
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
                    
                    <div className="mb-4">
                      <Label htmlFor="paymentMethod" className="mb-2 block">Preferred Payment Method</Label>
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
                    </div>
                    
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md p-3 mt-4">
                      <p className="text-sm text-foreground/80">
                        <strong>Important:</strong> Selecting a payment method here only indicates your preference. No payment is processed at this stage. We will send detailed payment instructions with your final quote.
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-6 mt-6">
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4">
                      <h3 className="font-playfair text-base font-semibold mb-2">Final Quote & Creation Process</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Each piece is custom-made with weights and colors that may vary based on stone sizes</li>
                        <li>50% advance payment locks the gold price on the day payment is received</li>
                        <li>Your piece will be handcrafted by skilled artisans over 3-4 weeks</li>
                        <li>Remaining 50% payment is required before shipping</li>
                        <li>Free shipping with insurance and tracking</li>
                        <li>Final prices may vary slightly from estimates due to customization</li>
                      </ul>
                    </div>
                    
                    <div className="flex justify-end">
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
                          <>Request Quote</>
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
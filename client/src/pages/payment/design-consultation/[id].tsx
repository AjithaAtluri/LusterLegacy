import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { useAuth } from "@/hooks/use-auth";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ChevronLeft, 
  Loader2, 
  CreditCard, 
  Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { PayPalButton } from "@/components/payment/paypal-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SiGooglepay, SiApplepay } from "react-icons/si";

// Fixed consultation fee amount - $150
const CONSULTATION_FEE = 150;

export default function DesignConsultationPayment() {
  const { id } = useParams();
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("paypal");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch design request data
  const { data: design, isLoading, error } = useQuery({
    queryKey: [`/api/custom-designs/${id}`],
    enabled: !!id && !!user,
  });
  
  // Redirect if already paid
  useEffect(() => {
    if (design && design.consultationFeePaid) {
      toast({
        title: "Already Paid",
        description: "The consultation fee for this design has already been paid.",
      });
      navigate(`/custom-designs/${id}`);
    }
  }, [design, navigate, toast, id]);
  
  // Handle payment success
  const handlePaymentSuccess = (orderId: number) => {
    // Navigate back to design detail page
    navigate(`/custom-designs/${id}`);
  };
  
  // Handle payment error
  const handlePaymentError = (error: any) => {
    console.error("Payment error:", error);
    toast({
      title: "Payment Failed",
      description: error instanceof Error ? error.message : "There was an error processing your payment. Please try again.",
      variant: "destructive",
    });
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-foreground/70">Loading design details...</p>
        </div>
      </div>
    );
  }
  
  if (error || !design) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Helmet>
          <title>Design Request Not Found | Luster Legacy</title>
        </Helmet>
        <div className="text-center py-12">
          <CreditCard className="h-16 w-16 mx-auto mb-4 text-foreground/20" />
          <h2 className="font-playfair text-2xl font-bold mb-2">Design Request Not Found</h2>
          <p className="text-foreground/70 mb-6">
            The design request you're looking for could not be found. It may have been removed or you may not have access to it.
          </p>
          <Button asChild>
            <Link href="/customer-dashboard">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    );
  }
  
  // Create cart item for PayPal
  const cartItems = [
    {
      id: 0,
      name: `Consultation Fee for Design Request #${design.id}`,
      price: CONSULTATION_FEE,
    }
  ];
  
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Helmet>
        <title>Pay Consultation Fee | Luster Legacy</title>
        <meta name="description" content="Pay the consultation fee for your custom jewelry design" />
      </Helmet>
      
      <div className="mb-8">
        <Button variant="outline" size="sm" asChild className="mb-4">
          <Link href={`/custom-designs/${id}`}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Design Request
          </Link>
        </Button>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-playfair text-3xl font-bold mb-2">Consultation Fee Payment</h1>
            <p className="text-foreground/70">
              Design Request #{design.id}
            </p>
          </div>
          <Badge className="bg-amber-500 text-white px-3 py-1 text-sm">
            Payment Required
          </Badge>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Payment Details */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
              <CardDescription>Complete payment to begin your custom design process</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary/5 p-4 rounded-md mb-6">
                <h3 className="font-semibold mb-1">What's Included:</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Detailed consultation with our design team</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Up to 4 design iterations to perfect your piece</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Professional CAD modeling of your custom design</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Detailed price quote for the final product</span>
                  </li>
                </ul>
              </div>
              
              <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="paypal" className="flex items-center gap-1">
                    <CreditCard className="h-4 w-4" />
                    <span>PayPal</span>
                  </TabsTrigger>
                  <TabsTrigger value="google" className="flex items-center gap-1">
                    <SiGooglepay className="h-5 w-5" />
                    <span>Google Pay</span>
                  </TabsTrigger>
                  <TabsTrigger value="apple" className="flex items-center gap-1">
                    <SiApplepay className="h-5 w-5" />
                    <span>Apple Pay</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="paypal" className="mt-0">
                  <PayPalButton
                    cartItems={cartItems}
                    currency="USD"
                    shippingAddress={{}}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                </TabsContent>
                
                <TabsContent value="google" className="mt-0">
                  <div className="p-6 border rounded-md text-center space-y-3">
                    <SiGooglepay className="h-12 w-12 mx-auto text-gray-800" />
                    <p>Google Pay integration will be available soon.</p>
                    <p className="text-sm text-muted-foreground">
                      Please use PayPal or another payment method for now.
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="apple" className="mt-0">
                  <div className="p-6 border rounded-md text-center space-y-3">
                    <SiApplepay className="h-12 w-12 mx-auto text-gray-800" />
                    <p>Apple Pay integration will be available soon.</p>
                    <p className="text-sm text-muted-foreground">
                      Please use PayPal or another payment method for now.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column - Payment Summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
              <CardDescription>One-time consultation fee</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-b pb-4">
                <div className="flex justify-between mb-2">
                  <span>Design Request #{design.id}</span>
                  <span className="font-medium">{formatCurrency(CONSULTATION_FEE)}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Consultation fee for custom jewelry design includes up to 4 iterations
                </p>
              </div>
              
              <div className="pt-2 space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium">{formatCurrency(CONSULTATION_FEE)}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(CONSULTATION_FEE)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start text-sm text-muted-foreground space-y-2">
              <p>
                This is a one-time consultation fee.
              </p>
              <p>
                After your design is approved, a separate payment of 50% of the final price will be required to begin production.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
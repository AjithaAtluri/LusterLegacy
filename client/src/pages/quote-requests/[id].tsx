import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Calendar, DollarSign, Clock, Package, Tag, MessageSquare, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { formatDate } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { ProductSpecifications } from "@/components/products/product-specifications";

export default function QuoteRequestDetailsPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  
  // Fetch quote request details
  const { data: quoteRequest, isLoading: isLoadingQuote } = useQuery({
    queryKey: ["/api/quote-requests", id],
    queryFn: async () => {
      const res = await fetch(`/api/quote-requests/${id}`);
      if (!res.ok) throw new Error("Failed to fetch quote request details");
      return res.json();
    },
    enabled: !!id && !!user,
  });

  // Fetch the product details
  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: ["/api/products", quoteRequest?.productId],
    queryFn: async () => {
      const res = await fetch(`/api/products/${quoteRequest?.productId}`);
      if (!res.ok) throw new Error("Failed to fetch product details");
      return res.json();
    },
    enabled: !!quoteRequest?.productId,
  });

  const handleBack = () => {
    setLocation("/customer-dashboard");
  };
  
  // Query client for cache invalidation
  const queryClient = useQueryClient();
  
  // Add mutation for sending a message
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: any) => {
      const response = await fetch(`/api/quote-requests/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Clear the message input
      setNewMessage('');
      
      // Invalidate and refetch the quote request data to show the new message
      queryClient.invalidateQueries({ queryKey: ["/api/quote-requests", id] });
      
      // Scroll to the bottom of the chat container
      setTimeout(() => {
        const chatContainer = document.getElementById('chat-container');
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }, 100);
    },
    onError: (error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle accepting the quote
  const acceptQuoteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/quote-requests/${id}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: "approved",
          isReadyToShip: quoteRequest.isReadyToShip
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to accept quote');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch the quote request data
      queryClient.invalidateQueries({ queryKey: ["/api/quote-requests", id] });
      
      toast({
        title: "Quote Accepted!",
        description: quoteRequest.isReadyToShip
          ? "Our team will contact you with payment details for the full amount shortly."
          : "Our team will contact you with payment details for the 50% advance shortly.",
        duration: 5000,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to accept quote",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleAcceptQuote = () => {
    acceptQuoteMutation.mutate();
  };

  // Handle sending a new message
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    sendMessageMutation.mutate({
      quoteRequestId: parseInt(id as string),
      content: newMessage,
      createdBy: user?.username || "Customer",
      isAdmin: false,
      userId: user?.id
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "in_progress":
        return "bg-blue-500 hover:bg-blue-600";
      case "completed":
        return "bg-green-500 hover:bg-green-600";
      case "cancelled":
        return "bg-red-500 hover:bg-red-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "in_progress":
        return "In Progress";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
    }
  };

  const formatCurrency = (price: number) => {
    if (!price) return "";
    
    const currency = quoteRequest?.currency || "USD";
    
    if (currency === "USD") {
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD',
        maximumFractionDigits: 0
      }).format(price);
    } else {
      return new Intl.NumberFormat('en-IN', { 
        style: 'currency', 
        currency: 'INR',
        maximumFractionDigits: 0 
      }).format(price);
    }
  };

  if (isLoadingQuote || isLoadingProduct) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          <span className="ml-3">Loading request details...</span>
        </div>
      </div>
    );
  }

  if (!quoteRequest) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-center py-12">
          Quote request not found or you don't have permission to view it
        </h1>
        <div className="flex justify-center">
          <Button onClick={handleBack}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Quote Request #{id} | Luster Legacy</title>
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={handleBack} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="font-playfair text-3xl font-bold">Quote Request #{id}</h1>
              <p className="text-muted-foreground">
                Submitted on {formatDate(quoteRequest.createdAt)}
              </p>
            </div>
            <Badge 
              className={`text-white px-3 py-1 text-sm ${getStatusColor(quoteRequest.status)}`}
            >
              {getStatusDisplay(quoteRequest.status)}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Info Card */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="mb-4 rounded-md overflow-hidden h-64">
                  {product?.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product?.name || "Product Image"} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-foreground/5">
                      <Package className="h-16 w-16 text-foreground/20" />
                    </div>
                  )}
                </div>
                
                <h3 className="font-playfair text-xl font-semibold">{product?.name}</h3>
                <p className="text-sm text-muted-foreground">{product?.description}</p>
                
                {quoteRequest.isReadyToShip && (
                  <div className="mt-2">
                    <Badge className="bg-green-600">Ready to Ship</Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      This item is in stock and ready for immediate shipment after full payment.
                    </p>
                  </div>
                )}
                
                {/* Product Specifications Dialog */}
                {product?.details && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">View Product Specifications</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>Product Specifications</DialogTitle>
                      </DialogHeader>
                      <div className="mt-4">
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
                                currentPrice={product.basePrice}
                                formatCurrency={(value) => formatCurrency(value)}
                              />
                            );
                          } catch (e) {
                            console.error("Error parsing product details:", e);
                            return <p>Error loading specifications</p>;
                          }
                        })()}
                      </div>
                      <div className="flex justify-end mt-4">
                        <DialogClose asChild>
                          <Button variant="secondary">Close</Button>
                        </DialogClose>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                
                <Separator />
                
                {/* Price Information */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Original Price:</span>
                    {product?.basePrice ? (
                      <span className={quoteRequest.quotedPrice ? "text-muted-foreground line-through" : "font-semibold text-purple-500"}>
                        {formatCurrency(product.calculatedPriceUSD || product.basePrice)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Unavailable</span>
                    )}
                  </div>
                  
                  {quoteRequest.quotedPrice && (
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Quoted Price:</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(quoteRequest.quotedPrice)}
                      </span>
                    </div>
                  )}
                  
                  {!quoteRequest.quotedPrice && quoteRequest.estimatedPrice && (
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Estimated Price:</span>
                      <span className="font-semibold text-purple-500">
                        {formatCurrency(quoteRequest.estimatedPrice)}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Shipping:</span>
                    <span className="font-semibold">Free</span>
                  </div>
                  
                  {quoteRequest.status === "quoted" && (
                    <div className="mt-4 border-t pt-4">
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={handleAcceptQuote}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Accept Quote
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        {quoteRequest.isReadyToShip ? 
                          "This item is ready to ship. By accepting, you agree to pay 100% of the quoted price before shipping." :
                          "By accepting, you agree to pay 50% advance of the quoted price. Remaining 50% due before shipping in 3-4 weeks."}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Order Details Card */}
            <Card>
              <CardHeader>
                <CardTitle>Request Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {/* Customer Information */}
                  <div className="border border-muted rounded-md p-3 bg-muted/5 mb-4">
                    <h4 className="text-sm font-medium mb-2">Customer Contact</h4>
                    <div className="grid gap-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span>{quoteRequest.fullName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span>{quoteRequest.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phone:</span>
                        <span>{quoteRequest.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Country:</span>
                        <span>{quoteRequest.country ? quoteRequest.country.toUpperCase() : 'Not specified'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-[20px_1fr] gap-2 items-start">
                    <Calendar className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Date Submitted</p>
                      <p className="text-sm text-muted-foreground">{formatDate(quoteRequest.createdAt)}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-[20px_1fr] gap-2 items-start">
                    <Clock className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Status</p>
                      <p className="text-sm text-muted-foreground">{getStatusDisplay(quoteRequest.status)}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-[20px_1fr] gap-2 items-start">
                    <DollarSign className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Currency Preference</p>
                      <p className="text-sm text-muted-foreground">{quoteRequest.currency || "USD"}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-[20px_1fr] gap-2 items-start">
                    <Package className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Shipping To</p>
                      <p className="text-sm text-muted-foreground">
                        {quoteRequest.country || "Not specified"}
                      </p>
                    </div>
                  </div>
                  
                  {quoteRequest.paymentMethod && (
                    <div className="grid grid-cols-[20px_1fr] gap-2 items-start">
                      <Tag className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">Payment Method Preference</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {quoteRequest.paymentMethod.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {quoteRequest.additionalNotes && (
                    <div className="grid grid-cols-[20px_1fr] gap-2 items-start">
                      <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">Additional Notes</p>
                        <p className="text-sm text-muted-foreground">{quoteRequest.additionalNotes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Status Card & Messages */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Quote Request Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-900 rounded-md p-4 border border-slate-200 dark:border-slate-800">
                  <div className="mb-2">
                    <span className="font-medium">Current Status:</span>{" "}
                    <Badge 
                      className={`text-white px-2 py-0.5 ml-2 ${getStatusColor(quoteRequest.status)}`}
                    >
                      {getStatusDisplay(quoteRequest.status)}
                    </Badge>
                  </div>
                  
                  <div className="space-y-4 mt-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${quoteRequest.status !== "pending" ? "bg-green-500" : "bg-primary"}`}>
                        <span className="text-white text-xs">1</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Quote Request Submitted</p>
                        <p className="text-sm text-muted-foreground">
                          Your request has been received and is being reviewed by our team.
                        </p>
                      </div>
                    </div>
                    
                    <div className="border-l-2 border-dashed border-slate-300 dark:border-slate-700 h-5 ml-3"></div>
                    
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${["in_progress", "quoted", "approved", "payment_received", "in_production", "shipping", "delivered", "completed"].includes(quoteRequest.status) ? "bg-green-500" : "bg-slate-300 dark:bg-slate-700"}`}>
                        <span className="text-white text-xs">2</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Quote Preparation</p>
                        <p className="text-sm text-muted-foreground">
                          Our team is preparing a detailed quote for your request.
                        </p>
                      </div>
                    </div>
                    
                    <div className="border-l-2 border-dashed border-slate-300 dark:border-slate-700 h-5 ml-3"></div>
                    
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${["quoted", "approved", "payment_received", "in_production", "shipping", "delivered", "completed"].includes(quoteRequest.status) ? "bg-green-500" : "bg-slate-300 dark:bg-slate-700"}`}>
                        <span className="text-white text-xs">3</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Final Quote Sent</p>
                        <p className="text-sm text-muted-foreground">
                          Your finalized quote with pricing details has been sent.
                        </p>
                      </div>
                    </div>
                    
                    <div className="border-l-2 border-dashed border-slate-300 dark:border-slate-700 h-5 ml-3"></div>
                    
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${["approved", "payment_received", "in_production", "shipping", "delivered", "completed"].includes(quoteRequest.status) ? "bg-green-500" : "bg-slate-300 dark:bg-slate-700"}`}>
                        <span className="text-white text-xs">4</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Quote Acceptance</p>
                        <p className="text-sm text-muted-foreground">
                          Quote accepted. Payment instructions sent to you.
                        </p>
                      </div>
                    </div>
                    
                    <div className="border-l-2 border-dashed border-slate-300 dark:border-slate-700 h-5 ml-3"></div>
                    
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${["payment_received", "in_production", "shipping", "delivered", "completed"].includes(quoteRequest.status) ? "bg-green-500" : "bg-slate-300 dark:bg-slate-700"}`}>
                        <span className="text-white text-xs">5</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Payment Received</p>
                        <p className="text-sm text-muted-foreground">
                          Your payment has been received. Production will begin soon.
                        </p>
                      </div>
                    </div>
                    
                    <div className="border-l-2 border-dashed border-slate-300 dark:border-slate-700 h-5 ml-3"></div>
                    
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${["in_production", "shipping", "delivered", "completed"].includes(quoteRequest.status) ? "bg-green-500" : "bg-slate-300 dark:bg-slate-700"}`}>
                        <span className="text-white text-xs">6</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">In Production</p>
                        <p className="text-sm text-muted-foreground">
                          Your jewelry piece is being crafted by our artisans.
                        </p>
                      </div>
                    </div>
                    
                    <div className="border-l-2 border-dashed border-slate-300 dark:border-slate-700 h-5 ml-3"></div>
                    
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${["shipping", "delivered", "completed"].includes(quoteRequest.status) ? "bg-green-500" : "bg-slate-300 dark:bg-slate-700"}`}>
                        <span className="text-white text-xs">7</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Shipping</p>
                        <p className="text-sm text-muted-foreground">
                          Your order has been shipped and is on its way to you.
                        </p>
                      </div>
                    </div>
                    
                    <div className="border-l-2 border-dashed border-slate-300 dark:border-slate-700 h-5 ml-3"></div>
                    
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${["delivered", "completed"].includes(quoteRequest.status) ? "bg-green-500" : "bg-slate-300 dark:bg-slate-700"}`}>
                        <span className="text-white text-xs">8</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Delivered</p>
                        <p className="text-sm text-muted-foreground">
                          Your order has been delivered. We hope you love your new jewelry!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {quoteRequest.status === "pending" && (
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md p-4">
                    <h3 className="font-medium text-amber-800 dark:text-amber-400 mb-1">What to expect next:</h3>
                    <ul className="list-disc list-inside text-sm space-y-1 text-amber-700 dark:text-amber-300">
                      <li>Our team is reviewing your request</li>
                      <li>We'll prepare a detailed quote based on current metal rates and stone prices</li>
                      <li>You'll receive your final quote within 24 hours</li>
                      {quoteRequest.isReadyToShip ? (
                        <li>Once you approve the quote, 100% payment will be required before shipping</li>
                      ) : (
                        <li>Once you approve the quote, a 50% advance payment will be required to begin production</li>
                      )}
                    </ul>
                  </div>
                )}
                
                {quoteRequest.status === "in_progress" && (
                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md p-4">
                    <h3 className="font-medium text-blue-800 dark:text-blue-400 mb-1">Your quote is being prepared:</h3>
                    <ul className="list-disc list-inside text-sm space-y-1 text-blue-700 dark:text-blue-300">
                      <li>We're calculating the exact cost based on your specifications</li>
                      <li>Current metal rates and stone prices are being applied</li>
                      <li>Your quote will be finalized and sent to you shortly</li>
                      <li>You'll be notified via email when your quote is ready</li>
                    </ul>
                  </div>
                )}
                
                {quoteRequest.status === "approved" && (
                  <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md p-4">
                    <h3 className="font-medium text-green-800 dark:text-green-400 mb-1">Your quote has been approved:</h3>
                    <ul className="list-disc list-inside text-sm space-y-1 text-green-700 dark:text-green-300">
                      <li>Thank you for accepting our quote!</li>
                      {quoteRequest.isReadyToShip ? (
                        <>
                          <li>Our team will contact you shortly with payment instructions for the full amount</li>
                          <li>Once we receive your payment, your item will be shipped immediately</li>
                        </>
                      ) : (
                        <>
                          <li>Our team will contact you shortly with payment instructions for the 50% advance</li>
                          <li>Production will begin once we receive your advance payment</li>
                          <li>The remaining 50% will be due before shipping in 3-4 weeks</li>
                        </>
                      )}
                      <li>If you have any questions, please message us through this page</li>
                    </ul>
                  </div>
                )}
                
                {quoteRequest.status === "quoted" && (
                  <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md p-4">
                    <h3 className="font-medium text-green-800 dark:text-green-400 mb-1">Your quote has been completed:</h3>
                    <ul className="list-disc list-inside text-sm space-y-1 text-green-700 dark:text-green-300">
                      <li>A detailed quote has been sent to your email</li>
                      <li>The quote is valid for 7 days</li>
                      <li>To proceed, follow the payment instructions in the email</li>
                      {quoteRequest.isReadyToShip ? (
                        <>
                          <li>100% payment is required before shipping this ready-to-ship item</li>
                          <li>Your item will be shipped immediately upon payment receipt</li>
                        </>
                      ) : (
                        <>
                          <li>Once the 50% advance is received, production will begin</li>
                          <li>Remaining 50% will be due before shipping in 3-4 weeks</li>
                        </>
                      )}
                      <li>Please contact us if you have any questions</li>
                    </ul>
                  </div>
                )}
                
                {quoteRequest.status === "payment_received" && (
                  <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md p-4">
                    <h3 className="font-medium text-green-800 dark:text-green-400 mb-1">Your payment has been received:</h3>
                    <ul className="list-disc list-inside text-sm space-y-1 text-green-700 dark:text-green-300">
                      <li>Thank you for your payment!</li>
                      {quoteRequest.isReadyToShip ? (
                        <li>Your item will be shipped soon</li>
                      ) : (
                        <>
                          <li>We have received your 50% advance payment</li>
                          <li>Production of your jewelry will begin shortly</li>
                        </>
                      )}
                      <li>We will keep you updated on the status of your order</li>
                      <li>Please contact us if you have any questions</li>
                    </ul>
                  </div>
                )}
                
                {quoteRequest.status === "in_production" && (
                  <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-md p-4">
                    <h3 className="font-medium text-indigo-800 dark:text-indigo-400 mb-1">Your jewelry is being prepared:</h3>
                    <ul className="list-disc list-inside text-sm space-y-1 text-indigo-700 dark:text-indigo-300">
                      {quoteRequest.isReadyToShip ? (
                        <>
                          <li>Your jewelry is being prepared for shipping</li>
                          <li>This process typically takes 1-3 days</li>
                          <li>We will update you when your piece has been shipped</li>
                        </>
                      ) : (
                        <>
                          <li>Our artisans are now crafting your jewelry piece</li>
                          <li>This process typically takes 3-4 weeks</li>
                          <li>We will update you when your piece is ready for shipping</li>
                          <li>The remaining 50% payment will be due before shipping</li>
                        </>
                      )}
                      <li>Please contact us if you have any questions</li>
                    </ul>
                  </div>
                )}
                
                {quoteRequest.status === "shipping" && (
                  <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-md p-4">
                    <h3 className="font-medium text-purple-800 dark:text-purple-400 mb-1">Your order has been shipped:</h3>
                    <ul className="list-disc list-inside text-sm space-y-1 text-purple-700 dark:text-purple-300">
                      <li>Your jewelry has been shipped and is on its way to you</li>
                      <li>You should receive it within the next few days</li>
                      <li>Please contact us if you have any questions about delivery</li>
                      <li>We hope you love your new jewelry piece!</li>
                    </ul>
                  </div>
                )}
                
                {quoteRequest.status === "delivered" && (
                  <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md p-4">
                    <h3 className="font-medium text-green-800 dark:text-green-400 mb-1">Your order has been delivered:</h3>
                    <ul className="list-disc list-inside text-sm space-y-1 text-green-700 dark:text-green-300">
                      <li>Your jewelry has been delivered</li>
                      <li>We hope you're delighted with your purchase</li>
                      <li>Please let us know if you have any questions or concerns</li>
                      <li>We would love to hear your feedback!</li>
                    </ul>
                  </div>
                )}
                
                {quoteRequest.status === "completed" && (
                  <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md p-4">
                    <h3 className="font-medium text-green-800 dark:text-green-400 mb-1">Your order is complete:</h3>
                    <ul className="list-disc list-inside text-sm space-y-1 text-green-700 dark:text-green-300">
                      <li>Thank you for choosing Luster Legacy!</li>
                      <li>Your order is now marked as complete</li>
                      <li>We hope you enjoy your beautiful jewelry piece</li>
                      <li>If you need any cleaning or maintenance tips, feel free to ask</li>
                      <li>We would be honored if you would share photos of your jewelry with us</li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Messages & Conversations */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-slate-200 dark:border-slate-800 h-64 overflow-y-auto p-4 mb-4" id="chat-container">
                  {quoteRequest.comments && quoteRequest.comments.length > 0 ? (
                    <div className="space-y-4">
                      {quoteRequest.comments.map((comment, index) => (
                        <div 
                          key={index} 
                          className={`${comment.isAdmin ? 'justify-start' : 'justify-end'} mb-4`}
                        >
                          <div 
                            className={`p-3 rounded-lg ${
                              comment.isAdmin 
                                ? 'bg-accent/5 ml-6' 
                                : 'bg-primary/5 mr-6'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="font-medium flex items-center">
                                {comment.isAdmin && (
                                  <Badge variant="outline" className="mr-2 bg-amber-500/10 text-amber-700 border-amber-200 dark:border-amber-800/30 dark:text-amber-400">
                                    Admin
                                  </Badge>
                                )}
                                {comment.createdBy}
                              </div>
                              <div className="text-xs text-foreground/60">
                                {new Date(comment.createdAt).toLocaleString([], {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                            <p className="whitespace-pre-wrap">{comment.content}</p>
                            
                            {/* Display image if available */}
                            {comment.imageUrl && (
                              <div className="mt-3">
                                <img
                                  src={comment.imageUrl}
                                  alt="Attached image"
                                  className="max-h-60 rounded-md cursor-pointer"
                                  onClick={() => window.open(comment.imageUrl, '_blank')}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageCircle className="h-12 w-12 mx-auto mb-3 text-foreground/20" />
                      <p className="text-foreground/60">No messages yet</p>
                    </div>
                  )}
                </div>
                
                {/* New message input */}
                <div className="mt-6">
                  <div className="flex items-start gap-2 mb-2">
                    <Textarea
                      placeholder="Type your message here..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 min-h-[100px]"
                    />
                  </div>
                  
                  {/* Image upload preview */}
                  {imagePreview && (
                    <div className="relative inline-block mt-2 mb-3">
                      <div className="group relative">
                        <img 
                          src={imagePreview} 
                          alt="Upload preview" 
                          className="h-20 rounded-md object-cover"
                        />
                        <button 
                          onClick={handleRemoveImage}
                          className="absolute -top-2 -right-2 bg-foreground text-background rounded-full p-1 shadow-sm"
                        >
                          <XIcon className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageSelection}
                        accept="image/*"
                        className="hidden"
                      />
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="outline"
                        onClick={triggerImageUpload}
                      >
                        <ImagePlus className="h-4 w-4 mr-2" />
                        Add Image
                      </Button>
                    </div>
                    
                    <Button 
                      type="button"
                      onClick={handleSendMessage}
                      disabled={isSubmitting || (!newMessage.trim() && !uploadedImage)}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          Send Message
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
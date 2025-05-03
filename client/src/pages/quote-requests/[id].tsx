import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, DollarSign, Clock, Package, Tag, MessageSquare } from "lucide-react";
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
                    <span className="font-medium">Estimated Price:</span>
                    {quoteRequest.estimatedPrice ? (
                      <span className="font-semibold text-purple-500">
                        {formatCurrency(quoteRequest.estimatedPrice)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Pending</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Shipping:</span>
                    <span className="font-semibold">Free</span>
                  </div>
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
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${quoteRequest.status === "in_progress" || quoteRequest.status === "completed" ? "bg-green-500" : "bg-slate-300 dark:bg-slate-700"}`}>
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
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${quoteRequest.status === "completed" ? "bg-green-500" : "bg-slate-300 dark:bg-slate-700"}`}>
                        <span className="text-white text-xs">3</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Final Quote Sent</p>
                        <p className="text-sm text-muted-foreground">
                          Your finalized quote with payment details has been sent.
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
                      <li>Once you approve the quote, a 50% advance payment will be required to begin production</li>
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
                
                {quoteRequest.status === "completed" && (
                  <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md p-4">
                    <h3 className="font-medium text-green-800 dark:text-green-400 mb-1">Your quote has been completed:</h3>
                    <ul className="list-disc list-inside text-sm space-y-1 text-green-700 dark:text-green-300">
                      <li>A detailed quote has been sent to your email</li>
                      <li>The quote is valid for 7 days</li>
                      <li>To proceed, follow the payment instructions in the email</li>
                      <li>Once the 50% advance is received, production will begin</li>
                      <li>Please contact us if you have any questions</li>
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
                          className={`flex ${comment.isAdmin ? 'justify-start' : 'justify-end'}`}
                        >
                          <div 
                            className={`max-w-[80%] p-3 rounded-lg ${
                              comment.isAdmin 
                                ? 'bg-slate-100 dark:bg-slate-800 text-foreground' 
                                : 'bg-primary/10 text-primary-foreground'
                            }`}
                          >
                            <div className="flex items-center mb-1 text-xs">
                              <span className="font-medium">{comment.createdBy}</span>
                              <span className="ml-2 text-muted-foreground">
                                {formatDate(comment.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                            {comment.imageUrl && (
                              <div className="mt-2">
                                <img 
                                  src={comment.imageUrl} 
                                  alt="Attached image" 
                                  className="max-h-32 rounded-md object-cover"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center">
                      <MessageSquare className="h-10 w-10 text-muted-foreground/40 mb-2" />
                      <p className="text-center text-muted-foreground text-sm">No messages yet</p>
                      <p className="text-center text-muted-foreground/60 text-xs mt-1">
                        Start a conversation with our team about your quote request
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <Textarea
                    placeholder="Type your message here..."
                    className="min-h-24 resize-none"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                  />
                  <div className="flex items-center justify-between">
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="outline"
                      className="text-muted-foreground"
                      onClick={() => toast({
                        title: "Coming soon",
                        description: "File attachments will be available soon"
                      })}
                    >
                      Attach File
                    </Button>
                    <Button 
                      type="button"
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                    >
                      Send Message
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
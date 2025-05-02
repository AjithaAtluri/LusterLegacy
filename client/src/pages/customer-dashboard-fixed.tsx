import { useState, useMemo } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  PenTool, 
  Settings, 
  User, 
  ExternalLink,
  ArrowRight,
  MessageCircle,
  Clock
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Link, Redirect, useLocation } from "wouter";
import { formatCurrency } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

export default function CustomerDashboard() {
  const { user, isLoading: isLoadingAuth } = useAuth();
  const [activeTab, setActiveTab] = useState("requests");
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  
  // Redirect to auth page if not logged in
  if (!isLoadingAuth && !user) {
    return <Redirect to="/auth" />;
  }
  
  // Fetch all types of requests
  // 1. Customization requests (for existing products)
  const { data: customizationRequests, isLoading: isLoadingRequests } = useQuery({
    queryKey: ['/api/customization-requests'],
    enabled: !!user
  });
  
  // 2. Custom design requests 
  const { data: customDesigns, isLoading: isLoadingCustomDesigns } = useQuery({
    queryKey: ['/api/custom-designs/user'],
    enabled: !!user
  });
  
  // 3. Quote requests for existing products
  const { data: quoteRequests, isLoading: isLoadingQuoteRequests } = useQuery({
    queryKey: ['/api/quote-requests'],
    enabled: !!user
  });
  
  // Combine all design and customization requests
  const allRequests = useMemo(() => {
    // Get all custom designs
    // Process custom design requests (completely new designs from customer specifications)
    const designs = (customDesigns || []).map(req => ({ 
      ...req, 
      requestType: 'design',
      needsConsultationFee: true,
      description: 'Custom-designed jewelry from your specifications with up to 4 design iterations.'
    }));
    
    // Process quote requests (requests for final pricing on unmodified catalog items)
    const quotes = (quoteRequests || []).map(req => ({ 
      ...req, 
      requestType: 'quote',
      needsConsultationFee: false,
      description: 'Price quote for a catalog item without modifications.'
    }));
    
    // Process customization requests (modifications to existing products)
    // Filter out any duplicates that match design request IDs
    const customizations = (customizationRequests || [])
      .filter(req => !designs.some(design => design.id === req.id))
      .map(req => ({ 
        ...req, 
        requestType: 'customization',
        needsConsultationFee: false,
        description: 'Product customization request for modifying an existing product.'
      }));
    
    // Combine all requests
    const requests = [...designs, ...customizations, ...quotes];
    
    // Sort by date
    return requests.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [customizationRequests, customDesigns, quoteRequests]);

  return (
    <>
      <Helmet>
        <title>My Account | Luster Legacy</title>
        <meta name="description" content="Manage your account and custom jewelry requests" />
      </Helmet>
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-playfair text-3xl font-bold text-foreground mb-2">My Account</h1>
              <p className="font-montserrat text-foreground/70">
                Manage your custom jewelry requests
              </p>
            </div>
            {user && (
              <div className="flex items-center">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {user.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-montserrat font-medium">{user.username}</p>
                  <p className="text-sm text-foreground/60">{user.email}</p>
                </div>
              </div>
            )}
          </div>
          
          <Tabs defaultValue="requests" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 mb-8">
              <TabsTrigger value="requests" className="flex items-center">
                <PenTool className="mr-2 h-4 w-4" />
                <span>My Requests</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                <span>Account</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Requests Tab */}
            <TabsContent value="requests">
              <Card>
                <CardHeader>
                  <CardTitle>All Requests</CardTitle>
                  <CardDescription>View and track all your jewelry requests</CardDescription>
                </CardHeader>
                <div className="px-6 pb-2 mb-4 border-b border-border/20">
                  <h4 className="text-sm font-medium mb-3">Request Types</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="p-3 bg-accent/5 rounded-lg">
                      <h3 className="font-medium text-sm mb-1 flex items-center">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                        Custom Design
                      </h3>
                      <p className="text-xs text-foreground/70">Completely custom jewelry with your design. Requires $150 consultation fee.</p>
                    </div>
                    <div className="p-3 bg-accent/5 rounded-lg">
                      <h3 className="font-medium text-sm mb-1 flex items-center">
                        <span className="w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
                        Product Customization
                      </h3>
                      <p className="text-xs text-foreground/70">Modifications to existing catalog items. No consultation fee required.</p>
                    </div>
                    <div className="p-3 bg-accent/5 rounded-lg">
                      <h3 className="font-medium text-sm mb-1 flex items-center">
                        <span className="w-2 h-2 bg-teal-500 rounded-full mr-2"></span>
                        Quote Request
                      </h3>
                      <p className="text-xs text-foreground/70">Price quote for standard catalog items without modifications.</p>
                    </div>
                  </div>
                  
                  <h4 className="text-sm font-medium mb-3">Status Indicators</h4>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                    <div className="flex items-center">
                      <span className="px-2 py-0.5 text-xs rounded-full inline-flex items-center bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 mr-2">
                        <span className="w-1.5 h-1.5 rounded-full mr-1 bg-current"></span>
                        <span>Pending</span>
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="px-2 py-0.5 text-xs rounded-full inline-flex items-center bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 mr-2">
                        <span className="w-1.5 h-1.5 rounded-full mr-1 bg-current"></span>
                        <span>Design Fee Paid</span>
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="px-2 py-0.5 text-xs rounded-full inline-flex items-center bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 mr-2">
                        <span className="w-1.5 h-1.5 rounded-full mr-1 bg-current"></span>
                        <span>Quoted</span>
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="px-2 py-0.5 text-xs rounded-full inline-flex items-center bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 mr-2">
                        <span className="w-1.5 h-1.5 rounded-full mr-1 bg-current"></span>
                        <span>Approved</span>
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="px-2 py-0.5 text-xs rounded-full inline-flex items-center bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 mr-2">
                        <span className="w-1.5 h-1.5 rounded-full mr-1 bg-current"></span>
                        <span>Rejected</span>
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="px-2 py-0.5 text-xs rounded-full inline-flex items-center bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 mr-2">
                        <span className="w-1.5 h-1.5 rounded-full mr-1 bg-current"></span>
                        <span>Completed</span>
                      </span>
                    </div>
                  </div>
                </div>
                <CardContent>
                  {isLoadingRequests || isLoadingCustomDesigns || isLoadingQuoteRequests ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p>Loading your requests...</p>
                    </div>
                  ) : !allRequests || allRequests.length === 0 ? (
                    <div className="text-center py-10">
                      <PenTool className="h-16 w-16 mx-auto mb-4 text-foreground/20" />
                      <h3 className="font-playfair text-xl font-medium mb-2">No requests yet</h3>
                      <p className="font-montserrat text-foreground/60 mb-6">
                        You haven't submitted any customization or quote requests yet.
                      </p>
                      <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Button asChild>
                          <Link href="/custom-design">
                            Request Custom Design <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="outline" asChild>
                          <Link href="/collections">
                            Browse Collections
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {allRequests.map((request) => (
                        <Card key={`${request.requestType}-${request.id}`} className="overflow-hidden">
                          <CardHeader className="bg-background/50 pb-2">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-lg">
                                {request.requestType === 'design' 
                                  ? 'Custom Design' 
                                  : request.requestType === 'customization' 
                                  ? 'Product Customization' 
                                  : 'Quote Request'} #{request.id}
                              </CardTitle>
                              <div className="flex items-center gap-2">
                                {/* Two types of requests: product customization vs custom design form */}
                                {request.productId ? (
                                  <Button variant="outline" size="sm" asChild>
                                    <Link href={`/products/${request.productId}`}>
                                      <ExternalLink className="h-3 w-3 mr-1" />
                                      View Product
                                    </Link>
                                  </Button>
                                ) : (
                                  <Button variant="outline" size="sm" asChild>
                                    <Link href={`/custom-designs/${request.id}`}>
                                      <ExternalLink className="h-3 w-3 mr-1" />
                                      View Details
                                    </Link>
                                  </Button>
                                )}
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <CardDescription>
                                {new Date(request.createdAt).toLocaleDateString()} {new Date(request.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </CardDescription>
                              <span className={`px-2 py-0.5 text-xs rounded-full inline-flex items-center ${
                                request.status === 'pending' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                request.status === 'design_fee_paid' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300' :
                                request.status === 'quoted' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : 
                                request.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                request.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                request.status === 'completed' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                                'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                              }`}>
                                <span className="w-1.5 h-1.5 rounded-full mr-1 bg-current"></span>
                                <span className="capitalize">{request.status === 'design_fee_paid' ? 'Design Fee Paid' : (request.status || 'pending')}</span>
                              </span>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-4">
                            {/* For product customization requests */}
                            {request.productId && (
                              <div className="flex items-start mb-4">
                                <div className="w-16 h-16 bg-background rounded-md border overflow-hidden flex-shrink-0 mr-4">
                                  {request.product?.imageUrl ? (
                                    <img 
                                      src={request.product.imageUrl} 
                                      alt={request.product.name} 
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-foreground/5">
                                      <PenTool className="h-6 w-6 text-foreground/30" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <h3 className="font-medium mb-1">
                                    {request.product?.name || 'Custom Piece'}
                                  </h3>
                                  <p className="text-sm text-foreground/70 mb-2">
                                    {request.specifications?.metalType} • {request.specifications?.stoneType}
                                  </p>
                                  <div className="text-sm">
                                    <p className="line-clamp-2 text-foreground/70">{request.message}</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* For custom design form submissions */}
                            {!request.productId && (
                              <div className="flex items-start mb-4">
                                <div className="w-16 h-16 bg-background rounded-md border overflow-hidden flex-shrink-0 mr-4">
                                  {request.imageUrl ? (
                                    <img 
                                      src={request.imageUrl} 
                                      alt="Design reference" 
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-foreground/5">
                                      <PenTool className="h-6 w-6 text-foreground/30" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <h3 className="font-medium mb-1">
                                    Custom Jewelry Design
                                  </h3>
                                  <p className="text-sm text-foreground/70 mb-2">
                                    {request.metalType || 'Custom Metal'} • {
                                      request.primaryStones && request.primaryStones.length > 0 
                                        ? request.primaryStones.join(', ') 
                                        : (request.primaryStone || 'Custom Stone')
                                    }
                                  </p>
                                  {request.notes && (
                                    <div className="text-sm">
                                      <p className="line-clamp-2 text-foreground/70">{request.notes}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* Custom Design Request Process - Visual Timeline */}
                            {request.requestType === 'design' && (
                              <div className="mb-4">
                                <div className="flex items-center mb-3">
                                  <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-2 text-xs font-medium 
                                    ${!request.consultationFeePaid ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'}`}>
                                    1
                                  </div>
                                  <div className="h-0.5 flex-grow mx-1 bg-border"></div>
                                  <div className={`h-8 w-8 rounded-full flex items-center justify-center mx-2 text-xs font-medium
                                    ${request.status === 'design_fee_paid' && !request.cadImageUrl ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300' : 
                                    request.cadImageUrl ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
                                    'bg-gray-100 text-gray-500 dark:bg-gray-800/30 dark:text-gray-400'}`}>
                                    2
                                  </div>
                                  <div className="h-0.5 flex-grow mx-1 bg-border"></div>
                                  <div className={`h-8 w-8 rounded-full flex items-center justify-center mx-2 text-xs font-medium
                                    ${request.status === 'quoted' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : 
                                    'bg-gray-100 text-gray-500 dark:bg-gray-800/30 dark:text-gray-400'}`}>
                                    3
                                  </div>
                                  <div className="h-0.5 flex-grow mx-1 bg-border"></div>
                                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ml-2 text-xs font-medium
                                    ${request.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
                                    request.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 
                                    'bg-gray-100 text-gray-500 dark:bg-gray-800/30 dark:text-gray-400'}`}>
                                    4
                                  </div>
                                </div>
                                <div className="grid grid-cols-4 text-center text-xs text-foreground/70 mb-3">
                                  <div>Pay Fee</div>
                                  <div>CAD Design</div>
                                  <div>Price Quote</div>
                                  <div>Decision</div>
                                </div>

                                {/* Consultation fee status */}
                                <div className={`p-3 rounded-md mb-3 ${request.consultationFeePaid ? 'bg-green-100/10' : 'bg-accent/10'}`}>
                                  <h4 className="text-sm font-medium mb-1">Consultation Fee ($150):</h4>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm">
                                      {request.consultationFeePaid 
                                        ? 'Paid - Up to 4 iterations included' 
                                        : 'Not paid - Pay to begin design process'}
                                    </span>
                                    {!request.consultationFeePaid && (
                                      <Button 
                                        variant="default" 
                                        size="sm" 
                                        className="bg-primary text-background hover:bg-primary/90"
                                        onClick={() => setLocation(`/payment/design-consultation/${request.id}`)}
                                      >
                                        Pay Fee <ArrowRight className="ml-1 h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                  {request.consultationFeePaid && request.iterationsCount > 0 && (
                                    <p className="text-xs mt-2">Design iterations used: {request.iterationsCount}/4</p>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* Designer comments */}
                            {request.designerComments && (
                              <div className="bg-indigo-50 dark:bg-indigo-950/20 p-4 rounded-md mb-3 border border-indigo-200 dark:border-indigo-800/30">
                                <div className="flex items-center mb-2">
                                  <h4 className="text-sm font-medium flex items-center">
                                    <svg className="h-4 w-4 mr-2 text-indigo-600 dark:text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                    </svg>
                                    Designer Feedback
                                  </h4>
                                </div>
                                <div className="bg-background rounded-md border p-3">
                                  <p className="text-sm leading-relaxed">{request.designerComments}</p>
                                </div>
                              </div>
                            )}
                            
                            {/* CAD Design from Admin */}
                            {request.cadImageUrl && (
                              <div className="bg-primary/5 p-4 rounded-md mb-3 border border-primary/10">
                                <div className="flex items-center mb-2">
                                  <h4 className="text-sm font-medium flex items-center">
                                    <svg className="h-4 w-4 mr-2 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
                                      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
                                      <path d="M2 2l7.586 7.586"></path>
                                      <circle cx="11" cy="11" r="2"></circle>
                                    </svg>
                                    CAD Design Received
                                  </h4>
                                  <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                                    Step 2 Complete
                                  </span>
                                </div>
                                <p className="text-xs text-foreground/70 mb-3">Our designer has created a custom CAD model based on your specifications.</p>
                                <div className="h-48 bg-background rounded-md border overflow-hidden">
                                  <img 
                                    src={request.cadImageUrl} 
                                    alt="CAD design" 
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                              </div>
                            )}
                            
                            {/* Price quotes */}
                            {(request.status === 'quoted' || request.estimatedPrice) && (
                              <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-md mb-3 border border-amber-200 dark:border-amber-800/30">
                                <div className="flex items-center mb-2">
                                  <h4 className="text-sm font-medium flex items-center">
                                    <svg className="h-4 w-4 mr-2 text-amber-600 dark:text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <circle cx="12" cy="12" r="10"></circle>
                                      <line x1="12" y1="8" x2="12" y2="12"></line>
                                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                    </svg>
                                    Price Quote Ready
                                  </h4>
                                  <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                                    Step 3 Complete
                                  </span>
                                </div>
                                <p className="text-xs text-foreground/70 mb-3">Our team has prepared a detailed price quote for your custom piece.</p>
                                <div className="bg-background rounded-md border p-3 mb-3">
                                  <div className="flex justify-between mb-1">
                                    <span className="text-sm">Total Quote Amount:</span>
                                    <span className="font-medium text-lg">
                                      {formatCurrency(request.quoteAmount || request.estimatedPrice || 0)}
                                    </span>
                                  </div>
                                  <div className="text-xs text-foreground/70 mt-2">
                                    <p>• 50% advance payment after quote acceptance</p>
                                    <p>• 50% before shipping on completion</p>
                                    <p>• Lead time: 4-6 weeks after approval</p>
                                  </div>
                                </div>
                                {request.status === 'quoted' && (
                                  <div className="flex justify-between items-center">
                                    <p className="text-xs text-foreground/70">
                                      Ready to move forward with your custom piece?
                                    </p>
                                    <Button variant="default" size="sm" asChild>
                                      <Link href={`/checkout/custom/${request.id}`}>
                                        Accept & Proceed <ArrowRight className="ml-1 h-3 w-3" />
                                      </Link>
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Account Settings Tab */}
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>Manage your account details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="font-medium">Personal Details</h3>
                      <div className="bg-background/50 p-4 rounded-md border">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm text-foreground/70">Username</label>
                            <p className="font-medium">{user?.username}</p>
                          </div>
                          <div>
                            <label className="text-sm text-foreground/70">Email</label>
                            <p className="font-medium">{user?.email}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-medium">Address Book</h3>
                      <div className="bg-background/50 p-4 rounded-md border">
                        <p className="text-foreground/70 text-sm mb-3">
                          Your saved shipping addresses will appear here.
                        </p>
                        <Button variant="outline" size="sm">
                          <User className="h-4 w-4 mr-2" />
                          Add New Address
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button variant="outline" className="mr-2">
                        <Settings className="h-4 w-4 mr-2" />
                        Update Profile
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
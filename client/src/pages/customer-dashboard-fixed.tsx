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
import { Link, Redirect } from "wouter";
import { formatCurrency } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

export default function CustomerDashboard() {
  const { user, isLoading: isLoadingAuth } = useAuth();
  const [activeTab, setActiveTab] = useState("requests");
  const { toast } = useToast();
  
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
    const designs = (customDesigns || []).map(req => ({ ...req, requestType: 'design' }));
    
    // Get all quote requests
    const quotes = (quoteRequests || []).map(req => ({ ...req, requestType: 'quote' }));
    
    // For customization requests, filter out duplicates that already exist in designs array
    // This prevents the same request appearing both as a customization and design
    const customizations = (customizationRequests || [])
      .filter(req => !designs.some(design => design.id === req.id))
      .map(req => ({ ...req, requestType: 'customization' }));
    
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
                            <CardDescription>
                              {new Date(request.createdAt).toLocaleDateString()} {new Date(request.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • 
                              Status: <span className="font-medium capitalize">{request.status}</span>
                            </CardDescription>
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
                            
                            {/* Consultation fee status for Custom Design requests */}
                            {request.requestType === 'design' && (
                              <div className={`p-3 rounded-md mb-3 ${request.consultationFeePaid ? 'bg-green-100/10' : 'bg-accent/10'}`}>
                                <h4 className="text-sm font-medium mb-1">Consultation Fee ($150):</h4>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">
                                    {request.consultationFeePaid 
                                      ? 'Paid - Up to 4 iterations included' 
                                      : 'Not paid - Pay to begin design process'}
                                  </span>
                                  {!request.consultationFeePaid && (
                                    <Button variant="outline" size="sm" asChild>
                                      <Link href={`/checkout/consultation/${request.id}`}>
                                        Pay Fee <ArrowRight className="ml-1 h-3 w-3" />
                                      </Link>
                                    </Button>
                                  )}
                                </div>
                                {request.consultationFeePaid && request.iterationsCount > 0 && (
                                  <p className="text-xs mt-2">Design iterations used: {request.iterationsCount}/4</p>
                                )}
                              </div>
                            )}
                            
                            {/* Designer comments */}
                            {request.designerComments && (
                              <div className="bg-primary/5 p-3 rounded-md mb-3">
                                <h4 className="text-sm font-medium mb-1">Designer Comments:</h4>
                                <p className="text-sm">{request.designerComments}</p>
                              </div>
                            )}
                            
                            {/* CAD image */}
                            {request.cadImageUrl && (
                              <div className="bg-primary/5 p-3 rounded-md mb-3">
                                <h4 className="text-sm font-medium mb-1">CAD Design:</h4>
                                <div className="h-40 bg-background rounded-md border overflow-hidden">
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
                              <div className="bg-accent/10 p-3 rounded-md">
                                <div className="flex justify-between mb-1">
                                  <h4 className="text-sm font-medium">Quote Amount:</h4>
                                  <span className="font-medium">
                                    {formatCurrency(request.quoteAmount || request.estimatedPrice || 0)}
                                  </span>
                                </div>
                                {request.status === 'quoted' && (
                                  <div className="flex justify-end mt-3">
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
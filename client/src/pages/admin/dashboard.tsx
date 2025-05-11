import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
// Gold price display has been removed
import { 
  ShoppingBag, 
  Users, 
  DollarSign, 
  Package, 
  TrendingUp, 
  Calendar,
  ExternalLink,
  Loader2,
  Star,
  UserCircle
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useState, useEffect, useMemo } from "react";

// Separate component for testimonials list to prevent React hooks rules violation
function PendingTestimonialsList() {
  const { data: testimonials, isLoading: isLoadingTestimonials } = useQuery({
    queryKey: ['/api/admin/testimonials']
  });
  
  const pendingTestimonials = Array.isArray(testimonials) 
    ? testimonials.filter((t: any) => !t.isApproved).slice(0, 5)
    : [];
    
  if (isLoadingTestimonials) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (pendingTestimonials.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No pending client stories to display
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {pendingTestimonials.map((testimonial: any) => (
        <div key={testimonial.id} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 p-4 border rounded-lg">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full overflow-hidden bg-muted flex items-center justify-center">
              {testimonial.imageUrls && testimonial.imageUrls.length > 0 ? (
                <img 
                  src={testimonial.imageUrls[0]} 
                  alt="Customer story" 
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserCircle className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div>
              <div className="font-medium">
                {testimonial.name}
                <Badge className="ml-2 bg-orange-500 text-white">Pending</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {testimonial.productType || "General"} • {new Date(testimonial.createdAt).toLocaleDateString()}
              </div>
              <div className="text-xs flex items-center mt-1">
                Rating: {testimonial.rating}/5
                <div className="flex ml-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < testimonial.rating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href={`/admin/testimonials`}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Review
            </Link>
          </Button>
        </div>
      ))}
      
      <div className="mt-4 text-center">
        <Button asChild variant="outline">
          <Link href="/admin/testimonials">
            Manage All Client Stories
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  // Use a single dashboard data query with configurable options for better performance
  const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ['/api/admin/dashboard-data'],
    // Use API endpoint if it exists, otherwise fallback to separate calls
    enabled: true,
    // Provide placeholders when loading to avoid rendering issues
    placeholderData: {
      quoteRequests: [],
      customizationRequests: [],
      designs: [],
      products: []
    }
  });
  
  // Extract data from combined endpoint or separate queries
  const quoteRequests = dashboardData?.quoteRequests;
  const personalizationRequests = dashboardData?.customizationRequests; // Using old API endpoint but with updated variable name
  const designs = dashboardData?.designs;
  const products = dashboardData?.products;
  
  // For backward compatibility, fetch separate data only if dashboard endpoint fails
  const [dashboardState, setDashboardState] = useState<any>(dashboardData || {});
  
  const { isLoading: isLoadingQuotes } = useQuery({
    queryKey: ['/api/quote-requests'],
    enabled: !dashboardData?.quoteRequests,
    // Using standard options without onSuccess callback to avoid TypeScript errors
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false
  });
  
  const { isLoading: isLoadingPersonalizations } = useQuery({
    queryKey: ['/api/customization-requests'], // Keep the old API endpoint
    enabled: !dashboardData?.customizationRequests, // Keep the old property name here for API compatibility
    staleTime: 30000,
    refetchOnWindowFocus: false
  });
  
  const { isLoading: isLoadingDesigns } = useQuery({
    queryKey: ['/api/custom-designs'],
    enabled: !dashboardData?.designs,
    staleTime: 30000,
    refetchOnWindowFocus: false
  });
  
  const { isLoading: isLoadingProducts } = useQuery({
    queryKey: ['/api/products'],
    enabled: !dashboardData?.products,
    staleTime: 30000,
    refetchOnWindowFocus: false
  });
  
  // Calculate request statistics
  const calculateRequestStats = () => {
    return {
      pendingPersonalizationRequests: Array.isArray(personalizationRequests) ? 
        personalizationRequests.filter((req: any) => req.status === "pending").length : 0,
      pendingQuoteRequests: Array.isArray(quoteRequests) ? 
        quoteRequests.filter((req: any) => req.status === "pending").length : 0,
    };
  };
  
  const calculateDesignStats = () => {
    if (!designs) return {
      totalDesigns: 0,
      pendingDesigns: 0,
      quotedDesigns: 0,
      approvedDesigns: 0
    };
    
    const totalDesigns = Array.isArray(designs) ? designs.length : 0;
    const pendingDesigns = Array.isArray(designs) ? designs.filter((design: any) => design.status === "pending").length : 0;
    const quotedDesigns = Array.isArray(designs) ? designs.filter((design: any) => design.status === "quoted").length : 0;
    const approvedDesigns = Array.isArray(designs) ? designs.filter((design: any) => design.status === "approved").length : 0;
    
    return {
      totalDesigns,
      pendingDesigns,
      quotedDesigns,
      approvedDesigns
    };
  };
  
  const requestStats = calculateRequestStats();
  const designStats = calculateDesignStats();
  
  // Define type for design objects
  interface DesignRequest {
    id: number;
    fullName: string;
    email: string;
    status: string;
    imageUrl: string;
    createdAt: Date | null;
    [key: string]: any; // Allow for additional properties
  }
  
  // Pending designs with proper type annotation
  const pendingDesigns = Array.isArray(designs) ? 
    designs.filter((design: any) => design.status === "pending")
      .slice(0, 5)
      .map((design: any): DesignRequest => ({
        id: design.id,
        fullName: design.fullName || "Unknown",
        email: design.email || "",
        status: design.status || "pending",
        imageUrl: design.imageUrl || "",
        createdAt: design.createdAt || null,
        ...design // Include all other properties
      }))
    : [];
  
  // Get today's date
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Loading state - also include the dashboard data loading state
  const isLoading = isLoadingDashboard || isLoadingQuotes || isLoadingPersonalizations || isLoadingDesigns || isLoadingProducts;
  
  // Add a timeout to prevent excessive re-rendering in production
  const [showLoading, setShowLoading] = useState(isLoading);
  
  useEffect(() => {
    // For better UX, only show loading state if it persists for more than 500ms
    let timeout: number;
    if (isLoading) {
      timeout = window.setTimeout(() => setShowLoading(true), 500);
    } else {
      setShowLoading(false);
    }
    
    return () => {
      if (timeout) window.clearTimeout(timeout);
    };
  }, [isLoading]);
  
  if (showLoading) {
    return (
      <AdminLayout title="Dashboard">
        <Helmet>
          <title>Admin Dashboard | Luster Legacy</title>
        </Helmet>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout title="Dashboard">
      <Helmet>
        <title>Admin Dashboard | Luster Legacy</title>
      </Helmet>
      
      <div className="space-y-8">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row justify-between md:items-center">
          <div>
            <h1 className="font-playfair text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              <Calendar className="inline-block mr-2 h-4 w-4" />
              {formattedDate}
            </p>
          </div>
          {/* Gold price display removed */}
        </div>
        
        {/* Stats Cards - Relevant Customer Request Information */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Custom Design Requests</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Link 
                href="/admin/designs" 
                className="block hover:opacity-75 transition-opacity cursor-pointer"
              >
                <div className="text-2xl font-bold">{designStats.totalDesigns || 0}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-orange-500">{designStats.pendingDesigns || 0}</span> need attention
                </p>
              </Link>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Quote Requests</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Link 
                href="/admin/quotes" 
                className="block hover:opacity-75 transition-opacity cursor-pointer"
              >
                <div className="text-2xl font-bold">{requestStats.pendingQuoteRequests || 0}</div>
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="inline mr-1 h-3 w-3 text-blue-500" />
                  <span className="text-blue-500">Pending quotes</span>
                </p>
              </Link>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Product Personalization Requests</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Link 
                href="/admin/personalizations" 
                className="block hover:opacity-75 transition-opacity cursor-pointer"
              >
                <div className="text-2xl font-bold">{requestStats.pendingPersonalizationRequests || 0}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-orange-500">Need response</span>
                </p>
              </Link>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Products</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Link 
                href="/admin/products" 
                className="block hover:opacity-75 transition-opacity cursor-pointer"
              >
                <div className="text-2xl font-bold">{Array.isArray(products) ? products.length : 0}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-primary">
                    {Array.isArray(products) ? products.filter((p: any) => p.isFeatured).length : 0}
                  </span> featured
                </p>
              </Link>
            </CardContent>
          </Card>
        </div>
        
        {/* Activity Tabs - Customer Request Interactions */}
        <Tabs defaultValue="designs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="designs">Custom Design Requests</TabsTrigger>
            <TabsTrigger value="personalizations">Product Personalization Requests</TabsTrigger>
            <TabsTrigger value="quotes">Quote Requests</TabsTrigger>
            <TabsTrigger value="testimonials">Client Stories</TabsTrigger>
          </TabsList>
          
          {/* Custom Design Requests Tab */}
          <TabsContent value="designs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Design Requests</CardTitle>
                <CardDescription>
                  Custom design requests awaiting your review
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingDesigns && pendingDesigns.length > 0 ? (
                  <div className="space-y-4">
                    {pendingDesigns.map(design => (
                      <div key={design.id} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded overflow-hidden bg-muted">
                            <img 
                              src={design.imageUrl} 
                              alt="Design reference" 
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-medium">
                              Design Request #{design.id}
                              <Badge className="ml-2 bg-orange-500 text-white">Pending</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {design.fullName} • {new Date(design.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/designs/${design.id}`}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No pending design requests to display
                  </div>
                )}
                
                {pendingDesigns && pendingDesigns.length > 0 && (
                  <div className="mt-4 text-center">
                    <Button asChild variant="outline">
                      <Link href="/admin/designs">
                        View All Design Requests
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Product Personalization Requests Tab */}
          <TabsContent value="personalizations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Product Personalization Requests</CardTitle>
                <CardDescription>
                  Requests to modify existing products
                </CardDescription>
              </CardHeader>
              <CardContent>
                {Array.isArray(personalizationRequests) && personalizationRequests.length > 0 ? (
                  <div className="space-y-4">
                    {personalizationRequests.map((req: any) => (
                      <div key={req.id} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded overflow-hidden bg-muted">
                            {req.productImageUrl ? (
                              <img 
                                src={req.productImageUrl} 
                                alt="Product" 
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Package className="h-8 w-8 m-2 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">
                              Personalization Request #{req.id}
                              <Badge className="ml-2 bg-orange-500 text-white">
                                {req.status === "pending" ? "Pending" : req.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {req.fullName} • {new Date(req.createdAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Metal: {req.originalMetalType || req.preferredMetal || req.requestedMetalType || "Not specified"} • 
                              Stone: {req.originalStoneType || req.preferredStones?.join(', ') || req.requestedStoneType || "Not specified"}
                            </div>
                            <div className="text-xs mt-1">
                              <span className="text-primary font-medium">Product:</span> {req.productName || "Not specified"}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/admin/personalizations/${req.id}`}>
                              <ExternalLink className="h-4 w-4 mr-1" /> View Request
                            </Link>
                          </Button>
                          {req.productId && (
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/products/${req.productId}`}>
                                <Package className="h-4 w-4 mr-1" /> Product Details
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No personalization requests to display
                  </div>
                )}
                
                <div className="mt-4 text-center">
                  <Button asChild variant="outline">
                    <Link href="/admin/personalizations">
                      View All Personalization Requests
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Quote Requests Tab */}
          <TabsContent value="quotes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quote Requests</CardTitle>
                <CardDescription>
                  Product price quote requests from customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {Array.isArray(quoteRequests) && quoteRequests.length > 0 ? (
                  <div className="space-y-4">
                    {quoteRequests.map((req: any) => (
                      <div key={req.id} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded overflow-hidden bg-muted">
                            {req.imageUrl ? (
                              <img 
                                src={req.imageUrl} 
                                alt="Product" 
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <ShoppingBag className="h-8 w-8 m-2 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">
                              Quote Request #{req.id}
                              <Badge className="ml-2 bg-blue-500 text-white">
                                {req.status === "pending" ? "Pending" : req.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {req.fullName} • {new Date(req.createdAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Metal: {req.metalType || "Not specified"} • Stone: {req.stoneType || "Not specified"}
                            </div>
                            <div className="text-xs mt-1">
                              <span className="text-primary font-medium">Product:</span> {req.productName || "Not specified"}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/admin/quotes/${req.id}`}>
                              <ExternalLink className="h-4 w-4 mr-1" /> View Request
                            </Link>
                          </Button>
                          {req.productId && (
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/products/${req.productId}`}>
                                <Package className="h-4 w-4 mr-1" /> Product Details
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No quote requests to display
                  </div>
                )}
                
                <div className="mt-4 text-center">
                  <Button asChild variant="outline">
                    <Link href="/admin/quotes">
                      View All Quote Requests
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Client Stories Tab */}
          <TabsContent value="testimonials" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Client Stories</CardTitle>
                <CardDescription>
                  Customer testimonials waiting for your approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PendingTestimonialsList />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Customer Request Management Quick Links */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">View Contact Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full" variant="outline">
                <Link href="/admin/contact-messages">
                  View Contact Messages
                </Link>
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Product Customization Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full" variant="outline">
                <Link href="/admin/customizations">
                  View Customization Requests
                </Link>
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Quote Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full" variant="outline">
                <Link href="/admin/quotes">
                  View Quote Requests
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* Product Management Quick Links */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Add New Product</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/admin/ai-generator">
                  Create New Product with AI
                </Link>
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Manage Products</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full" variant="outline">
                <Link href="/admin/products">
                  View All Products
                </Link>
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Visit Store</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full" variant="secondary">
                <a href="/" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Website
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

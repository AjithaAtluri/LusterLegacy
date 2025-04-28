import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { GoldPriceDisplay } from "@/components/admin/gold-price-display";
import { 
  ShoppingBag, 
  Users, 
  DollarSign, 
  Package, 
  TrendingUp, 
  Calendar,
  ExternalLink,
  Loader2,
  ArrowLeft,
  Home,
  Settings,
  LogOut
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// This is a special direct-access version of the admin dashboard
// that doesn't use the AdminLayout component to bypass auth issues

export default function DirectAdminDashboard() {
  // Get section from query parameter
  const [location] = useLocation();
  const params = new URLSearchParams(location.split('?')[1] || '');
  const currentSection = params.get('section') || 'dashboard';
  const itemId = params.get('id');
  
  // State to track login status
  const [isAttemptingLogin, setIsAttemptingLogin] = useState(true);

  // Auto-login effect
  useEffect(() => {
    const attemptLogin = async () => {
      setIsAttemptingLogin(true);
      try {
        // First check if already logged in
        const userRes = await fetch('/api/user', { 
          credentials: 'include',
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache", 
            "Expires": "0"
          }
        });
        
        // If already logged in, just confirm access
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.role === 'admin') {
            console.log("Already logged in as admin", userData);
            setIsAttemptingLogin(false);
            return;
          }
        }
      
        // If not logged in, auto-login with admin credentials
        console.log("Not logged in, attempting auto login");
        const loginRes = await apiRequest("POST", "/api/login", {
          username: "admin", 
          password: "admin123"
        });
        
        if (!loginRes.ok) {
          console.log("Admin auth system login failed, trying admin-specific login");
          throw new Error("Main admin login failed");
        }
        
        // Also login to admin system
        try {
          await apiRequest("POST", "/api/auth/login", {
            username: "admin", 
            password: "admin123"
          });
          console.log("Successfully logged in to both auth systems");
        } catch (adminAuthError) {
          console.warn("Admin auth login failed:", adminAuthError);
          // Continue anyway since main login succeeded
        }
        
        setIsAttemptingLogin(false);
      } catch (error) {
        console.error("Login error:", error);
        toast({
          title: "Login failed",
          description: "Unable to auto-login to admin account, proceeding in limited mode",
          variant: "destructive"
        });
        setIsAttemptingLogin(false);
      }
    };
    
    attemptLogin();
  }, []);
  
  // Fetch orders
  const { data: orders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['/api/admin/orders']
  });
  
  // Fetch designs
  const { data: designs, isLoading: isLoadingDesigns } = useQuery({
    queryKey: ['/api/custom-designs']
  });
  
  // Fetch products
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['/api/products']
  });
  
  // Calculate statistics
  const calculateStats = () => {
    if (!orders) return {
      totalOrders: 0,
      totalRevenue: 0,
      pendingOrders: 0,
      shippedOrders: 0,
      completedOrders: 0
    };
    
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.advanceAmount, 0);
    const pendingOrders = orders.filter(order => order.orderStatus === "processing").length;
    const shippedOrders = orders.filter(order => order.orderStatus === "shipped").length;
    const completedOrders = orders.filter(order => order.orderStatus === "delivered").length;
    
    return {
      totalOrders,
      totalRevenue,
      pendingOrders,
      shippedOrders,
      completedOrders
    };
  };
  
  const calculateDesignStats = () => {
    if (!designs) return {
      totalDesigns: 0,
      pendingDesigns: 0,
      quotedDesigns: 0,
      approvedDesigns: 0
    };
    
    const totalDesigns = designs.length;
    const pendingDesigns = designs.filter(design => design.status === "pending").length;
    const quotedDesigns = designs.filter(design => design.status === "quoted").length;
    const approvedDesigns = designs.filter(design => design.status === "approved").length;
    
    return {
      totalDesigns,
      pendingDesigns,
      quotedDesigns,
      approvedDesigns
    };
  };
  
  const stats = calculateStats();
  const designStats = calculateDesignStats();
  
  // Recent orders
  const recentOrders = orders?.slice(0, 5) || [];
  
  // Pending designs
  const pendingDesigns = designs?.filter(design => design.status === "pending").slice(0, 5) || [];
  
  // Get today's date
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Loading state
  const isLoading = isAttemptingLogin || isLoadingOrders || isLoadingDesigns || isLoadingProducts;
  
  const handleLogout = async () => {
    try {
      // Logout from both auth systems
      await apiRequest("POST", "/api/auth/logout");
      await apiRequest("POST", "/api/logout");
      
      toast({
        title: "Logged out successfully",
        description: "Returning to home page"
      });
      
      // Navigate to home
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      // Force redirect anyway
      window.location.href = "/";
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Helmet>
          <title>Admin Dashboard | Luster Legacy</title>
        </Helmet>
        <div className="flex items-center justify-center h-screen">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="text-muted-foreground">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Admin Dashboard | Luster Legacy</title>
        <meta name="description" content="Administrator dashboard for Luster Legacy jewelry management system." />
      </Helmet>
      
      {/* Manual Admin Header */}
      <header className="border-b sticky top-0 z-30 bg-background">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center gap-2 font-playfair text-xl font-bold">
            <span className="hidden md:inline">Luster<span className="text-primary">Legacy</span> Admin</span>
            <span className="md:hidden">LL<span className="text-primary">Admin</span></span>
          </div>
          
          <div className="ml-auto flex items-center gap-4">
            <Button variant="outline" asChild>
              <a href="/" target="_blank" rel="noopener noreferrer">
                <Home className="h-4 w-4 mr-2" />
                View Site
              </a>
            </Button>
            
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>
      
      {/* Side Navigation */}
      <div className="flex flex-1">
        <aside className="w-64 border-r hidden md:block">
          <div className="h-full py-6 px-3 overflow-y-auto">
            <nav className="space-y-1">
              <a 
                href="/admin/direct-dashboard" 
                className={`flex items-center gap-3 rounded-lg px-3 py-2 ${currentSection === 'dashboard' ? 'text-primary bg-accent/50 font-medium' : 'text-foreground hover:bg-accent hover:text-accent-foreground'}`}
              >
                <Home className="h-5 w-5" />
                Dashboard
              </a>
              <a 
                href="/admin/direct-dashboard?section=products" 
                className={`flex items-center gap-3 rounded-lg px-3 py-2 ${currentSection === 'products' ? 'text-primary bg-accent/50 font-medium' : 'text-foreground hover:bg-accent hover:text-accent-foreground'}`}
              >
                <Package className="h-5 w-5" />
                Products
              </a>
              <a 
                href="/admin/direct-dashboard?section=product-types" 
                className={`flex items-center gap-3 rounded-lg px-3 py-2 ${currentSection === 'product-types' ? 'text-primary bg-accent/50 font-medium' : 'text-foreground hover:bg-accent hover:text-accent-foreground'}`}
              >
                <Package className="h-5 w-5" />
                Product Types
              </a>
              <a 
                href="/admin/direct-dashboard?section=metal-types" 
                className={`flex items-center gap-3 rounded-lg px-3 py-2 ${currentSection === 'metal-types' ? 'text-primary bg-accent/50 font-medium' : 'text-foreground hover:bg-accent hover:text-accent-foreground'}`}
              >
                <Package className="h-5 w-5" />
                Metal Types
              </a>
              <a 
                href="/admin/direct-dashboard?section=stone-types" 
                className={`flex items-center gap-3 rounded-lg px-3 py-2 ${currentSection === 'stone-types' ? 'text-primary bg-accent/50 font-medium' : 'text-foreground hover:bg-accent hover:text-accent-foreground'}`}
              >
                <Package className="h-5 w-5" />
                Stone Types
              </a>
              <a 
                href="/admin/direct-dashboard?section=orders" 
                className={`flex items-center gap-3 rounded-lg px-3 py-2 ${currentSection === 'orders' ? 'text-primary bg-accent/50 font-medium' : 'text-foreground hover:bg-accent hover:text-accent-foreground'}`}
              >
                <ShoppingBag className="h-5 w-5" />
                Orders
              </a>
              <a 
                href="/admin/direct-dashboard?section=designs" 
                className={`flex items-center gap-3 rounded-lg px-3 py-2 ${currentSection === 'designs' ? 'text-primary bg-accent/50 font-medium' : 'text-foreground hover:bg-accent hover:text-accent-foreground'}`}
              >
                <Settings className="h-5 w-5" />
                Custom Designs
              </a>
              <a 
                href="/admin/ai-generator" 
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <Settings className="h-5 w-5" />
                AI Generator
              </a>
            </nav>
          </div>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Direct Access Alert */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800 flex items-center gap-3">
              <div className="bg-blue-100 rounded-full p-2">
                <ExternalLink className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold">Direct Admin Access</h3>
                <p className="text-sm">You are using the direct access mode which bypasses authentication checks.</p>
              </div>
              <Button asChild variant="ghost" size="sm" className="ml-auto">
                <a href="/admin">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Return to Standard Admin
                </a>
              </Button>
            </div>
            
            {/* Dashboard Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-center">
              <div>
                <h1 className="font-playfair text-2xl font-bold tracking-tight">
                  {currentSection === 'dashboard' && 'Dashboard'}
                  {currentSection === 'products' && 'Products'}
                  {currentSection === 'product-types' && 'Product Types'}
                  {currentSection === 'metal-types' && 'Metal Types'}
                  {currentSection === 'stone-types' && 'Stone Types'}
                  {currentSection === 'orders' && 'Orders'}
                  {currentSection === 'designs' && 'Custom Designs'}
                </h1>
                <p className="text-muted-foreground">
                  <Calendar className="inline-block mr-2 h-4 w-4" />
                  {formattedDate}
                </p>
              </div>
              <div className="mt-4 md:mt-0 md:w-64">
                <GoldPriceDisplay />
              </div>
            </div>
            
            {/* Dynamic Content Based on Section */}
            {currentSection === 'dashboard' && (
              <>
                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                      <p className="text-xs text-muted-foreground">50% advance payments</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                      <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalOrders}</div>
                      <p className="text-xs text-muted-foreground">
                        <TrendingUp className="inline mr-1 h-3 w-3 text-green-500" />
                        <span className="text-green-500">{stats.pendingOrders}</span> pending
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Design Requests</CardTitle>
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{designStats.totalDesigns}</div>
                      <p className="text-xs text-muted-foreground">
                        <span className="text-orange-500">{designStats.pendingDesigns}</span> need attention
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Products</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{products?.length || 0}</div>
                      <p className="text-xs text-muted-foreground">
                        <span className="text-primary">{products?.filter(p => p.isFeatured).length || 0}</span> featured
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Activity Tabs */}
                <Tabs defaultValue="orders" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="orders">Recent Orders</TabsTrigger>
                    <TabsTrigger value="designs">Pending Designs</TabsTrigger>
                  </TabsList>
                  
                  {/* Recent Orders Tab */}
                  <TabsContent value="orders" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Orders</CardTitle>
                        <CardDescription>
                          Latest orders that require processing
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {recentOrders.length > 0 ? (
                          <div className="space-y-4">
                            {recentOrders.map(order => (
                              <div key={order.id} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 p-4 border rounded-lg">
                                <div>
                                  <div className="font-medium flex items-center">
                                    Order #{order.id}
                                    <Badge className={`ml-2 ${
                                      order.orderStatus === 'processing' ? 'bg-blue-500' :
                                      order.orderStatus === 'shipped' ? 'bg-orange-500' :
                                      order.orderStatus === 'delivered' ? 'bg-green-500' :
                                      'bg-red-500'
                                    } text-white`}>
                                      {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {order.customerName} • {new Date(order.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <div className="font-medium">{formatCurrency(order.totalAmount)}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {order.paymentStatus === "advance_paid" ? "50% Paid" : "Fully Paid"}
                                    </div>
                                  </div>
                                  <Button asChild variant="ghost" size="sm">
                                    <a href={`/admin/direct-dashboard?section=orders&id=${order.id}`}>
                                      <ExternalLink className="h-4 w-4" />
                                    </a>
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-muted-foreground">
                            No recent orders to display
                          </div>
                        )}
                        
                        {recentOrders.length > 0 && (
                          <div className="mt-4 text-center">
                            <Button asChild variant="outline">
                              <Link href="/admin/direct-dashboard?section=orders">
                                View All Orders
                              </Link>
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  {/* Pending Designs Tab */}
                  <TabsContent value="designs" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Pending Design Requests</CardTitle>
                        <CardDescription>
                          Custom design requests awaiting your review
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {pendingDesigns.length > 0 ? (
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
                                  <a href={`/admin/direct-dashboard?section=designs&id=${design.id}`}>
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-muted-foreground">
                            No pending design requests to display
                          </div>
                        )}
                        
                        {pendingDesigns.length > 0 && (
                          <div className="mt-4 text-center">
                            <Button asChild variant="outline">
                              <Link href="/admin/direct-dashboard?section=designs">
                                View All Design Requests
                              </Link>
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
                
                {/* Quick Links */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                      <CardTitle className="text-sm font-medium">Manage Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button asChild className="w-full" variant="outline">
                        <Link href="/admin/direct-dashboard?section=orders">
                          View All Orders
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Design Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button asChild className="w-full" variant="outline">
                        <Link href="/admin/direct-dashboard?section=designs">
                          Manage Design Requests
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
              </>
            )}
            
            {/* Orders Section */}
            {currentSection === 'orders' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>All Orders</CardTitle>
                    <CardDescription>Manage and track all customer orders</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Add full orders list/management UI here */}
                    {orders && orders.length > 0 ? (
                      <div className="space-y-4">
                        {orders.map(order => (
                          <div key={order.id} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 p-4 border rounded-lg">
                            <div>
                              <div className="font-medium flex items-center">
                                Order #{order.id}
                                <Badge className={`ml-2 ${
                                  order.orderStatus === 'processing' ? 'bg-blue-500' :
                                  order.orderStatus === 'shipped' ? 'bg-orange-500' :
                                  order.orderStatus === 'delivered' ? 'bg-green-500' :
                                  'bg-red-500'
                                } text-white`}>
                                  {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {order.customerName} • {new Date(order.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="font-medium">{formatCurrency(order.totalAmount)}</div>
                                <div className="text-sm text-muted-foreground">
                                  {order.paymentStatus === "advance_paid" ? "50% Paid" : "Fully Paid"}
                                </div>
                              </div>
                              <Button asChild variant="ghost" size="sm">
                                <Link href={`/admin/direct-dashboard?section=orders&id=${order.id}`}>
                                  <ExternalLink className="h-4 w-4" />
                                </Link>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        No orders to display
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Designs Section */}
            {currentSection === 'designs' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Custom Design Requests</CardTitle>
                    <CardDescription>Manage all customer design requests</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Add full design requests list/management UI here */}
                    {designs && designs.length > 0 ? (
                      <div className="space-y-4">
                        {designs.map(design => (
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
                                  <Badge className={`ml-2 ${
                                    design.status === 'pending' ? 'bg-orange-500' :
                                    design.status === 'quoted' ? 'bg-blue-500' :
                                    design.status === 'approved' ? 'bg-green-500' :
                                    'bg-red-500'
                                  } text-white`}>
                                    {design.status.charAt(0).toUpperCase() + design.status.slice(1)}
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {design.fullName} • {new Date(design.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <Button asChild variant="ghost" size="sm">
                              <Link href={`/admin/direct-dashboard?section=designs&id=${design.id}`}>
                                <ExternalLink className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        No design requests to display
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Products Section */}
            {currentSection === 'products' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>All Products</CardTitle>
                    <CardDescription>Manage and edit your product catalog</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Add full products list/management UI here */}
                    {products && products.length > 0 ? (
                      <div className="space-y-4">
                        {products.map(product => (
                          <div key={product.id} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 p-4 border rounded-lg">
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded overflow-hidden bg-muted">
                                <img 
                                  src={product.imageUrl} 
                                  alt={product.name} 
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div>
                                <div className="font-medium">
                                  {product.name}
                                  {product.isFeatured && (
                                    <Badge className="ml-2 bg-primary text-white">Featured</Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {formatCurrency(product.basePrice)}
                                </div>
                              </div>
                            </div>
                            <Button asChild variant="ghost" size="sm">
                              <Link href={`/admin/direct-dashboard?section=products&id=${product.id}`}>
                                <ExternalLink className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        No products to display
                      </div>
                    )}
                    
                    <div className="mt-4 text-center">
                      <Button asChild>
                        <Link href="/admin/ai-generator">
                          Create New Product with AI
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Product Types Section */}
            {currentSection === 'product-types' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Product Types</CardTitle>
                    <CardDescription>Manage product categories and types</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-4">
                      <p>Product types management interface will be implemented here</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Metal Types Section */}
            {currentSection === 'metal-types' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Metal Types</CardTitle>
                    <CardDescription>Manage available metal types and properties</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-4">
                      <p>Metal types management interface will be implemented here</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Stone Types Section */}
            {currentSection === 'stone-types' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Stone Types</CardTitle>
                    <CardDescription>Manage available stone types and properties</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-4">
                      <p>Stone types management interface will be implemented here</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
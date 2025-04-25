import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  ShoppingBag, 
  Users, 
  DollarSign, 
  Package, 
  TrendingUp, 
  Calendar,
  ExternalLink,
  Loader2
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function AdminDashboard() {
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
  const isLoading = isLoadingOrders || isLoadingDesigns || isLoadingProducts;
  
  if (isLoading) {
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
        </div>
        
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
                            <Link href={`/admin/orders?id=${order.id}`}>
                              <ExternalLink className="h-4 w-4" />
                            </Link>
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
                      <Link href="/admin/orders">
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
                          <Link href={`/admin/designs?id=${design.id}`}>
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
                
                {pendingDesigns.length > 0 && (
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
        </Tabs>
        
        {/* Quick Links */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Add New Product</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/admin/add-product-with-unified-generator">
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
                <Link href="/admin/orders">
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
                <Link href="/admin/designs">
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
      </div>
    </AdminLayout>
  );
}

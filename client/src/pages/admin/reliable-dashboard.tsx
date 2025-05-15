import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LayoutDashboard, Package, ShoppingBag, Users, MessageCircle, Diamond, Gem } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Simple direct API call function to avoid React Query loading states
const fetchDirectly = async (url: string) => {
  try {
    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'X-Admin-Direct': 'true',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return null;
  }
};

export default function ReliableDashboard() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [adminData, setAdminData] = useState<any>(null);
  const [counts, setCounts] = useState<{
    pendingDesigns: number;
    pendingPersonalizations: number;
    pendingQuotes: number;
    unreadMessages: number;
    totalProducts: number;
    totalOrders: number;
    totalCustomers: number;
  }>({
    pendingDesigns: 0,
    pendingPersonalizations: 0,
    pendingQuotes: 0,
    unreadMessages: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0
  });

  // Direct fetch function that doesn't depend on React Query
  const loadDashboardData = async () => {
    setIsLoading(true);
    
    try {
      // First verify admin authentication
      const adminCheck = await fetchDirectly('/api/auth/me');
      
      if (!adminCheck || (adminCheck.role !== 'admin' && adminCheck.role !== 'limited-admin')) {
        console.log('Not authenticated as admin, redirecting...');
        window.location.href = '/admin/login';
        return;
      }
      
      setAdminData(adminCheck);
      
      // Fetch all dashboard data in parallel
      const [
        designs, 
        personalizations, 
        quotes, 
        messages,
        products,
        orders,
        customers
      ] = await Promise.all([
        fetchDirectly('/api/custom-designs'),
        fetchDirectly('/api/customization-requests'),
        fetchDirectly('/api/quote-requests'),
        fetchDirectly('/api/admin/contact'),
        fetchDirectly('/api/products'),
        fetchDirectly('/api/orders'),
        fetchDirectly('/api/users?role=customer')
      ]);
      
      // Calculate counts
      const updatedCounts = {
        pendingDesigns: Array.isArray(designs) ? 
          designs.filter((design: any) => design.status === "pending").length : 0,
          
        pendingPersonalizations: Array.isArray(personalizations) ? 
          personalizations.filter((req: any) => req.status === "pending").length : 0,
          
        pendingQuotes: Array.isArray(quotes) ? 
          quotes.filter((req: any) => req.status === "pending").length : 0,
          
        unreadMessages: Array.isArray(messages) ?
          messages.filter((message: any) => message.isRead === false).length : 0,
          
        totalProducts: Array.isArray(products) ? products.length : 0,
        
        totalOrders: Array.isArray(orders) ? orders.length : 0,
        
        totalCustomers: Array.isArray(customers) ? customers.length : 0
      };
      
      setCounts(updatedCounts);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error loading dashboard",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load data on mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-playfair text-3xl">Admin Dashboard</h1>
        
        <div className="flex items-center gap-4">
          {adminData && (
            <span className="text-sm text-muted-foreground">
              Logged in as: <span className="font-medium">{adminData.loginID || adminData.username}</span>
            </span>
          )}
          
          <Button 
            variant="outline" 
            onClick={loadDashboardData}
            disabled={isLoading}
          >
            Refresh Data
          </Button>
        </div>
      </div>
      
      <Separator className="mb-8" />
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">Loading dashboard data...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <DashboardCard 
              title="Pending Custom Designs" 
              value={counts.pendingDesigns} 
              icon={<Diamond className="h-5 w-5" />}
              onClick={() => window.location.href = '/admin/designs'}
            />
            
            <DashboardCard 
              title="Pending Personalizations" 
              value={counts.pendingPersonalizations} 
              icon={<Gem className="h-5 w-5" />}
              onClick={() => window.location.href = '/admin/personalization-requests'}
            />
            
            <DashboardCard 
              title="Pending Quote Requests" 
              value={counts.pendingQuotes} 
              icon={<MessageCircle className="h-5 w-5" />}
              onClick={() => window.location.href = '/admin/quote-requests'}
            />
            
            <DashboardCard 
              title="Unread Messages" 
              value={counts.unreadMessages} 
              icon={<MessageCircle className="h-5 w-5" />}
              onClick={() => window.location.href = '/admin/contact-messages'}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DashboardCard 
              title="Total Products" 
              value={counts.totalProducts} 
              icon={<Package className="h-5 w-5" />}
              onClick={() => window.location.href = '/admin/products'}
            />
            
            <DashboardCard 
              title="Total Orders" 
              value={counts.totalOrders} 
              icon={<ShoppingBag className="h-5 w-5" />}
              onClick={() => window.location.href = '/admin/orders'}
            />
            
            <DashboardCard 
              title="Total Customers" 
              value={counts.totalCustomers} 
              icon={<Users className="h-5 w-5" />}
              onClick={() => window.location.href = '/admin/customers'}
            />
          </div>
          
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <Button onClick={() => window.location.href = '/admin/products/new'}>
                  Add New Product
                </Button>
                <Button onClick={() => window.location.href = '/admin/designs'}>
                  View Design Requests
                </Button>
                <Button onClick={() => window.location.href = '/admin/personalization-requests'}>
                  View Personalizations
                </Button>
                <Button onClick={() => window.location.href = '/admin/products'}>
                  Manage Products
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Current system information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Admin User</p>
                  <p className="text-sm text-muted-foreground">
                    {adminData ? (adminData.loginID || adminData.username) : 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Role</p>
                  <p className="text-sm text-muted-foreground">
                    {adminData ? adminData.role : 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Server Status</p>
                  <p className="text-sm text-green-500">Online</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Last Refresh</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date().toLocaleTimeString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

// Dashboard card component
function DashboardCard({ 
  title, 
  value, 
  icon,
  onClick
}: { 
  title: string; 
  value: number; 
  icon: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Card 
      className={`overflow-hidden ${onClick ? 'cursor-pointer hover:border-primary transition-colors' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
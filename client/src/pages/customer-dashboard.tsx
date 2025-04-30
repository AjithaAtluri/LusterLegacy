import { useState, useMemo } from "react";
import { Helmet } from "react-helmet";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  ShoppingCart, 
  Package, 
  PenTool, 
  Settings, 
  User, 
  Trash2,
  ExternalLink,
  ArrowRight,
  ShoppingBag
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Link, Redirect } from "wouter";
import { formatCurrency } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function CustomerDashboard() {
  const { user, isLoading: isLoadingAuth } = useAuth();
  const [activeTab, setActiveTab] = useState("cart");
  
  // Redirect to auth page if not logged in
  if (!isLoadingAuth && !user) {
    return <Redirect to="/auth" />;
  }
  
  // Fetch cart items
  const { data: cart, isLoading: isLoadingCart } = useQuery({
    queryKey: ['/api/cart'],
    enabled: activeTab === "cart",
    staleTime: 60000 // 1 minute cache
  });
  
  // Fetch both types of customization requests (from both endpoints)
  const { data: customizationRequests, isLoading: isLoadingRequests } = useQuery({
    queryKey: ['/api/customization-requests'],
    enabled: activeTab === "requests" && !!user,
    staleTime: 60000,
    onSuccess: (data) => {
      console.log("Successfully fetched customization requests:", data);
    },
    onError: () => {
      console.error("Error fetching customization requests");
      toast({
        title: "Error",
        description: "Failed to load your custom design requests",
        variant: "destructive",
      });
    }
  });
  
  // Also fetch custom designs from the other endpoint
  const { data: customDesigns, isLoading: isLoadingCustomDesigns } = useQuery({
    queryKey: ['/api/custom-designs/user'],
    enabled: activeTab === "requests" && !!user,
    staleTime: 60000,
    onSuccess: (data) => {
      console.log("Successfully fetched custom designs:", data);
    },
    onError: () => {
      console.error("Error fetching custom designs");
    }
  });
  
  // Use only customizationRequests to avoid duplicates
  // Since both endpoints return the same data, just use one of them
  const allDesignRequests = useMemo(() => {
    // Only use the data from customizationRequests to avoid duplicates
    const requests = [...(customizationRequests || [])];
    
    // Sort by date
    return requests.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [customizationRequests]);
  
  // Fetch orders
  const { data: orders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['/api/orders'],
    enabled: activeTab === "orders",
    staleTime: 60000
  });

  const { toast } = useToast();
  
  // Cart item removal mutation
  const removeCartItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      return await apiRequest("DELETE", `/api/cart/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove item from cart",
        variant: "destructive",
      });
      console.error('Error removing item from cart:', error);
    }
  });

  return (
    <>
      <Helmet>
        <title>My Account | Luster Legacy</title>
        <meta name="description" content="Manage your account, cart, orders and custom design requests." />
      </Helmet>
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-playfair text-3xl font-bold text-foreground mb-2">My Account</h1>
              <p className="font-montserrat text-foreground/70">
                Manage your cart, orders, and custom jewelry requests
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
          
          <Tabs defaultValue="cart" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-8">
              <TabsTrigger value="cart" className="flex items-center">
                <ShoppingCart className="mr-2 h-4 w-4" />
                <span>My Cart</span>
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center">
                <Package className="mr-2 h-4 w-4" />
                <span>My Orders</span>
              </TabsTrigger>
              <TabsTrigger value="requests" className="flex items-center">
                <PenTool className="mr-2 h-4 w-4" />
                <span>Custom Requests</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                <span>Account</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Cart Tab */}
            <TabsContent value="cart">
              <Card>
                <CardHeader>
                  <CardTitle>My Shopping Cart</CardTitle>
                  <CardDescription>Review and manage items in your cart</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingCart ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p>Loading your cart...</p>
                    </div>
                  ) : !cart || cart.items.length === 0 ? (
                    <div className="text-center py-10">
                      <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-foreground/20" />
                      <h3 className="font-playfair text-xl font-medium mb-2">Your cart is empty</h3>
                      <p className="font-montserrat text-foreground/60 mb-6">
                        Start exploring our collections to find your perfect piece
                      </p>
                      <Button asChild>
                        <Link href="/collections">
                          Browse Collections <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Cart items */}
                      <div className="space-y-4">
                        {cart.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-4 border rounded-md">
                            <div className="flex items-center">
                              <div className="w-16 h-16 bg-background rounded-md border overflow-hidden flex-shrink-0 mr-4">
                                {item.product?.imageUrl ? (
                                  <img 
                                    src={item.product.imageUrl} 
                                    alt={item.product.name} 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-foreground/5">
                                    <ShoppingBag className="h-6 w-6 text-foreground/30" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <h3 className="font-medium mb-1">{item.product?.name}</h3>
                                <p className="text-sm text-foreground/60">
                                  {item.metalTypeId} • {item.stoneTypeId}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <p className="font-playfair font-medium mr-6">
                                {formatCurrency(item.price)}
                              </p>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => removeCartItemMutation.mutate(item.id)}
                                disabled={removeCartItemMutation.isPending}
                              >
                                {removeCartItemMutation.isPending ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                ) : (
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                )}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <Separator />
                      
                      {/* Cart summary */}
                      <div className="bg-accent/10 p-4 rounded-lg">
                        <div className="flex justify-between mb-2">
                          <span className="font-montserrat">Items ({cart.items.length})</span>
                          <span className="font-medium">{formatCurrency(cart.total)}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span className="font-montserrat">Shipping</span>
                          <span className="font-medium">Free</span>
                        </div>
                        <Separator className="my-3" />
                        <div className="flex justify-between">
                          <span className="font-montserrat font-medium">Total</span>
                          <span className="font-semibold">{formatCurrency(cart.total)}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button asChild className="w-full md:w-auto">
                          <Link href="/checkout">
                            Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Orders Tab */}
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>My Orders</CardTitle>
                  <CardDescription>Track and manage your orders</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingOrders ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p>Loading your orders...</p>
                    </div>
                  ) : !orders || orders.length === 0 ? (
                    <div className="text-center py-10">
                      <Package className="h-16 w-16 mx-auto mb-4 text-foreground/20" />
                      <h3 className="font-playfair text-xl font-medium mb-2">No orders yet</h3>
                      <p className="font-montserrat text-foreground/60 mb-6">
                        You haven't placed any orders yet. Start by adding items to your cart.
                      </p>
                      <Button asChild>
                        <Link href="/collections">
                          Browse Collections <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <Card key={order.id} className="overflow-hidden">
                          <CardHeader className="bg-background/50 pb-2">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/orders/${order.id}`}>
                                  View Details
                                </Link>
                              </Button>
                            </div>
                            <CardDescription>
                              {new Date(order.createdAt).toLocaleDateString()} • 
                              Status: <span className="font-medium capitalize">{order.orderStatus}</span>
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pt-4">
                            <div className="grid gap-4">
                              {order.items && order.items.map((item) => (
                                <div key={item.id} className="flex items-center">
                                  <div className="w-12 h-12 bg-background rounded-md border overflow-hidden flex-shrink-0 mr-3">
                                    {item.product?.imageUrl ? (
                                      <img 
                                        src={item.product.imageUrl} 
                                        alt={item.product.name} 
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-foreground/5">
                                        <ShoppingBag className="h-5 w-5 text-foreground/30" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{item.product?.name}</p>
                                    <p className="text-xs text-foreground/60">
                                      {item.metalTypeId} • {item.stoneTypeId}
                                    </p>
                                  </div>
                                  <p className="font-medium text-sm">
                                    {formatCurrency(item.price)}
                                  </p>
                                </div>
                              ))}
                            </div>
                            <Separator className="my-3" />
                            <div className="flex justify-between">
                              <span className="font-montserrat text-sm">Total</span>
                              <span className="font-medium">{formatCurrency(order.totalAmount)}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Custom Requests Tab */}
            <TabsContent value="requests">
              <Card>
                <CardHeader>
                  <CardTitle>Custom Design Requests</CardTitle>
                  <CardDescription>View and track your custom jewelry requests</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingRequests || isLoadingCustomDesigns ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p>Loading your design requests...</p>
                    </div>
                  ) : !allDesignRequests || allDesignRequests.length === 0 ? (
                    <div className="text-center py-10">
                      <PenTool className="h-16 w-16 mx-auto mb-4 text-foreground/20" />
                      <h3 className="font-playfair text-xl font-medium mb-2">No custom design requests</h3>
                      <p className="font-montserrat text-foreground/60 mb-6">
                        You haven't submitted any customization requests yet.
                      </p>
                      <Button asChild>
                        <Link href="/custom-design">
                          Create Custom Design <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {allDesignRequests.map((request) => (
                        <Card key={request.id} className="overflow-hidden">
                          <CardHeader className="bg-background/50 pb-2">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-lg">Request #{request.id}</CardTitle>
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
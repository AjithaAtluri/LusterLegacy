import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { Eye, Loader2, Package, CreditCard } from "lucide-react";

interface OrderDetailProps {
  order: {
    id: number;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    shippingAddress: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    specialInstructions?: string;
    totalAmount: number;
    advanceAmount: number;
    balanceAmount: number;
    paymentStatus: string;
    orderStatus: string;
    createdAt: string;
    items: Array<{
      id: number;
      productId: number;
      metalTypeId: string;
      stoneTypeId: string;
      price: number;
      isCustomDesign: boolean;
      designRequestId?: number;
      product?: {
        name: string;
        imageUrl: string;
      };
    }>;
  };
}

export default function OrderDetail({ order }: OrderDetailProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [orderStatus, setOrderStatus] = useState(order.orderStatus);
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "processing":
        return "bg-blue-500";
      case "shipped":
        return "bg-orange-500";
      case "delivered":
        return "bg-green-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };
  
  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "advance_paid":
        return "bg-yellow-500";
      case "full_paid":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  
  const handleUpdate = async () => {
    setIsUpdating(true);
    
    try {
      await apiRequest("PUT", `/api/admin/orders/${order.id}`, {
        orderStatus,
        paymentStatus
      });
      
      toast({
        title: "Order updated",
        description: "The order has been updated successfully"
      });
      
      // Invalidate query to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      
      // Close dialog
      setIsOpen(false);
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        title: "Update failed",
        description: "Failed to update order",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          View
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-playfair text-xl">Order #{order.id}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Customer Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="space-y-2">
                <div>
                  <div className="font-medium">Name</div>
                  <div>{order.customerName}</div>
                </div>
                <div>
                  <div className="font-medium">Email</div>
                  <div>{order.customerEmail}</div>
                </div>
                <div>
                  <div className="font-medium">Phone</div>
                  <div>{order.customerPhone}</div>
                </div>
                <div>
                  <div className="font-medium">Order Date</div>
                  <div>{formatDate(order.createdAt)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Shipping Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Shipping Address</CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="space-y-1">
                <div>{order.shippingAddress.line1}</div>
                {order.shippingAddress.line2 && <div>{order.shippingAddress.line2}</div>}
                <div>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                </div>
                <div>{order.shippingAddress.country}</div>
              </div>
              
              {order.specialInstructions && (
                <div className="mt-4">
                  <div className="font-medium">Special Instructions</div>
                  <div className="text-sm mt-1">{order.specialInstructions}</div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Order Items */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4">
                    {item.product?.imageUrl && (
                      <div className="h-16 w-16 rounded overflow-hidden flex-shrink-0">
                        <img 
                          src={item.product.imageUrl} 
                          alt={item.product?.name || `Product ${item.productId}`} 
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {item.product?.name || `Product ID: ${item.productId}`}
                        {item.isCustomDesign && (
                          <Badge className="ml-2 bg-primary">Custom Design</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Metal: {item.metalTypeId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Stone: {item.stoneTypeId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </div>
                    </div>
                    <div className="font-medium">
                      {formatCurrency(item.price)}
                    </div>
                  </div>
                ))}
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>{formatCurrency(order.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Advance Payment (50%)</span>
                  <span>{formatCurrency(order.advanceAmount)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Balance Due</span>
                  <span>{formatCurrency(order.balanceAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Order Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Order Status
              </CardTitle>
              <CardDescription>
                Update the fulfillment status of this order
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="space-y-2">
                <div className="font-medium">Current Status</div>
                <div>
                  <Badge className={`${getOrderStatusColor(order.orderStatus)} text-white`}>
                    {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                  </Badge>
                </div>
                
                <div className="mt-4">
                  <label htmlFor="orderStatus" className="block font-medium mb-1">
                    Update Status
                  </label>
                  <select
                    id="orderStatus"
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    value={orderStatus}
                    onChange={(e) => setOrderStatus(e.target.value)}
                  >
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Payment Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Payment Status
              </CardTitle>
              <CardDescription>
                Update the payment status of this order
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="space-y-2">
                <div className="font-medium">Current Status</div>
                <div>
                  <Badge className={`${getPaymentStatusColor(order.paymentStatus)} text-white`}>
                    {order.paymentStatus === "advance_paid" ? "Advance Paid" : "Fully Paid"}
                  </Badge>
                </div>
                
                <div className="mt-4">
                  <label htmlFor="paymentStatus" className="block font-medium mb-1">
                    Update Status
                  </label>
                  <select
                    id="paymentStatus"
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                  >
                    <option value="advance_paid">Advance Paid (50%)</option>
                    <option value="full_paid">Fully Paid (100%)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Update Button */}
          <div className="md:col-span-2">
            <Button 
              onClick={handleUpdate} 
              disabled={isUpdating}
              className="w-full"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Order"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

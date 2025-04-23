import { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/admin-layout";
import OrderDetail from "@/components/admin/order-detail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Mail, Download } from "lucide-react";

export default function AdminOrders() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const { toast } = useToast();
  
  // Fetch orders
  const { data: orders, isLoading } = useQuery({
    queryKey: ['/api/admin/orders'],
  });
  
  // Filter orders by search query and status
  const filteredOrders = orders?.filter(order => {
    // Filter by search query
    const matchesSearch = !searchQuery || 
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toString().includes(searchQuery);
    
    // Filter by status
    const matchesStatus = statusFilter === "all" || order.orderStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Sort orders
  const sortedOrders = filteredOrders?.sort((a, b) => {
    if (sortOrder === "newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortOrder === "oldest") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sortOrder === "highest") {
      return b.totalAmount - a.totalAmount;
    } else if (sortOrder === "lowest") {
      return a.totalAmount - b.totalAmount;
    }
    return 0;
  });
  
  // Export orders as CSV
  const exportOrders = () => {
    if (!orders || orders.length === 0) {
      toast({
        title: "No orders to export",
        description: "There are no orders available to export.",
        variant: "destructive",
      });
      return;
    }
    
    // Create CSV content
    const headers = [
      "Order ID",
      "Date",
      "Customer Name",
      "Email",
      "Phone",
      "Total Amount",
      "Advance Payment",
      "Balance Due",
      "Payment Status",
      "Order Status"
    ];
    
    const csvRows = [
      headers.join(","),
      ...orders.map(order => [
        order.id,
        new Date(order.createdAt).toLocaleDateString(),
        `"${order.customerName}"`,
        `"${order.customerEmail}"`,
        `"${order.customerPhone}"`,
        order.totalAmount,
        order.advanceAmount,
        order.balanceAmount,
        order.paymentStatus,
        order.orderStatus
      ].join(","))
    ];
    
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    
    // Create temporary link and trigger download
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `luster-legacy-orders-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export successful",
      description: "Orders have been exported to CSV.",
    });
  };
  
  // Helper function to get status badge color
  const getStatusColor = (status: string) => {
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
  
  return (
    <AdminLayout title="Orders">
      <Helmet>
        <title>Manage Orders | Luster Legacy Admin</title>
      </Helmet>
      
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6">
        <div>
          <h1 className="font-playfair text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">
            Manage customer orders and update their status
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button onClick={exportOrders} variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>
      
      <div className="mb-6 space-y-4">
        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, email or order ID..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="highest">Highest Price</SelectItem>
                <SelectItem value="lowest">Lowest Price</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Status Tabs */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="all">All Orders</TabsTrigger>
            <TabsTrigger value="processing">Processing</TabsTrigger>
            <TabsTrigger value="shipped">Shipped</TabsTrigger>
            <TabsTrigger value="delivered">Delivered</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Orders Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : sortedOrders && sortedOrders.length > 0 ? (
        <div className="rounded-md border">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead>
                <tr className="border-b transition-colors hover:bg-muted/10">
                  <th className="h-12 px-4 text-left font-medium">Order</th>
                  <th className="h-12 px-4 text-left font-medium">Customer</th>
                  <th className="h-12 px-4 text-left font-medium">Date</th>
                  <th className="h-12 px-4 text-left font-medium">Status</th>
                  <th className="h-12 px-4 text-left font-medium">Payment</th>
                  <th className="h-12 px-4 text-left font-medium">Total</th>
                  <th className="h-12 px-4 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedOrders.map(order => (
                  <tr key={order.id} className="border-b transition-colors hover:bg-muted/20">
                    <td className="p-4 font-medium">#{order.id}</td>
                    <td className="p-4">
                      <div>{order.customerName}</div>
                      <div className="text-xs text-muted-foreground flex items-center">
                        <Mail className="h-3 w-3 mr-1" /> {order.customerEmail}
                      </div>
                    </td>
                    <td className="p-4">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <Badge className={`${getStatusColor(order.orderStatus)} text-white`}>
                        {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline">
                        {order.paymentStatus === "advance_paid" ? "50% Paid" : "Fully Paid"}
                      </Badge>
                    </td>
                    <td className="p-4 font-medium">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="p-4">
                      <OrderDetail order={order} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-24 border rounded-lg bg-muted/10">
          <h3 className="font-playfair text-lg font-medium mb-1">No orders found</h3>
          <p className="text-muted-foreground">
            {searchQuery || statusFilter !== "all"
              ? "No orders match your search criteria. Try different filters."
              : "Orders will appear here when customers place them."}
          </p>
        </div>
      )}
    </AdminLayout>
  );
}

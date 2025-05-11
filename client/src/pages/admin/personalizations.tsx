import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search, RefreshCw } from "lucide-react";
import { SelectSeparator } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { CustomizationRequest } from "@shared/schema";

export default function PersonalizationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  
  // Fetch all personalization requests using original API endpoint for compatibility
  const { data: personalizationRequests, isLoading, isError, refetch } = useQuery({
    queryKey: ["/api/customization-requests"],
    queryFn: async () => {
      const res = await fetch("/api/customization-requests");
      if (!res.ok) throw new Error("Failed to fetch personalization requests");
      return res.json();
    }
  });
  
  // Filter requests based on search term and active tab
  const filteredRequests = personalizationRequests ? personalizationRequests
    .filter((request: CustomizationRequest) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        request.fullName.toLowerCase().includes(searchLower) ||
        request.email.toLowerCase().includes(searchLower) ||
        request.productName.toLowerCase().includes(searchLower) ||
        String(request.id).includes(searchTerm)
      );
    })
    .filter((request: CustomizationRequest) => {
      if (activeTab === "active") {
        return !["completed", "cancelled"].includes(request.status);
      } else if (activeTab === "completed") {
        return request.status === "completed";
      } else {
        return true; // Show all in "all" tab
      }
    }) : [];
  
  // Handle refresh button
  const handleRefresh = () => {
    refetch();
  };
  
  // Loading state
  if (isLoading) {
    return (
      <AdminLayout title="Product Personalization Requests">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }
  
  // Error state
  if (isError) {
    return (
      <AdminLayout title="Product Personalization Requests">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-destructive">Error loading personalization requests</p>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </AdminLayout>
    );
  }
  
  // Empty state
  if (personalizationRequests && personalizationRequests.length === 0) {
    return (
      <AdminLayout title="Product Personalization Requests">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-muted-foreground">No personalization requests found</p>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout title="Product Personalization Requests">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name, email, or ID..."
              className="w-full pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="active" onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="space-y-4">
            {filteredRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <p className="text-muted-foreground">No matching personalization requests found</p>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                  {filteredRequests.map((request: CustomizationRequest) => (
                    <PersonalizationRequestCard key={request.id} request={request} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

interface PersonalizationRequestCardProps {
  request: CustomizationRequest;
}

function PersonalizationRequestCard({ request }: PersonalizationRequestCardProps) {
  // Format the date
  const formattedDate = request.createdAt 
    ? formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })
    : "Date not available";
  
  // Generate status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-500">In Progress</Badge>;
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Get personalization type display name
  const getPersonalizationType = (type: string) => {
    switch(type) {
      case "metal_and_stone":
        return "Metal & Stone";
      case "metal_only":
        return "Metal Only";
      case "stone_only":
        return "Stone Only";
      default:
        return type || "Custom";
    }
  };
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Request #{request.id}</CardTitle>
            <CardDescription>{formattedDate}</CardDescription>
          </div>
          {getStatusBadge(request.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-medium">Customer Details</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
            <div className="text-sm text-muted-foreground">Name:</div>
            <div className="text-sm">{request.fullName}</div>
            <div className="text-sm text-muted-foreground">Email:</div>
            <div className="text-sm">{request.email}</div>
          </div>
        </div>
        
        <SelectSeparator />
        
        <div>
          <h3 className="font-medium">Product Details</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
            <div className="text-sm text-muted-foreground">Product:</div>
            <div className="text-sm">{request.productName}</div>
            <div className="text-sm text-muted-foreground">Personalization:</div>
            <div className="text-sm">{getPersonalizationType(request.personalizationType || request.customizationType)}</div>
          </div>
        </div>
        
        <SelectSeparator />
        
        <Button className="w-full" variant="outline" asChild>
          <a href={`/admin/personalizations/${request.id}`}>View Details</a>
        </Button>
      </CardContent>
    </Card>
  );
}
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search, RefreshCw, ExternalLink } from "lucide-react";
import { SelectSeparator } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { QuoteRequest } from "@shared/schema";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from "@/lib/utils";

interface QuoteRequestDisplay extends QuoteRequest {
  productName: string;
  quotedPrice: number | null;
  currency: string | null;
}

export default function QuotesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [_, navigate] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  
  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && !user?.role?.includes("admin")) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);
  
  // Fetch all quote requests
  const { data: quoteRequests, isLoading, isError, refetch } = useQuery({
    queryKey: ["/api/quote-requests"],
    queryFn: async () => {
      const res = await fetch("/api/quote-requests");
      if (!res.ok) throw new Error("Failed to fetch quote requests");
      return res.json();
    },
    enabled: !!user?.role?.includes("admin")
  });
  
  // Filter requests based on search term and active tab
  const filteredRequests = quoteRequests ? (quoteRequests as QuoteRequestDisplay[])
    .filter((request) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        request.fullName.toLowerCase().includes(searchLower) ||
        request.email.toLowerCase().includes(searchLower) ||
        request.productName.toLowerCase().includes(searchLower) ||
        String(request.id).includes(searchTerm)
      );
    })
    .filter((request) => {
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
  
  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'approved':
        return 'bg-emerald-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'quoted':
        return 'bg-purple-500';
      case 'cancelled':
      case 'rejected':
        return 'bg-destructive';
      default:
        return 'bg-yellow-500'; // Pending
    }
  };
  
  // Format date relative to now
  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };
  
  // Loading state
  if (authLoading || isLoading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="mt-4 text-lg">Loading quote requests...</p>
        </div>
      </AdminLayout>
    );
  }
  
  // Error state
  if (isError) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Error Loading Quote Requests</CardTitle>
              <CardDescription>
                There was a problem fetching the quote requests. Please try again.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleRefresh}>Retry</Button>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout title="Quote Requests">
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">Quote Requests</CardTitle>
                <CardDescription>
                  Manage and respond to product quote requests from customers
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="self-start"
                onClick={handleRefresh}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 mt-4 md:items-center">
              <div className="relative w-full md:w-72">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email or ID..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Tabs 
                defaultValue="active" 
                className="w-full md:w-auto"
                value={activeTab}
                onValueChange={setActiveTab}
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="all">All</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          
          <SelectSeparator />
          
          <CardContent>
            <ScrollArea className="h-[600px] w-full pr-4">
              {filteredRequests.length > 0 ? (
                <div className="space-y-4">
                  {filteredRequests.map((request) => (
                    <Card key={request.id} className="overflow-hidden">
                      <div className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">Quote #{request.id}</h3>
                              <Badge className={getStatusBadgeColor(request.status)}>
                                {request.status.replace("_", " ").toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              From: {request.fullName} ({request.email})
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Submitted {formatDate(request.createdAt)}
                            </p>
                          </div>
                          
                          <Button 
                            variant="outline" 
                            className="self-start"
                            onClick={() => navigate(`/admin/quotes/${request.id}`)}
                          >
                            View Details
                            <ExternalLink className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Product</p>
                            <p className="text-sm">{request.productName || "Not specified"}</p>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Metal Type</p>
                            <p className="text-sm">{request.metalType || "Not specified"}</p>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Stone Type</p>
                            <p className="text-sm">{request.stoneType || "Not specified"}</p>
                          </div>
                        </div>
                        
                        {request.quotedPrice && (
                          <div className="mt-4">
                            <p className="text-sm font-medium">Quoted Price</p>
                            <p className="text-lg font-bold text-primary">
                              {formatCurrency(request.quotedPrice, request.currency || 'USD')}
                            </p>
                          </div>
                        )}
                        
                        {request.specialRequirements && (
                          <div className="mt-4">
                            <p className="text-sm font-medium">Special Requirements</p>
                            <p className="text-sm mt-1 line-clamp-2">
                              {request.specialRequirements}
                            </p>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-muted-foreground mb-4">
                    {searchTerm 
                      ? "No quote requests match your search criteria" 
                      : "No quote requests found"}
                  </p>
                  {searchTerm && (
                    <Button 
                      variant="outline" 
                      onClick={() => setSearchTerm("")}
                    >
                      Clear Search
                    </Button>
                  )}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
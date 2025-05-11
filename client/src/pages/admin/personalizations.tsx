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
import { PersonalizationRequest } from "@shared/schema";

export default function PersonalizationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  
  // Fetch all personalization requests
  const { data: personalizationRequests, isLoading, isError, refetch } = useQuery({
    queryKey: ["/api/personalization-requests"],
    queryFn: async () => {
      const res = await fetch("/api/personalization-requests");
      if (!res.ok) throw new Error("Failed to fetch personalization requests");
      return res.json();
    }
  });
  
  // Filter requests based on search term and active tab
  const filteredRequests = personalizationRequests ? personalizationRequests
    .filter((request: PersonalizationRequest) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        request.fullName.toLowerCase().includes(searchLower) ||
        request.email.toLowerCase().includes(searchLower) ||
        request.productName?.toLowerCase().includes(searchLower) ||
        String(request.id).includes(searchTerm)
      );
    })
    .filter((request: PersonalizationRequest) => {
      // Active tab includes all non-completed and non-cancelled requests
      if (activeTab === "active") {
        return !["completed", "cancelled"].includes(request.status);
      }
      // Completed tab includes only completed requests
      else if (activeTab === "completed") {
        return request.status === "completed";
      }
      // Cancelled tab includes only cancelled requests
      else if (activeTab === "cancelled") {
        return request.status === "cancelled";
      }
      return true;
    })
    .sort((a: PersonalizationRequest, b: PersonalizationRequest) => {
      // Sort by status priority first (pending first, then in_progress, etc.)
      const statusPriority: { [key: string]: number } = {
        pending: 0,
        in_progress: 1,
        quoted: 2,
        approved: 3,
        production: 4,
        ready: 5,
        completed: 6,
        cancelled: 7
      };
      
      const statusDiff = (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99);
      if (statusDiff !== 0) return statusDiff;
      
      // Then sort by date (newest first)
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    })
    : [];
  
  // Format status for display
  const formatStatus = (status: string) => {
    const statusMap: { [key: string]: { label: string; color: string } } = {
      pending: { label: "Pending", color: "bg-yellow-500" },
      in_progress: { label: "In Progress", color: "bg-blue-500" },
      quoted: { label: "Quoted", color: "bg-purple-500" },
      approved: { label: "Approved", color: "bg-indigo-500" },
      production: { label: "In Production", color: "bg-pink-500" },
      ready: { label: "Ready", color: "bg-orange-500" },
      completed: { label: "Completed", color: "bg-green-500" },
      cancelled: { label: "Cancelled", color: "bg-destructive" }
    };
    
    return statusMap[status] || { label: status.charAt(0).toUpperCase() + status.slice(1), color: "bg-slate-500" };
  };
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <AdminLayout title="Personalization Requests">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Personalization Requests</h1>
        <Button onClick={() => refetch()} variant="outline" className="flex items-center gap-1.5">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>
      
      <div className="mb-6">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Label htmlFor="search" className="text-sm font-medium mb-1.5 block">
              Search
            </Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by name, email, or product"
                className="pl-9"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-4">
          <TabsTrigger value="active">
            Active
            {personalizationRequests && (
              <Badge variant="outline" className="ml-2">
                {personalizationRequests.filter(r => !["completed", "cancelled"].includes(r.status)).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed
            {personalizationRequests && (
              <Badge variant="outline" className="ml-2">
                {personalizationRequests.filter(r => r.status === "completed").length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled
            {personalizationRequests && (
              <Badge variant="outline" className="ml-2">
                {personalizationRequests.filter(r => r.status === "cancelled").length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="mt-0">
          <RequestsGrid 
            requests={filteredRequests} 
            isLoading={isLoading} 
            isError={isError} 
            formatStatus={formatStatus}
          />
        </TabsContent>
        
        <TabsContent value="completed" className="mt-0">
          <RequestsGrid 
            requests={filteredRequests} 
            isLoading={isLoading} 
            isError={isError} 
            formatStatus={formatStatus}
          />
        </TabsContent>
        
        <TabsContent value="cancelled" className="mt-0">
          <RequestsGrid 
            requests={filteredRequests} 
            isLoading={isLoading} 
            isError={isError} 
            formatStatus={formatStatus}
          />
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}

type RequestsGridProps = {
  requests: PersonalizationRequest[];
  isLoading: boolean;
  isError: boolean;
  formatStatus: (status: string) => { label: string; color: string };
};

const RequestsGrid = ({ requests, isLoading, isError, formatStatus }: RequestsGridProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="text-center p-6 border rounded-lg bg-destructive/10 text-destructive">
        <p>Failed to load personalization requests. Please try again.</p>
      </div>
    );
  }
  
  if (requests.length === 0) {
    return (
      <div className="text-center p-6 border rounded-lg">
        <p className="text-muted-foreground">No personalization requests found.</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {requests.map(request => (
        <RequestCard key={request.id} request={request} formatStatus={formatStatus} />
      ))}
    </div>
  );
};

type RequestCardProps = {
  request: PersonalizationRequest;
  formatStatus: (status: string) => { label: string; color: string };
};

const RequestCard = ({ request, formatStatus }: RequestCardProps) => {
  const status = formatStatus(request.status);
  const dateTimeFormatOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base">Request #{request.id}</CardTitle>
            <CardDescription>
              {request.createdAt 
                ? formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })
                : "Date unknown"}
            </CardDescription>
          </div>
          <Badge className={status.color}>{status.label}</Badge>
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
            <div className="text-sm">{request.personalizationType}</div>
          </div>
        </div>
        
        <SelectSeparator />
        
        <Button className="w-full" variant="outline" asChild>
          <a href={`/admin/personalizations/${request.id}`}>View Details</a>
        </Button>
      </CardContent>
    </Card>
  );
};
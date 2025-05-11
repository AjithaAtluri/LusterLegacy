import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/admin-layout";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface PersonalizationRequest {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  country: string | null;
  productId: number;
  productName: string;
  originalMetalType: string;
  requestedMetalType: string;
  originalStoneType: string;
  requestedStoneType: string;
  additionalNotes: string | null;
  personalizationType: string;
  preferredMetal: string;
  preferredStones: string[];
  personalizationDetails: string;
  status: string;
  quotedPrice: number | null;
  currency: string | null;
  imageUrls: string[] | null;
  productImageUrl?: string | null;
  createdAt: string;
}

export default function PersonalizationsPage() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortedRequests, setSortedRequests] = useState<PersonalizationRequest[]>([]);

  // Fetch personalization requests
  const { data: requests, isLoading, isError } = useQuery({
    queryKey: ["/api/personalization-requests"],
    queryFn: async () => {
      const res = await fetch("/api/personalization-requests");
      if (!res.ok) {
        throw new Error("Failed to fetch personalization requests");
      }
      return res.json();
    }
  });

  useEffect(() => {
    if (!requests) return;

    // Filter and sort the requests
    let filtered = [...requests];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((request: PersonalizationRequest) => {
        return (
          request.fullName.toLowerCase().includes(term) ||
          request.email.toLowerCase().includes(term) ||
          request.productName.toLowerCase().includes(term) ||
          (request.additionalNotes && request.additionalNotes.toLowerCase().includes(term))
        );
      });
    }

    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((request: PersonalizationRequest) => {
        return request.status === filterStatus;
      });
    }

    // Sort by creation date (most recent first)
    filtered = filtered.sort((a: PersonalizationRequest, b: PersonalizationRequest) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    setSortedRequests(filtered);
  }, [requests, searchTerm, filterStatus]);

  // Format status for display
  const formatStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return { label: "Pending", color: "bg-yellow-500 text-white" };
      case "in_progress":
        return { label: "In Progress", color: "bg-blue-500 text-white" };
      case "completed":
        return { label: "Completed", color: "bg-green-500 text-white" };
      case "cancelled":
        return { label: "Cancelled", color: "bg-gray-500 text-white" };
      case "approved":
        return { label: "Approved", color: "bg-emerald-500 text-white" };
      case "rejected":
        return { label: "Rejected", color: "bg-red-500 text-white" };
      case "waiting_for_payment":
        return { label: "Waiting for Payment", color: "bg-purple-500 text-white" };
      case "in_production":
        return { label: "In Production", color: "bg-indigo-500 text-white" };
      case "shipped":
        return { label: "Shipped", color: "bg-teal-500 text-white" };
      case "delivered":
        return { label: "Delivered", color: "bg-green-700 text-white" };
      default:
        return { label: status, color: "bg-gray-500 text-white" };
    }
  };

  return (
    <AdminLayout title="Personalization Requests">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search requests..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              className="border rounded-md p-2 text-sm bg-background"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
              <option value="waiting_for_payment">Waiting for Payment</option>
              <option value="in_production">In Production</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
        </div>

        <Tabs defaultValue="grid" className="w-full">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="grid">Grid View</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
            </TabsList>
            <div className="text-sm text-muted-foreground">
              {sortedRequests ? `${sortedRequests.length} requests found` : "Loading..."}
            </div>
          </div>

          <TabsContent value="grid" className="mt-4">
            <RequestsGrid 
              requests={sortedRequests} 
              isLoading={isLoading} 
              isError={isError}
              formatStatus={formatStatus}
            />
          </TabsContent>

          <TabsContent value="list" className="mt-4">
            <div className="rounded-md border">
              <div className="grid grid-cols-7 px-4 py-3 bg-muted/50 text-sm font-medium">
                <div>Customer</div>
                <div>Product</div>
                <div>Type</div>
                <div>Date</div>
                <div>Status</div>
                <div>Price Quote</div>
                <div></div>
              </div>
              <Separator />
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="grid grid-cols-7 px-4 py-4 items-center">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-8 w-20 ml-auto" />
                  </div>
                ))
              ) : isError ? (
                <div className="px-4 py-8 text-center text-muted-foreground">
                  Failed to load personalization requests
                </div>
              ) : sortedRequests && sortedRequests.length > 0 ? (
                sortedRequests.map((r) => (
                  <div key={r.id} className="grid grid-cols-7 px-4 py-4 items-center hover:bg-muted/30">
                    <div className="truncate">
                      <div className="font-medium truncate">{r.fullName}</div>
                      <div className="text-xs text-muted-foreground truncate">{r.email}</div>
                    </div>
                    <div className="truncate">{r.productName}</div>
                    <div className="capitalize">{r.personalizationType.replace(/_/g, ' ')}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                    </div>
                    <div>
                      <Badge className={formatStatus(r.status).color}>
                        {formatStatus(r.status).label}
                      </Badge>
                    </div>
                    <div>
                      {r.quotedPrice ? (
                        <span className="font-medium">
                          {r.currency === 'USD' ? '$' : '₹'}{r.quotedPrice.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Not quoted</span>
                      )}
                    </div>
                    <div className="flex justify-end">
                      <Button 
                        size="sm" 
                        onClick={() => setLocation(`/admin/personalizations/${r.id}`)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-muted-foreground">
                  No personalization requests found
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
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
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array(6).fill(0).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent className="pb-2">
              <Skeleton className="h-24 w-full mb-2" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            </CardContent>
            <CardFooter>
              <Skeleton className="h-9 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        Failed to load personalization requests. Please try again later.
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No personalization requests found
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {requests.map((request) => (
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
  const [, setLocation] = useLocation();
  const status = formatStatus(request.status);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg truncate">{request.fullName}</CardTitle>
          <Badge className={status.color}>{status.label}</Badge>
        </div>
        <CardDescription className="truncate">
          {request.email} • {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 pb-2">
        <div className="rounded-md overflow-hidden relative h-24 bg-muted">
          {request.productImageUrl ? (
            <img 
              src={request.productImageUrl} 
              alt={request.productName} 
              className="object-cover w-full h-full"
            />
          ) : request.imageUrls && request.imageUrls.length > 0 ? (
            <img 
              src={request.imageUrls[0]} 
              alt="Personalization request" 
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No image available
            </div>
          )}
        </div>
        <div>
          <h4 className="font-medium truncate">{request.productName}</h4>
          <p className="text-sm text-muted-foreground truncate capitalize">
            {request.personalizationType.replace(/_/g, ' ')}
          </p>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {request.requestedMetalType} • {request.requestedStoneType}
          </span>
          {request.quotedPrice ? (
            <span className="font-medium">
              {request.currency === 'USD' ? '$' : '₹'}{request.quotedPrice.toLocaleString()}
            </span>
          ) : null}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          variant="default"
          onClick={() => setLocation(`/admin/personalizations/${request.id}`)}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};
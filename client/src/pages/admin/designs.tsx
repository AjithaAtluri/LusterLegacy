import { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import AdminLayout from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { Loader2, Search, Download, Eye } from "lucide-react";

// Define interfaces
interface DesignComment {
  id: number;
  content: string;
  createdAt: string;
  imageUrl?: string;
  isAdmin: boolean;
}

interface CustomDesign {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  country?: string;
  metalType: string;
  primaryStone?: string;
  primaryStones?: string[];
  notes?: string;
  imageUrl: string;
  imageUrls?: string[];
  status: string;
  estimatedPrice?: number;
  cadImageUrl?: string;
  consultationFeePaid: boolean;
  createdAt: string;
  comments?: DesignComment[];
}

export default function AdminDesigns() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  
  // Get URL search params
  const params = new URLSearchParams(window.location.search);
  const userIdParam = params.get('userId');
  
  // Fetch design requests
  const { data: designs, isLoading } = useQuery({
    queryKey: ['/api/custom-designs'],
  });
  
  // Filter designs by search query, status, and userId
  const filteredDesigns = designs?.filter(design => {
    // Filter by search query
    const matchesSearch = !searchQuery || 
      design.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      design.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      design.id.toString().includes(searchQuery);
    
    // Filter by status
    const matchesStatus = statusFilter === "all" || design.status === statusFilter;
    
    // Filter by userId if present in URL
    const matchesUserId = !userIdParam || design.userId === parseInt(userIdParam);
    
    return matchesSearch && matchesStatus && matchesUserId;
  });
  
  // Sort designs
  const sortedDesigns = filteredDesigns?.sort((a, b) => {
    if (sortOrder === "newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortOrder === "oldest") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return 0;
  });
  
  // Helper function to get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-orange-500";
      case "quoted":
        return "bg-blue-500";
      case "approved":
        return "bg-green-500";
      case "rejected":
        return "bg-red-500";
      case "completed":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };
  
  return (
    <AdminLayout title="Custom Design Requests">
      <Helmet>
        <title>Design Requests | Luster Legacy Admin</title>
      </Helmet>
      
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6">
        <div>
          <h1 className="font-playfair text-2xl font-bold tracking-tight">Custom Design Requests</h1>
          <p className="text-muted-foreground">
            Manage and respond to custom design requests from customers
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button variant="outline">
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
              placeholder="Search by name, email or request ID..."
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
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Status Tabs */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="all">All Requests</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="quoted">Quoted</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Design Requests Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : sortedDesigns && sortedDesigns.length > 0 ? (
        <div className="rounded-md border">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead>
                <tr className="border-b transition-colors hover:bg-muted/10">
                  <th className="h-12 px-4 text-left font-medium">ID</th>
                  <th className="h-12 px-4 text-left font-medium">Customer</th>
                  <th className="h-12 px-4 text-left font-medium">Design</th>
                  <th className="h-12 px-4 text-left font-medium">Submitted</th>
                  <th className="h-12 px-4 text-left font-medium">Status</th>
                  <th className="h-12 px-4 text-left font-medium">Price</th>
                  <th className="h-12 px-4 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedDesigns.map(design => (
                  <tr key={design.id} className="border-b transition-colors hover:bg-muted/20">
                    <td className="p-4 font-medium">#{design.id}</td>
                    <td className="p-4">
                      <div>{design.fullName}</div>
                      <div className="text-xs text-muted-foreground">{design.email}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded overflow-hidden bg-muted mr-2">
                          <img 
                            src={design.imageUrl} 
                            alt="Design reference" 
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <div>{design.metalType}</div>
                          <div className="text-xs text-muted-foreground">
                            {design.primaryStones && design.primaryStones.length > 0
                              ? design.primaryStones.join(', ')
                              : design.primaryStone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {new Date(design.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <Badge className={`${getStatusColor(design.status)} text-white`}>
                        {design.status.charAt(0).toUpperCase() + design.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="p-4 font-medium">
                      {design.estimatedPrice ? formatCurrency(design.estimatedPrice) : "Not quoted"}
                    </td>
                    <td className="p-4">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/designs/${design.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-24 border rounded-lg bg-muted/10">
          <h3 className="font-playfair text-lg font-medium mb-1">No design requests found</h3>
          <p className="text-muted-foreground">
            {searchQuery || statusFilter !== "all"
              ? "No design requests match your search criteria. Try different filters."
              : "Design requests will appear here when customers submit them."}
          </p>
        </div>
      )}
    </AdminLayout>
  );
}

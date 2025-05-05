import { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { 
  Check, 
  X, 
  MoreHorizontal, 
  Star, 
  Image,
  Eye,
  Search,
  Loader2,
  ExternalLink
} from "lucide-react";
import { Testimonial } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { ClientStoryGrid } from "@/components/client-stories/client-story-grid";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

// Helper function to format dates
function formatDate(date: string | Date | null): string {
  if (!date) return "Unknown";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminTestimonials() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewStory, setViewStory] = useState<Testimonial | null>(null);
  
  // Fetch all testimonials (both approved and pending)
  const { data: testimonials, isLoading } = useQuery({
    queryKey: ["/api/admin/testimonials"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/testimonials");
      if (!res.ok) {
        throw new Error("Failed to fetch testimonials");
      }
      return res.json();
    },
  });
  
  // Approve testimonial mutation
  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PUT", `/api/admin/testimonials/${id}/approve`);
      if (!res.ok) {
        throw new Error("Failed to approve testimonial");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Testimonial approved and published",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/testimonials"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Reject testimonial mutation
  const rejectMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PUT", `/api/admin/testimonials/${id}/reject`);
      if (!res.ok) {
        throw new Error("Failed to reject testimonial");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Testimonial has been rejected",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete testimonial mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/testimonials/${id}`);
      if (!res.ok) {
        throw new Error("Failed to delete testimonial");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Testimonial has been deleted",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/testimonials"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Filter testimonials based on status and search query
  const getPendingTestimonials = () => {
    if (!testimonials) return [];
    
    return testimonials
      .filter((testimonial: Testimonial) => !testimonial.isApproved)
      .filter((testimonial: Testimonial) => 
        searchQuery === "" || 
        testimonial.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        testimonial.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (testimonial.story && testimonial.story.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (testimonial.productType && testimonial.productType.toLowerCase().includes(searchQuery.toLowerCase()))
      );
  };
  
  const getApprovedTestimonials = () => {
    if (!testimonials) return [];
    
    return testimonials
      .filter((testimonial: Testimonial) => testimonial.isApproved)
      .filter((testimonial: Testimonial) => 
        searchQuery === "" || 
        testimonial.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        testimonial.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (testimonial.story && testimonial.story.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (testimonial.productType && testimonial.productType.toLowerCase().includes(searchQuery.toLowerCase()))
      );
  };
  
  // Calculate counts
  const pendingCount = testimonials 
    ? testimonials.filter((t: Testimonial) => !t.isApproved).length
    : 0;
    
  const approvedCount = testimonials
    ? testimonials.filter((t: Testimonial) => t.isApproved).length
    : 0;
  
  // View story dialog
  const renderViewDialog = () => {
    if (!viewStory) return null;
    
    return (
      <Dialog open={!!viewStory} onOpenChange={() => setViewStory(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Client Story Details</DialogTitle>
            <DialogDescription>
              Full details of the client story
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Client Name</Label>
                <div className="font-medium">{viewStory.name}</div>
              </div>
              
              <div>
                <Label>Product Type</Label>
                <div className="font-medium">{viewStory.productType || "Not specified"}</div>
              </div>
              
              <div>
                <Label>Rating</Label>
                <div className="font-medium flex items-center">
                  {viewStory.rating} / 5
                  <div className="flex ml-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < viewStory.rating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div>
                <Label>Location</Label>
                <div className="font-medium">{viewStory.location || "Not specified"}</div>
              </div>
              
              <div>
                <Label>Submitted On</Label>
                <div className="font-medium">{formatDate(viewStory.createdAt)}</div>
              </div>
              
              <div>
                <Label>Status</Label>
                <div className="font-medium">
                  {viewStory.isApproved ? (
                    <Badge className="bg-green-600 hover:bg-green-700">Approved</Badge>
                  ) : (
                    <Badge variant="outline">Pending</Badge>
                  )}
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <Label>Brief Testimonial</Label>
              <div className="mt-2 p-3 bg-muted/40 rounded-md">
                {viewStory.text}
              </div>
            </div>
            
            {viewStory.story && (
              <div>
                <Label>Full Story</Label>
                <div className="mt-2 p-3 bg-muted/40 rounded-md">
                  {viewStory.story}
                </div>
              </div>
            )}
            
            {viewStory.imageUrls && viewStory.imageUrls.length > 0 && (
              <div>
                <Label>Images ({viewStory.imageUrls.length})</Label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {viewStory.imageUrls.map((url, index) => (
                    <a 
                      key={index} 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="relative overflow-hidden rounded-md aspect-square group"
                    >
                      <img src={url} alt={`Customer upload ${index + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ExternalLink className="text-white h-5 w-5" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            {!viewStory.isApproved ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setViewStory(null)}
                  className="mr-auto"
                >
                  Close
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    rejectMutation.mutate(viewStory.id);
                    setViewStory(null);
                  }}
                  disabled={rejectMutation.isPending}
                >
                  {rejectMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <X className="mr-2 h-4 w-4" />
                      Reject
                    </>
                  )}
                </Button>
                <Button 
                  onClick={() => {
                    approveMutation.mutate(viewStory.id);
                    setViewStory(null);
                  }}
                  disabled={approveMutation.isPending}
                >
                  {approveMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Approve
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setViewStory(null)}
                  className="mr-auto"
                >
                  Close
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    deleteMutation.mutate(viewStory.id);
                    setViewStory(null);
                  }}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "Delete"
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };
  
  return (
    <AdminLayout title="Client Stories">
      <Helmet>
        <title>Manage Client Stories | Admin | Luster Legacy</title>
      </Helmet>
      
      <div className="container py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Client Stories</h1>
          
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search stories..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <Tabs defaultValue="pending">
          <TabsList className="mb-4">
            <TabsTrigger value="pending">
              Pending Review
              {pendingCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved
              {approvedCount > 0 && (
                <Badge variant="outline" className="ml-2">
                  {approvedCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="preview">
              Preview
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Client Stories</CardTitle>
                <CardDescription>
                  Review and approve client testimonials before they appear on the website
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : getPendingTestimonials().length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No pending client stories found
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Product Type</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Testimonial</TableHead>
                        <TableHead>Images</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getPendingTestimonials().map((testimonial: Testimonial) => (
                        <TableRow key={testimonial.id}>
                          <TableCell className="font-medium">{testimonial.name}</TableCell>
                          <TableCell>{testimonial.productType || "—"}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {testimonial.rating}/5
                              <Star className="h-3 w-3 text-yellow-400 fill-yellow-400 ml-1" />
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {testimonial.text}
                          </TableCell>
                          <TableCell>
                            {testimonial.imageUrls && testimonial.imageUrls.length > 0 ? (
                              <Badge variant="outline">
                                <Image className="h-3 w-3 mr-1" />
                                {testimonial.imageUrls.length}
                              </Badge>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell>{formatDate(testimonial.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setViewStory(testimonial)}
                              >
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View</span>
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => rejectMutation.mutate(testimonial.id)}
                                disabled={rejectMutation.isPending}
                              >
                                {rejectMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <X className="h-4 w-4" />
                                )}
                                <span className="sr-only">Reject</span>
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => approveMutation.mutate(testimonial.id)}
                                disabled={approveMutation.isPending}
                                className="text-primary"
                              >
                                {approveMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                                <span className="sr-only">Approve</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="approved" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Approved Client Stories</CardTitle>
                <CardDescription>
                  Client testimonials that have been approved and are visible on the website
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : getApprovedTestimonials().length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No approved client stories found
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Product Type</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Testimonial</TableHead>
                        <TableHead>Images</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getApprovedTestimonials().map((testimonial: Testimonial) => (
                        <TableRow key={testimonial.id}>
                          <TableCell className="font-medium">{testimonial.name}</TableCell>
                          <TableCell>{testimonial.productType || "—"}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {testimonial.rating}/5
                              <Star className="h-3 w-3 text-yellow-400 fill-yellow-400 ml-1" />
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {testimonial.text}
                          </TableCell>
                          <TableCell>
                            {testimonial.imageUrls && testimonial.imageUrls.length > 0 ? (
                              <Badge variant="outline">
                                <Image className="h-3 w-3 mr-1" />
                                {testimonial.imageUrls.length}
                              </Badge>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell>{formatDate(testimonial.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setViewStory(testimonial)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View details
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => deleteMutation.mutate(testimonial.id)}
                                  className="text-destructive"
                                >
                                  <X className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <CardTitle>Website Preview</CardTitle>
                <CardDescription>
                  This is how the client stories appear on the website
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ClientStoryGrid 
                  stories={getApprovedTestimonials()} 
                  isLoading={isLoading}
                  emptyMessage="No approved client stories yet"
                  showEmpty={true}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {renderViewDialog()}
    </AdminLayout>
  );
}
import { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import AdminLayout from "@/components/admin/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Check,
  X,
  Loader2,
  Star,
  UserCircle,
  Image as ImageIcon,
  Clock,
  CheckCircle2,
  MessageSquare
} from "lucide-react";

export default function AdminTestimonials() {
  const { toast } = useToast();
  const [selectedTestimonial, setSelectedTestimonial] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch testimonials data
  const { data: testimonials, isLoading: isLoadingTestimonials } = useQuery({
    queryKey: ['/api/admin/testimonials']
  });

  // Approve testimonial mutation
  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      // Add admin headers to ensure proper authorization
      const options = {
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Debug-Auth': 'true',
          'X-Admin-API-Key': 'dev_admin_key_12345',
          'X-Admin-Username': 'admin'
        }
      };
      
      const response = await apiRequest(
        "PUT", 
        `/api/admin/testimonials/${id}/approve`, 
        null, 
        options
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Testimonial approved",
        description: "The testimonial has been approved and is now visible on the website.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/testimonials'] });
      setDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to approve testimonial. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Reject testimonial mutation
  const rejectMutation = useMutation({
    mutationFn: async (id: number) => {
      // Add admin headers to ensure proper authorization
      const options = {
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Debug-Auth': 'true',
          'X-Admin-API-Key': 'dev_admin_key_12345',
          'X-Admin-Username': 'admin'
        }
      };
      
      const response = await apiRequest(
        "PUT", 
        `/api/admin/testimonials/${id}/reject`, 
        null, 
        options
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Testimonial rejected",
        description: "The testimonial has been rejected and removed from the system.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/testimonials'] });
      setDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to reject testimonial. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Delete testimonial mutation (for deleting approved testimonials)
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      // Add admin headers to ensure proper authorization
      const options = {
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Debug-Auth': 'true',
          'X-Admin-API-Key': 'dev_admin_key_12345',
          'X-Admin-Username': 'admin'
        }
      };
      
      const response = await apiRequest(
        "DELETE", 
        `/api/admin/testimonials/${id}`, 
        null, 
        options
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Testimonial deleted",
        description: "The testimonial has been permanently deleted from the system.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/testimonials'] });
      setDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete testimonial. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Filter testimonials by approval status
  const pendingTestimonials = Array.isArray(testimonials) 
    ? testimonials.filter(t => !t.isApproved)
    : [];
    
  const approvedTestimonials = Array.isArray(testimonials) 
    ? testimonials.filter(t => t.isApproved)
    : [];

  const handleOpenDialog = (testimonial: any) => {
    setSelectedTestimonial(testimonial);
    setDialogOpen(true);
  };

  const handleApprove = () => {
    if (selectedTestimonial) {
      approveMutation.mutate(selectedTestimonial.id);
    }
  };

  const handleReject = () => {
    if (selectedTestimonial) {
      rejectMutation.mutate(selectedTestimonial.id);
    }
  };
  
  const handleDelete = () => {
    if (selectedTestimonial) {
      if (window.confirm(`Are you sure you want to permanently delete this testimonial from ${selectedTestimonial.name}?`)) {
        deleteMutation.mutate(selectedTestimonial.id);
      }
    }
  };

  if (isLoadingTestimonials) {
    return (
      <AdminLayout title="Client Stories">
        <Helmet>
          <title>Client Stories | Luster Legacy Admin</title>
        </Helmet>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Client Stories">
      <Helmet>
        <title>Client Stories | Luster Legacy Admin</title>
      </Helmet>
      
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Client Stories</h1>
          <p className="text-muted-foreground">
            Manage customer testimonials and client stories
          </p>
        </div>
        
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">Pending Approval ({pendingTestimonials.length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({approvedTestimonials.length})</TabsTrigger>
          </TabsList>
          
          {/* Pending Testimonials Tab */}
          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Client Stories</CardTitle>
                <CardDescription>
                  Client stories waiting for your approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingTestimonials.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                    <p>No pending testimonials to approve</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {pendingTestimonials.map((testimonial) => (
                      <div 
                        key={testimonial.id} 
                        className="border rounded-lg p-4 hover:bg-accent/20 transition-colors cursor-pointer"
                        onClick={() => handleOpenDialog(testimonial)}
                      >
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                              {testimonial.imageUrls && testimonial.imageUrls.length > 0 ? (
                                <img 
                                  src={testimonial.imageUrls[0]} 
                                  alt="Customer" 
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <UserCircle className="h-8 w-8 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium">
                                {testimonial.name}
                                <Badge className="ml-2 bg-orange-500 text-white">Pending</Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {testimonial.location || "Unknown location"} • {new Date(testimonial.createdAt).toLocaleDateString()}
                              </div>
                              <div className="flex items-center mt-1">
                                <span className="text-sm mr-1">Rating: {testimonial.rating}/5</span>
                                <div className="flex">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-3 w-3 ${
                                        i < testimonial.rating
                                          ? "text-yellow-400 fill-yellow-400"
                                          : "text-gray-300"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="md:ml-auto flex gap-2 mt-2 md:mt-0">
                            {testimonial.imageUrls && testimonial.imageUrls.length > 0 && (
                              <Badge variant="outline" className="gap-1">
                                <ImageIcon className="h-3 w-3" />
                                {testimonial.imageUrls.length} {testimonial.imageUrls.length === 1 ? "Image" : "Images"}
                              </Badge>
                            )}
                            <Badge variant="outline" className="gap-1">
                              <Clock className="h-3 w-3" />
                              New
                            </Badge>
                          </div>
                        </div>
                        <div className="mt-3 text-sm line-clamp-2">
                          {testimonial.text || testimonial.story || "No testimonial content"}
                        </div>
                        <div className="flex justify-end mt-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDialog(testimonial);
                            }}
                          >
                            Review
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Approved Testimonials Tab */}
          <TabsContent value="approved" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Approved Client Stories</CardTitle>
                <CardDescription>
                  Client stories currently displayed on the website
                </CardDescription>
              </CardHeader>
              <CardContent>
                {approvedTestimonials.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                    <p>No approved testimonials yet</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {approvedTestimonials.map((testimonial) => (
                      <div 
                        key={testimonial.id} 
                        className="border rounded-lg p-4 hover:bg-accent/20 transition-colors cursor-pointer"
                        onClick={() => handleOpenDialog(testimonial)}
                      >
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                              {testimonial.imageUrls && testimonial.imageUrls.length > 0 ? (
                                <img 
                                  src={testimonial.imageUrls[0]} 
                                  alt="Customer" 
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <UserCircle className="h-8 w-8 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium">
                                {testimonial.name}
                                <Badge className="ml-2 bg-green-500 text-white">Approved</Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {testimonial.location || "Unknown location"} • {new Date(testimonial.createdAt).toLocaleDateString()}
                              </div>
                              <div className="flex items-center mt-1">
                                <span className="text-sm mr-1">Rating: {testimonial.rating}/5</span>
                                <div className="flex">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-3 w-3 ${
                                        i < testimonial.rating
                                          ? "text-yellow-400 fill-yellow-400"
                                          : "text-gray-300"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="md:ml-auto flex gap-2 mt-2 md:mt-0">
                            {testimonial.imageUrls && testimonial.imageUrls.length > 0 && (
                              <Badge variant="outline" className="gap-1">
                                <ImageIcon className="h-3 w-3" />
                                {testimonial.imageUrls.length} {testimonial.imageUrls.length === 1 ? "Image" : "Images"}
                              </Badge>
                            )}
                            <Badge variant="outline" className="gap-1 bg-green-50">
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                              Approved
                            </Badge>
                          </div>
                        </div>
                        <div className="mt-3 text-sm line-clamp-2">
                          {testimonial.text || testimonial.story || "No testimonial content"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Detail Dialog */}
      {selectedTestimonial && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Client Story Review</DialogTitle>
              <DialogDescription>
                Review this client's testimonial before approving or rejecting it.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Customer Info */}
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                  {selectedTestimonial.imageUrls && selectedTestimonial.imageUrls.length > 0 ? (
                    <img 
                      src={selectedTestimonial.imageUrls[0]} 
                      alt="Customer" 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserCircle className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-medium">{selectedTestimonial.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedTestimonial.location || "Unknown location"}
                  </p>
                  <div className="flex items-center mt-1">
                    <span className="text-sm mr-1">Rating: {selectedTestimonial.rating}/5</span>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < selectedTestimonial.rating
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Product Information */}
              <div>
                <h4 className="text-sm font-medium mb-1">Product Information</h4>
                <div className="text-sm bg-muted p-2 rounded">
                  <div><span className="font-medium">Product Type:</span> {selectedTestimonial.productType || "Not specified"}</div>
                  <div><span className="font-medium">Purchase Type:</span> {selectedTestimonial.purchaseType === "self" ? "For myself" : 
                    selectedTestimonial.purchaseType === "gift_for" ? "As a gift for someone" : 
                    selectedTestimonial.purchaseType === "gift_from" ? "As a gift from someone" : 
                    "Not specified"}
                  </div>
                  {selectedTestimonial.occasion && (
                    <div><span className="font-medium">Occasion:</span> {selectedTestimonial.occasion}</div>
                  )}
                </div>
              </div>
              
              {/* Images */}
              {selectedTestimonial.imageUrls && selectedTestimonial.imageUrls.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Uploaded Images</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {selectedTestimonial.imageUrls.map((imageUrl: string, idx: number) => (
                      <div key={idx} className="aspect-square rounded-md overflow-hidden border">
                        <img 
                          src={imageUrl} 
                          alt={`Customer upload ${idx + 1}`} 
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Generated Testimonials */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Brief Testimonial</h4>
                  <div className="bg-accent/20 p-3 rounded-md text-sm">
                    {selectedTestimonial.text || "No brief testimonial available"}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Full Testimonial</h4>
                  <div className="bg-accent/20 p-3 rounded-md text-sm">
                    {selectedTestimonial.story || "No full testimonial available"}
                  </div>
                </div>
              </div>
              
              {/* Original Inputs */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-2">Customer Original Inputs</h4>
                <div className="space-y-2 text-sm">
                  {selectedTestimonial.designExperience && (
                    <div>
                      <span className="font-medium">Design Team Experience:</span> {selectedTestimonial.designExperience}
                    </div>
                  )}
                  {selectedTestimonial.overallExperience && (
                    <div>
                      <span className="font-medium">Overall Experience:</span> {selectedTestimonial.overallExperience}
                    </div>
                  )}
                  {selectedTestimonial.giftRecipient && (
                    <div>
                      <span className="font-medium">Gift Recipient:</span> {selectedTestimonial.giftRecipient}
                    </div>
                  )}
                  {selectedTestimonial.giftReaction && (
                    <div>
                      <span className="font-medium">Gift Reaction:</span> {selectedTestimonial.giftReaction}
                    </div>
                  )}
                  {selectedTestimonial.storyBehind && (
                    <div>
                      <span className="font-medium">Story Behind Purchase:</span> {selectedTestimonial.storyBehind}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end gap-2 mt-6">
                {!selectedTestimonial.isApproved ? (
                  <>
                    <Button 
                      variant="destructive" 
                      onClick={handleReject}
                      disabled={rejectMutation.isPending}
                    >
                      {rejectMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <X className="h-4 w-4 mr-2" />
                      )}
                      Reject
                    </Button>
                    <Button 
                      variant="default" 
                      onClick={handleApprove}
                      disabled={approveMutation.isPending}
                    >
                      {approveMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      Approve
                    </Button>
                  </>
                ) : (
                  <Button 
                    variant="destructive" 
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <X className="h-4 w-4 mr-2" />
                    )}
                    Delete Testimonial
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AdminLayout>
  );
}
import { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/admin-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { 
  Loader2, 
  MessageCircle, 
  ImageIcon, 
  X, 
  FileImage, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  User, 
  Mail,
  ChevronLeft
} from "lucide-react";

export default function DesignDetailPage() {
  const { id } = useParams();
  const [_, navigate] = useLocation();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState("");
  const [cadImageUrl, setCadImageUrl] = useState("");
  const [status, setStatus] = useState("");
  const [newComment, setNewComment] = useState("");
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("info");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch design request data
  const { data: design, isLoading, error } = useQuery({
    queryKey: [`/api/custom-designs/${id}`],
    enabled: !!id,
  });
  
  // Update state when design data is loaded
  useEffect(() => {
    if (design) {
      setEstimatedPrice(design.estimatedPrice?.toString() || "");
      setCadImageUrl(design.cadImageUrl || "");
      setStatus(design.status || "pending");
    }
  }, [design]);

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
      const updateData = {
        status,
        estimatedPrice: estimatedPrice ? parseInt(estimatedPrice) : null,
        cadImageUrl: cadImageUrl || null
      };
      
      await apiRequest("PUT", `/api/custom-designs/${id}`, updateData);
      
      toast({
        title: "Design request updated",
        description: "The design request has been updated successfully"
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/custom-designs/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/custom-designs'] });
      
    } catch (error) {
      console.error("Error updating design request:", error);
      toast({
        title: "Update failed",
        description: "Failed to update design request",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.type.match('image.*')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive"
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image must be less than 5MB",
          variant: "destructive"
        });
        return;
      }
      
      setUploadedImage(file);
      
      // Create image preview
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleRemoveImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const triggerImageUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleCommentSubmit = async () => {
    if (!newComment.trim() && !uploadedImage) return;
    
    setIsSubmittingComment(true);
    
    try {
      // Create form data to support file upload
      const formData = new FormData();
      
      if (newComment.trim()) {
        formData.append("content", newComment);
      }
      
      if (uploadedImage) {
        formData.append("image", uploadedImage);
      }
      
      // Send request with formData
      const response = await fetch(`/api/custom-designs/${id}/comments`, {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error("Failed to send message");
      }
      
      toast({
        title: uploadedImage ? "Message with image sent" : "Message sent",
        description: "Your message has been added to the conversation"
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/custom-designs/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/custom-designs'] });
      
      // Clear comment field and image
      setNewComment("");
      setUploadedImage(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Message failed",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[70vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  // Error state
  if (error || !design) {
    return (
      <AdminLayout>
        <div className="container mx-auto p-6">
          <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md">
            <h2 className="font-bold text-lg mb-2">Error Loading Design Request</h2>
            <p>We couldn't load the design request details. Please try again later or contact support.</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => navigate('/admin/designs')}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Design Requests
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Helmet>
        <title>Design Request #{id} | Admin Dashboard</title>
      </Helmet>
      
      <div className="container px-6 max-w-7xl">
        {/* Breadcrumb Navigation */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin/designs">Design Requests</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink>Request #{id}</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              Design Request #{id}
            </h1>
            <p className="text-muted-foreground">
              Submitted on {formatDate(design.createdAt)} by {design.fullName}
            </p>
          </div>
          
          <Badge className={`${getStatusColor(design.status)} text-white px-3 py-1`}>
            {design.status.charAt(0).toUpperCase() + design.status.slice(1)}
          </Badge>
        </div>
        
        {/* Main Content */}
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">
              <User className="h-4 w-4 mr-2" />
              Customer & Design Info
            </TabsTrigger>
            <TabsTrigger value="communication">
              <MessageCircle className="h-4 w-4 mr-2" />
              Communication
            </TabsTrigger>
            <TabsTrigger value="manage">
              <DollarSign className="h-4 w-4 mr-2" />
              Manage Request
            </TabsTrigger>
          </TabsList>
          
          {/* Tab 1: Customer & Design Info */}
          <TabsContent value="info" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div>
                      <div className="font-medium">Name</div>
                      <div>{design.fullName}</div>
                    </div>
                    <div>
                      <div className="font-medium">Email</div>
                      <div>{design.email}</div>
                    </div>
                    {design.phone && (
                      <div>
                        <div className="font-medium">Phone</div>
                        <div>{design.phone}</div>
                      </div>
                    )}
                    {design.country && (
                      <div>
                        <div className="font-medium">Country</div>
                        <div>{design.country}</div>
                      </div>
                    )}
                    <div>
                      <div className="font-medium">Submission Date</div>
                      <div>{formatDate(design.createdAt)}</div>
                    </div>
                    <div>
                      <div className="font-medium">Consultation Fee</div>
                      <div>
                        {design.consultationFeePaid ? (
                          <Badge className="bg-green-500 text-white">Paid</Badge>
                        ) : (
                          <Badge variant="outline" className="text-orange-500 border-orange-500">
                            Pending Payment
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Design Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle>Design Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="font-medium">Metal Type</div>
                    <div>{design.metalType}</div>
                  </div>
                  <div>
                    <div className="font-medium">Primary Stone{design.primaryStones && design.primaryStones.length > 1 ? 's' : ''}</div>
                    {design.primaryStones && design.primaryStones.length > 0 ? (
                      <div className="space-y-1">
                        {design.primaryStones.map((stone, index) => (
                          <div key={index} className="flex items-center">
                            <span className="inline-block h-2 w-2 rounded-full bg-primary/70 mr-2"></span>
                            {stone}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div>{design.primaryStone}</div> 
                    )}
                  </div>
                  {design.notes && (
                    <div>
                      <div className="font-medium">Additional Notes</div>
                      <div className="text-sm whitespace-pre-wrap">{design.notes}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Design Images */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Design References</CardTitle>
                  <CardDescription>
                    {design.imageUrls && design.imageUrls.length > 0 
                      ? `${design.imageUrls.length + 1} reference images provided` 
                      : 'Reference image provided by customer'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Main reference image */}
                    <div className="aspect-square rounded-md overflow-hidden relative">
                      <img 
                        src={design.imageUrl} 
                        alt="Main design reference" 
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute top-2 left-2 bg-primary/80 text-white text-xs px-2 py-1 rounded-md">
                        Main Image
                      </div>
                    </div>
                    
                    {/* Additional images */}
                    {design.imageUrls && design.imageUrls.map((imageUrl, index) => (
                      <div 
                        key={index}
                        className="aspect-square rounded-md overflow-hidden relative"
                      >
                        <img 
                          src={imageUrl} 
                          alt={`Design reference ${index + 1}`} 
                          className="object-cover w-full h-full"
                        />
                        <div className="absolute top-2 right-2 bg-background/80 text-xs px-2 py-1 rounded-md">
                          Image {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* CAD Preview (if available) */}
              {design.cadImageUrl && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>CAD Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-[500px] overflow-hidden rounded-md">
                      <img 
                        src={design.cadImageUrl} 
                        alt="CAD Model" 
                        className="object-contain w-full max-h-[500px]"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          
          {/* Tab 2: Communication */}
          <TabsContent value="communication" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Communication with Customer</CardTitle>
                <CardDescription>
                  {design.comments && design.comments.length > 0 
                    ? `${design.comments.length} messages in this conversation` 
                    : 'No messages yet'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[600px] overflow-y-auto p-2">
                  {/* Comments list */}
                  {design.comments && design.comments.length > 0 ? (
                    design.comments.map((comment, index) => (
                      <div 
                        key={index} 
                        className={`p-4 rounded-md ${
                          comment.isAdmin 
                            ? "bg-primary/10 ml-12" 
                            : "bg-muted mr-12"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium">{comment.isAdmin ? "Admin" : design.fullName}</span>
                          <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
                        </div>
                        
                        {/* Comment text */}
                        {comment.content && (
                          <p className="text-sm whitespace-pre-wrap mb-2">{comment.content}</p>
                        )}
                        
                        {/* Comment image (if any) */}
                        {comment.imageUrl && (
                          <div className="mt-2 max-w-[280px]">
                            <img 
                              src={comment.imageUrl} 
                              alt="Attached image" 
                              className="rounded-md border border-border max-h-[200px] object-contain"
                            />
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-foreground/60">
                      No messages yet. Use the form below to communicate with the customer.
                    </div>
                  )}
                </div>
              </CardContent>
              
              <Separator />
              
              {/* Comment Form */}
              <CardFooter className="pt-4">
                <div className="w-full space-y-3">
                  <Textarea 
                    placeholder="Add a comment or message for the customer..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  
                  {/* Hidden file input */}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                  />
                  
                  {/* Image preview */}
                  {imagePreview && (
                    <div className="relative w-24 h-24 overflow-hidden rounded-md border border-border mt-2">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-1 right-1 bg-background/80 rounded-full p-1"
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    {/* Image upload button */}
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={triggerImageUpload}
                      size="sm"
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Add Image
                    </Button>
                    
                    {/* Submit button */}
                    <Button 
                      onClick={handleCommentSubmit}
                      disabled={isSubmittingComment || (!newComment.trim() && !uploadedImage)}
                    >
                      {isSubmittingComment ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Tab 3: Manage Request */}
          <TabsContent value="manage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Update Status & Pricing</CardTitle>
                <CardDescription>
                  Update the design request status, provide CAD image URL and set the estimated price
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Request Status</Label>
                      <select
                        id="status"
                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="quoted">Quoted (CAD & Price Ready)</option>
                        <option value="approved">Approved by Customer</option>
                        <option value="rejected">Rejected by Customer</option>
                        <option value="completed">Completed</option>
                      </select>
                      
                      <div className="text-sm text-muted-foreground mt-1">
                        Current status: 
                        <Badge className={`${getStatusColor(design.status)} text-white ml-2`}>
                          {design.status.charAt(0).toUpperCase() + design.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cadImageUrl">CAD Image URL</Label>
                      <Input
                        id="cadImageUrl"
                        value={cadImageUrl}
                        onChange={(e) => setCadImageUrl(e.target.value)}
                        placeholder="https://example.com/cad-image.jpg"
                      />
                      <p className="text-sm text-muted-foreground">
                        Add a URL to the CAD render image for this design
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="estimatedPrice">Estimated Price (₹)</Label>
                      <Input
                        id="estimatedPrice"
                        type="number"
                        min={5000}
                        step={1000}
                        value={estimatedPrice}
                        onChange={(e) => setEstimatedPrice(e.target.value)}
                        placeholder="100000"
                      />
                      {estimatedPrice && (
                        <div className="text-sm text-muted-foreground">
                          Formatted: {formatCurrency(parseInt(estimatedPrice))}
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-8 bg-muted/30 p-4 rounded-md">
                      <h3 className="font-semibold mb-2">Payment Instructions</h3>
                      <p className="text-sm">
                        When the status is set to "Quoted", inform the customer that:
                      </p>
                      <ul className="text-sm list-disc ml-4 mt-2 space-y-1">
                        <li>50% advance payment is required to begin production</li>
                        <li>Remaining 50% is due before shipping</li>
                        <li>Payment is made offline through bank transfer</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end mt-4">
                  <Button 
                    onClick={handleUpdate} 
                    disabled={isUpdating}
                    className="w-full md:w-auto"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Update Design Request
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Request Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center mr-4 flex-shrink-0">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Design Request Submitted</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(design.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className={`h-10 w-10 rounded-full ${design.consultationFeePaid ? 'bg-green-500/20' : 'bg-muted'} flex items-center justify-center mr-4 flex-shrink-0`}>
                      <DollarSign className={`h-5 w-5 ${design.consultationFeePaid ? 'text-green-500' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <h3 className={`font-medium ${!design.consultationFeePaid && 'text-muted-foreground'}`}>
                        Consultation Fee {design.consultationFeePaid ? 'Paid' : 'Pending'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {design.consultationFeePaid 
                          ? "Customer has paid the consultation fee" 
                          : "Waiting for customer to pay consultation fee"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className={`h-10 w-10 rounded-full ${design.status === 'quoted' || design.status === 'approved' || design.status === 'completed' ? 'bg-blue-500/20' : 'bg-muted'} flex items-center justify-center mr-4 flex-shrink-0`}>
                      <FileImage className={`h-5 w-5 ${design.status === 'quoted' || design.status === 'approved' || design.status === 'completed' ? 'text-blue-500' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <h3 className={`font-medium ${!(design.status === 'quoted' || design.status === 'approved' || design.status === 'completed') && 'text-muted-foreground'}`}>
                        CAD Design & Quote
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {design.status === 'quoted' || design.status === 'approved' || design.status === 'completed'
                          ? `CAD design and quote provided (${formatCurrency(design.estimatedPrice || 0)})` 
                          : "CAD design and quote not yet provided"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className={`h-10 w-10 rounded-full ${design.status === 'approved' || design.status === 'completed' ? 'bg-green-500/20' : 'bg-muted'} flex items-center justify-center mr-4 flex-shrink-0`}>
                      <CheckCircle className={`h-5 w-5 ${design.status === 'approved' || design.status === 'completed' ? 'text-green-500' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <h3 className={`font-medium ${!(design.status === 'approved' || design.status === 'completed') && 'text-muted-foreground'}`}>
                        Customer Approval
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {design.status === 'approved' || design.status === 'completed'
                          ? "Customer has approved the design and quote" 
                          : "Waiting for customer approval"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
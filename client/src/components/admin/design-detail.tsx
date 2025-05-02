import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { Eye, Loader2, MessageCircle, ImageIcon, X } from "lucide-react";

interface DesignDetailProps {
  design: {
    id: number;
    fullName: string;
    email: string;
    phone: string | null;
    country: string | null;
    metalType: string;
    primaryStone: string;
    primaryStones?: string[];
    notes: string | null;
    imageUrl: string;
    imageUrls?: string[]; // Array of additional images
    status: string;
    estimatedPrice: number | null;
    cadImageUrl: string | null;
    createdAt: string;
    comments?: Array<{
      id: number;
      content: string;
      imageUrl?: string; // Image URL for comment
      createdAt: string;
      createdBy: string;
      isAdmin: boolean;
    }>;
  };
}

export default function DesignDetail({ design }: DesignDetailProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState(design.estimatedPrice?.toString() || "");
  const [cadImageUrl, setCadImageUrl] = useState(design.cadImageUrl || "");
  const [status, setStatus] = useState(design.status);
  const [newComment, setNewComment] = useState("");
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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
      
      await apiRequest("PUT", `/api/custom-designs/${design.id}`, updateData);
      
      toast({
        title: "Design request updated",
        description: "The design request has been updated successfully"
      });
      
      // Invalidate query to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/custom-designs'] });
      
      // Close dialog
      setIsOpen(false);
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
      const response = await fetch(`/api/custom-designs/${design.id}/comments`, {
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
      
      // Invalidate query to refresh data
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
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          View
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-playfair text-xl">Design Request #{design.id}</DialogTitle>
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
                  <div className="font-medium">Status</div>
                  <div className="mt-1">
                    <Badge className={`${getStatusColor(design.status)} text-white`}>
                      {design.status.charAt(0).toUpperCase() + design.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Design Images */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Design References</CardTitle>
              <CardDescription>
                {design.imageUrls && design.imageUrls.length > 0 
                  ? `${design.imageUrls.length} reference images provided` 
                  : 'Main reference image'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              {/* Main reference image */}
              <div className="aspect-square w-full rounded-md overflow-hidden relative mb-4">
                <img 
                  src={design.imageUrl} 
                  alt="Main design reference" 
                  className="object-cover w-full h-full"
                />
                <div className="absolute top-2 left-2 bg-primary/80 text-white text-xs px-2 py-1 rounded-md">
                  Main Image
                </div>
              </div>
              
              {/* Additional images gallery */}
              {design.imageUrls && design.imageUrls.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Additional Images</h4>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {design.imageUrls.map((imageUrl, index) => (
                      <div 
                        key={index}
                        className="border border-border rounded-md overflow-hidden aspect-square relative"
                      >
                        <img 
                          src={imageUrl} 
                          alt={`Design reference ${index + 1}`} 
                          className="object-cover w-full h-full"
                        />
                        <div className="absolute top-1 right-1 bg-background/80 text-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {(!design.imageUrls || design.imageUrls.length === 0) && (
                <div className="text-sm text-muted-foreground mt-2">
                  No additional reference images provided
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Design Preferences */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Design Preferences</CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="space-y-2">
                <div>
                  <div className="font-medium">Metal Type</div>
                  <div>{design.metalType}</div>
                </div>
                <div>
                  <div className="font-medium">Primary Stone{design.primaryStones && design.primaryStones.length > 1 ? 's' : ''}</div>
                  {design.primaryStones && design.primaryStones.length > 0 ? (
                    <div>
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
              </div>
            </CardContent>
          </Card>
          
          {/* CAD and Price */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">CAD Model & Pricing</CardTitle>
              <CardDescription>
                Update design status, provide CAD image URL and estimated price
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="quoted">Quoted</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cadImageUrl">CAD Image URL</Label>
                <Input
                  id="cadImageUrl"
                  value={cadImageUrl}
                  onChange={(e) => setCadImageUrl(e.target.value)}
                  placeholder="https://example.com/cad-image.jpg"
                />
              </div>
              
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
                    {formatCurrency(parseInt(estimatedPrice))}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
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
                  "Update Design Request"
                )}
              </Button>
            </CardFooter>
          </Card>
          
          {/* CAD Preview (if available) */}
          {design.cadImageUrl && (
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">CAD Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-hidden rounded-md">
                  <img 
                    src={design.cadImageUrl} 
                    alt="CAD Model" 
                    className="object-contain w-full"
                  />
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Comments Section */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Communication with Customer</CardTitle>
              <CardDescription>
                Messages between you and the customer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {design.comments && design.comments.length > 0 ? (
                  design.comments.map((comment) => (
                    <div 
                      key={comment.id} 
                      className={`p-3 rounded-md ${comment.isAdmin ? 'bg-primary/10 mr-6' : 'bg-background border ml-6'}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium">
                          {comment.isAdmin ? 'Luster Legacy Team' : comment.createdBy}
                        </span>
                        <span className="text-xs text-foreground/60">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
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
                    No comments yet. Use the form below to communicate with the customer.
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
        </div>
      </DialogContent>
    </Dialog>
  );
}

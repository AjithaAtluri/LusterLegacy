import { useState, useRef } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency, isImageFile } from "@/lib/utils";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { 
  ChevronLeft, 
  Loader2, 
  PenTool, 
  ArrowRight,
  Check,
  X,
  MessageCircle,
  ImagePlus,
  X as XIcon,
  Image,
  Info
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function CustomizationRequestDetail() {
  const { id } = useParams();
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for new comments
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Fetch customization request data
  const { data: customizationRequest, isLoading, error } = useQuery({
    queryKey: [`/api/customization-requests/${id}`],
    enabled: !!id && !!user,
  });
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-blue-500";
      case "quoted":
        return "bg-amber-500";
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
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleImageSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      if (!isImageFile(file)) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (jpg, jpeg, png, gif).",
          variant: "destructive"
        });
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 5MB.",
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
    
    setIsSubmitting(true);
    
    try {
      // Create form data to support file upload
      const formData = new FormData();
      
      formData.append("customizationRequestId", id);
      
      if (newComment.trim()) {
        formData.append("content", newComment);
      }
      
      if (uploadedImage) {
        formData.append("image", uploadedImage);
      }
      
      // Send request with formData instead of JSON
      const response = await fetch(`/api/customization-comments`, {
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
      queryClient.invalidateQueries({ queryKey: [`/api/customization-requests/${id}`] });
      
      // Also invalidate user requests query to keep both views in sync
      queryClient.invalidateQueries({ queryKey: ['/api/customization-requests/user'] });
      
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
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-foreground/70">Loading customization request details...</p>
        </div>
      </div>
    );
  }
  
  if (error || !customizationRequest) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Helmet>
          <title>Customization Request Not Found | Luster Legacy</title>
        </Helmet>
        <div className="text-center py-12">
          <PenTool className="h-16 w-16 mx-auto mb-4 text-foreground/20" />
          <h2 className="font-playfair text-2xl font-bold mb-2">Customization Request Not Found</h2>
          <p className="text-foreground/70 mb-6">
            The customization request you're looking for could not be found. It may have been removed or you may not have access to it.
          </p>
          <Button asChild>
            <Link href="/customer-dashboard">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Helmet>
        <title>{`Customization Request #${customizationRequest.id} | Luster Legacy`}</title>
        <meta name="description" content="View and manage your product customization request" />
      </Helmet>
      
      <div className="mb-8">
        <Button variant="outline" size="sm" asChild className="mb-4">
          <Link href="/customer-dashboard?tab=requests">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-playfair text-3xl font-bold mb-2">Customization Request #{customizationRequest.id}</h1>
            <p className="text-foreground/70">
              Submitted on {formatDate(customizationRequest.createdAt)}
            </p>
          </div>
          <Badge className={`${getStatusColor(customizationRequest.status)} text-white px-3 py-1 text-sm`}>
            {customizationRequest.status.charAt(0).toUpperCase() + customizationRequest.status.slice(1)}
          </Badge>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Left Column - Product Image */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle>Product Reference</CardTitle>
            <CardDescription>The product you're requesting to customize</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-square w-full rounded-md overflow-hidden">
              {customizationRequest.productImageUrl || (customizationRequest.product && customizationRequest.product.imageUrl) ? (
                <img 
                  src={customizationRequest.productImageUrl || (customizationRequest.product && customizationRequest.product.imageUrl)} 
                  alt={customizationRequest.productName || 'Product'} 
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-foreground/5">
                  <PenTool className="h-16 w-16 text-foreground/20" />
                </div>
              )}
              
              {/* Add debugging info */}
              <div className="absolute top-2 right-2 text-xs bg-black/60 text-white px-2 py-1 rounded-md">
                {customizationRequest.productId ? `Product ID: ${customizationRequest.productId}` : 'No Product ID'}
              </div>
            </div>
            
            {/* Show product name and details */}
            <div className="mt-4 space-y-2">
              <h3 className="font-medium">{customizationRequest.productName || 'Product'}</h3>
              {customizationRequest.product && customizationRequest.product.description && (
                <p className="text-sm text-foreground/70">{customizationRequest.product.description}</p>
              )}
              
              <div className="flex flex-wrap gap-2">
                {customizationRequest.productId && (
                  <Button variant="outline" size="sm" className="mt-2" asChild>
                    <Link href={`/product-detail/${customizationRequest.productId}`}>
                      View Original Product
                    </Link>
                  </Button>
                )}
                
                {/* "Original Specifications" dialog removed - redundant with "View Original Product" button */}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Right Column - Customization Details */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Customization Specifications</CardTitle>
            <CardDescription>Your requested customization details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-foreground/70">Metal Type</h3>
                <div className="flex items-center mt-1">
                  <div>
                    <span className="text-xs text-muted-foreground">Original:</span>
                    <p className="font-medium">{customizationRequest.originalMetalType || 'Not specified'}</p>
                  </div>
                  
                  <ArrowRight className="mx-2 h-4 w-4 text-muted-foreground" />
                  
                  <div>
                    <span className="text-xs text-muted-foreground">Requested:</span>
                    <p className="font-medium text-primary">{customizationRequest.preferredMetal || customizationRequest.requestedMetalType || 'Same as original'}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-foreground/70">Stone Type</h3>
                <div className="flex items-center mt-1">
                  <div>
                    <span className="text-xs text-muted-foreground">Original:</span>
                    <p className="font-medium">{customizationRequest.originalStoneType || 'Not specified'}</p>
                  </div>
                  
                  <ArrowRight className="mx-2 h-4 w-4 text-muted-foreground" />
                  
                  <div>
                    <span className="text-xs text-muted-foreground">Requested:</span>
                    <p className="font-medium text-primary">
                      {customizationRequest.preferredStones && customizationRequest.preferredStones.length > 0 
                        ? customizationRequest.preferredStones.join(', ') 
                        : (customizationRequest.requestedStoneType || 'Same as original')}
                    </p>
                  </div>
                </div>
              </div>
              
              {(customizationRequest.additionalNotes || customizationRequest.customizationDetails) && (
                <div>
                  <h3 className="text-sm font-medium text-foreground/70">Customization Notes</h3>
                  <p className="whitespace-pre-wrap">{customizationRequest.additionalNotes || customizationRequest.customizationDetails}</p>
                </div>
              )}
              
              <Separator />
              
              {/* Price Quote (if available) */}
              {customizationRequest.quotedPrice && (
                <div className="bg-accent/10 p-4 rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Estimated Price:</span>
                    <span className="font-semibold">{formatCurrency(customizationRequest.quotedPrice)}</span>
                  </div>
                  
                  {customizationRequest.status === 'quoted' && (
                    <div className="mt-4 flex flex-col sm:flex-row gap-3">
                      <Button className="flex-1 sm:flex-auto" asChild>
                        <Link href={`/checkout/customization/${customizationRequest.id}`}>
                          <Check className="mr-2 h-4 w-4" />
                          Accept Quote
                        </Link>
                      </Button>
                      <Button variant="outline" className="flex-1 sm:flex-auto">
                        <X className="mr-2 h-4 w-4" />
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* CAD Preview (if available) */}
      {customizationRequest.cadImageUrl && (
        <Card className="mb-8">
          <CardHeader className="pb-2">
            <CardTitle>CAD Preview</CardTitle>
            <CardDescription>3D model of your customized design</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[500px] rounded-md overflow-hidden">
              <img 
                src={customizationRequest.cadImageUrl} 
                alt="CAD Model" 
                className="object-contain w-full max-h-full"
              />
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Comments Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Communication</CardTitle>
          <CardDescription>Messages between you and our design team</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Message thread */}
          <div className="space-y-4 mb-6">
            {customizationRequest.comments && customizationRequest.comments.length > 0 ? (
              customizationRequest.comments.map((comment, index) => (
                <div 
                  key={comment.id} 
                  className={`p-4 rounded-lg ${
                    comment.isAdmin ? 'bg-accent/5 ml-6' : 'bg-primary/5 mr-6'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium flex items-center">
                      {comment.isAdmin && (
                        <Badge variant="outline" className="mr-2 bg-amber-500/10 text-amber-700 border-amber-200 dark:border-amber-800/30 dark:text-amber-400">
                          Admin
                        </Badge>
                      )}
                      {comment.createdBy}
                    </div>
                    <div className="text-xs text-foreground/60">
                      {new Date(comment.createdAt).toLocaleString([], {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap">{comment.content}</p>
                  
                  {/* Display image if available */}
                  {comment.imageUrl && (
                    <div className="mt-3">
                      <img
                        src={comment.imageUrl}
                        alt="Attached image"
                        className="max-h-60 rounded-md cursor-pointer"
                        onClick={() => window.open(comment.imageUrl, '_blank')}
                      />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 text-foreground/20" />
                <p className="text-foreground/60">No messages yet</p>
              </div>
            )}
          </div>
          
          {/* New message input */}
          <div className="mt-6">
            <div className="flex items-start gap-2 mb-2">
              <Textarea
                placeholder="Type your message here..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 min-h-[100px]"
              />
            </div>
            
            {/* Image upload preview */}
            {imagePreview && (
              <div className="relative inline-block mt-2 mb-3">
                <div className="group relative">
                  <img 
                    src={imagePreview} 
                    alt="Upload preview" 
                    className="h-20 rounded-md object-cover"
                  />
                  <button 
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-foreground text-background rounded-full p-1 shadow-sm"
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center mt-4">
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelection}
                  accept="image/*"
                  className="hidden"
                />
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline"
                  onClick={triggerImageUpload}
                >
                  <ImagePlus className="h-4 w-4 mr-2" />
                  Add Image
                </Button>
              </div>
              
              <Button 
                type="button"
                onClick={handleCommentSubmit}
                disabled={isSubmitting || (!newComment.trim() && !uploadedImage)}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Message
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
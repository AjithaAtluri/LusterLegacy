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
  Image
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function CustomDesignDetail() {
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
  
  // Fetch design request data
  const { data: design, isLoading, error } = useQuery({
    queryKey: [`/api/custom-designs/${id}`],
    enabled: !!id && !!user,
  });
  
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
      
      if (newComment.trim()) {
        formData.append("content", newComment);
      }
      
      if (uploadedImage) {
        formData.append("image", uploadedImage);
      }
      
      // Send request with formData instead of JSON
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
      
      // Invalidate query to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/custom-designs/${id}`] });
      
      // Also invalidate user designs query to keep both views in sync
      queryClient.invalidateQueries({ queryKey: ['/api/custom-designs/user'] });
      
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
          <p className="text-foreground/70">Loading design details...</p>
        </div>
      </div>
    );
  }
  
  if (error || !design) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Helmet>
          <title>Design Request Not Found | Luster Legacy</title>
        </Helmet>
        <div className="text-center py-12">
          <PenTool className="h-16 w-16 mx-auto mb-4 text-foreground/20" />
          <h2 className="font-playfair text-2xl font-bold mb-2">Design Request Not Found</h2>
          <p className="text-foreground/70 mb-6">
            The design request you're looking for could not be found. It may have been removed or you may not have access to it.
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
        <title>{`Design Request #${design.id} | Luster Legacy`}</title>
        <meta name="description" content="View and manage your custom jewelry design request" />
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
            <h1 className="font-playfair text-3xl font-bold mb-2">Design Request #{design.id}</h1>
            <p className="text-foreground/70">
              Submitted on {formatDate(design.createdAt)}
            </p>
          </div>
          <Badge className={`${getStatusColor(design.status)} text-white px-3 py-1 text-sm`}>
            {design.status.charAt(0).toUpperCase() + design.status.slice(1)}
          </Badge>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Left Column - Design Image or Product Image */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle>
              {design.product ? "Product Reference" : "Reference Image"}
            </CardTitle>
            <CardDescription>
              {design.product 
                ? "The product you're requesting to customize" 
                : "Your uploaded design inspiration"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-square w-full rounded-md overflow-hidden">
              {design.product?.imageUrl ? (
                <img 
                  src={design.product.imageUrl} 
                  alt={design.product.name} 
                  className="w-full h-full object-contain"
                />
              ) : design.imageUrl ? (
                <img 
                  src={design.imageUrl} 
                  alt="Design Reference" 
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-foreground/5">
                  <PenTool className="h-16 w-16 text-foreground/20" />
                </div>
              )}
            </div>
            
            {/* Show product name and details if it's a customization request */}
            {design.product && (
              <div className="mt-4 space-y-2">
                <h3 className="font-medium">{design.product.name}</h3>
                <p className="text-sm text-foreground/70">{design.product.description}</p>
                
                {design.product.id && (
                  <Button variant="outline" size="sm" className="mt-2" asChild>
                    <Link href={`/products/${design.product.id}`}>
                      View Original Product
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Right Column - Design Details */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>
              {design.product ? "Customization Specifications" : "Design Specifications"}
            </CardTitle>
            <CardDescription>
              {design.product 
                ? "Your requested customization details" 
                : "Your custom design requirements"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-foreground/70">Metal Type</h3>
                <p className="font-medium">{design.metalType}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-foreground/70">Primary Stone{design.primaryStones?.length > 1 ? 's' : ''}</h3>
                {design.primaryStones && design.primaryStones.length > 0 ? (
                  <p className="font-medium">{design.primaryStones.join(', ')}</p>
                ) : (
                  <p className="font-medium">{design.primaryStone}</p>
                )}
              </div>
              
              {design.notes && (
                <div>
                  <h3 className="text-sm font-medium text-foreground/70">
                    {design.product ? "Customization Notes" : "Design Notes"}
                  </h3>
                  <p className="whitespace-pre-wrap">{design.notes}</p>
                </div>
              )}
              
              <Separator />
              
              {/* Price Quote (if available) */}
              {design.estimatedPrice && (
                <div className="bg-accent/10 p-4 rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Estimated Price:</span>
                    <span className="font-semibold">{formatCurrency(design.estimatedPrice)}</span>
                  </div>
                  
                  {design.status === 'quoted' && (
                    <div className="mt-4 flex flex-col sm:flex-row gap-3">
                      <Button className="flex-1 sm:flex-auto" asChild>
                        <Link href={`/checkout/custom/${design.id}`}>
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
      {design.cadImageUrl && (
        <Card className="mb-8">
          <CardHeader className="pb-2">
            <CardTitle>CAD Preview</CardTitle>
            <CardDescription>3D model of your design</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[500px] rounded-md overflow-hidden">
              <img 
                src={design.cadImageUrl} 
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
          <div className="space-y-4">
            {design.comments && design.comments.length > 0 ? (
              design.comments.map((comment) => (
                <div 
                  key={comment.id} 
                  className={`p-3 rounded-md ${comment.isAdmin ? 'bg-background border ml-6' : 'bg-primary/10 mr-6'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium">
                      {comment.isAdmin ? 'Luster Legacy Team' : 'You'}
                    </span>
                    <span className="text-xs text-foreground/60">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  
                  {/* Comment Text */}
                  {comment.content && (
                    <p className="text-sm whitespace-pre-wrap mb-2">{comment.content}</p>
                  )}
                  
                  {/* Comment Image (if any) */}
                  {comment.imageUrl && (
                    <div className="mt-2 rounded-md overflow-hidden">
                      <img 
                        src={comment.imageUrl} 
                        alt="Attached Image" 
                        className="max-h-[300px] object-contain max-w-full"
                        onClick={() => window.open(comment.imageUrl, '_blank')}
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-foreground/60">
                No comments yet. Use the form below to communicate with our design team.
              </div>
            )}
          </div>
        </CardContent>
        
        <Separator />
        
        {/* Comment Form */}
        <CardFooter className="pt-4">
          <div className="w-full space-y-3">
            <Textarea 
              placeholder="Add a comment or question about your design request..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
            />
            
            {/* Hidden file input */}
            <input 
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageSelection}
            />
            
            {/* Image Preview */}
            {imagePreview && (
              <div className="relative w-full border rounded-md p-2 mt-2">
                <div className="relative max-h-[200px] overflow-hidden rounded-md">
                  <img 
                    src={imagePreview} 
                    alt="Upload preview" 
                    className="max-h-[200px] max-w-full object-contain mx-auto"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-background/80 rounded-full p-1 hover:bg-background border"
                    aria-label="Remove image"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={triggerImageUpload}
                className="text-xs"
              >
                <ImagePlus className="h-4 w-4 mr-1" />
                Attach Image
              </Button>
              
              <Button 
                onClick={handleCommentSubmit}
                disabled={isSubmitting || (!newComment.trim() && !uploadedImage)}
              >
                {isSubmitting ? (
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
  );
}
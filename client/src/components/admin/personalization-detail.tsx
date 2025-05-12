import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { Eye, Loader2, MessageCircle, ImageIcon, X, FileText, ArrowRight } from "lucide-react";

interface PersonalizationDetailProps {
  personalization: {
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
    product?: {
      basePrice?: number;
      calculatedPriceUSD?: number;
      calculatedPriceINR?: number;
    };
    comments?: Array<{
      id: number;
      content: string;
      imageUrl?: string;
      createdAt: string;
      createdBy: string;
      isAdmin: boolean;
    }>;
  };
}

export default function PersonalizationDetail({ personalization }: PersonalizationDetailProps) {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [priceUpdateLoading, setPriceUpdateLoading] = useState(false);
  const [quotedPrice, setQuotedPrice] = useState(personalization.quotedPrice?.toString() || "");
  const [showProductDialog, setShowProductDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch product details for the dialog
  const { data: productDetails } = useQuery({
    queryKey: [`/api/products/${personalization.productId}`],
    enabled: showProductDialog && !!personalization.productId,
  });

  // Handle comment submission
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() && !selectedFile) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("content", comment);
    formData.append("personalizationRequestId", personalization.id.toString());
    formData.append("isAdmin", "true");
    
    if (selectedFile) {
      formData.append("image", selectedFile);
    }

    try {
      const response = await fetch("/api/personalization-comments", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to submit comment");

      toast({
        title: "Comment submitted",
        description: "Your comment has been added successfully",
      });

      // Clear form and refresh data
      setComment("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      // Refresh data using both API endpoints for backward compatibility
      queryClient.invalidateQueries({ queryKey: ["/api/customization-requests"] });
      queryClient.invalidateQueries({ queryKey: [`/api/customization-requests/${personalization.id}`] });
      // Also invalidate the personalization endpoints if they exist
      queryClient.invalidateQueries({ queryKey: ["/api/personalization-requests"] });
      queryClient.invalidateQueries({ queryKey: [`/api/personalization-requests/${personalization.id}`] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle status update
  const updateStatus = async (newStatus: string) => {
    setStatusUpdateLoading(true);
    try {
      // Use correct API endpoint for customization requests
      const response = await apiRequest("PATCH", `/api/customization-requests/${personalization.id}`, {
        status: newStatus,
      });

      if (!response.ok) throw new Error("Failed to update status");

      toast({
        title: "Status updated",
        description: `Request status has been updated to ${newStatus}`,
      });

      // Refresh data using correct API endpoints
      queryClient.invalidateQueries({ queryKey: ["/api/customization-requests"] });
      queryClient.invalidateQueries({ queryKey: [`/api/customization-requests/${personalization.id}`] });
    } catch (error) {
      console.error("Status update error:", error);
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  // Handle price update
  const updatePrice = async () => {
    if (!quotedPrice.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid price",
        variant: "destructive",
      });
      return;
    }

    setPriceUpdateLoading(true);
    try {
      const price = parseFloat(quotedPrice);
      // Use correct API endpoint for customization requests
      const response = await apiRequest("PATCH", `/api/customization-requests/${personalization.id}`, {
        quotedPrice: price,
      });

      if (!response.ok) throw new Error("Failed to update price");

      toast({
        title: "Price updated",
        description: `Quoted price has been updated to ${formatCurrency(price, personalization.currency || "USD")}`,
      });

      // Refresh data using correct API endpoints
      queryClient.invalidateQueries({ queryKey: ["/api/customization-requests"] });
      queryClient.invalidateQueries({ queryKey: [`/api/customization-requests/${personalization.id}`] });
    } catch (error) {
      console.error("Price update error:", error);
      toast({
        title: "Error",
        description: "Failed to update price. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPriceUpdateLoading(false);
    }
  };

  // Handle file change for comment attachment
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Open image dialog
  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowImageDialog(true);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get personalization type badge label and color
  const getPersonalizationTypeDisplay = () => {
    switch(personalization.personalizationType) {
      case "metal_and_stone":
        return { label: "Metal & Stone", color: "bg-amber-500" };
      case "metal_only":
        return { label: "Metal Only", color: "bg-yellow-500" };
      case "stone_only":
        return { label: "Stone Only", color: "bg-purple-500" };
      default:
        return { label: "Other", color: "bg-slate-500" };
    }
  };

  const typeDisplay = getPersonalizationTypeDisplay();

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-start">
        <div>
          <h2 className="text-2xl font-bold">Personalization Request #{personalization.id}</h2>
          <p className="text-muted-foreground">
            Submitted on {formatDate(personalization.createdAt)}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge 
              className={
                personalization.status === "completed" ? "bg-green-500" :
                personalization.status === "in_progress" ? "bg-blue-500" :
                personalization.status === "quoted" ? "bg-purple-500" :
                personalization.status === "cancelled" ? "bg-destructive" :
                "bg-yellow-500"
              }
            >
              {personalization.status.replace("_", " ").toUpperCase()}
            </Badge>
            
            <Badge className={typeDisplay.color}>
              {typeDisplay.label}
            </Badge>
          </div>
        </div>
      </div>
      
      <Separator />
      
      {/* Customer & Product Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="font-medium">Name:</div>
              <div className="col-span-2">{personalization.fullName}</div>
              
              <div className="font-medium">Email:</div>
              <div className="col-span-2">{personalization.email}</div>
              
              {personalization.phone && (
                <>
                  <div className="font-medium">Phone:</div>
                  <div className="col-span-2">{personalization.phone}</div>
                </>
              )}
              
              {personalization.country && (
                <>
                  <div className="font-medium">Country:</div>
                  <div className="col-span-2">{personalization.country}</div>
                </>
              )}
            </div>
            
            {personalization.personalizationDetails && (
              <div className="pt-2">
                <h4 className="font-medium mb-1">Additional Notes:</h4>
                <p className="text-sm whitespace-pre-wrap">{personalization.personalizationDetails}</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Personalization Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Add product image at the top */}
            <div className="mb-4 border rounded-md overflow-hidden relative">
              {/* Display product image if available */}
              {personalization.productId && (
                <div className="aspect-square w-full h-64 relative">
                  <img 
                    src={personalization.productImageUrl || `/api/products/${personalization.productId}/image`} 
                    alt={personalization.productName}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/src/assets/product-placeholder.png";
                    }}
                  />
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    Product ID: {personalization.productId}
                  </div>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="font-medium">Product:</div>
              <div className="col-span-2 font-semibold text-primary">{personalization.productName}</div>
              
              <div className="font-medium">Original Metal:</div>
              <div className="col-span-2 flex items-center">
                <span>{personalization.originalMetalType || "Not specified"}</span>
                <ArrowRight className="mx-2 h-4 w-4 text-muted-foreground" />
                <span className="text-primary font-medium">{personalization.preferredMetal || personalization.requestedMetalType || "Not specified"}</span>
              </div>
              
              <div className="font-medium">Original Stone:</div>
              <div className="col-span-2 flex items-center">
                <span>{personalization.originalStoneType || "Not specified"}</span>
                <ArrowRight className="mx-2 h-4 w-4 text-muted-foreground" />
                <span className="text-primary font-medium">
                  {personalization.preferredStones?.length ? 
                    personalization.preferredStones.join(', ') : 
                    (personalization.requestedStoneType || "Not specified")}
                </span>
              </div>
              
              {/* Original Product Price Information */}
              {personalization.product?.basePrice && (
                <>
                  <div className="font-medium">Original Base Price:</div>
                  <div className="col-span-2">
                    {formatCurrency(personalization.product.basePrice, "INR")} 
                    {personalization.product.calculatedPriceUSD && (
                      <span className="text-muted-foreground ml-2">
                        ({formatCurrency(personalization.product.calculatedPriceUSD, "USD")})
                      </span>
                    )}
                  </div>
                </>
              )}
              
              {personalization.product?.calculatedPriceUSD && personalization.product?.calculatedPriceINR && (
                <>
                  <div className="font-medium">Original Calculated Price:</div>
                  <div className="col-span-2">
                    {formatCurrency(personalization.product.calculatedPriceINR, "INR")}
                    <span className="text-muted-foreground ml-2">
                      ({formatCurrency(personalization.product.calculatedPriceUSD, "USD")})
                    </span>
                  </div>
                </>
              )}
              
              {/* Divider before quoted price */}
              {(personalization.product?.basePrice || personalization.product?.calculatedPriceUSD) && 
               personalization.quotedPrice && (
                <div className="col-span-3 py-1">
                  <Separator className="my-2" />
                </div>
              )}
              
              {/* Quoted Price */}
              {personalization.quotedPrice && personalization.currency && (
                <>
                  <div className="font-medium">Quoted Price:</div>
                  <div className="col-span-2 font-bold text-primary">
                    {formatCurrency(personalization.quotedPrice, personalization.currency)}
                  </div>
                </>
              )}
            </div>
            
            {/* Display Reference Images */}
            {personalization.imageUrls && personalization.imageUrls.length > 0 && (
              <div className="pt-2">
                <h4 className="font-medium mb-1">Reference Images:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {personalization.imageUrls.map((url, index) => (
                    <div 
                      key={index}
                      className="relative aspect-video rounded-md overflow-hidden border cursor-pointer"
                      onClick={() => handleImageClick(url)}
                    >
                      <img 
                        src={url} 
                        alt={`Reference ${index + 1}`} 
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Eye className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* View Product Details Button */}
            {personalization.productId && (
              <div className="pt-4">
                <Button 
                  variant="outline"
                  onClick={() => setShowProductDialog(true)}
                >
                  <Eye className="mr-2 h-4 w-4" /> View Product Details
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Admin Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Update Status</Label>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={personalization.status === "pending" ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateStatus("pending")}
                  disabled={statusUpdateLoading || personalization.status === "pending"}
                >
                  Pending
                </Button>
                <Button
                  variant={personalization.status === "in_progress" ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateStatus("in_progress")}
                  disabled={statusUpdateLoading || personalization.status === "in_progress"}
                >
                  In Progress
                </Button>
                <Button
                  variant={personalization.status === "quoted" ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateStatus("quoted")}
                  disabled={statusUpdateLoading || personalization.status === "quoted"}
                >
                  Quoted
                </Button>
                <Button
                  variant={personalization.status === "completed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateStatus("completed")}
                  disabled={statusUpdateLoading || personalization.status === "completed"}
                >
                  Completed
                </Button>
                <Button
                  variant={personalization.status === "cancelled" ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => updateStatus("cancelled")}
                  disabled={statusUpdateLoading || personalization.status === "cancelled"}
                >
                  Cancelled
                </Button>
                
                {statusUpdateLoading && (
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground text-sm">Updating...</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quotedPrice">Update Quoted Price (USD)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="quotedPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={quotedPrice}
                  onChange={(e) => setQuotedPrice(e.target.value)}
                  placeholder="Enter quoted price"
                  className="w-full"
                />
                <Button 
                  onClick={updatePrice} 
                  disabled={priceUpdateLoading || !quotedPrice.trim()}
                >
                  {priceUpdateLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Update"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Communication History */}
      <Card>
        <CardHeader>
          <CardTitle>Communication History</CardTitle>
          <CardDescription>
            Messages between customer and admin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4 max-h-96 overflow-y-auto p-1">
            {personalization.comments && personalization.comments.length > 0 ? (
              personalization.comments.map((comment) => (
                <div 
                  key={comment.id} 
                  className={`p-3 rounded-lg ${
                    comment.isAdmin 
                      ? "bg-primary/10 ml-6" 
                      : "bg-muted mr-6"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-medium">
                      {comment.isAdmin ? "Admin" : personalization.fullName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  
                  <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                  
                  {comment.imageUrl && (
                    <div 
                      className="mt-2 relative aspect-video rounded-md overflow-hidden border cursor-pointer"
                      onClick={() => handleImageClick(comment.imageUrl!)}
                    >
                      <img 
                        src={comment.imageUrl} 
                        alt="Comment attachment" 
                        className="object-contain w-full h-full max-h-48"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Eye className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <MessageCircle className="mx-auto h-8 w-8 mb-2" />
                <p>No communication history yet.</p>
              </div>
            )}
          </div>
          
          {/* Comment form */}
          <form onSubmit={handleCommentSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="comment">Add Comment</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Enter your message to the customer..."
                className="min-h-[100px]"
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="attachment">Attachment (optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="attachment"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="w-full"
                />
                {selectedFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {selectedFile && (
                <p className="text-xs text-muted-foreground">
                  {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                </p>
              )}
            </div>
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Message"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {/* Image viewer dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Image View</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center">
            <img 
              src={selectedImage} 
              alt="Enlarged view" 
              className="max-w-full max-h-[70vh] object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
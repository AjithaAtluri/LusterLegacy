import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Eye, Loader2, MessageCircle, ImageIcon, X, FileText } from "lucide-react";

interface QuoteDetailProps {
  quote: {
    id: number;
    fullName: string;
    email: string;
    phone: string | null;
    country: string | null;
    productId: number;
    productName: string;
    metalType: string;
    stoneType: string;
    quantity: number;
    specialRequirements: string | null;
    preferredCurrency: string | null;
    shippingAddress: any | null;
    status: string;
    quotedPrice: number | null;
    currency: string | null;
    imageUrl: string | null;
    isReadyToShip?: boolean;
    createdAt: string;
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

export default function QuoteDetail({ quote }: QuoteDetailProps) {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [priceUpdateLoading, setPriceUpdateLoading] = useState(false);
  const [quotedPrice, setQuotedPrice] = useState(quote.quotedPrice?.toString() || "");
  const [isReadyToShip, setIsReadyToShip] = useState(quote.isReadyToShip || false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Handle comment submission
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() && !selectedFile) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("content", comment);
    formData.append("quoteRequestId", quote.id.toString());
    formData.append("isAdmin", "true");
    
    if (selectedFile) {
      formData.append("image", selectedFile);
    }

    try {
      const response = await fetch("/api/quote-comments", {
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
      
      // Refresh quote requests data
      queryClient.invalidateQueries({ queryKey: ["/api/quote-requests"] });
      queryClient.invalidateQueries({ queryKey: [`/api/quote-requests/${quote.id}`] });
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
      const response = await apiRequest("PATCH", `/api/quote-requests/${quote.id}`, {
        status: newStatus,
      });

      if (!response.ok) throw new Error("Failed to update status");

      toast({
        title: "Status updated",
        description: `Request status has been updated to ${newStatus}`,
      });

      // Refresh quote requests data
      queryClient.invalidateQueries({ queryKey: ["/api/quote-requests"] });
      queryClient.invalidateQueries({ queryKey: [`/api/quote-requests/${quote.id}`] });
    } catch (error) {
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
      
      // When setting a price, automatically update status to "quoted" if it's not already in a later stage
      const latestStages = ["approved", "payment_received", "in_production", "shipping", "delivered", "completed"];
      const shouldUpdateStatus = !latestStages.includes(quote.status);
      
      const response = await apiRequest("PATCH", `/api/quote-requests/${quote.id}`, {
        quotedPrice: price,
        isReadyToShip: isReadyToShip,
        ...(shouldUpdateStatus && { status: "quoted" })
      });

      if (!response.ok) throw new Error("Failed to update price");

      const readyStatusMsg = isReadyToShip ? " (Ready to Ship)" : "";
      const statusMsg = shouldUpdateStatus ? " and status changed to QUOTED" : "";
      
      toast({
        title: "Quote updated",
        description: `Quoted price has been updated to ${formatCurrency(price, quote.currency || "USD")}${readyStatusMsg}${statusMsg}`,
      });

      // Refresh quote requests data
      queryClient.invalidateQueries({ queryKey: ["/api/quote-requests"] });
      queryClient.invalidateQueries({ queryKey: [`/api/quote-requests/${quote.id}`] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update quote. Please try again.",
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

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-start">
        <div>
          <h2 className="text-2xl font-bold">Quote Request #{quote.id}</h2>
          <p className="text-muted-foreground">
            Submitted on {formatDate(quote.createdAt)}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge 
              className={
                quote.status === "completed" ? "bg-green-500" :
                quote.status === "in_progress" ? "bg-blue-500" :
                quote.status === "quoted" ? "bg-purple-500" :
                quote.status === "cancelled" ? "bg-destructive" :
                "bg-yellow-500"
              }
            >
              {quote.status.replace("_", " ").toUpperCase()}
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
              <div className="col-span-2">{quote.fullName}</div>
              
              <div className="font-medium">Email:</div>
              <div className="col-span-2">{quote.email}</div>
              
              {quote.phone && (
                <>
                  <div className="font-medium">Phone:</div>
                  <div className="col-span-2">{quote.phone}</div>
                </>
              )}
              
              {quote.country && (
                <>
                  <div className="font-medium">Country:</div>
                  <div className="col-span-2">{quote.country}</div>
                </>
              )}
            </div>
            
            {quote.specialRequirements && (
              <div className="pt-2">
                <h4 className="font-medium mb-1">Special Requirements:</h4>
                <p className="text-sm whitespace-pre-wrap">{quote.specialRequirements}</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="font-medium">Product:</div>
              <div className="col-span-2">{quote.productName}</div>
              
              <div className="font-medium">Metal Type:</div>
              <div className="col-span-2">{quote.metalType}</div>
              
              <div className="font-medium">Stone Type:</div>
              <div className="col-span-2">{quote.stoneType}</div>
              
              <div className="font-medium">Quantity:</div>
              <div className="col-span-2">{quote.quantity}</div>
              
              {quote.quotedPrice && quote.currency && (
                <>
                  <div className="font-medium">Quoted Price:</div>
                  <div className="col-span-2 font-bold">
                    {formatCurrency(quote.quotedPrice, quote.currency)}
                    {quote.isReadyToShip && (
                      <Badge className="ml-2 bg-green-600">Ready to Ship</Badge>
                    )}
                  </div>
                </>
              )}
            </div>
            
            {/* Display Product Image */}
            {quote.imageUrl && (
              <div className="pt-2">
                <h4 className="font-medium mb-1">Product Image:</h4>
                <div className="relative aspect-square max-w-[200px] rounded-md overflow-hidden border cursor-pointer">
                  <img 
                    src={quote.imageUrl} 
                    alt={quote.productName} 
                    className="object-cover w-full h-full"
                    onClick={() => handleImageClick(quote.imageUrl!)}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Eye className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            )}
            
            {/* View Product Details Button */}
            {quote.productId && (
              <div className="pt-4">
                <Button asChild variant="outline">
                  <a href={`/product/${quote.productId}`} target="_blank" rel="noopener noreferrer">
                    <Eye className="mr-2 h-4 w-4" /> View Product Details
                  </a>
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
                  variant={quote.status === "pending" ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateStatus("pending")}
                  disabled={statusUpdateLoading || quote.status === "pending"}
                >
                  Pending
                </Button>
                <Button
                  variant={quote.status === "in_progress" ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateStatus("in_progress")}
                  disabled={statusUpdateLoading || quote.status === "in_progress"}
                >
                  In Progress
                </Button>
                <Button
                  variant={quote.status === "quoted" ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateStatus("quoted")}
                  disabled={statusUpdateLoading || quote.status === "quoted" || !quote.quotedPrice}
                >
                  Quoted
                </Button>
                <Button
                  variant={quote.status === "approved" ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateStatus("approved")}
                  disabled={statusUpdateLoading || quote.status === "approved"}
                >
                  Approved
                </Button>
                <Button
                  variant={quote.status === "payment_received" ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateStatus("payment_received")}
                  disabled={statusUpdateLoading || quote.status === "payment_received"}
                >
                  Payment Received
                </Button>
                <Button
                  variant={quote.status === "in_production" ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateStatus("in_production")}
                  disabled={statusUpdateLoading || quote.status === "in_production"}
                >
                  In Production
                </Button>
                <Button
                  variant={quote.status === "shipping" ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateStatus("shipping")}
                  disabled={statusUpdateLoading || quote.status === "shipping"}
                >
                  Shipping
                </Button>
                <Button
                  variant={quote.status === "delivered" ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateStatus("delivered")}
                  disabled={statusUpdateLoading || quote.status === "delivered"}
                >
                  Delivered
                </Button>
                <Button
                  variant={quote.status === "completed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateStatus("completed")}
                  disabled={statusUpdateLoading || quote.status === "completed"}
                >
                  Completed
                </Button>
                <Button
                  variant={quote.status === "rejected" ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => updateStatus("rejected")}
                  disabled={statusUpdateLoading || quote.status === "rejected"}
                >
                  Rejected
                </Button>
              </div>
              {statusUpdateLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Updating status...
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="price">Update Quoted Price</Label>
              <div className="flex gap-2">
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="1"
                  value={quotedPrice}
                  onChange={(e) => setQuotedPrice(e.target.value)}
                  placeholder="Enter price"
                  className="flex-1"
                />
                <Button 
                  onClick={updatePrice} 
                  disabled={priceUpdateLoading}
                >
                  {priceUpdateLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating
                    </>
                  ) : "Update Quote"}
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="ready-to-ship"
                    checked={isReadyToShip}
                    onChange={(e) => setIsReadyToShip(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="ready-to-ship" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Ready to Ship
                  </Label>
                </div>
                
                {isReadyToShip && (
                  <Badge className="bg-green-600">100% Payment Required</Badge>
                )}
                
                {!isReadyToShip && quotedPrice && (
                  <Badge className="bg-blue-600">50% Advance Payment</Badge>
                )}
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  Currency: {quote.currency || "USD"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isReadyToShip 
                    ? "This product is in stock and ready for immediate shipment. Customer will be required to pay 100% of the quoted price upfront."
                    : "This product will need to be custom made. Customer will pay 50% advance and 50% before shipping (3-4 weeks)."}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Communication Section */}
      <Card>
        <CardHeader>
          <CardTitle>Communication</CardTitle>
          <CardDescription>
            Exchange messages with the customer regarding their quote request
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Comments Display */}
          <div className="space-y-4 max-h-[400px] overflow-y-auto p-1">
            {quote.comments && quote.comments.length > 0 ? (
              quote.comments.map((comment) => (
                <div 
                  key={comment.id}
                  className={`flex gap-3 ${comment.isAdmin ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    comment.isAdmin ? "bg-primary" : "bg-muted"
                  }`}>
                    {comment.isAdmin ? "A" : comment.createdBy.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className={`flex-1 max-w-[80%] space-y-2 ${
                    comment.isAdmin ? "items-end" : "items-start"
                  }`}>
                    <div className={`rounded-lg p-3 ${
                      comment.isAdmin ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                    </div>
                    
                    {comment.imageUrl && (
                      <div className="relative aspect-video w-full max-w-xs rounded-md overflow-hidden border">
                        <img 
                          src={comment.imageUrl} 
                          alt="Comment attachment" 
                          className="object-cover w-full h-full cursor-pointer"
                          onClick={() => handleImageClick(comment.imageUrl!)}
                        />
                      </div>
                    )}
                    
                    <div className={`flex text-xs text-muted-foreground ${
                      comment.isAdmin ? "justify-end" : "justify-start"
                    }`}>
                      <span>{formatDate(comment.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No messages yet. Start the conversation with the customer.
              </div>
            )}
          </div>
          
          {/* Comment Form */}
          <form onSubmit={handleCommentSubmit} className="space-y-3">
            <Textarea
              placeholder="Type your message here..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Attach Image
                </Button>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                {selectedFile && (
                  <div className="flex items-center gap-1 text-sm">
                    <span className="text-muted-foreground truncate max-w-[150px]">
                      {selectedFile.name}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending
                  </>
                ) : (
                  <>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Send Message
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* Image Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          <div className="relative flex-1 overflow-hidden p-1 flex items-center justify-center">
            <img 
              src={selectedImage} 
              alt="Full size view" 
              className="max-h-[70vh] max-w-full object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
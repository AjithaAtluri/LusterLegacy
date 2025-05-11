import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Circle, 
  MessageSquare, 
  Clock, 
  User, 
  FileText, 
  Image as ImageIcon, 
  Send,
  Upload,
  DollarSign,
  PlusCircle
} from "lucide-react";

interface PersonalizationDetailProps {
  customization: {
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

export default function PersonalizationDetail({ customization }: PersonalizationDetailProps) {
  const [commentText, setCommentText] = useState("");
  const [commentImage, setCommentImage] = useState<File | null>(null);
  const [priceInput, setPriceInput] = useState(
    customization.quotedPrice?.toString() || ""
  );
  const [currencyInput, setCurrencyInput] = useState(
    customization.currency || "USD"
  );
  const [statusInput, setStatusInput] = useState(customization.status);
  const [isUploading, setIsUploading] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

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

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({
      content,
      image,
    }: {
      content: string;
      image: File | null;
    }) => {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("content", content);
      formData.append("personalizationId", customization.id.toString());
      if (image) {
        formData.append("image", image);
      }

      const res = await fetch("/api/personalization-comments", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to add comment");
      }

      return res.json();
    },
    onSuccess: () => {
      setCommentText("");
      setCommentImage(null);
      setIsUploading(false);
      queryClient.invalidateQueries({
        queryKey: [`/api/personalization-requests/${customization.id}`],
      });
      toast({
        title: "Comment added",
        description: "Your comment has been added to the personalization request",
      });
    },
    onError: (error: Error) => {
      setIsUploading(false);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await apiRequest(
        "PATCH",
        `/api/personalization-requests/${customization.id}/status`,
        { status }
      );
      if (!res.ok) {
        throw new Error("Failed to update status");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/personalization-requests/${customization.id}`],
      });
      toast({
        title: "Status updated",
        description: "The personalization request status has been updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update price mutation
  const updatePriceMutation = useMutation({
    mutationFn: async ({
      price,
      currency,
    }: {
      price: number;
      currency: string;
    }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/personalization-requests/${customization.id}/price`,
        { price, currency }
      );
      if (!res.ok) {
        throw new Error("Failed to update price");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/personalization-requests/${customization.id}`],
      });
      toast({
        title: "Price updated",
        description: "The personalization request price has been updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() && !commentImage) return;

    await addCommentMutation.mutate({
      content: commentText,
      image: commentImage,
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCommentImage(e.target.files[0]);
    }
  };

  const handleUpdateStatus = async () => {
    await updateStatusMutation.mutate(statusInput);
  };

  const handleUpdatePrice = async () => {
    const price = parseFloat(priceInput);
    if (isNaN(price)) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid number for the price",
        variant: "destructive",
      });
      return;
    }
    
    await updatePriceMutation.mutate({
      price,
      currency: currencyInput,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Customer and Request Details */}
        <Card className="md:w-1/3">
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>
              Personalization request #{customization.id}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Full Name</Label>
              <p className="font-medium">{customization.fullName}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Email</Label>
              <p className="font-medium">{customization.email}</p>
            </div>
            {customization.phone && (
              <div>
                <Label className="text-muted-foreground">Phone</Label>
                <p className="font-medium">{customization.phone}</p>
              </div>
            )}
            {customization.country && (
              <div>
                <Label className="text-muted-foreground">Country</Label>
                <p className="font-medium">{customization.country}</p>
              </div>
            )}
            <div>
              <Label className="text-muted-foreground">Request Date</Label>
              <p className="font-medium">
                {new Date(customization.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(customization.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Product Details */}
        <Card className="md:w-2/3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle>Product Details</CardTitle>
              <CardDescription>
                Information about the product being personalized
              </CardDescription>
            </div>
            <Badge className={formatStatus(customization.status).color}>
              {formatStatus(customization.status).label}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="sm:w-1/3 h-48 bg-muted rounded-md overflow-hidden">
                {customization.productImageUrl ? (
                  <img
                    src={customization.productImageUrl}
                    alt={customization.productName}
                    className="w-full h-full object-cover"
                  />
                ) : customization.imageUrls && customization.imageUrls.length > 0 ? (
                  <img
                    src={customization.imageUrls[0]}
                    alt="Personalization request"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-12 w-12 opacity-30" />
                  </div>
                )}
              </div>
              <div className="sm:w-2/3 space-y-3">
                <div>
                  <Label className="text-muted-foreground">Product Name</Label>
                  <p className="font-medium text-lg">{customization.productName}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-muted-foreground">Original Metal</Label>
                    <p className="font-medium">{customization.originalMetalType}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Requested Metal</Label>
                    <p className="font-medium">{customization.requestedMetalType || customization.preferredMetal}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Original Stone</Label>
                    <p className="font-medium">{customization.originalStoneType}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Requested Stone</Label>
                    <p className="font-medium">{customization.requestedStoneType || customization.preferredStones.join(", ")}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Personalization Type</Label>
                  <p className="font-medium capitalize">{customization.personalizationType.replace(/_/g, " ")}</p>
                </div>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Personalization Details</Label>
              <p className="mt-1 whitespace-pre-line">{customization.personalizationDetails}</p>
            </div>
            {customization.additionalNotes && (
              <div>
                <Label className="text-muted-foreground">Additional Notes</Label>
                <p className="mt-1 whitespace-pre-line">{customization.additionalNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Images Section */}
      {customization.imageUrls && customization.imageUrls.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Reference Images</CardTitle>
            <CardDescription>
              Images provided by the customer for the personalization request
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {customization.imageUrls.map((url, index) => (
                <div
                  key={index}
                  className="aspect-square rounded-md overflow-hidden border"
                >
                  <img
                    src={url}
                    alt={`Reference ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                    onClick={() => window.open(url, "_blank")}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status and Actions */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Price Quote */}
        <Card className="md:w-1/2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Price Quote
            </CardTitle>
            <CardDescription>
              Set or update the price for this personalization request
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label htmlFor="price">Price Amount</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  placeholder="Enter price amount"
                />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={currencyInput}
                  onChange={(e) => setCurrencyInput(e.target.value)}
                >
                  <option value="USD">USD ($)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>
            </div>
            <Button
              onClick={handleUpdatePrice}
              disabled={updatePriceMutation.isPending}
            >
              {updatePriceMutation.isPending ? "Updating..." : "Update Price"}
            </Button>
          </CardContent>
        </Card>

        {/* Status Update */}
        <Card className="md:w-1/2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Circle className="h-5 w-5" />
              Status Update
            </CardTitle>
            <CardDescription>
              Update the current status of this personalization request
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="status">Current Status</Label>
              <select
                id="status"
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={statusInput}
                onChange={(e) => setStatusInput(e.target.value)}
              >
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
            <Button
              onClick={handleUpdateStatus}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? "Updating..." : "Update Status"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Communication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Communication
          </CardTitle>
          <CardDescription>
            Messages and updates regarding this personalization request
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="comments" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="comments">Comments ({customization.comments?.length || 0})</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>
            
            <TabsContent value="comments">
              <div className="space-y-6">
                {/* Comment List */}
                <ScrollArea className="h-96 pr-4">
                  {customization.comments && customization.comments.length > 0 ? (
                    <div className="space-y-4">
                      {customization.comments.map((comment) => (
                        <div
                          key={comment.id}
                          className={`flex gap-4 ${
                            comment.isAdmin ? "justify-start" : "justify-end"
                          }`}
                        >
                          <div
                            className={`max-w-[80%] space-y-2 ${
                              comment.isAdmin
                                ? "order-2"
                                : "order-1 text-right"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {comment.isAdmin ? (
                                <>
                                  <span className="font-medium text-sm">
                                    Admin
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    Staff
                                  </Badge>
                                </>
                              ) : (
                                <span className="ml-auto font-medium text-sm">
                                  {customization.fullName}
                                </span>
                              )}
                            </div>
                            
                            <div
                              className={`rounded-lg p-3 ${
                                comment.isAdmin
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              <p className="whitespace-pre-line">{comment.content}</p>
                            </div>
                            
                            {comment.imageUrl && (
                              <div className="mt-2">
                                <img
                                  src={comment.imageUrl}
                                  alt="Comment attachment"
                                  className="rounded-md max-h-60 object-contain"
                                  onClick={() => window.open(comment.imageUrl, "_blank")}
                                />
                              </div>
                            )}
                            
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>
                                {formatDistanceToNow(
                                  new Date(comment.createdAt),
                                  { addSuffix: true }
                                )}
                              </span>
                            </div>
                          </div>
                          
                          <Avatar
                            className={`h-8 w-8 ${
                              comment.isAdmin ? "order-1" : "order-2"
                            }`}
                          >
                            <AvatarFallback>
                              {comment.isAdmin ? "A" : customization.fullName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No comments yet. Start the conversation.
                    </div>
                  )}
                </ScrollArea>
                
                {/* Add Comment Form */}
                <form onSubmit={handleCommentSubmit} className="space-y-3">
                  <Textarea
                    placeholder="Type your message here..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="min-h-[100px]"
                  />
                  
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      {commentImage && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <ImageIcon className="h-4 w-4" />
                          <span className="truncate">{commentImage.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 p-0"
                            onClick={() => setCommentImage(null)}
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor="comment-image"
                        className="cursor-pointer text-muted-foreground hover:text-foreground"
                      >
                        <Upload className="h-5 w-5" />
                        <span className="sr-only">Upload image</span>
                      </Label>
                      <Input
                        id="comment-image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      
                      <Button
                        type="submit"
                        className="gap-2"
                        disabled={
                          (!commentText.trim() && !commentImage) ||
                          addCommentMutation.isPending
                        }
                      >
                        <Send className="h-4 w-4" />
                        Send Message
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </TabsContent>
            
            <TabsContent value="timeline">
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-border">
                {/* Creation */}
                <div className="relative">
                  <div className="absolute left-[-24px] top-0 rounded-full bg-primary p-1">
                    <PlusCircle className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="space-y-1">
                    <div className="font-medium">Request Created</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(customization.createdAt).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </div>
                    <p className="text-sm">
                      {customization.fullName} submitted a personalization request for {customization.productName}
                    </p>
                  </div>
                </div>
                
                {/* Status updates - these would be populated from a proper history in a real app */}
                <div className="relative">
                  <div className="absolute left-[-24px] top-0 rounded-full bg-blue-500 p-1">
                    <Circle className="h-4 w-4 text-white" />
                  </div>
                  <div className="space-y-1">
                    <div className="font-medium">Current Status: {formatStatus(customization.status).label}</div>
                    <div className="text-sm text-muted-foreground">
                      Status last updated on (would be from history in a real app)
                    </div>
                  </div>
                </div>
                
                {/* Price quote - if exists */}
                {customization.quotedPrice && (
                  <div className="relative">
                    <div className="absolute left-[-24px] top-0 rounded-full bg-green-500 p-1">
                      <DollarSign className="h-4 w-4 text-white" />
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium">Price Quote Provided</div>
                      <div className="text-sm">
                        A price of {customization.currency === 'USD' ? '$' : '₹'}
                        {customization.quotedPrice.toLocaleString()} has been quoted for this personalization.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
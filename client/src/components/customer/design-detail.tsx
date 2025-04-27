import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Eye, MessageCircle, Loader2 } from "lucide-react";

// Types interface for the design request
interface DesignDetailProps {
  design: {
    id: number;
    fullName: string;
    email: string;
    phone: string | null;
    country: string | null;
    metalType: string;
    primaryStone: string;
    notes: string | null;
    imageUrl: string;
    status: string;
    estimatedPrice: number | null;
    cadImageUrl: string | null;
    createdAt: string;
    comments?: Array<{
      id: number;
      content: string;
      createdAt: string;
      createdBy: string;
      isAdmin: boolean;
    }>;
  };
}

export default function CustomerDesignDetail({ design }: DesignDetailProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newComment, setNewComment] = useState("");
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
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      await apiRequest("POST", `/api/custom-designs/${design.id}/comments`, {
        content: newComment
      });
      
      toast({
        title: "Comment added",
        description: "Your comment has been added to the design request"
      });
      
      // Invalidate query to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/custom-designs/user'] });
      
      // Clear comment field
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Comment failed",
        description: "Failed to add comment",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getStatusMessage = (status: string) => {
    switch (status) {
      case "pending":
        return "Your design request is being reviewed by our team. We'll get back to you soon with a quote.";
      case "quoted":
        return "We've reviewed your design and provided a quote. You can accept it to proceed with the order.";
      case "approved":
        return "Your design has been approved and our team is working on creating it.";
      case "rejected":
        return "Unfortunately, we couldn't proceed with this design request. Please check the comments for details.";
      case "completed":
        return "Your custom design has been completed! Check the CAD model preview.";
      default:
        return "Your design request is being processed.";
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          View Details
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-playfair text-xl">Design Request #{design.id}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Status Card */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Request Status</CardTitle>
                <Badge className={`${getStatusColor(design.status)} text-white`}>
                  {design.status.charAt(0).toUpperCase() + design.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/80">{getStatusMessage(design.status)}</p>
              
              {/* Price quote information */}
              {design.estimatedPrice && (
                <div className="mt-4 p-3 bg-accent/10 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Estimated Price:</span>
                    <span className="font-semibold">{formatCurrency(design.estimatedPrice)}</span>
                  </div>
                  
                  {design.status === 'quoted' && (
                    <div className="mt-3 flex justify-end">
                      <Button asChild>
                        <a href={`/checkout/custom/${design.id}`}>Accept & Proceed</a>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Design Details */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Design Details</CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="space-y-2">
                <div>
                  <div className="font-medium">Metal Type</div>
                  <div>{design.metalType}</div>
                </div>
                <div>
                  <div className="font-medium">Primary Stone</div>
                  <div>{design.primaryStone}</div>
                </div>
                {design.notes && (
                  <div>
                    <div className="font-medium">Design Notes</div>
                    <div className="text-sm whitespace-pre-wrap">{design.notes}</div>
                  </div>
                )}
                <div>
                  <div className="font-medium">Submitted On</div>
                  <div>{formatDate(design.createdAt)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Design Image */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Reference Image</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-square w-full rounded-md overflow-hidden">
                <img 
                  src={design.imageUrl} 
                  alt="Design Reference" 
                  className="w-full h-full object-contain"
                />
              </div>
            </CardContent>
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
              <CardTitle className="text-lg">Communication</CardTitle>
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
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-foreground/60">
                    No comments yet. Feel free to ask any questions about your design request.
                  </div>
                )}
              </div>
            </CardContent>
            <Separator />
            <CardFooter className="pt-4">
              <div className="w-full space-y-3">
                <Textarea 
                  placeholder="Add a comment or question about your design request..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <Button 
                  className="ml-auto"
                  onClick={handleCommentSubmit}
                  disabled={isSubmitting || !newComment.trim()}
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
            </CardFooter>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { Eye, Loader2 } from "lucide-react";

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
  };
}

export default function DesignDetail({ design }: DesignDetailProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState(design.estimatedPrice?.toString() || "");
  const [cadImageUrl, setCadImageUrl] = useState(design.cadImageUrl || "");
  const [status, setStatus] = useState(design.status);
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
          
          {/* Design Image */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Design Reference</CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="aspect-square w-full rounded-md overflow-hidden">
                <img 
                  src={design.imageUrl} 
                  alt="Design reference" 
                  className="object-cover w-full h-full"
                />
              </div>
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
                  <div className="font-medium">Primary Stone</div>
                  <div>{design.primaryStone}</div>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}

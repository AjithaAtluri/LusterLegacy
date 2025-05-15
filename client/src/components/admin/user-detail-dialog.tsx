import { useState, useEffect } from "react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Clipboard, Mail, Phone, MapPin, Calendar, Activity } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// User interface with all possible properties
interface DetailedUser {
  id: number;
  username: string;
  email: string;
  loginID: string;
  name: string | null;
  phone: string | null;
  country: string | null;
  role: string;
  createdAt: string;
  emailVerified: boolean;
  notifyDesignUpdates: boolean;
  notifyOrderStatus: boolean;
  notifyQuoteResponses: boolean;
  lastLogin?: string;
}

interface UserActivitySummary {
  designRequests: number;
  quoteRequests: number;
  personalizationRequests: number;
  orders: number;
  contactMessages: number;
  lastActivity?: string;
}

interface UserDetailDialogProps {
  userId: number | null;
  onClose: () => void;
}

export function UserDetailDialog({ userId, onClose }: UserDetailDialogProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);

  // Reset copied state after 2 seconds
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  // Fetch user details
  const { 
    data: user, 
    isLoading: isLoadingUser
  } = useQuery({
    queryKey: ['/api/admin/users', userId],
    queryFn: async () => {
      if (!userId) return null;
      const response = await apiRequest("GET", `/api/admin/users/${userId}`);
      return await response.json() as DetailedUser;
    },
    enabled: !!userId
  });

  // Fetch user activity
  const {
    data: activity,
    isLoading: isLoadingActivity
  } = useQuery({
    queryKey: ['/api/admin/users/activity', userId],
    queryFn: async () => {
      if (!userId) return null;
      try {
        const response = await apiRequest("GET", `/api/admin/users/${userId}/activity`);
        return await response.json() as UserActivitySummary;
      } catch (error) {
        console.error("Error fetching user activity:", error);
        toast({
          title: "Error",
          description: "Could not load user activity data. Please try again.",
          variant: "destructive",
        });
        
        // Return empty data while we fix the API issue
        return {
          designRequests: 0,
          quoteRequests: 0,
          personalizationRequests: 0,
          orders: 0,
          contactMessages: 0
        } as UserActivitySummary;
      }
    },
    enabled: !!userId
  });

  // Handle copying data to clipboard
  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    toast({
      title: "Copied to clipboard",
      description: `${field} has been copied to your clipboard.`,
      duration: 2000,
    });
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    try {
      return format(new Date(dateString), "PPP pp");
    } catch (error) {
      return "Invalid date";
    }
  };

  const isLoading = isLoadingUser || isLoadingActivity;

  return (
    <Dialog open={!!userId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl overflow-y-auto max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">User Details</DialogTitle>
          <DialogDescription>
            Complete information about the selected user.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !user ? (
          <div className="py-4 text-center text-destructive">
            Failed to load user details.
          </div>
        ) : (
          <div className="space-y-6">
            {/* User Basic Info */}
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="bg-muted text-primary rounded-full w-20 h-20 flex items-center justify-center text-3xl font-bold">
                {user.name ? user.name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
              </div>
              
              <div className="space-y-2 flex-1">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  {user.name || user.username}
                  <Badge variant={user.role === "admin" ? "secondary" : user.role === "limited-admin" ? "default" : "outline"}>
                    {user.role || "customer"}
                  </Badge>
                  {user.emailVerified && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Verified
                    </Badge>
                  )}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="flex-1 truncate">{user.email}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7"
                      onClick={() => handleCopy(user.email, "Email")}
                    >
                      <Clipboard className={`h-4 w-4 ${copied === "Email" ? "text-green-500" : ""}`} />
                    </Button>
                  </div>
                  
                  {user.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{user.phone}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => handleCopy(user.phone!, "Phone")}
                      >
                        <Clipboard className={`h-4 w-4 ${copied === "Phone" ? "text-green-500" : ""}`} />
                      </Button>
                    </div>
                  )}
                  
                  {user.country && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{user.country}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Account Details */}
            <div>
              <h4 className="font-medium mb-2">Account Information</h4>
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <div className="text-sm text-muted-foreground">User ID</div>
                      <div className="font-medium">{user.id}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Username</div>
                      <div className="font-medium">{user.username}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Login ID</div>
                      <div className="font-medium">{user.loginID}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Account Created</div>
                      <div className="font-medium">{formatDate(user.createdAt)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Last Login</div>
                      <div className="font-medium">{formatDate(user.lastLogin)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Notification Preferences */}
            <div>
              <h4 className="font-medium mb-2">Notification Preferences</h4>
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${user.notifyDesignUpdates ? "bg-green-500" : "bg-gray-300"}`}></div>
                      <span className={user.notifyDesignUpdates ? "font-medium" : "text-muted-foreground"}>
                        Design Updates
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${user.notifyOrderStatus ? "bg-green-500" : "bg-gray-300"}`}></div>
                      <span className={user.notifyOrderStatus ? "font-medium" : "text-muted-foreground"}>
                        Order Status
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${user.notifyQuoteResponses ? "bg-green-500" : "bg-gray-300"}`}></div>
                      <span className={user.notifyQuoteResponses ? "font-medium" : "text-muted-foreground"}>
                        Quote Responses
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Activity Summary */}
            <div>
              <h4 className="font-medium mb-2">User Activity</h4>
              <Card>
                <CardContent className="p-4">
                  {isLoadingActivity ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  ) : !activity ? (
                    <div className="text-sm text-muted-foreground py-2">
                      Activity data not available
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <Button 
                          variant="ghost" 
                          className="text-center p-2 bg-muted rounded-lg hover:bg-muted/80 h-auto" 
                          onClick={() => window.location.href = `/admin/custom-designs?userId=${userId}`}
                        >
                          <div className="text-xl font-bold">{activity.designRequests}</div>
                          <div className="text-xs text-muted-foreground">Design Requests</div>
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="text-center p-2 bg-muted rounded-lg hover:bg-muted/80 h-auto" 
                          onClick={() => window.location.href = `/admin/quotes?userId=${userId}`}
                        >
                          <div className="text-xl font-bold">{activity.quoteRequests}</div>
                          <div className="text-xs text-muted-foreground">Quote Requests</div>
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="text-center p-2 bg-muted rounded-lg hover:bg-muted/80 h-auto" 
                          onClick={() => window.location.href = `/admin/customizations?userId=${userId}`}
                        >
                          <div className="text-xl font-bold">{activity.personalizationRequests}</div>
                          <div className="text-xs text-muted-foreground">Personalizations</div>
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="text-center p-2 bg-muted rounded-lg hover:bg-muted/80 h-auto" 
                          onClick={() => window.location.href = `/admin/orders?userId=${userId}`}
                        >
                          <div className="text-xl font-bold">{activity.orders}</div>
                          <div className="text-xs text-muted-foreground">Orders</div>
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="text-center p-2 bg-muted rounded-lg hover:bg-muted/80 h-auto" 
                          onClick={() => window.location.href = `/admin/contact?userId=${userId}`}
                        >
                          <div className="text-xl font-bold">{activity.contactMessages}</div>
                          <div className="text-xs text-muted-foreground">Messages</div>
                        </Button>
                      </div>
                      
                      {activity.lastActivity && (
                        <div className="flex items-center gap-2 text-sm">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                          <span>Last activity: {formatDate(activity.lastActivity)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={onClose}>Close</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
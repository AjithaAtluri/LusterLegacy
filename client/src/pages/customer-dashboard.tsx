import { useState, useMemo, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  PenTool, 
  Settings, 
  User, 
  ExternalLink,
  ArrowRight,
  MessageCircle,
  Package,
  Clock,
  CalendarDays,
  BarChart3,
  PlusCircle,
  DollarSign,
  Bell,
  Gem,
  Search,
  Filter,
  ShoppingBag,
  Palette,
  Check,
  Mail,
  Phone,
  MapPin,
  Lock,
  Shield
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Link, Redirect, useLocation } from "wouter";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function CustomerDashboard() {
  const { user, isLoading: isLoadingAuth } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  
  // Form state for profile updates
  const [nameValue, setNameValue] = useState("");
  const [phoneValue, setPhoneValue] = useState("");
  const [countryValue, setCountryValue] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Update form fields when user data changes
  useEffect(() => {
    if (user) {
      setNameValue(user.name || "");
      setPhoneValue(user.phone || "");
      setCountryValue(user.country || "");
    }
  }, [user]);
  
  // Update user profile fields
  const updateProfile = async (field: string, value: string) => {
    if (!user) return;
    
    try {
      setIsUpdatingProfile(true);
      const res = await fetch("/api/user/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ field, value })
      });
      
      if (!res.ok) {
        throw new Error(`Failed to update ${field}`);
      }
      
      const data = await res.json();
      
      toast({
        title: "Profile Updated",
        description: `Your ${field} has been updated successfully.`,
        variant: "default"
      });
      
      // Refresh user data
      window.location.reload();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update Failed",
        description: error.message || "There was an error updating your profile.",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };
  
  // Send email verification
  const sendVerificationEmail = async () => {
    if (!user) return;
    
    try {
      setIsVerifyingEmail(true);
      const res = await fetch("/api/user/send-verification", {
        method: "POST"
      });
      
      if (!res.ok) {
        throw new Error("Failed to send verification email");
      }
      
      const data = await res.json();
      
      toast({
        title: "Verification Email Sent",
        description: "A verification link has been sent to your email address.",
        variant: "default"
      });
      
      // For development and testing, show the verification link in console
      console.log("Verification link (for development only):", data.verificationLink);
    } catch (error) {
      console.error("Error sending verification email:", error);
      toast({
        title: "Verification Failed",
        description: error.message || "There was an error sending the verification email.",
        variant: "destructive"
      });
    } finally {
      setIsVerifyingEmail(false);
    }
  };
  
  // Change password
  const changePassword = async () => {
    if (!user) return;
    
    // Password validation
    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirmation do not match.",
        variant: "destructive"
      });
      return;
    }
    
    if (newPassword.length < 8) {
      toast({
        title: "Password Too Short",
        description: "New password must be at least 8 characters long.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsChangingPassword(true);
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          currentPassword, 
          newPassword 
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to change password");
      }
      
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
        variant: "default"
      });
      
      // Clear password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error changing password:", error);
      toast({
        title: "Password Change Failed",
        description: error.message || "There was an error changing your password.",
        variant: "destructive"
      });
    } finally {
      setIsChangingPassword(false);
    }
  };
  
  // This useEffect is already defined above
  
  // Redirect to auth page if not logged in
  if (!isLoadingAuth && !user) {
    return <Redirect to="/auth" />;
  }
  
  // Fetch all types of requests
  // 1. Customization requests (for existing products)
  const { data: customizationRequests, isLoading: isLoadingRequests } = useQuery({
    queryKey: ['/api/customization-requests/user'],
    enabled: !!user
  });
  
  // 2. Custom design requests 
  const { data: customDesigns, isLoading: isLoadingCustomDesigns } = useQuery({
    queryKey: ['/api/custom-designs/user'],
    enabled: !!user
  });
  
  // 3. Quote requests for existing products
  const { data: quoteRequests, isLoading: isLoadingQuoteRequests } = useQuery({
    queryKey: ['/api/quote-requests/user'],
    enabled: !!user
  });
  
  // Combine all design and customization requests
  const allRequests = useMemo(() => {
    // Get all custom designs
    // Process custom design requests (completely new designs from customer specifications)
    const designs = (customDesigns || []).map(req => ({ 
      ...req, 
      requestType: 'design',
      needsConsultationFee: true,
      description: 'Custom-designed jewelry from your specifications with up to 4 design iterations.'
    }));
    
    // Process quote requests (requests for final pricing on unmodified catalog items)
    const quotes = (quoteRequests || []).map(req => ({ 
      ...req, 
      requestType: 'quote',
      needsConsultationFee: false,
      description: 'Price quote for a catalog item without modifications.'
    }));
    
    // Process personalization requests (modifications to existing products)
    // Filter out any duplicates that match design request IDs
    const customizations = (customizationRequests || [])
      .filter(req => !designs.some(design => design.id === req.id))
      .map(req => ({ 
        ...req, 
        requestType: 'customization',
        needsConsultationFee: false,
        description: 'Product personalization request for modifying an existing product.'
      }));
    
    // Combine all requests
    const requests = [...designs, ...customizations, ...quotes];
    
    // Sort by date
    return requests.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [customizationRequests, customDesigns, quoteRequests]);

  // Filter requests by search query and filters
  const filteredRequests = useMemo(() => {
    if (!allRequests) return [];
    
    return allRequests.filter(request => {
      // Apply search filter (on item name or request ID)
      const searchMatch = searchQuery === "" || 
        request.id?.toString().includes(searchQuery) || 
        (request.productName && request.productName.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Apply status filter
      const statusMatch = statusFilter === "all" || request.status === statusFilter;
      
      // Apply type filter  
      const typeMatch = typeFilter === "all" || request.requestType === typeFilter;
      
      return searchMatch && statusMatch && typeMatch;
    });
  }, [allRequests, searchQuery, statusFilter, typeFilter]);

  // Count requests by type and status
  const stats = useMemo(() => {
    if (!allRequests) return { total: 0, pending: 0, inProgress: 0, completed: 0 };
    
    return {
      total: allRequests.length,
      pending: allRequests.filter(r => r.status === 'pending').length,
      inProgress: allRequests.filter(r => ['design_fee_paid', 'quoted', 'in_progress'].includes(r.status)).length,
      completed: allRequests.filter(r => ['completed', 'approved'].includes(r.status)).length,
      customDesigns: allRequests.filter(r => r.requestType === 'design').length,
      customizations: allRequests.filter(r => r.requestType === 'customization').length,
      quotes: allRequests.filter(r => r.requestType === 'quote').length
    };
  }, [allRequests]);

  // Get the status badge color based on status
  const getStatusBadgeClasses = (status) => {
    switch(status) {
      case 'pending':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'design_fee_paid':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300';
      case 'quoted':
      case 'in_progress':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'completed':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // Format status display text
  const formatStatus = (status) => {
    if (!status) return 'Pending';
    
    if (status === 'design_fee_paid') return 'Design Fee Paid';
    
    // Convert snake_case to Title Case
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Format request type display
  const formatRequestType = (type) => {
    switch(type) {
      case 'design': return 'Custom Design';
      case 'customization': return 'Product Personalization';
      case 'quote': return 'Quote Request';
      default: return type;
    }
  };

  // Get request type color
  const getRequestTypeColor = (type) => {
    switch(type) {
      case 'design': return 'text-purple-500';
      case 'customization': return 'text-amber-500';
      case 'quote': return 'text-teal-500';
      default: return 'text-primary';
    }
  };

  // Get the appropriate icon for the request type
  const getRequestTypeIcon = (type) => {
    switch(type) {
      case 'design': return <PenTool className="h-5 w-5" />;
      case 'customization': return <Palette className="h-5 w-5" />;
      case 'quote': return <DollarSign className="h-5 w-5" />;
      default: return <Package className="h-5 w-5" />;
    }
  };

  // Get the URL for the request details page
  const getRequestUrl = (request) => {
    switch(request.requestType) {
      case 'design': return `/custom-designs/${request.id}`;
      case 'customization': return `/customization-requests/${request.id}`;
      case 'quote': return `/quote-requests/${request.id}`;
      default: return '#';
    }
  };

  // Loading state
  const isLoading = isLoadingRequests || isLoadingCustomDesigns || isLoadingQuoteRequests;

  // Empty state
  const isEmpty = !isLoading && (!allRequests || allRequests.length === 0);

  return (
    <>
      <Helmet>
        <title>My Account | Luster Legacy</title>
        <meta name="description" content="Manage your account and custom jewelry requests" />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header with user info */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="font-playfair text-3xl font-bold text-foreground mb-2">My Dashboard</h1>
              <p className="font-montserrat text-foreground/70">
                Track your custom jewelry requests and manage your account
              </p>
            </div>
            {user && (
              <div className="flex items-center bg-background rounded-lg p-3 border shadow-sm">
                <Avatar className="h-12 w-12 mr-3">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {((user.name || user.loginID || user.email || "User")).substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-montserrat font-medium">{user.name || user.loginID}</p>
                  <p className="text-sm text-foreground/60">{user.email}</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Main dashboard tabs */}
          <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="bg-background border rounded-lg p-1 mb-6">
              <TabsList className="grid grid-cols-3 h-auto">
                <TabsTrigger value="overview" className="flex items-center py-3">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  <span>Overview</span>
                </TabsTrigger>
                <TabsTrigger value="requests" className="flex items-center py-3">
                  <Gem className="mr-2 h-4 w-4" />
                  <span>My Requests</span>
                  {stats.total > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs">{stats.total}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center py-3">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Account</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">Total Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold">{stats.total}</div>
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">Pending</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold">{stats.pending}</div>
                      <div className="p-2 bg-blue-500/10 rounded-full">
                        <Clock className="h-5 w-5 text-blue-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">In Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold">{stats.inProgress}</div>
                      <div className="p-2 bg-amber-500/10 rounded-full">
                        <PenTool className="h-5 w-5 text-amber-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">Completed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold">{stats.completed}</div>
                      <div className="p-2 bg-green-500/10 rounded-full">
                        <ShoppingBag className="h-5 w-5 text-green-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Request Types Guide */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Request Types Guide</CardTitle>
                  <CardDescription>Understanding our different jewelry request options</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/20 rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-100 dark:bg-purple-800/20 rounded-full">
                          <PenTool className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="font-medium">Custom Design</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Create completely custom jewelry pieces from your vision and specifications.
                      </p>
                      <ul className="text-xs space-y-1.5 text-foreground/80">
                        <li className="flex items-start">
                          <span className="text-purple-500 mr-1.5">•</span>
                          <span>$150 consultation fee covers up to 4 design iterations</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-purple-500 mr-1.5">•</span>
                          <span>Upload sketches, inspirations, and detailed specifications</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-purple-500 mr-1.5">•</span>
                          <span>Receive CAD designs and final quote before production</span>
                        </li>
                      </ul>
                      <Button variant="link" className="text-purple-600 dark:text-purple-400 p-0 h-auto mt-4" asChild>
                        <Link href="/custom-design">
                          Submit Custom Design Request <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                    
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-100 dark:bg-amber-800/20 rounded-full">
                          <Palette className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <h3 className="font-medium">Product Personalization</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Personalize existing catalog pieces to your preferences.
                      </p>
                      <ul className="text-xs space-y-1.5 text-foreground/80">
                        <li className="flex items-start">
                          <span className="text-amber-500 mr-1.5">•</span>
                          <span>No consultation fee required</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-amber-500 mr-1.5">•</span>
                          <span>Change metals, stones, sizes, or other details</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-amber-500 mr-1.5">•</span>
                          <span>Receive personalization quote before committing</span>
                        </li>
                      </ul>
                      <Button variant="link" className="text-amber-600 dark:text-amber-400 p-0 h-auto mt-4">
                        <Link href="/collections">
                          Browse Products to Personalize <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                    
                    <div className="p-4 bg-teal-50 dark:bg-teal-900/10 border border-teal-100 dark:border-teal-900/20 rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-teal-100 dark:bg-teal-800/20 rounded-full">
                          <DollarSign className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                        </div>
                        <h3 className="font-medium">Quote Request</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Request final pricing and availability for standard catalog items.
                      </p>
                      <ul className="text-xs space-y-1.5 text-foreground/80">
                        <li className="flex items-start">
                          <span className="text-teal-500 mr-1.5">•</span>
                          <span>No consultation fee required</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-teal-500 mr-1.5">•</span>
                          <span>Get exact pricing based on current material costs</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-teal-500 mr-1.5">•</span>
                          <span>Specify your currency and shipping preferences</span>
                        </li>
                      </ul>
                      <Button variant="link" className="text-teal-600 dark:text-teal-400 p-0 h-auto mt-4">
                        <Link href="/collections">
                          Browse Products to Quote <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Recent Requests */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-lg">Recent Requests</CardTitle>
                    <CardDescription>Your most recent jewelry requests</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab("requests")}>
                    View All <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p>Loading your requests...</p>
                    </div>
                  ) : isEmpty ? (
                    <div className="text-center py-10">
                      <Gem className="h-16 w-16 mx-auto mb-4 text-foreground/20" />
                      <h3 className="font-playfair text-xl font-medium mb-2">No requests yet</h3>
                      <p className="font-montserrat text-foreground/60 mb-6">
                        You haven't submitted any jewelry requests yet.
                      </p>
                      <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Button asChild>
                          <Link href="/custom-design">
                            Start Custom Design <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="outline" asChild>
                          <Link href="/collections">
                            Browse Collections
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {allRequests.slice(0, 3).map((request) => (
                        <div key={`${request.requestType}-${request.id}`} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${
                              request.requestType === 'design' 
                                ? 'bg-purple-100 dark:bg-purple-900/20' 
                                : request.requestType === 'customization'
                                ? 'bg-amber-100 dark:bg-amber-900/20'
                                : 'bg-teal-100 dark:bg-teal-900/20'
                            }`}>
                              {getRequestTypeIcon(request.requestType)}
                            </div>
                            <div>
                              <div className="font-medium">
                                {formatRequestType(request.requestType)} #{request.id}
                              </div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{formatDate(request.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 text-xs rounded-full inline-flex items-center ${getStatusBadgeClasses(request.status)}`}>
                              <span className="w-1.5 h-1.5 rounded-full mr-1 bg-current"></span>
                              <span>{formatStatus(request.status)}</span>
                            </span>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={getRequestUrl(request)}>
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                {!isEmpty && allRequests && allRequests.length > 3 && (
                  <CardFooter className="flex justify-center border-t pt-4">
                    <Button variant="ghost" onClick={() => setActiveTab("requests")}>
                      View All {allRequests.length} Requests
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </TabsContent>
            
            {/* Requests Tab */}
            <TabsContent value="requests" className="space-y-6">
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle>All Requests</CardTitle>
                      <CardDescription>Track and manage your jewelry requests</CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button size="sm" asChild>
                        <Link href="/custom-design">
                          <PlusCircle className="mr-1.5 h-4 w-4" />
                          New Request
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                {/* Filter Controls */}
                <div className="px-6 pb-4 border-b">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search by ID or product name" 
                        className="pl-8"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="design_fee_paid">Design Fee Paid</SelectItem>
                        <SelectItem value="quoted">Quoted</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="design">Custom Design</SelectItem>
                        <SelectItem value="customization">Product Personalization</SelectItem>
                        <SelectItem value="quote">Quote Request</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Status Legend */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Badge variant="outline" className="bg-blue-100/50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                      <span className="w-1.5 h-1.5 rounded-full mr-1 bg-blue-500"></span>
                      Pending
                    </Badge>
                    <Badge variant="outline" className="bg-indigo-100/50 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800">
                      <span className="w-1.5 h-1.5 rounded-full mr-1 bg-indigo-500"></span>
                      Design Fee Paid
                    </Badge>
                    <Badge variant="outline" className="bg-amber-100/50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                      <span className="w-1.5 h-1.5 rounded-full mr-1 bg-amber-500"></span>
                      Quoted/In Progress
                    </Badge>
                    <Badge variant="outline" className="bg-green-100/50 text-green-800 dark:bg-green-900/20 dark:text-green-300 border-green-200 dark:border-green-800">
                      <span className="w-1.5 h-1.5 rounded-full mr-1 bg-green-500"></span>
                      Approved
                    </Badge>
                    <Badge variant="outline" className="bg-red-100/50 text-red-800 dark:bg-red-900/20 dark:text-red-300 border-red-200 dark:border-red-800">
                      <span className="w-1.5 h-1.5 rounded-full mr-1 bg-red-500"></span>
                      Rejected
                    </Badge>
                    <Badge variant="outline" className="bg-purple-100/50 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                      <span className="w-1.5 h-1.5 rounded-full mr-1 bg-purple-500"></span>
                      Completed
                    </Badge>
                  </div>
                </div>
                
                <CardContent className="pt-6">
                  {isLoading ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p>Loading your requests...</p>
                    </div>
                  ) : isEmpty ? (
                    <div className="text-center py-10">
                      <Gem className="h-16 w-16 mx-auto mb-4 text-foreground/20" />
                      <h3 className="font-playfair text-xl font-medium mb-2">No requests yet</h3>
                      <p className="font-montserrat text-foreground/60 mb-6">
                        You haven't submitted any jewelry requests yet.
                      </p>
                      <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Button asChild>
                          <Link href="/custom-design">
                            Start Custom Design <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="outline" asChild>
                          <Link href="/collections">
                            Browse Collections
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ) : filteredRequests.length === 0 ? (
                    <div className="text-center py-10">
                      <Search className="h-16 w-16 mx-auto mb-4 text-foreground/20" />
                      <h3 className="font-playfair text-xl font-medium mb-2">No matching requests</h3>
                      <p className="font-montserrat text-foreground/60 mb-6">
                        Try adjusting your filters or search query
                      </p>
                      <Button variant="outline" onClick={() => {
                        setSearchQuery("");
                        setStatusFilter("all");
                        setTypeFilter("all");
                      }}>
                        Clear Filters
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredRequests.map((request) => (
                        <Card key={`${request.requestType}-${request.id}`} className="overflow-hidden">
                          <div className="flex flex-col md:flex-row">
                            {/* Left side: request info */}
                            <div className="flex-grow p-4 md:p-6">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-full ${
                                    request.requestType === 'design' 
                                      ? 'bg-purple-100 dark:bg-purple-900/20' 
                                      : request.requestType === 'customization'
                                      ? 'bg-amber-100 dark:bg-amber-900/20'
                                      : 'bg-teal-100 dark:bg-teal-900/20'
                                  }`}>
                                    {getRequestTypeIcon(request.requestType)}
                                  </div>
                                  <div>
                                    <h3 className="font-medium text-lg flex items-center">
                                      <span className={getRequestTypeColor(request.requestType)}>
                                        {formatRequestType(request.requestType)}
                                      </span>
                                      <span className="ml-2">#{request.id}</span>
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <CalendarDays className="h-3.5 w-3.5" />
                                      <span>{formatDate(request.createdAt)}</span>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <span className={`px-3 py-1 text-sm rounded-full inline-flex items-center ${getStatusBadgeClasses(request.status)}`}>
                                    <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current"></span>
                                    <span>{formatStatus(request.status)}</span>
                                  </span>
                                </div>
                              </div>
                              
                              {/* Request details */}
                              <div className="mb-4">
                                {request.productName && (
                                  <div className="mb-2">
                                    <h4 className="text-sm font-medium">Product</h4>
                                    <p>{request.productName}</p>
                                  </div>
                                )}
                                
                                {request.description && (
                                  <div className="mb-2">
                                    <h4 className="text-sm font-medium">Description</h4>
                                    <p className="text-sm text-muted-foreground">{request.description}</p>
                                  </div>
                                )}
                                
                                {request.additionalNotes && (
                                  <div>
                                    <h4 className="text-sm font-medium">Notes</h4>
                                    <p className="text-sm text-muted-foreground line-clamp-2">{request.additionalNotes}</p>
                                  </div>
                                )}
                              </div>
                              
                              {/* Price information if available */}
                              {(request.estimatedPrice || request.consultationFee) && (
                                <div className="mb-4 p-3 bg-muted/20 rounded-md">
                                  {request.consultationFee && (
                                    <div className="flex justify-between text-sm">
                                      <span>Consultation Fee:</span>
                                      <span className="font-medium">{formatCurrency(request.consultationFee, request.currency || 'USD')}</span>
                                    </div>
                                  )}
                                  {request.estimatedPrice && (
                                    <div className="flex justify-between text-sm">
                                      <span>Estimated Price:</span>
                                      <span className="font-medium">{formatCurrency(request.estimatedPrice, request.currency || 'USD')}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            {/* Right side: actions */}
                            <div className="bg-muted/10 p-4 md:p-6 flex flex-row md:flex-col justify-between md:justify-center items-center md:border-l md:min-w-[180px]">
                              <Button variant="default" size="sm" className="w-full" asChild>
                                <Link href={getRequestUrl(request)}>
                                  View Details
                                </Link>
                              </Button>
                              
                              {request.status === 'quoted' && (
                                <Button variant="outline" size="sm" className="mt-2 w-full">
                                  Approve Quote
                                </Button>
                              )}
                              
                              {request.status === 'pending' && request.requestType === 'design' && (
                                <Button variant="outline" size="sm" className="mt-2 w-full">
                                  Pay Design Fee
                                </Button>
                              )}
                              
                              <Button variant="ghost" size="sm" className="mt-2 w-full">
                                <MessageCircle className="h-4 w-4 mr-1.5" />
                                Contact
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Settings Tab */}
            <TabsContent value="settings">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                    <CardDescription>Update your personal details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Name Field */}
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-center">
                        <User className="h-5 w-5 text-muted-foreground mr-2" />
                        <h3 className="text-sm font-medium">Name</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input 
                          placeholder="Enter your full name" 
                          value={nameValue}
                          onChange={(e) => setNameValue(e.target.value)}
                          className="max-w-md"
                        />
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="shrink-0" 
                          onClick={() => updateProfile("name", nameValue)}
                          disabled={isUpdatingProfile || nameValue === user?.name || !nameValue.trim()}
                        >
                          {isUpdatingProfile ? 
                            <span className="flex items-center gap-1">
                              <span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin"></span>
                              <span>Saving</span>
                            </span> : 
                            "Update"
                          }
                        </Button>
                      </div>
                    </div>
                    
                    {/* Login ID Field (Read-only) */}
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-center">
                        <User className="h-5 w-5 text-muted-foreground mr-2" />
                        <h3 className="text-sm font-medium">Login ID</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input 
                          value={user?.loginID || ""}
                          className="max-w-md bg-muted/20"
                          readOnly
                        />
                        {user?.loginID === "Ajitha M" ? (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="shrink-0"
                            disabled={isUpdatingProfile}
                            onClick={async () => {
                              try {
                                setIsUpdatingProfile(true);
                                const res = await fetch("/api/user/update-login-id", {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json"
                                  },
                                  body: JSON.stringify({ loginID: "AjithaM" })
                                });
                                
                                if (!res.ok) {
                                  const errorData = await res.json();
                                  throw new Error(errorData.message || "Failed to update login ID");
                                }
                                
                                const updatedUser = await res.json();
                                toast({
                                  title: "Login ID Updated",
                                  description: "Your login ID has been updated to AjithaM",
                                });
                                
                                // Force reload to update the session
                                window.location.reload();
                              } catch (error: any) {
                                toast({
                                  title: "Update Failed",
                                  description: error.message || "Failed to update login ID",
                                  variant: "destructive"
                                });
                              } finally {
                                setIsUpdatingProfile(false);
                              }
                            }}
                          >
                            {isUpdatingProfile ? (
                              <span className="flex items-center gap-1">
                                <span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin"></span>
                                <span>Updating</span>
                              </span>
                            ) : (
                              "Fix Login ID Format"
                            )}
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="shrink-0 opacity-50 cursor-not-allowed"
                            disabled={true}
                          >
                            Cannot Change
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Your login ID cannot be changed and is used to sign in to your account.
                      </p>
                    </div>
                    
                    {/* Email Field with Verify Button */}
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-center">
                        <Mail className="h-5 w-5 text-muted-foreground mr-2" />
                        <h3 className="text-sm font-medium">Email</h3>
                        {user?.emailVerified ? (
                          <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                            <Check className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
                            Unverified
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground px-3 py-2 border rounded-md flex-grow bg-muted/10">
                          {user?.email || "Not provided"}
                        </p>
                        {!user?.emailVerified && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="shrink-0"
                            onClick={sendVerificationEmail}
                            disabled={isVerifyingEmail}
                          >
                            {isVerifyingEmail ? (
                              <span className="flex items-center gap-1">
                                <span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin"></span>
                                <span>Sending</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                                Verify
                              </span>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Phone Number Field */}
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-center">
                        <Phone className="h-5 w-5 text-muted-foreground mr-2" />
                        <h3 className="text-sm font-medium">Phone Number</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input 
                          placeholder="Enter your phone number" 
                          defaultValue={user?.phone || ""} 
                          value={phoneValue}
                          onChange={(e) => setPhoneValue(e.target.value)}
                          className="max-w-md"
                        />
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="shrink-0"
                          onClick={() => updateProfile("phone", phoneValue)}
                          disabled={isUpdatingProfile || phoneValue === user?.phone}
                        >
                          {isUpdatingProfile ? 
                            <span className="flex items-center gap-1">
                              <span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin"></span>
                              <span>Saving</span>
                            </span> : 
                            "Update"
                          }
                        </Button>
                      </div>
                    </div>
                    
                    {/* Country Field */}
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-center">
                        <MapPin className="h-5 w-5 text-muted-foreground mr-2" />
                        <h3 className="text-sm font-medium">Country</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select 
                          defaultValue={user?.country || ""} 
                          value={countryValue}
                          onValueChange={setCountryValue}
                        >
                          <SelectTrigger className="max-w-md">
                            <SelectValue placeholder="Select your country" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="in">India</SelectItem>
                            <SelectItem value="us">United States</SelectItem>
                            <SelectItem value="uk">United Kingdom</SelectItem>
                            <SelectItem value="ca">Canada</SelectItem>
                            <SelectItem value="au">Australia</SelectItem>
                            <SelectItem value="sg">Singapore</SelectItem>
                            <SelectItem value="ae">UAE</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="shrink-0"
                          onClick={() => updateProfile("country", countryValue)}
                          disabled={isUpdatingProfile || countryValue === user?.country || !countryValue}
                        >
                          {isUpdatingProfile ? 
                            <span className="flex items-center gap-1">
                              <span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin"></span>
                              <span>Saving</span>
                            </span> : 
                            "Update"
                          }
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="default">
                      Save All Changes
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Bell className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <CardTitle>Notifications</CardTitle>
                        <CardDescription>Manage your notification preferences</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium mb-3">Email Notifications</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between py-2 px-3 bg-muted/10 rounded-md">
                            <div>
                              <p className="text-sm font-medium">Custom Design Updates</p>
                              <p className="text-xs text-muted-foreground">Get notified when your design is reviewed or updated</p>
                            </div>
                            <Switch id="email-design-updates" defaultChecked />
                          </div>
                          
                          <div className="flex items-center justify-between py-2 px-3 bg-muted/10 rounded-md">
                            <div>
                              <p className="text-sm font-medium">Order Status Changes</p>
                              <p className="text-xs text-muted-foreground">Receive notifications about your order status</p>
                            </div>
                            <Switch id="email-order-updates" defaultChecked />
                          </div>
                          
                          <div className="flex items-center justify-between py-2 px-3 bg-muted/10 rounded-md">
                            <div>
                              <p className="text-sm font-medium">Quote Responses</p>
                              <p className="text-xs text-muted-foreground">Get notified when you receive a quote</p>
                            </div>
                            <Switch id="email-quote-updates" defaultChecked />
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h3 className="text-sm font-medium mb-3">Marketing Communications</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between py-2 px-3 bg-muted/10 rounded-md">
                            <div>
                              <p className="text-sm font-medium">Promotions and Discounts</p>
                              <p className="text-xs text-muted-foreground">Special offers and limited-time discounts</p>
                            </div>
                            <Switch id="marketing-promotions" />
                          </div>
                          
                          <div className="flex items-center justify-between py-2 px-3 bg-muted/10 rounded-md">
                            <div>
                              <p className="text-sm font-medium">New Collection Updates</p>
                              <p className="text-xs text-muted-foreground">Be the first to know about new jewelry collections</p>
                            </div>
                            <Switch id="marketing-new-collections" defaultChecked />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button>Save Notification Preferences</Button>
                  </CardFooter>
                </Card>
                
                <Card className="md:col-span-2">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <CardTitle>Privacy & Security</CardTitle>
                        <CardDescription>Manage your account security</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Left Column - Password Change */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Lock className="h-5 w-5 text-muted-foreground" />
                          <h3 className="text-sm font-medium">Change Password</h3>
                        </div>
                        <div className="space-y-3 bg-muted/10 p-4 rounded-md border">
                          <div className="space-y-1">
                            <Label htmlFor="current-password">Current Password</Label>
                            <Input id="current-password" type="password" />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input id="new-password" type="password" />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="confirm-password">Confirm New Password</Label>
                            <Input id="confirm-password" type="password" />
                          </div>
                          <Button className="mt-2 w-full">Update Password</Button>
                        </div>
                      </div>
                      
                      {/* Right Column - Verification */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Mail className="h-5 w-5 text-muted-foreground" />
                          <h3 className="text-sm font-medium">Account Verification</h3>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between py-3 px-4 bg-amber-50 dark:bg-amber-900/10 rounded-md border border-amber-200 dark:border-amber-900/50">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                              <div>
                                <p className="text-sm font-medium">Email Verification</p>
                                <p className="text-xs text-muted-foreground">Verify your email address</p>
                              </div>
                            </div>
                            <Button size="sm" variant="outline">Verify</Button>
                          </div>
                          
                          <div className="flex items-center justify-between py-3 px-4 bg-muted/10 rounded-md border">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-slate-400"></div>
                              <div>
                                <p className="text-sm font-medium">Phone Verification</p>
                                <p className="text-xs text-muted-foreground">Verify your phone number</p>
                              </div>
                            </div>
                            <Button size="sm" variant="outline">Verify</Button>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            <h3 className="text-sm font-medium">Login Activity</h3>
                          </div>
                          <div className="mt-2 bg-muted/10 p-3 rounded-md border">
                            <p className="text-xs text-muted-foreground">Last login: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
                            <p className="text-xs text-muted-foreground">Device: Web Browser</p>
                            <p className="text-xs text-muted-foreground mt-1">Location: Unknown</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Account Data & Privacy Section */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <h3 className="text-sm font-medium">Account Data & Privacy</h3>
                      </div>
                      
                      <div className="grid gap-4">
                        <div className="flex items-center justify-between py-3 px-4 bg-red-50 dark:bg-red-900/10 rounded-md border border-red-200 dark:border-red-900/50">
                          <div className="space-y-0.5">
                            <p className="text-sm font-medium text-red-600 dark:text-red-400">Delete account</p>
                            <p className="text-xs text-muted-foreground">
                              Permanently remove your account and all associated data
                            </p>
                          </div>
                          <Button variant="destructive" size="sm">
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
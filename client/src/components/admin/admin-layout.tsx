import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Package,
  GalleryHorizontal,
  ShoppingBag,
  UserCircle,
  LogOut,
  Menu,
  X,
  Diamond,
  Gem,
  Sparkles,
  Paintbrush,
  Receipt,
  Wand2,
  PlusCircle,
  MessageSquare,
  Users,
  MessageCircle,
  ChevronRight,
  ChevronDown,
  AlertCircle
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
// Import our new utilities
import { useLoadingTimeout } from "@/hooks/use-loading-timeout";
import { 
  getAdminAuth, 
  isValidAdminAuth, 
  saveAdminAuth 
} from "@/lib/admin-auth-storage";
import { 
  verifyAdminAuth, 
  emergencyAdminAuth, 
  syncAdminCookie 
} from "@/lib/admin-auth-api";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const [, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCustomerRequestsOpen, setIsCustomerRequestsOpen] = useState(true); // Always expanded by default
  const { toast } = useToast();
  
  // State to track if direct API admin check is in progress
  const [directAdminCheckInProgress, setDirectAdminCheckInProgress] = useState(false);
  
  // State to track if we've performed emergency authentication
  const [performedEmergencyAuth, setPerformedEmergencyAuth] = useState(false);
  
  // Track environment
  const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';
  const [environment] = useState(isProduction ? 'Production' : 'Development');
  
  // Use the main auth hook for authentication including stable loading state
  const { user, isLoading, stableLoading, error, logoutMutation } = useAuth();
  
  // Monitor loading state for timeouts
  const { hasTimedOut, timeElapsed } = useLoadingTimeout(stableLoading, 7000);
  
  // Fetch data for pending request counts
  const { data: customDesigns } = useQuery({
    queryKey: ['/api/custom-designs'],
    enabled: !!user?.id
  });
  
  // Using personalization terminology while keeping the original API endpoint for backward compatibility
  const { data: personalizationRequests } = useQuery({
    queryKey: ['/api/customization-requests'], // Original endpoint name preserved for compatibility
    enabled: !!user?.id
  });
  
  const { data: quoteRequests } = useQuery({
    queryKey: ['/api/quote-requests'],
    enabled: !!user?.id
  });

  // Fetch contact messages to count unread ones
  const { data: contactMessages } = useQuery({
    queryKey: ['/api/admin/contact'],
    enabled: !!user?.id
  });
  
  // Count pending requests
  const pendingDesigns = Array.isArray(customDesigns) 
    ? customDesigns.filter((design: any) => design.status === "pending").length 
    : 0;
    
  const pendingPersonalizations = Array.isArray(personalizationRequests) 
    ? personalizationRequests.filter((req: any) => req.status === "pending").length 
    : 0;
    
  const pendingQuotes = Array.isArray(quoteRequests) 
    ? quoteRequests.filter((req: any) => req.status === "pending").length 
    : 0;

  // Count unread messages
  const unreadMessages = Array.isArray(contactMessages)
    ? contactMessages.filter((message: any) => message.isRead === false).length
    : 0;

  // Check if the user is an admin
  const isAdmin = user?.role === 'admin' || user?.role === 'limited-admin';
    
  // Log authentication state for debugging
  useEffect(() => {
    console.log('Admin layout - checking auth state:', {
      user,
      isLoading,
      stableLoading,
      loadingTimeout: hasTimedOut
    });
    console.log(`Admin layout - environment detected: ${environment}`);
  }, [user, isLoading, stableLoading, hasTimedOut, environment]);
  
  // Effect to check for cached admin credentials in session storage
  useEffect(() => {
    // If we're loading or already have a user, skip this
    if (isLoading || user) {
      return;
    }
    
    // Try to load cached admin auth data
    const cachedAdminAuth = getAdminAuth();
    if (cachedAdminAuth) {
      console.log('Loaded cached user data from session storage:', cachedAdminAuth);
      
      // In production, assume cached data is valid and use it immediately
      // This prevents the infinite loading state while the API checks happen
      if (isProduction) {
        console.log('Production environment with cached data - bypassing loading state');
      }
    }
  }, [isLoading, user, isProduction]);
  
  // Effect to check for admin authentication timeout
  useEffect(() => {
    // If we've already handled this timeout, don't try again
    if (hasTimedOut && !performedEmergencyAuth && !directAdminCheckInProgress) {
      setDirectAdminCheckInProgress(true);
      
      // If we're in a timeout situation, but have a cached admin user,
      // allow access but try to verify in the background
      const cachedAdminAuth = getAdminAuth();
      
      if (cachedAdminAuth && isValidAdminAuth()) {
        console.log('Admin layout - cached user appears to be admin, verifying with direct API call');
        
        // Attempt to verify the admin status directly with API
        console.log('Admin layout - checking admin auth endpoint...');
        
        // Perform emergency admin auth check
        (async () => {
          try {
            const adminAuthResult = await verifyAdminAuth({ 
              forceRefresh: true,
              storeResult: true
            });
            
            if (adminAuthResult) {
              console.log('Admin layout - admin auth check successful:', adminAuthResult.username || adminAuthResult.loginID);
              console.log('Admin layout - user is verified admin via /api/auth/me');
              
              // Also refresh the admin cookie
              await syncAdminCookie(adminAuthResult.id);
              
              // Update React Query cache to help break any loading state
              import("@/lib/queryClient").then(({queryClient}) => {
                queryClient.setQueryData(["/api/user"], adminAuthResult);
              });
            } else {
              console.error('Admin layout - admin auth check failed');
              // Despite failed check, still use cached data if we have it
              if (cachedAdminAuth) {
                console.log('Error in auth check but cached user is admin - allowing access but may encounter further issues');
              }
            }
          } catch (error) {
            console.error('Error during admin auth check:', error);
            // Still use cached data if we have it
            if (cachedAdminAuth) {
              console.log('Error in optimized auth path:', error);
            }
          } finally {
            setDirectAdminCheckInProgress(false);
            setPerformedEmergencyAuth(true);
          }
        })();
      } else {
        // No cached admin auth, perform emergency authentication
        console.log('Admin layout - no cached admin data, attempting emergency authentication');
        
        (async () => {
          try {
            // Try to get the admin ID from URL if available
            let adminId: number | undefined;
            try {
              const urlParams = new URLSearchParams(window.location.search);
              const adminIdParam = urlParams.get('admin_id');
              if (adminIdParam) {
                adminId = parseInt(adminIdParam);
                if (isNaN(adminId)) adminId = undefined;
              }
            } catch (e) {
              console.warn('Failed to parse admin_id from URL:', e);
            }
            
            // Use our improved emergency auth function
            const emergencyAuthResult = await emergencyAdminAuth(adminId);
            
            if (emergencyAuthResult) {
              console.log('Admin layout - emergency admin auth successful:', emergencyAuthResult.username || emergencyAuthResult.loginID);
              
              // Update React Query cache to help break any loading state
              import("@/lib/queryClient").then(({queryClient}) => {
                queryClient.setQueryData(["/api/user"], emergencyAuthResult);
              });
            } else {
              console.error('Admin layout - emergency admin auth failed');
              toast({
                title: "Authentication Error",
                description: "Failed to verify admin access. Please try logging in again.",
                variant: "destructive"
              });
            }
          } catch (error) {
            console.error('Error during emergency admin auth:', error);
          } finally {
            setDirectAdminCheckInProgress(false);
            setPerformedEmergencyAuth(true);
          }
        })();
      }
    }
  }, [hasTimedOut, performedEmergencyAuth, directAdminCheckInProgress, toast]);
  
  // Redirect to login page if not authenticated or not an admin
  // Use a separate state and timeout to handle loading situations
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  useEffect(() => {
    // Set a maximum loading time of 2 seconds
    if (isLoading || stableLoading) {
      // Set a timeout to force continuation after 2 seconds
      const timer = setTimeout(() => {
        console.log("Admin layout - loading timeout reached");
        setLoadingTimeout(true);
      }, 2000);
      
      return () => clearTimeout(timer); // Clean up the timer
    } else {
      setLoadingTimeout(false); // Reset when loading completes
    }
  }, [isLoading, stableLoading]);

  useEffect(() => {
    const checkAdminAuth = async () => {
      console.log("Admin layout - checking auth state:", { 
        user, 
        isLoading, 
        stableLoading,
        loadingTimeout 
      });
      
      // Check if there's a valid admin user already
      if (user && (user.role === 'admin' || user.role === 'limited-admin')) {
        console.log('Admin layout - authenticated admin user found:', user.username || user.loginID);
        // Store in session storage for future emergency checks
        saveAdminAuth({
          id: user.id,
          username: user.username,
          loginID: user.loginID,
          role: user.role,
          email: user.email,
          authTime: Date.now(),
          authSource: 'react_query'
        });
        return; // Already authenticated as admin, nothing else to do
      }
      
      // Only proceed with emergency checks if we're loading or timed out
      if ((isLoading || stableLoading) && !loadingTimeout) {
        console.log("Admin layout - waiting for auth state to load...");
        
        // Enhanced emergency direct check after 1 second to exit infinite loading situations
        setTimeout(async () => {
          if (isLoading || stableLoading) {
            try {
              console.log("Admin layout - emergency direct admin check");
              
              // First check cache from our storage utility
              const cachedAdminAuth = getAdminAuth();
              if (cachedAdminAuth && isValidAdminAuth()) {
                console.log("Admin verified via utility cache - bypassing React Query");
                
                // Update React Query cache to help break the loading state
                import("@/lib/queryClient").then(({queryClient}) => {
                  queryClient.setQueryData(["/api/user"], cachedAdminAuth);
                });
                
                // Don't redirect, let the auth check continue naturally with the cached data
                return;
              }
              
              // Cache not available, try direct API verification
              const adminAuthResult = await verifyAdminAuth({ 
                forceRefresh: true, 
                storeResult: true
              });
              
              if (adminAuthResult) {
                console.log("Admin verified via direct auth API - bypassing React Query");
                
                // Update React Query cache to help break the loading state
                import("@/lib/queryClient").then(({queryClient}) => {
                  queryClient.setQueryData(["/api/user"], adminAuthResult);
                });
                
                // Also sync the admin cookie for future requests
                await syncAdminCookie(adminAuthResult.id);
                
                // Don't redirect, let the auth check continue naturally
                return;
              }
              
              // If all else fails, try the emergency admin auth
              const emergencyAuthResult = await emergencyAdminAuth();
              if (emergencyAuthResult) {
                console.log("Admin verified via emergency auth - bypassing React Query");
                
                // Update React Query cache to help break the loading state
                import("@/lib/queryClient").then(({queryClient}) => {
                  queryClient.setQueryData(["/api/user"], emergencyAuthResult);
                });
                
                // Don't redirect, let the auth check continue naturally
                return;
              }
              
              // If all checks failed, redirect to login
              console.log("All emergency admin checks failed - redirecting to login");
              window.location.href = window.location.origin + "/admin/login";
            } catch (error) {
              console.error("Error during emergency direct admin check:", error);
              
              // On error, fallback to login page to be safe
              window.location.href = window.location.origin + "/admin/login";
            }
          }
        }, 1000); // Try after 1 second to give normal auth flow a chance
        
        return; // Wait for loading to complete or timeout
      }
      
      // If we get here, we're not loading, but also don't have a valid admin user
      // This means authentication has completed but the user is not an admin
      if (!user || (user.role !== 'admin' && user.role !== 'limited-admin')) {
        console.log("Admin layout - user is not an admin, redirecting to login page");
        toast({
          title: "Authentication Required",
          description: "Please log in with admin credentials to access this area",
          variant: "destructive"
        });
        window.location.href = "/admin/login";
      }
    };
    
    // Run the check function when component mounts or dependencies change
    checkAdminAuth();
  }, [user, isLoading, stableLoading, loadingTimeout, toast]);

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
      window.location.href = "/";
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Example of a direct API call for non-critical data
  const { data: testimonials } = useQuery({
    queryKey: ['/api/testimonials'],
    enabled: !!user?.id,
  });

  // Determine if the user has full admin privileges
  const hasFullAdminAccess = user?.role === 'admin';

  interface NavSubItem {
    title: string;
    icon: React.ReactNode;
    href: string;
    badge?: number;
  }

  interface NavItem {
    title: string;
    icon: React.ReactNode;
    href?: string;
    badge?: number;
    isGroup?: boolean;
    items?: NavSubItem[];
  }

  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard className="w-5 h-5 mr-2" />,
      href: "/admin"
    },
    {
      title: "Customer Requests",
      icon: <MessageSquare className="w-5 h-5 mr-2" />,
      isGroup: true,
      badge: pendingDesigns + pendingPersonalizations + pendingQuotes,
      items: [
        {
          title: "Custom Designs",
          icon: <Sparkles className="w-4 h-4 mr-2" />,
          href: "/admin/designs",
          badge: pendingDesigns
        },
        {
          title: "Personalizations",
          icon: <Paintbrush className="w-4 h-4 mr-2" />,
          href: "/admin/personalizations",
          badge: pendingPersonalizations
        },
        {
          title: "Product Inquiries",
          icon: <MessageCircle className="w-4 h-4 mr-2" />,
          href: "/admin/inquiries",
          badge: pendingQuotes
        }
      ]
    },
    {
      title: "Products",
      icon: <Diamond className="w-5 h-5 mr-2" />,
      href: "/admin/products"
    },
    {
      title: "Contact Messages",
      icon: <MessageSquare className="w-5 h-5 mr-2" />,
      href: "/admin/contact",
      badge: unreadMessages
    },
    {
      title: "Metals & Stones",
      icon: <Gem className="w-5 h-5 mr-2" />,
      href: "/admin/materials"
    },
    {
      title: "Customers",
      icon: <Users className="w-5 h-5 mr-2" />,
      href: "/admin/customers"
    },
    {
      title: "AI Content Helper",
      icon: <Wand2 className="w-5 h-5 mr-2" />,
      href: "/admin/ai-helper"
    },
  ];

  // Authentication states
  if (isLoading || stableLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="relative w-16 h-16">
          <div className="w-16 h-16 rounded-full border-4 border-t-primary border-r-primary border-b-transparent border-l-transparent animate-spin"></div>
          
          {/* After 5 seconds of loading, show a timeout message */}
          {hasTimedOut && (
            <div className="absolute -bottom-24 text-center w-64 -left-24">
              <p className="text-sm text-muted-foreground">This is taking longer than usual...</p>
              <p className="text-xs text-muted-foreground mt-1">Trying alternative authentication methods</p>
              <p className="text-xs text-muted-foreground mt-1">Elapsed: {Math.round(timeElapsed / 1000)}s</p>
            </div>
          )}
        </div>
        <h1 className="mt-4 text-xl font-semibold">Loading Admin Dashboard</h1>
      </div>
    );
  }

  // If not authorized, the effect will handle redirection to login
  if (!isAdmin) return null;

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 border-r">
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <div className="flex items-center">
            <Diamond className="h-6 w-6 text-primary mr-2" />
            <span className="text-xl font-bold">Luster Legacy</span>
          </div>
        </div>
        <div className="flex flex-col p-4 flex-1 overflow-y-auto">
          <nav className="space-y-2">
            {navItems.map((item, index) => 
              item.isGroup ? (
                <Collapsible 
                  key={index} 
                  open={isCustomerRequestsOpen} 
                  onOpenChange={setIsCustomerRequestsOpen}
                  className="w-full"
                >
                  <CollapsibleTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="justify-between w-full font-medium"
                    >
                      <div className="flex items-center">
                        {item.icon}
                        {item.title}
                      </div>
                      <div className="flex items-center">
                        {item.badge ? (
                          <Badge 
                            variant="secondary" 
                            className="ml-auto mr-2"
                          >
                            {item.badge}
                          </Badge>
                        ) : null}
                        {isCustomerRequestsOpen ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </div>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-2">
                    <div className="flex flex-col space-y-1 mt-1 ml-6 border-l pl-2">
                      {item.items?.map((subItem, subIndex) => (
                        <Button
                          key={subIndex}
                          variant="ghost"
                          className="justify-start font-normal"
                          onClick={() => setLocation(subItem.href)}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center">
                              {subItem.icon}
                              {subItem.title}
                            </div>
                            {subItem.badge ? (
                              <Badge variant="secondary">
                                {subItem.badge}
                              </Badge>
                            ) : null}
                          </div>
                        </Button>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <Button 
                  key={index} 
                  variant="ghost" 
                  className="justify-start w-full font-medium"
                  onClick={() => setLocation(item.href!)}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      {item.icon}
                      {item.title}
                    </div>
                    {item.badge ? (
                      <Badge variant="secondary">
                        {item.badge}
                      </Badge>
                    ) : null}
                  </div>
                </Button>
              )
            )}
          </nav>
          <div className="mt-auto pt-4">
            <Separator className="my-4" />
            <div className="flex items-center mb-2 px-2">
              <UserCircle className="w-8 h-8 mr-2 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{user?.username || user?.loginID}</p>
                <p className="text-xs text-muted-foreground">{user?.role}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="justify-start w-full"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile header and sidebar */}
      <div className="lg:hidden fixed inset-x-0 top-0 z-30 border-b bg-background h-16 flex items-center px-4">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex items-center justify-between h-16 px-4 border-b">
              <div className="flex items-center">
                <Diamond className="h-6 w-6 text-primary mr-2" />
                <span className="text-xl font-bold">Luster Legacy</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-4 overflow-y-auto">
              <nav className="space-y-2">
                {navItems.map((item, index) => 
                  item.isGroup ? (
                    <Collapsible 
                      key={index} 
                      open={isCustomerRequestsOpen} 
                      onOpenChange={setIsCustomerRequestsOpen}
                      className="w-full"
                    >
                      <CollapsibleTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="justify-between w-full font-medium"
                        >
                          <div className="flex items-center">
                            {item.icon}
                            {item.title}
                          </div>
                          <div className="flex items-center">
                            {item.badge ? (
                              <Badge 
                                variant="secondary" 
                                className="ml-auto mr-2"
                              >
                                {item.badge}
                              </Badge>
                            ) : null}
                            {isCustomerRequestsOpen ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </div>
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pl-2">
                        <div className="flex flex-col space-y-1 mt-1 ml-6 border-l pl-2">
                          {item.items?.map((subItem, subIndex) => (
                            <Button
                              key={subIndex}
                              variant="ghost"
                              className="justify-start font-normal"
                              onClick={() => {
                                setLocation(subItem.href);
                                setIsMobileMenuOpen(false);
                              }}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center">
                                  {subItem.icon}
                                  {subItem.title}
                                </div>
                                {subItem.badge ? (
                                  <Badge variant="secondary">
                                    {subItem.badge}
                                  </Badge>
                                ) : null}
                              </div>
                            </Button>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <Button 
                      key={index} 
                      variant="ghost" 
                      className="justify-start w-full font-medium"
                      onClick={() => {
                        setLocation(item.href!);
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center">
                          {item.icon}
                          {item.title}
                        </div>
                        {item.badge ? (
                          <Badge variant="secondary">
                            {item.badge}
                          </Badge>
                        ) : null}
                      </div>
                    </Button>
                  )
                )}
              </nav>
              <div className="mt-auto pt-4">
                <Separator className="my-4" />
                <div className="flex items-center mb-2 px-2">
                  <UserCircle className="w-8 h-8 mr-2 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{user?.username || user?.loginID}</p>
                    <p className="text-xs text-muted-foreground">{user?.role}</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  className="justify-start w-full"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        
        <h1 className="text-lg font-bold ml-4">{title}</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0 ml-0 mt-16 lg:mt-0 overflow-hidden">
        <header className="hidden lg:flex items-center h-16 px-6 border-b">
          <h1 className="text-xl font-bold">{title}</h1>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
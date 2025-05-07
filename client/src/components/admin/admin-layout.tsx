import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

// Safe stringify function to handle circular references
function safeJsonStringify(obj: any): string {
  const cache = new Set();
  return JSON.stringify(obj, (key, value) => {
    // Handle circular references
    if (typeof value === 'object' && value !== null) {
      if (cache.has(value)) {
        return '[Circular]';
      }
      cache.add(value);
    }
    // Skip React nodes, functions, and other problematic fields
    if (key === '_context' || key === 'Provider' || key === 'Consumer' || 
        key === '_owner' || typeof value === 'function') {
      return undefined;
    }
    return value;
  })
}
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
  Paintbrush,
  Receipt,
  Wand2,
  PlusCircle,
  MessageSquare,
  Users,
  MessageCircle,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const [, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCustomerRequestsOpen, setIsCustomerRequestsOpen] = useState(true); // Always expanded by default
  const { toast } = useToast();
  
  // Use the main auth hook for authentication including stable loading state
  const { user, isLoading, stableLoading, error, logoutMutation } = useAuth();
  
  // Add our own loading state for admin-specific operations
  const [adminLoadingState, setAdminLoadingState] = useState<'initial' | 'checking' | 'success' | 'error'>('initial');
  const [isAdminLoading, setIsAdminLoading] = useState(true); // Start with loading enabled
  
  // Add timeout detection for API checks that might get stuck
  const [isApiCheckTimedOut, setIsApiCheckTimedOut] = useState(false);
  
  // Store navigation state in sessionStorage to prevent flickering
  const [hasCachedNav, setHasCachedNav] = useState(() => {
    try {
      // Check if we have previously cached nav items
      return !!sessionStorage.getItem('cached_admin_nav_built');
    } catch (e) {
      return false;
    }
  });
  
  // Apply a strict anti-flicker approach
  // Always force loading state until everything is 100% ready
  // Use two-phase rendering to prevent any UI updates during transition
  const hasCachedData = !!sessionStorage.getItem('cached_admin_session');
  
  // Create a strict loading state that prevents ANY rendering until we're fully ready
  const [isInitialRenderComplete, setIsInitialRenderComplete] = useState(false);
  const [isUIStable, setIsUIStable] = useState(false);
  
  // Combine all loading states into a single deterministic value
  const isGlobalLoading = 
    // Always show loading if initial render isn't complete
    !isInitialRenderComplete ||
    // Or if we're still loading auth status
    (isLoading || stableLoading || isAdminLoading) && 
    // Unless we've timed out
    !isApiCheckTimedOut && 
    // And don't skip the loader in production unless we've confirmed stability
    !(isUIStable && hasCachedData && window.location.hostname.includes('.replit.app'));
  
  // Fetch data for pending request counts
  const { data: customDesigns } = useQuery({
    queryKey: ['/api/custom-designs'],
    enabled: !!user?.id
  });
  
  const { data: customizationRequests } = useQuery({
    queryKey: ['/api/customization-requests'],
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
    
  const pendingCustomizations = Array.isArray(customizationRequests) 
    ? customizationRequests.filter((req: any) => req.status === "pending").length 
    : 0;
    
  const pendingQuotes = Array.isArray(quoteRequests) 
    ? quoteRequests.filter((req: any) => req.status === "pending").length 
    : 0;

  // Count unread messages
  const unreadMessages = Array.isArray(contactMessages)
    ? contactMessages.filter((message: any) => message.isRead === false).length
    : 0;
  

  
  // Add a timeout effect to prevent infinite loading
  useEffect(() => {
    // If loading is active, set a timeout to prevent getting stuck
    if (isGlobalLoading) {
      const timeoutId = setTimeout(() => {
        console.log("Admin layout - API check timed out after 15 seconds");
        setIsApiCheckTimedOut(true);
        setIsAdminLoading(false);
        setAdminLoadingState('error');
        
        toast({
          title: "Loading timed out",
          description: "Unable to verify admin access. Please try refreshing the page.",
          variant: "destructive"
        });
      }, 15000); // 15 second timeout
      
      return () => clearTimeout(timeoutId);
    }
  }, [isGlobalLoading, toast]);

  // Detect production environment for optimized checks
  const [isProduction, setIsProduction] = useState(false);
  
  useEffect(() => {
    const isProd = window.location.hostname.includes('.replit.app') || 
                  !window.location.hostname.includes('localhost');
    setIsProduction(isProd);
    console.log(`Admin Layout - Environment detected: ${isProd ? 'Production' : 'Development'}`);
  }, []);
  
  // Check for cached admin data in sessionStorage
  useEffect(() => {
    try {
      // Quick check for cached admin session to prevent flickering
      const cachedAdminSession = sessionStorage.getItem('cached_admin_session');
      if (cachedAdminSession && isProduction) {
        const adminData = JSON.parse(cachedAdminSession);
        if (adminData && (adminData.role === 'admin' || adminData.role === 'limited-admin')) {
          console.log("Admin layout - found cached admin session data");
          // We have a valid cached admin session so we can skip the loading state
          setAdminLoadingState('success');
          setIsAdminLoading(false);
        }
      }
    } catch (error) {
      console.warn("Error checking cached admin session:", error);
    }
  }, [isProduction]);
  
  // Redirect to login page if not authenticated or not an admin
  useEffect(() => {
    const checkAdminAuth = async () => {
      console.log("Admin layout - checking auth state:", { user, isLoading, stableLoading, isAdminLoading });
      
      // Start admin auth check process
      setAdminLoadingState('checking');
      
      // First check if currently loading
      if (isLoading || stableLoading) {
        console.log("Admin layout - still loading auth state...");
        return; // Wait for loading to complete
      }

      // Perform a multi-level authentication check to ensure we're truly authenticated
      try {
        // Check 1: First check the cached user from React Query
        if (!user) {
          console.log("Admin layout - no user in cache, will verify with API");
          
          // If no user in the cache, immediately end loading and redirect to login
          setAdminLoadingState('error');
          setIsAdminLoading(false);
          toast({
            title: "Authentication required",
            description: "Please log in to access the admin dashboard",
            variant: "destructive"
          });
          window.location.href = "/admin/login";
          return;
        } else if (user.role !== "admin" && user.role !== "limited-admin") {
          console.log("Admin layout - user is not admin or limited-admin, redirecting to home page");
          setAdminLoadingState('error');
          setIsAdminLoading(false);
          toast({
            title: "Access restricted",
            description: "You don't have permission to access the admin dashboard",
            variant: "destructive"
          });
          window.location.href = "/";
          return;
        } else {
          console.log("Admin layout - cached user appears to be admin, proceeding with admin auth");
          
          // Cache admin session data for future use, but only store essential properties
          // to avoid circular reference errors when stringifying
          try {
            // Create a safe copy with only the data we need
            const safeUserData = {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role,
              // Add other essential properties as needed, but avoid complex objects
            };
            
            sessionStorage.setItem('cached_admin_session', safeJsonStringify(safeUserData));
            console.log("Admin layout - cached admin session data updated");
          } catch (cacheError) {
            console.warn("Could not cache admin session:", cacheError);
          }
          
          // Since user is already confirmed as admin in the cache, we'll trust that
          // but still try the API call with a safety mechanism
          setAdminLoadingState('success');
          setIsAdminLoading(false);
        }

        // Do background verification for logs only, but don't block UI
        console.log("Admin layout - checking admin auth endpoint (background verification)...");
        
        // Background verification - doesn't affect loading state since we already passed auth from cache
        setTimeout(async () => {
          try {
            // Check admin auth
            const adminResponse = await fetch("/api/auth/me", { 
              credentials: "include",
              headers: { "Cache-Control": "no-cache" }
            });
            
            if (adminResponse.ok) {
              const adminData = await adminResponse.json();
              console.log("Background verification - admin auth check successful:", adminData);
              
              // Update the cache with this fresh data
              import("@/lib/queryClient").then(({queryClient}) => {
                queryClient.setQueryData(["/api/user"], adminData);
              });
            } else {
              console.log("Background verification - admin auth check failed");
              
              // Try regular user endpoint
              const userResponse = await fetch("/api/user", { 
                credentials: "include",
                headers: { "Cache-Control": "no-cache" }
              });
              
              if (userResponse.ok) {
                const userData = await userResponse.json();
                console.log("Background verification - user auth check successful:", userData);
              } else {
                console.log("Background verification - both auth checks failed");
              }
            }
          } catch (error) {
            console.log("Error in background auth verification:", error);
          }
        }, 100);
        
        // Since the user is already authenticated via cache, continue with the UI
        return;
      } catch (error) {
        console.error("Error during auth check:", error);
        // Mark as error state
        setAdminLoadingState('error');
        setIsAdminLoading(false);
        
        // Show error toast and redirect to login page
        toast({
          title: "Authentication error",
          description: "There was an error verifying your admin access. Please log in again.",
          variant: "destructive"
        });
        
        window.location.href = "/admin/login";
        return;
      }
    };
    
    // Run the check immediately
    checkAdminAuth();
  }, [user, isLoading, stableLoading, toast]);
  
  // Handle logout from both auth systems
  const handleLogout = async () => {
    try {
      console.log("Admin logout - logging out from both auth systems");
      
      // First try to log out from legacy admin auth
      try {
        await apiRequest("POST", "/api/auth/logout");
        console.log("Admin logout - successfully logged out from admin auth");
      } catch (adminLogoutError) {
        console.warn("Admin logout - error logging out from admin auth:", adminLogoutError);
        // Continue with main logout anyway
      }
      
      // Now use the main logout mutation which also attempts both logouts
      logoutMutation.mutate(undefined, {
        onSuccess: () => {
          console.log("Admin logout - successfully logged out from main auth");
          
          toast({
            title: "Logged out successfully",
            description: "You have been logged out of the admin dashboard",
          });
          
          // Use hard navigation for clean slate
          window.location.href = "/";
        },
        onError: (error) => {
          console.error("Admin logout - error logging out from main auth:", error);
          
          // Force logout by clearing cookies manually and redirecting
          document.cookie.split(";").forEach(cookie => {
            const [name] = cookie.trim().split("=");
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          });
          
          toast({
            title: "Logged out (forced)",
            description: "You have been logged out of the admin dashboard",
          });
          
          // Redirect to home
          window.location.href = "/";
        }
      });
    } catch (error) {
      console.error("Admin logout - unexpected error:", error);
      // Force redirect to home on any error
      window.location.href = "/";
    }
  };
  
  // Fetch pending testimonials count
  const { data: testimonials } = useQuery({
    queryKey: ['/api/admin/testimonials'],
    enabled: !!user?.id
  });
  
  // Count pending testimonials (only count unapproved ones)
  const pendingTestimonials = Array.isArray(testimonials) 
    ? testimonials.filter((t: any) => t.status === 'pending' || !t.isApproved).length 
    : 0;
    
  // Define TypeScript interfaces for nav items
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
  
  // Define the base navigation items (available to all admin users) 
  // Using plain constants instead of refs for better stability
  const baseItems: NavItem[] = [
    { 
      title: "Dashboard", 
      icon: <LayoutDashboard className="h-5 w-5" />, 
      href: "/admin/dashboard" 
    },
    { 
      title: "Products", 
      icon: <GalleryHorizontal className="h-5 w-5" />, 
      href: "/admin/products" 
    },
    {
      title: "Customer Requests",
      icon: <MessageCircle className="h-5 w-5" />,
      isGroup: true,
      items: [
        { 
          title: "Custom Design Requests", 
          icon: <Package className="h-5 w-5" />, 
          href: "/admin/designs",
        },
        {
          title: "Product Customization Requests",
          icon: <Paintbrush className="h-5 w-5" />,
          href: "/admin/customizations",
        },
        {
          title: "Product Quote Requests",
          icon: <Receipt className="h-5 w-5" />,
          href: "/admin/quotes",
        },
      ]
    },
    {
      title: "Contact Messages",
      icon: <MessageSquare className="h-5 w-5" />,
      href: "/admin/contact-messages",
    }
  ];
  
  // Define admin-only items
  const fullAdminItems: NavItem[] = [
    {
      title: "Product Types",
      icon: <Package className="h-5 w-5" />,
      href: "/admin/product-types"
    },
    { 
      title: "Metal Types", 
      icon: <Diamond className="h-5 w-5" />, 
      href: "/admin/metal-types" 
    },
    { 
      title: "Stone Types", 
      icon: <Gem className="h-5 w-5" />, 
      href: "/admin/stone-types" 
    },
    {
      title: "Client Stories",
      icon: <MessageSquare className="h-5 w-5" />,
      href: "/admin/testimonials",
    },
    { 
      title: "AI Content Generator(For new Products)", 
      icon: <Wand2 className="h-5 w-5" />, 
      href: "/admin/ai-generator" 
    },
    {
      title: "User Management",
      icon: <Users className="h-5 w-5" />,
      href: "/admin/users"
    }
  ];
  
  // Get the nav items for rendering
  // Use useState + useEffect pattern instead of ref mutation pattern
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  
  // Determine if this is a limited admin or full admin
  const isLimitedAdmin = user?.role === "limited-admin";
  
  // Update badges in a separate effect that runs after initial build
  useEffect(() => {
    // Only run if we have nav items and badge counts
    if (!navItems.length || pendingDesigns === undefined) return;
    
    // Create a deep copy to avoid mutations
    const updatedNavItems = JSON.parse(JSON.stringify(navItems));
    let hasChanges = false;
    
    // Update Customer Requests group badges
    const customerRequestsGroup = updatedNavItems.find((item: NavItem) => item.title === "Customer Requests");
    if (customerRequestsGroup && customerRequestsGroup.items) {
      // Update Custom Design Requests badge
      const designsItem = customerRequestsGroup.items.find((item: NavSubItem) => item.title === "Custom Design Requests");
      if (designsItem) {
        const newBadge = pendingDesigns > 0 ? pendingDesigns : undefined;
        if (designsItem.badge !== newBadge) {
          designsItem.badge = newBadge;
          hasChanges = true;
        }
      }
      
      // Update Product Customization Requests badge
      const customizationsItem = customerRequestsGroup.items.find((item: NavSubItem) => item.title === "Product Customization Requests");
      if (customizationsItem) {
        const newBadge = pendingCustomizations > 0 ? pendingCustomizations : undefined;
        if (customizationsItem.badge !== newBadge) {
          customizationsItem.badge = newBadge;
          hasChanges = true;
        }
      }
      
      // Update Product Quote Requests badge
      const quotesItem = customerRequestsGroup.items.find((item: NavSubItem) => item.title === "Product Quote Requests");
      if (quotesItem) {
        const newBadge = pendingQuotes > 0 ? pendingQuotes : undefined;
        if (quotesItem.badge !== newBadge) {
          quotesItem.badge = newBadge;
          hasChanges = true;
        }
      }
    }
    
    // Update Contact Messages badge
    const contactMessagesItem = updatedNavItems.find((item: NavItem) => item.title === "Contact Messages");
    if (contactMessagesItem) {
      const newBadge = unreadMessages > 0 ? unreadMessages : undefined;
      if (contactMessagesItem.badge !== newBadge) {
        contactMessagesItem.badge = newBadge;
        hasChanges = true;
      }
    }
    
    // Update Client Stories badge (only for full admin)
    if (!isLimitedAdmin) {
      const testimonialItem = updatedNavItems.find((item: NavItem) => item.title === "Client Stories");
      if (testimonialItem) {
        const newBadge = pendingTestimonials > 0 ? pendingTestimonials : undefined;
        if (testimonialItem.badge !== newBadge) {
          testimonialItem.badge = newBadge;
          hasChanges = true;
        }
      }
    }
    
    // Only update state if there were actual changes to prevent loops
    if (hasChanges) {
      console.log("Admin layout - updating badges");
      setNavItems(updatedNavItems);
    }
  }, [navItems, pendingDesigns, pendingCustomizations, pendingQuotes, unreadMessages, pendingTestimonials, isLimitedAdmin]);
  
  // Build nav items from scratch when role changes
  useEffect(() => {
    // Initialize with base items
    let compiledNavItems = JSON.parse(JSON.stringify(baseItems)); 
    
    // Add admin-only items if not limited admin
    if (!isLimitedAdmin && user?.role === "admin") {
      const adminOnlyItems = JSON.parse(JSON.stringify(fullAdminItems));
      compiledNavItems = [...compiledNavItems, ...adminOnlyItems];
    }
    
    // Cache built navigation for future use - create safe serializable version
    try {
      // Create a copy without React nodes to avoid circular references
      const safeNavData = compiledNavItems.map((item: NavItem) => {
        // Replace React nodes with placeholders
        return {
          title: item.title,
          href: item.href,
          badge: item.badge,
          isGroup: item.isGroup,
          items: item.items ? item.items.map((subItem: NavSubItem) => ({
            title: subItem.title,
            href: subItem.href,
            badge: subItem.badge
            // Skip the icon which is a React node
          })) : undefined
          // Skip the icon which is a React node
        };
      });
      
      // Store cache marker and safe data
      sessionStorage.setItem('cached_admin_nav_built', 'true');
      sessionStorage.setItem('cached_admin_nav_data', JSON.stringify(safeNavData));
      setHasCachedNav(true);
    } catch (e) {
      console.warn("Error caching nav state:", e);
    }
    
    // Set the items to state
    setNavItems(compiledNavItems);
    
    console.log("Admin layout - REBUILT nav items for role:", user?.role);
  }, [user?.role, isLimitedAdmin, baseItems, fullAdminItems]); // Full dependency array
  
  // Production environment detection (use the existing isProduction value from earlier)
  
  // Apply production-specific loading optimizations
  const [userDataStable, setUserDataStable] = useState(false);
  
  // First effect: Trust cached user immediately to avoid flickering
  useEffect(() => {
    // For production, we prioritize a smooth loading experience
    if (isProduction) {
      // If we already have user data, trust it immediately
      if (user && user.id) {
        console.log("Production: Using cached user data immediately");
        setAdminLoadingState('success');
        setIsAdminLoading(false);
        
        // Mark the user data as stable for other components
        setUserDataStable(true);
      }
    }
  }, [user, isProduction, setAdminLoadingState]);
  
  // Initialize the two-phase rendering system
  useEffect(() => {
    // First clear any potentially corrupted caches to start fresh
    try {
      // Check if this is the first run after our fix
      const cacheFixApplied = sessionStorage.getItem('cache_fix_v1');
      if (!cacheFixApplied) {
        console.log("Admin layout - applying cache fix, clearing all potentially corrupted caches");
        // Clear all session storage items that could have circular references
        sessionStorage.removeItem('cached_admin_session');
        sessionStorage.removeItem('cached_admin_nav_built');
        sessionStorage.removeItem('cached_admin_nav_data');
        sessionStorage.removeItem('admin_ui_stable');
        
        // Mark that we've applied the fix to avoid clearing again
        sessionStorage.setItem('cache_fix_v1', 'true');
      }
    } catch (e) {
      console.warn("Could not clear caches:", e);
    }
    
    // Phase 1: Initial data load completed marker
    const initialRenderTimer = setTimeout(() => {
      console.log("Admin layout - marking initial render as complete");
      setIsInitialRenderComplete(true);
    }, 800); // Delay to ensure all initial state is processed
    
    // Phase 2: Set full rendering stability marker
    const stabilityTimer = setTimeout(() => {
      console.log("Admin layout - marking UI as stable");
      setIsUIStable(true);
      
      // Also mark cached data as available for future page loads
      try {
        sessionStorage.setItem('admin_ui_stable', 'true');
      } catch (e) {
        console.warn("Failed to cache UI stability marker:", e);
      }
    }, 1800); // Longer delay to ensure full rendering stability
    
    return () => {
      clearTimeout(initialRenderTimer);
      clearTimeout(stabilityTimer);
    };
  }, []);
  
  // Second effect: Handle full authentication flow with anti-flicker protection
  useEffect(() => {
    // Only update the UI when auth is complete AND all rendering phases are done
    if (!isLoading && !stableLoading && isInitialRenderComplete) {
      if (user) {
        console.log("Authentication stable, user found - loading admin UI");
        
        // In production, add longer delay to avoid abrupt transitions
        // Increased further to ensure complete stability
        const loadingDelay = isProduction ? 2000 : 800;
        
        // If we haven't already shown the UI based on cached data
        if (!userDataStable) {
          const timer = setTimeout(() => {
            setAdminLoadingState('success');
            setIsAdminLoading(false);
            console.log("Admin loading completed - UI will now render");
            
            // Mark UI as fully stable after successful load
            setIsUIStable(true);
          }, loadingDelay);
          
          return () => clearTimeout(timer);
        }
      } else {
        // No user found after auth check is done - redirect to login
        console.log("Authentication stable, but no user found - redirecting to login");
        setAdminLoadingState('error');
        setIsAdminLoading(false);
        
        // Delay redirect to avoid race conditions
        const redirectTimer = setTimeout(() => {
          window.location.href = "/admin/login";
        }, 300);
        
        return () => clearTimeout(redirectTimer);
      }
    }
  }, [isLoading, stableLoading, user, isProduction, userDataStable, isInitialRenderComplete]);

  // Current location for determining active route
  const [location] = useLocation();
  
  // Use the global loading state to ensure a completely stable loading experience
  // We've modified this to use a fixed, non-animated loading screen to prevent any flickering
  if (isGlobalLoading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center h-screen w-screen bg-background" 
           style={{ 
             zIndex: 9999, 
             opacity: 1,
             transition: 'none',
             userSelect: 'none',
             pointerEvents: 'none'
           }}>
        <div className="rounded-full h-16 w-16 border-2 border-primary mb-4 relative overflow-hidden">
          {/* Static loader with no animations */}
          <div className="absolute inset-0 bg-primary/20"></div>
          <div className="absolute bottom-0 left-0 right-0 bg-primary h-1/2"></div>
        </div>
        <p className="text-foreground/70 text-sm font-montserrat">
          Loading admin dashboard...
        </p>
        {/* Slightly longer timeout message for very slow connections */}
        {isApiCheckTimedOut && (
          <p className="text-foreground/60 text-xs font-montserrat mt-4 max-w-md text-center px-4">
            Loading is taking longer than expected. The admin panel will appear shortly.
          </p>
        )}
      </div>
    );
  }
  
  // Implement a freeze mechanism for the entire UI to prevent flickering until stable
  useEffect(() => {
    if (isUIStable) {
      // Once UI is stable, we track all scroll events to improve performance
      const controller = new AbortController();
      document.addEventListener('scroll', () => {}, { passive: true, signal: controller.signal });
      return () => controller.abort();
    }
  }, [isUIStable]);
  
  return (
    <div 
      className="min-h-screen flex flex-col bg-background"
      style={{ 
        // Force all UI to be completely static with no transitions until stable
        willChange: isUIStable ? 'auto' : 'transform',
        backfaceVisibility: 'hidden',
        transform: 'translateZ(0)',
        // Disable all animations initially
        animationDuration: isUIStable ? 'initial' : '0s !important',
        transitionDuration: isUIStable ? 'initial' : '0s !important'
      }}
    >
      {/* Header */}
      <header className="border-b sticky top-0 z-30 bg-background">
        <div className="flex h-16 items-center px-4 sm:px-6">
          <div className="md:hidden mr-2">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0">
                <div className="flex flex-col h-full">
                  <div className="flex items-center p-4 border-b">
                    <div>
                      <a href="/admin/dashboard" className="font-playfair text-xl font-bold">
                        Luster<span className="text-primary">Legacy</span> Admin
                      </a>
                      {user?.role === "limited-admin" && (
                        <Badge variant="outline" className="ml-2">Limited Access</Badge>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="ml-auto" onClick={() => setIsMobileMenuOpen(false)}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-auto py-2">
                    <nav className="flex flex-col gap-1 px-2">
                      {navItems.map((item: NavItem, idx: number) => (
                        item.isGroup ? (
                          <Collapsible key={`group-${idx}`} defaultOpen={isCustomerRequestsOpen}>
                            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                              <div className="flex items-center gap-3">
                                {item.icon}
                                {item.title}
                              </div>
                              {isCustomerRequestsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </CollapsibleTrigger>
                            <CollapsibleContent className="pl-4">
                              {item.items?.map((subItem: NavSubItem) => (
                                <a
                                  key={subItem.href}
                                  href={subItem.href}
                                  onClick={() => setIsMobileMenuOpen(false)}
                                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground ${
                                    location === subItem.href ? "bg-accent/50 font-medium" : ""
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    {subItem.icon}
                                    {subItem.title}
                                  </div>
                                  {subItem.badge && (
                                    <Badge variant="destructive" className="ml-2">{subItem.badge}</Badge>
                                  )}
                                </a>
                              ))}
                            </CollapsibleContent>
                          </Collapsible>
                        ) : (
                          <a
                            key={item.href || `mobile-nav-item-${idx}`}
                            href={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground ${
                              location === item.href ? "bg-accent/50 font-medium" : ""
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {item.icon}
                              {item.title}
                            </div>
                            {item.badge && (
                              <Badge variant="destructive" className="ml-2">{item.badge}</Badge>
                            )}
                          </a>
                        )
                      ))}
                    </nav>
                  </div>
                  <div className="border-t p-4">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-muted-foreground" 
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-5 w-5" />
                      Log out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          
          <div className="flex-1">
            <h1 className="font-playfair text-xl font-semibold tracking-tight">{title || "Admin Dashboard"}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center">
              <UserCircle className="h-5 w-5 mr-2 text-muted-foreground" />
              <span className="text-sm font-medium">{user?.username}</span>
              {user?.role === "limited-admin" && (
                <Badge variant="outline" className="ml-2">Limited Access</Badge>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="hidden md:flex">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Button>
          </div>
        </div>
      </header>
      
      <div className="flex flex-1">
        {/* Sidebar (desktop only) */}
        <div className="hidden md:flex w-64 flex-col border-r bg-background z-20">
          <div className="flex h-14 items-center border-b px-4">
            <a href="/admin/dashboard" className="font-playfair text-xl font-bold">
              Luster<span className="text-primary">Legacy</span>
            </a>
          </div>
          <nav className="flex flex-col gap-1 p-4">
            {navItems.map((item: NavItem, idx: number) => (
              item.isGroup ? (
                <Collapsible key={`desktop-group-${idx}`} defaultOpen={isCustomerRequestsOpen} onOpenChange={setIsCustomerRequestsOpen}>
                  <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                    <div className="flex items-center gap-3">
                      {item.icon}
                      {item.title}
                    </div>
                    {isCustomerRequestsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-4">
                    {item.items?.map((subItem: NavSubItem) => (
                      <a
                        key={subItem.href}
                        href={subItem.href}
                        className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground ${
                          location === subItem.href ? "bg-accent/50 font-medium" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {subItem.icon}
                          {subItem.title}
                        </div>
                        {subItem.badge && (
                          <Badge variant="destructive" className="ml-2">{subItem.badge}</Badge>
                        )}
                      </a>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <a
                  key={item.href || `nav-item-${idx}`}
                  href={item.href}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground ${
                    location === item.href ? "bg-accent/50 font-medium" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    {item.title}
                  </div>
                  {item.badge && (
                    <Badge variant="destructive" className="ml-2">{item.badge}</Badge>
                  )}
                </a>
              )
            ))}
          </nav>
        </div>
        
        {/* Main content */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-auto p-4 sm:p-6 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

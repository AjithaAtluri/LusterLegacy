import { useState, useEffect } from "react";
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

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const [, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCustomerRequestsOpen, setIsCustomerRequestsOpen] = useState(true);
  const { toast } = useToast();
  
  // Use the main auth hook for authentication
  const { user, isLoading, error, logoutMutation } = useAuth();
  
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
  
  // Redirect to login page if not authenticated or not an admin
  useEffect(() => {
    const checkAdminAuth = async () => {
      console.log("Admin layout - checking auth state:", { user, isLoading });
      
      // First check if currently loading
      if (isLoading) {
        console.log("Admin layout - still loading auth state...");
        return; // Wait for loading to complete
      }

      // Perform a multi-level authentication check to ensure we're truly authenticated
      try {
        // Check 1: First check the cached user from React Query
        if (!user) {
          console.log("Admin layout - no user in cache, will verify with API");
        } else if (user.role !== "admin") {
          console.log("Admin layout - user is not admin, redirecting to home page");
          toast({
            title: "Access restricted",
            description: "You don't have permission to access the admin dashboard",
            variant: "destructive"
          });
          window.location.href = "/";
          return;
        } else {
          console.log("Admin layout - cached user appears to be admin, verifying with direct API call");
        }

        // Check 2: Check admin-specific auth API
        console.log("Admin layout - checking admin auth endpoint...");
        const adminAuthResponse = await fetch("/api/auth/me", { 
          credentials: "include",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
          }
        });
        
        // If admin auth succeeded, we're definitely authenticated properly
        if (adminAuthResponse.ok) {
          const adminData = await adminAuthResponse.json();
          console.log("Admin layout - admin auth check successful:", adminData);
          
          // Make sure it's still an admin account
          if (adminData.role === "admin") {
            console.log("Admin layout - user is verified admin via /api/auth/me");
            // Update the cache with this fresh data
            import("@/lib/queryClient").then(({queryClient}) => {
              queryClient.setQueryData(["/api/user"], adminData);
            });
            return; // Allow access
          } else {
            console.log("User is authenticated but admin role missing in admin auth check");
            toast({
              title: "Access restricted",
              description: "Admin role not found in authentication data",
              variant: "destructive"
            });
            window.location.href = "/admin/login";
            return;
          }
        }
        
        // Check 3: Try regular auth endpoint as fallback
        console.log("Admin layout - admin auth check failed, trying regular user endpoint...");
        const userResponse = await fetch("/api/user", { 
          credentials: "include",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
          }
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          console.log("Admin layout - regular auth check successful:", userData);
          
          if (userData.role === "admin") {
            console.log("Admin layout - user is verified admin via /api/user");
            // Update the cache with this fresh data
            import("@/lib/queryClient").then(({queryClient}) => {
              queryClient.setQueryData(["/api/user"], userData);
            });
            
            // Since admin auth failed but regular auth succeeded, try to fix admin auth
            try {
              const username = userData.username;
              const fixAdminAuthResult = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Cache-Control": "no-cache, no-store, must-revalidate",
                  "Pragma": "no-cache",
                  "Expires": "0"
                },
                credentials: "include",
                body: JSON.stringify({ username, password: "admin123" })
              });
              
              if (fixAdminAuthResult.ok) {
                console.log("Successfully fixed admin auth");
              } else {
                console.warn("Could not fix admin auth, but continuing anyway");
              }
            } catch (fixError) {
              console.warn("Error trying to fix admin auth:", fixError);
            }
            
            return; // Allow access
          } else {
            // User is authenticated but not an admin
            console.log("User is authenticated but not an admin");
            toast({
              title: "Access restricted",
              description: "You don't have permission to access the admin dashboard",
              variant: "destructive"
            });
            window.location.href = "/";
            return;
          }
        }
        
        // If we reach here, both auth checks failed
        console.log("Both auth checks failed - user is not authenticated");
        toast({
          title: "Authentication required",
          description: "Please log in to access the admin dashboard",
          variant: "destructive"
        });
        window.location.href = "/admin/login";
        return;
      } catch (error) {
        console.error("Error during auth check:", error);
        // Fall back to React Query state only if an exception occurred
        if (!user) {
          console.log("Error in auth check and no cached user - redirecting to login");
          window.location.href = "/admin/login";
          return;
        } else if (user.role !== "admin") {
          console.log("Error in auth check and cached user is not admin - redirecting home");
          window.location.href = "/";
          return;
        } else {
          console.log("Error in auth check but cached user is admin - allowing access but may encounter further issues");
          // Continue with access and hope for the best
          return;
        }
      }
    };
    
    // Run the check immediately
    checkAdminAuth();
  }, [user, isLoading, toast]);
  
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
  
  // Navigation items - all pointing to direct path routes
  const navItems = [
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
      title: "AI Content Generator(For new Products)", 
      icon: <Wand2 className="h-5 w-5" />, 
      href: "/admin/ai-generator" 
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
          badge: pendingDesigns > 0 ? pendingDesigns : undefined
        },
        {
          title: "Product Customization Requests",
          icon: <Paintbrush className="h-5 w-5" />,
          href: "/admin/customizations",
          badge: pendingCustomizations > 0 ? pendingCustomizations : undefined
        },
        {
          title: "Quote Requests",
          icon: <Receipt className="h-5 w-5" />,
          href: "/admin/quotes",
          badge: pendingQuotes > 0 ? pendingQuotes : undefined
        },
      ]
    },
    {
      title: "Contact Messages",
      icon: <MessageSquare className="h-5 w-5" />,
      href: "/admin/contact-messages"
    },
    {
      title: "User Management",
      icon: <Users className="h-5 w-5" />,
      href: "/admin/users"
    }
  ];
  
  // Current location for determining active route
  const [location] = useLocation();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
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
                    <a href="/admin/dashboard" className="font-playfair text-xl font-bold">
                      Luster<span className="text-primary">Legacy</span> Admin
                    </a>
                    <Button variant="ghost" size="icon" className="ml-auto" onClick={() => setIsMobileMenuOpen(false)}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-auto py-2">
                    <nav className="flex flex-col gap-1 px-2">
                      {navItems.map((item, idx) => (
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
                              {item.items?.map((subItem) => (
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
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground ${
                              location === item.href ? "bg-accent/50 font-medium" : ""
                            }`}
                          >
                            {item.icon}
                            {item.title}
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
            {navItems.map((item, idx) => (
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
                    {item.items?.map((subItem) => (
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
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground ${
                    location === item.href ? "bg-accent/50 font-medium" : ""
                  }`}
                >
                  {item.icon}
                  {item.title}
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

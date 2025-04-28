import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
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
  Wand2,
  PlusCircle
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const [, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toast } = useToast();
  
  // Use the main auth hook for authentication
  const { user, isLoading, error, logoutMutation } = useAuth();
  
  // Redirect to login page if not authenticated or not an admin
  useEffect(() => {
    const checkAdminAuth = async () => {
      console.log("Admin layout - checking auth state:", { user, isLoading });
      
      // First check if currently loading
      if (isLoading) {
        console.log("Admin layout - still loading auth state...");
        return; // Wait for loading to complete
      }

      // Use a direct backend check to get the freshest authentication state
      try {
        // Make a direct fetch call to the user endpoint (no React Query caching)
        const response = await fetch("/api/user", { 
          credentials: "include",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          console.log("Admin layout - auth check successful:", userData);
          
          if (userData.role === "admin") {
            console.log("Admin layout - user is verified admin");
            // Update the cache with this fresh data
            import("@/lib/queryClient").then(({queryClient}) => {
              queryClient.setQueryData(["/api/user"], userData);
            });
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
        } else {
          // Not authenticated
          console.log("User not authenticated");
          toast({
            title: "Authentication required",
            description: "Please log in to access the admin dashboard",
            variant: "destructive"
          });
          window.location.href = "/admin/login";
          return;
        }
      } catch (error) {
        console.error("Error during auth check:", error);
        // Fall back to React Query state
        if (!user) {
          console.log("Error in auth check and no cached user - redirecting to login");
          window.location.href = "/admin/login";
          return;
        } else if (user.role !== "admin") {
          console.log("Error in auth check and cached user is not admin - redirecting home");
          window.location.href = "/";
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
  
  // Navigation items
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
      title: "AI Generator", 
      icon: <Wand2 className="h-5 w-5" />, 
      href: "/admin/ai-generator" 
    },
    { 
      title: "Custom Designs", 
      icon: <Package className="h-5 w-5" />, 
      href: "/admin/designs" 
    },
    { 
      title: "Orders", 
      icon: <ShoppingBag className="h-5 w-5" />, 
      href: "/admin/orders" 
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
                    <Link href="/admin/dashboard" className="font-playfair text-xl font-bold">
                      Luster<span className="text-primary">Legacy</span> Admin
                    </Link>
                    <Button variant="ghost" size="icon" className="ml-auto" onClick={() => setIsMobileMenuOpen(false)}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-auto py-2">
                    <nav className="flex flex-col gap-1 px-2">
                      {navItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground ${
                            location === item.href ? "bg-accent/50 font-medium" : ""
                          }`}
                        >
                          {item.icon}
                          {item.title}
                        </Link>
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
            <Link href="/admin/dashboard" className="font-playfair text-xl font-bold">
              Luster<span className="text-primary">Legacy</span>
            </Link>
          </div>
          <nav className="flex flex-col gap-1 p-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground ${
                  location === item.href ? "bg-accent/50 font-medium" : ""
                }`}
              >
                {item.icon}
                {item.title}
              </Link>
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

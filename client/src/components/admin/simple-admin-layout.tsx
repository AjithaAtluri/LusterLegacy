import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Menu, 
  X, 
  ShoppingBag, 
  Package, 
  PenSquare, 
  MessageCircle,
  Users, 
  UserCircle, 
  LogOut, 
  ChevronDown,
  ChevronRight,
  Calendar,
  MessageSquareText,
  Star,
  FileText,
  Gem,
  GemIcon,
  BoxIcon,
  Loader2
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

export default function SimpleAdminLayout({ children, title }: AdminLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCustomerRequestsOpen, setIsCustomerRequestsOpen] = useState(true);
  const { user, isLoading, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();

  // Handle logout
  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      toast({ title: "Logged out successfully" });
      window.location.href = "/admin/login";
    } catch (error) {
      toast({ 
        title: "Failed to logout", 
        description: "Please try again", 
        variant: "destructive" 
      });
    }
  };

  // Limited admin status check
  const isLimitedAdmin = user?.role === "limited-admin";
  
  // Base items common to all admin users (admin and limited-admin)
  const baseItems: NavItem[] = [
    {
      title: "Dashboard",
      icon: <Calendar className="h-5 w-5" />,
      href: "/admin/dashboard",
    },
    // Customer Requests Group - Always available to all admin users
    {
      title: "Customer Requests",
      icon: <MessageCircle className="h-5 w-5" />,
      isGroup: true,
      items: [
        {
          title: "Custom Design Requests",
          icon: <PenSquare className="h-5 w-5" />,
          href: "/admin/designs",
        },
        {
          title: "Product Customization Requests",
          icon: <Package className="h-5 w-5" />,
          href: "/admin/customizations",
        },
        {
          title: "Product Quote Requests",
          icon: <ShoppingBag className="h-5 w-5" />,
          href: "/admin/quotes",
        }
      ]
    },
    {
      title: "Products",
      icon: <Package className="h-5 w-5" />,
      href: "/admin/products",
    },
    {
      title: "Contact Messages",
      icon: <MessageSquareText className="h-5 w-5" />,
      href: "/admin/contact",
    },
    {
      title: "Client Stories",
      icon: <Star className="h-5 w-5" />,
      href: "/admin/testimonials",
    },
    {
      title: "Orders",
      icon: <FileText className="h-5 w-5" />,
      href: "/admin/orders",
    },
  ];
  
  // Admin-only items
  const fullAdminItems: NavItem[] = [
    {
      title: "Metal Types",
      icon: <GemIcon className="h-5 w-5" />,
      href: "/admin/metal-types",
    },
    {
      title: "Stone Types",
      icon: <Gem className="h-5 w-5" />,
      href: "/admin/stone-types",
    },
    {
      title: "Product Types",
      icon: <BoxIcon className="h-5 w-5" />,
      href: "/admin/product-types",
    },
    {
      title: "Users",
      icon: <Users className="h-5 w-5" />,
      href: "/admin/users",
    }
  ];
  
  // Build the navigation items based on user role
  let navItems: NavItem[] = [...baseItems];
  
  // Add admin-only items if user is a full admin
  if (!isLimitedAdmin && user?.role === "admin") {
    navItems = [...navItems, ...fullAdminItems];
  }

  // Loading screen
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect if not logged in
  if (!isLoading && !user) {
    // We'll handle redirect in useEffect to avoid React rendering issues
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Redirecting to login...</p>
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
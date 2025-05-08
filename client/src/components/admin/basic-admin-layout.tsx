import React from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
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

// Super simplified version with minimal hooks and state
export default function BasicAdminLayout({ children, title }: { children: React.ReactNode; title: string }) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();
  
  // Extremely simple loading screen with no conditional hooks
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Very basic menu for admin users
  const menuItems = [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/designs", label: "Custom Designs" },
    { href: "/admin/customizations", label: "Customization Requests" },
    { href: "/admin/quotes", label: "Quote Requests" },
    { href: "/admin/products", label: "Products" },
    { href: "/admin/contact", label: "Contact Messages" },
    { href: "/admin/testimonials", label: "Client Stories" },
    { href: "/admin/orders", label: "Orders" },
  ];
  
  // Add admin-only items if not limited-admin
  if (user?.role === "admin") {
    menuItems.push(
      { href: "/admin/metal-types", label: "Metal Types" },
      { href: "/admin/stone-types", label: "Stone Types" },
      { href: "/admin/product-types", label: "Product Types" },
      { href: "/admin/users", label: "Users" }
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Basic header */}
      <header className="border-b sticky top-0 z-30 bg-background">
        <div className="flex h-16 items-center px-4 sm:px-6">
          <div className="md:hidden mr-2">
            <Sheet>
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
                    <Button variant="ghost" size="icon" className="ml-auto">
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-auto py-2">
                    <nav className="flex flex-col gap-1 px-2">
                      {menuItems.map((item) => (
                        <a
                          key={item.href}
                          href={item.href}
                          className={`flex items-center rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground ${
                            location === item.href ? "bg-accent/50 font-medium" : ""
                          }`}
                        >
                          {item.label}
                        </a>
                      ))}
                    </nav>
                  </div>
                  <div className="border-t p-4">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-muted-foreground" 
                      onClick={() => window.location.href = "/admin/login"}
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
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.href = "/admin/login"} 
              className="hidden md:flex"
            >
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
            {menuItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground ${
                  location === item.href ? "bg-accent/50 font-medium" : ""
                }`}
              >
                {item.label}
              </a>
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
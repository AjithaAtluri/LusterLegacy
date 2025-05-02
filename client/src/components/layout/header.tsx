import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, X, ShoppingBag, User, LogOut } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Logo } from "@/components/ui/logo";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Header() {
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logoutMutation } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Check if the admin auth cookie is set
  useEffect(() => {
    // Check admin authentication status
    const checkAdminAuth = async () => {
      try {
        const response = await apiRequest('GET', '/api/auth/me');
        if (response.ok) {
          setIsAdmin(true);
        }
      } catch (error) {
        console.log('Not logged in as admin');
      }
    };
    
    checkAdminAuth();
  }, [location]); // Check on location change
  
  // Fetch cart items count
  const { data: cartData } = useQuery({
    queryKey: ['/api/cart'],
    // Enable the cart query to properly show cart items
    staleTime: 60000 // 1 minute stale time to reduce refetches
  });
  
  // Safely extract items from the cart data response
  const cartItems = cartData?.items || [];
  const cartCount = cartItems.length;
  
  const handleLogout = async () => {
    // If we're admin, clear the admin auth cookie
    if (isAdmin) {
      try {
        await apiRequest('POST', '/api/auth/logout');
        // Force reload to clear all auth state
        window.location.href = '/';
      } catch (error) {
        console.error('Failed to logout admin:', error);
      }
    } else {
      // Regular user logout
      logoutMutation.mutate();
    }
  };
  
  const isActive = (path: string) => {
    return location === path;
  };
  
  const navItems = [
    { label: "Collections", path: "/collections" },
    { label: "Custom Design", path: "/custom-design" },
    { label: "Gem & Metal Guide", path: "/gem-metal-guide" },
    { label: "Founder's Story", path: "/about" },
    { label: "Contact", path: "/contact" }
  ];
  
  return (
    <header className="bg-background shadow-md sticky top-0 z-50">
      <nav className="container mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <Logo size="lg" />
        </div>
        
        {/* Desktop navigation */}
        <div className="hidden md:flex space-x-6 items-center">
          {navItems.map((item) => (
            <Link 
              key={item.path}
              href={item.path}
              className={`font-montserrat transition duration-300 ${
                isActive(item.path)
                  ? "text-primary font-medium"
                  : "text-foreground hover:text-primary"
              }`}
            >
              {item.label}
            </Link>
          ))}
          
          {user || isAdmin ? (
            <div className="flex space-x-2">
              {isAdmin ? (
                <Link href="/admin/direct-dashboard" className="font-montserrat text-background bg-rose-600 px-4 py-2 rounded hover:bg-rose-700 transition duration-300 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Admin Dashboard
                </Link>
              ) : (
                <Link href="/customer-dashboard" className="font-montserrat text-background bg-primary px-4 py-2 rounded hover:bg-accent transition duration-300 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              )}
              <Button 
                onClick={handleLogout} 
                variant="outline" 
                className="font-montserrat flex items-center" 
                disabled={logoutMutation.isPending}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {logoutMutation.isPending ? "Logging out..." : "Logout"}
              </Button>
            </div>
          ) : (
            <Link href="/auth" className="font-montserrat text-background bg-primary px-4 py-2 rounded hover:bg-accent transition duration-300 flex items-center">
              <User className="h-4 w-4 mr-2" />
              Sign Up/Login
            </Link>
          )}
        </div>
        
        {/* Mobile menu button */}
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="Menu">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[80%] sm:w-[350px] bg-background">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-8">
                <div onClick={() => setIsMenuOpen(false)}>
                  <Logo size="md" />
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="flex flex-col space-y-6">
                {navItems.map((item) => (
                  <Link 
                    key={item.path}
                    href={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`font-montserrat text-lg transition duration-300 ${
                      isActive(item.path)
                        ? "text-primary font-medium"
                        : "text-foreground hover:text-primary"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
                
                {user || isAdmin ? (
                  <div className="flex flex-col space-y-4 mt-4">
                    {isAdmin ? (
                      <Link 
                        href="/admin/direct-dashboard"
                        onClick={() => setIsMenuOpen(false)}
                        className="font-montserrat text-background bg-rose-600 px-4 py-2 rounded hover:bg-rose-700 transition duration-300 flex items-center justify-center"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Admin Dashboard
                      </Link>
                    ) : (
                      <Link 
                        href="/customer-dashboard"
                        onClick={() => setIsMenuOpen(false)}
                        className="font-montserrat text-background bg-primary px-4 py-2 rounded hover:bg-accent transition duration-300 flex items-center justify-center"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Dashboard
                      </Link>
                    )}
                    <Button 
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }} 
                      variant="outline" 
                      className="font-montserrat flex items-center justify-center" 
                      disabled={logoutMutation.isPending}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      {logoutMutation.isPending ? "Logging out..." : "Logout"}
                    </Button>
                  </div>
                ) : (
                  <Link 
                    href="/auth"
                    onClick={() => setIsMenuOpen(false)}
                    className="font-montserrat text-background bg-primary px-4 py-2 rounded hover:bg-accent transition duration-300 flex items-center justify-center mt-4"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Sign Up/Login
                  </Link>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, X, ShoppingBag, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Logo } from "@/components/ui/logo";

export default function Header() {
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Fetch cart items count
  const { data: cartData } = useQuery({
    queryKey: ['/api/cart'],
    // Enable the cart query to properly show cart items
    staleTime: 60000 // 1 minute stale time to reduce refetches
  });
  
  // Safely extract items from the cart data response
  const cartItems = cartData?.items || [];
  const cartCount = cartItems.length;
  
  const isActive = (path: string) => {
    return location === path;
  };
  
  const navItems = [
    { label: "Collections", path: "/collections" },
    { label: "Custom Design", path: "/custom-design" },
    { label: "Inspiration", path: "/inspiration" },
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
          
          <Link href="/customer-dashboard" className="font-montserrat text-background bg-primary px-4 py-2 rounded hover:bg-accent transition duration-300 flex items-center">
            <User className="h-4 w-4 mr-2" />
            My Account
          </Link>
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
                
                <Link 
                  href="/customer-dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="font-montserrat text-background bg-primary px-4 py-2 rounded hover:bg-accent transition duration-300 flex items-center justify-center mt-4"
                >
                  <User className="h-4 w-4 mr-2" />
                  My Account
                </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}

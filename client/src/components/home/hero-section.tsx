import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export default function HeroSection() {
  const [scrollY, setScrollY] = useState(0);
  
  // Subtle parallax effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="relative h-screen overflow-hidden">
      {/* Split background design - 2 images side by side on desktop */}
      <div className="absolute inset-0 grid grid-cols-1 md:grid-cols-2 z-0">
        {/* Left side - rich background image */}
        <div className="relative h-full">
          <img 
            src="https://images.unsplash.com/photo-1633810253710-7ed0bc822a0f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80" 
            alt="Elegant diamond earrings" 
            className="w-full h-full object-cover"
            style={{ transform: `translateY(${scrollY * 0.05}px)` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-charcoal/80 to-charcoal/50"></div>
        </div>
        
        {/* Right side - close-up jewelry detail image (visible only on desktop) */}
        <div className="relative h-full hidden md:block">
          <img 
            src="https://images.unsplash.com/photo-1515377905703-c4788e51af15?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80" 
            alt="Fine jewelry craftsmanship" 
            className="w-full h-full object-cover"
            style={{ transform: `translateY(${scrollY * -0.05}px)` }}
          />
          <div className="absolute inset-0 bg-gradient-to-l from-charcoal/80 to-charcoal/50"></div>
        </div>
        
        {/* Mobile overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/70 via-charcoal/50 to-charcoal/70 md:hidden"></div>
      </div>
      
      {/* Diagonal gold accent line */}
      <div className="absolute hidden md:block w-full h-0.5 bg-primary opacity-70 top-1/2 transform -translate-y-1/2 -rotate-6 z-10"></div>
      
      {/* Decorative diamond pattern overlay */}
      <div className="absolute inset-0 z-5 opacity-5 pointer-events-none">
        <div className="h-full w-full" 
             style={{ 
               backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M20 10 L30 20 L20 30 L10 20 Z\' stroke=\'%23D4AF37\' stroke-width=\'0.5\' fill=\'none\'/%3E%3C/svg%3E")',
               backgroundSize: '40px 40px'
             }}>
        </div>
      </div>
      
      {/* Content */}
      <div className="relative z-20 container h-full mx-auto px-6 flex flex-col justify-center">
        <div className="max-w-2xl">
          <div className="mb-6">
            <div className="inline-flex items-center px-4 py-1.5 border border-primary/40 rounded-full bg-charcoal/30 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary mr-2" />
              <span className="text-xs uppercase tracking-widest font-montserrat text-pearl/90">
                Luxury Custom Jewelry
              </span>
            </div>
          </div>
          
          <h1 className="font-playfair font-bold text-4xl md:text-6xl lg:text-7xl text-pearl mb-6 leading-tight text-shadow">
            <span className="block">Crafted by</span>
            <span className="block text-primary">Artisans</span>
            <span className="block mt-2">Designed by You</span>
          </h1>
          
          <div className="mb-12 max-w-xl">
            <p className="font-cormorant text-xl md:text-2xl text-pearl/90 leading-relaxed">
              <span className="text-primary font-semibold">Experience bespoke luxury in every piece.</span>{" "}
              <span className="text-pearl/90">Timeless elegance reimagined for the modern connoisseur.</span>
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
            <Button 
              asChild
              className="font-montserrat font-medium bg-primary/90 text-pearl px-8 py-4 md:px-10 md:py-5 rounded-none border border-primary/80 hover:bg-primary transition duration-300 hover-shine h-auto group shadow-lg"
            >
              <Link href="/collections" className="flex items-center">
                <span>Explore Collection</span>
                <ArrowRight className="ml-2 h-4 w-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
              </Link>
            </Button>
            <Button 
              asChild
              variant="outline"
              className="font-montserrat font-medium border border-primary/80 bg-charcoal/30 backdrop-blur-sm text-pearl px-8 py-4 md:px-10 md:py-5 rounded-none hover:bg-primary/20 transition duration-300 h-auto shadow-lg"
            >
              <Link href="/custom-design">
                Create Custom Design
              </Link>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-8 left-8 h-20 w-20 border-t-2 border-l-2 border-primary/40 pointer-events-none"></div>
      <div className="absolute bottom-8 right-8 h-20 w-20 border-b-2 border-r-2 border-primary/40 pointer-events-none"></div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center z-20">
        <a href="#collections" className="flex flex-col items-center group">
          <span className="text-xs text-pearl/70 uppercase tracking-widest mb-2 font-montserrat group-hover:text-primary transition-colors duration-300">Discover</span>
          <div className="relative w-6 h-10 border-2 border-pearl/30 rounded-full flex justify-center p-1">
            <div className="w-1 h-2 bg-primary rounded-full animate-scroll"></div>
          </div>
        </a>
      </div>
    </section>
  );
}

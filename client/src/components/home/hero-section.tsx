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
      {/* Full-width background image with beautiful jewelry */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1622398925373-3f91b1d04b5d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=90" 
          alt="Elegant gold rings and luxury jewelry" 
          className="w-full h-full object-cover brightness-110 contrast-105"
          style={{ transform: `translateY(${scrollY * 0.05}px) scale(${1 + scrollY * 0.0002})` }}
        />
        {/* Semi-transparent gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-charcoal/90 via-charcoal/75 to-charcoal/60"></div>
      </div>
      
      {/* Subtle gold accents */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/80 via-primary/40 to-transparent"></div>
      <div className="absolute bottom-0 right-0 w-full h-1 bg-gradient-to-l from-primary/80 via-primary/40 to-transparent"></div>
      
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
        <div className="max-w-2xl md:ml-10 lg:ml-20">
          {/* Small luxury badge */}
          <div className="mb-6">
            <div className="inline-flex items-center px-4 py-1.5 border border-primary/40 rounded-full bg-charcoal/60 backdrop-blur-sm shadow-lg">
              <Sparkles className="h-3.5 w-3.5 text-primary mr-2" />
              <span className="text-xs uppercase tracking-widest font-montserrat text-primary font-semibold">
                Luxury Custom Jewelry
              </span>
            </div>
          </div>
          
          {/* Heading with enhanced elegant typography */}
          <h1 className="font-playfair font-bold text-4xl md:text-6xl lg:text-7xl mb-6 leading-tight">
            <span className="block text-shadow-lg text-white">Crafted by</span>
            <span className="block text-primary text-glow font-extrabold my-1">Artisans</span>
            <span className="block mt-2 text-shadow-lg text-white">Designed by You</span>
          </h1>
          
          {/* Tagline with elegant styling and enhanced readability */}
          <div className="mb-12 max-w-xl">
            <p className="font-cormorant text-xl md:text-2xl leading-relaxed border-l-2 border-primary pl-4 text-shadow-sm">
              <span className="text-primary font-semibold">Experience bespoke luxury in every piece.</span>{" "}
              <span className="text-pearl font-medium">Timeless elegance reimagined for the modern connoisseur.</span>
            </p>
          </div>
          
          {/* Call to action buttons */}
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
              className="font-montserrat font-medium border border-primary/80 bg-primary/20 backdrop-blur-sm text-pearl px-8 py-4 md:px-10 md:py-5 rounded-none hover:bg-primary/30 focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-charcoal transition duration-300 h-auto shadow-lg"
            >
              <Link href="/custom-design" className="flex items-center">
                <span>Create Custom Design</span>
                <span className="ml-2">✦</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Decorative corner elements */}
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

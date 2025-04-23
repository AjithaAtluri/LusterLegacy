import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronDown, Diamond, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export default function HeroSection() {
  const [scrollY, setScrollY] = useState(0);
  
  // Parallax effect on scroll
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Parallax */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1617038220319-276d3cfab638?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80" 
          alt="Luxury jewelry showcase" 
          className="w-full h-full object-cover"
          style={{ transform: `translateY(${scrollY * 0.2}px)` }}
        />
        <div className="absolute inset-0 bg-gradient-radial from-charcoal/40 to-charcoal/80"></div>
      </div>
      
      {/* Gold decorative diamond pattern overlay */}
      <div className="absolute inset-0 z-5 opacity-10 pointer-events-none">
        <div className="h-full w-full" 
             style={{ 
               backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M30 15 L45 30 L30 45 L15 30 Z\' stroke=\'%23D4AF37\' stroke-width=\'1\' fill=\'none\'/%3E%3C/svg%3E")',
               backgroundSize: '60px 60px'
             }}>
        </div>
      </div>
      
      {/* Luxury frame border */}
      <div className="absolute inset-0 z-10 border-8 border-primary/5 m-8 md:m-12 pointer-events-none"></div>
      
      {/* Content with glass card effect */}
      <div 
        className="relative z-20 container mx-auto px-4"
        style={{ transform: `translateY(${scrollY * -0.1}px)` }}
      >
        <div className="backdrop-blur-md bg-charcoal/20 border border-pearl/10 rounded-xl p-8 md:p-12 max-w-4xl mx-auto shadow-2xl">
          {/* Logo mark */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <Diamond size={36} className="text-primary" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Diamond size={24} className="text-pearl" />
              </div>
            </div>
          </div>
          
          <div className="inline-flex items-center mb-6 bg-charcoal/40 backdrop-blur-sm px-4 py-1 rounded-full mx-auto">
            <Sparkles className="h-4 w-4 text-primary mr-2" />
            <span className="text-xs uppercase tracking-widest font-montserrat text-pearl">Luxury Custom Jewelry</span>
          </div>
          
          <h1 className="font-playfair font-bold text-4xl md:text-6xl text-pearl mb-8 text-center">
            <span className="block mb-2">Crafted by Artisans,</span>
            <span className="text-primary relative inline-block">
              Designed by You
              <span className="absolute -bottom-3 left-0 right-0 mx-auto w-3/4 h-0.5 bg-primary"></span>
            </span>
          </h1>
          
          <div className="mb-10 py-4 max-w-3xl mx-auto">
            <p className="font-cormorant text-xl md:text-2xl text-pearl mb-2 text-center text-shadow-sm">
              <span className="font-semibold text-primary">Experience bespoke luxury in every piece.</span>
            </p>
            <p className="font-cormorant text-xl md:text-2xl text-pearl text-center text-shadow-sm">
              <span className="text-pearl font-medium">Timeless elegance reimagined for the modern connoisseur.</span>
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 justify-center">
            <Button 
              asChild
              className="font-montserrat font-medium bg-primary text-pearl px-8 py-4 rounded-full hover:bg-primary/90 transition duration-300 hover-shine h-auto group"
            >
              <Link href="/collections" className="flex items-center">
                <span>Explore Collection</span>
                <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">→</span>
              </Link>
            </Button>
            <Button 
              asChild
              variant="outline"
              className="font-montserrat font-medium border-2 border-primary/80 bg-transparent text-pearl px-8 py-4 rounded-full hover:bg-primary/20 transition duration-300 h-auto"
            >
              <Link href="/custom-design">
                Create Custom Design
              </Link>
            </Button>
          </div>
          
          {/* Decorative gold corner accents inside the card */}
          <div className="absolute top-4 left-4 h-8 w-8 border-t-2 border-l-2 border-primary/60"></div>
          <div className="absolute top-4 right-4 h-8 w-8 border-t-2 border-r-2 border-primary/60"></div>
          <div className="absolute bottom-4 left-4 h-8 w-8 border-b-2 border-l-2 border-primary/60"></div>
          <div className="absolute bottom-4 right-4 h-8 w-8 border-b-2 border-r-2 border-primary/60"></div>
        </div>
      </div>
      
      {/* Scroll Indicator with animation */}
      <div className="absolute bottom-12 left-0 right-0 flex justify-center z-20">
        <a 
          href="#collections" 
          className="group flex flex-col items-center"
        >
          <span className="text-xs text-pearl/70 uppercase tracking-widest mb-2 font-montserrat group-hover:text-primary transition-colors duration-300">Discover</span>
          <div className="relative w-6 h-10 border-2 border-pearl/30 rounded-full flex justify-center p-1">
            <div className="w-1 h-2 bg-primary rounded-full animate-scroll"></div>
          </div>
        </a>
      </div>
    </section>
  );
}

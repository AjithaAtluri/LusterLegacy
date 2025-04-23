import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative h-screen overflow-hidden">
      {/* Main background image */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1604176424472-44aee1ad3196?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80" 
          alt="Elegant jewelry" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/70 via-charcoal/50 to-charcoal/70"></div>
      </div>
      
      {/* Simple thin gold line in the middle */}
      <div className="absolute hidden md:block h-px w-1/2 bg-primary left-0 top-1/2 transform -translate-y-1/2 opacity-70"></div>
      
      {/* Content - Left aligned, minimal clean design */}
      <div className="relative z-10 container h-full mx-auto px-6 flex flex-col justify-center">
        <div className="max-w-2xl md:ml-10 lg:ml-20">
          <div className="mb-4">
            <span className="inline-block px-4 py-1 border border-primary/40 rounded-full text-xs uppercase tracking-widest font-montserrat text-pearl/90 mb-6">
              Luxury Custom Jewelry
            </span>
          </div>
          
          <h1 className="font-playfair font-bold text-4xl md:text-6xl lg:text-7xl text-pearl mb-6 leading-tight">
            <span className="block">Crafted by</span>
            <span className="block text-primary">Artisans</span>
            <span className="block mt-2">Designed by You</span>
          </h1>
          
          <p className="font-cormorant text-xl md:text-2xl text-pearl/90 max-w-md leading-relaxed mb-12">
            Experience bespoke luxury in every piece. Timeless elegance reimagined for the modern connoisseur.
          </p>
          
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
            <Button 
              asChild
              className="font-montserrat font-medium bg-primary/90 text-pearl px-8 py-4 md:px-10 md:py-5 rounded-none hover:bg-primary transition duration-300 hover-shine h-auto group"
            >
              <Link href="/collections" className="flex items-center">
                <span>Explore Collection</span>
                <ArrowRight className="ml-2 h-4 w-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
              </Link>
            </Button>
            <Button 
              asChild
              variant="outline"
              className="font-montserrat font-medium border border-primary/80 bg-transparent text-pearl px-8 py-4 md:px-10 md:py-5 rounded-none hover:bg-primary/20 transition duration-300 h-auto"
            >
              <Link href="/custom-design">
                Create Custom Design
              </Link>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Decorative corner element (subtle, minimal) */}
      <div className="absolute top-8 left-8 h-16 w-16 border-t border-l border-primary/30 pointer-events-none"></div>
      <div className="absolute bottom-8 right-8 h-16 w-16 border-b border-r border-primary/30 pointer-events-none"></div>
      
      {/* Subtle scroll indicator */}
      <div className="absolute bottom-10 right-10 text-pearl/70">
        <span className="text-xs uppercase tracking-wider font-montserrat block transform rotate-90 origin-bottom-right">Scroll</span>
        <div className="w-px h-16 bg-pearl/30 absolute -bottom-20 right-2"></div>
      </div>
    </section>
  );
}

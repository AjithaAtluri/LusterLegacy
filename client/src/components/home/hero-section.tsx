import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronDown, Sparkles } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Split Design */}
      <div className="absolute inset-0 z-0">
        <div className="grid grid-cols-1 md:grid-cols-2 h-full">
          {/* Left side - main image */}
          <div className="relative h-full">
            <img 
              src="https://images.unsplash.com/photo-1617038220319-276d3cfab638?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80" 
              alt="Luxury jewelry showcase" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-charcoal/70 to-charcoal/20"></div>
          </div>
          
          {/* Right side - elegant pattern or secondary image */}
          <div className="relative hidden md:block h-full">
            <img 
              src="https://images.unsplash.com/photo-1579169233264-5d7ba5de5756?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80" 
              alt="Luxury jewelry details" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-charcoal/70 to-charcoal/20"></div>
          </div>
        </div>
        
        {/* Overlay for mobile view */}
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/50 via-charcoal/40 to-charcoal/60 md:hidden"></div>
        
        {/* Gold diagonal accent line */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-10 pointer-events-none hidden md:block">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-primary transform -translate-y-1/2 rotate-6 opacity-80"></div>
        </div>
      </div>
      
      {/* Content */}
      <div className="relative z-20 container mx-auto px-4 grid md:grid-cols-2 items-center">
        <div className="text-left md:pr-8 max-w-xl mx-auto md:mx-0 text-center md:text-left">
          <div className="inline-flex items-center mb-6 bg-charcoal/40 backdrop-blur-sm px-4 py-1 rounded-full">
            <Sparkles className="h-4 w-4 text-primary mr-2" />
            <span className="text-xs uppercase tracking-widest font-montserrat text-pearl">Luxury Custom Jewelry</span>
          </div>
          
          <h1 className="font-playfair font-bold text-4xl md:text-6xl text-pearl mb-6 text-shadow">
            Crafted by Artisans, <span className="text-primary relative">
              Designed by You
              <span className="absolute -bottom-2 left-0 h-0.5 w-full bg-primary"></span>
            </span>
          </h1>
          
          <div className="mb-10 backdrop-blur-sm py-4">
            <p className="font-cormorant text-xl md:text-2xl text-pearl mb-2 text-shadow-sm">
              <span className="font-semibold text-primary">Experience bespoke luxury in every piece.</span>
            </p>
            <p className="font-cormorant text-xl md:text-2xl text-pearl text-shadow-sm">
              <span className="text-pearl font-medium">Timeless elegance reimagined for the modern connoisseur.</span>
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 justify-center md:justify-start">
            <Button 
              asChild
              className="font-montserrat font-medium bg-primary text-pearl px-8 py-4 rounded-full hover:bg-accent transition duration-300 hover-shine h-auto"
            >
              <Link href="/collections">
                Explore Collection
              </Link>
            </Button>
            <Button 
              asChild
              variant="outline"
              className="font-montserrat font-medium border-2 border-primary text-pearl px-8 py-4 rounded-full hover:bg-primary transition duration-300 h-auto"
            >
              <Link href="/custom-design">
                Create Custom Design
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Empty right column for desktop */}
        <div className="hidden md:block"></div>
      </div>
      
      {/* Decorative element */}
      <div className="absolute bottom-20 right-10 hidden lg:block z-10">
        <div className="w-32 h-32 border-2 border-primary/30 rounded-full"></div>
        <div className="w-32 h-32 border-2 border-primary/50 rounded-full absolute top-4 left-4"></div>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center animate-bounce z-20">
        <a href="#collections" className="bg-charcoal/40 backdrop-blur-sm p-2 rounded-full text-pearl">
          <ChevronDown className="h-6 w-6" />
        </a>
      </div>
    </section>
  );
}

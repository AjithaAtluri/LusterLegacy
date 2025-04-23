import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronDown, Sparkles } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1617038220319-276d3cfab638?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80" 
          alt="Luxury jewelry showcase" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/60 via-charcoal/40 to-charcoal/70"></div>
      </div>
      
      {/* Gold decorative accents */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-10 pointer-events-none">
        <div className="absolute top-10 md:top-20 left-0 w-32 md:w-64 h-0.5 bg-primary opacity-60"></div>
        <div className="absolute bottom-10 md:bottom-20 right-0 w-32 md:w-64 h-0.5 bg-primary opacity-60"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-20 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center mb-6 bg-charcoal/60 backdrop-blur-sm px-4 py-1 rounded-full">
            <Sparkles className="h-4 w-4 text-primary mr-2" />
            <span className="text-xs uppercase tracking-widest font-montserrat text-pearl">Luxury Custom Jewelry</span>
          </div>
          
          <h1 className="font-playfair font-bold text-4xl md:text-6xl text-pearl mb-6 text-shadow">
            Crafted by Artisans, <br className="hidden sm:block" />
            <span className="text-primary relative">
              Designed by You
              <span className="absolute -bottom-2 left-0 right-0 mx-auto w-3/4 h-0.5 bg-primary"></span>
            </span>
          </h1>
          
          <div className="mb-10 backdrop-blur-sm py-4 px-6 rounded-lg bg-charcoal/30 max-w-3xl mx-auto">
            <p className="font-cormorant text-xl md:text-2xl text-pearl mb-2 text-shadow-sm">
              <span className="font-semibold text-primary">Experience bespoke luxury in every piece.</span>
            </p>
            <p className="font-cormorant text-xl md:text-2xl text-pearl text-shadow-sm">
              <span className="text-pearl font-medium">Timeless elegance reimagined for the modern connoisseur.</span>
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 justify-center">
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
      </div>
      
      {/* Decorative corners */}
      <div className="absolute top-10 left-10 hidden lg:block z-10">
        <div className="w-16 h-16 border border-primary/50 rounded-tl-3xl"></div>
      </div>
      <div className="absolute bottom-10 right-10 hidden lg:block z-10">
        <div className="w-16 h-16 border border-primary/50 rounded-br-3xl"></div>
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

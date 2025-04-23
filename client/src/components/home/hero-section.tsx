import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

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
        <div className="absolute inset-0 bg-charcoal opacity-30"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 text-center px-4 md:px-8 max-w-5xl">
        <h1 className="font-playfair font-bold text-4xl md:text-6xl text-pearl mb-6 text-shadow">
          Crafted by Artisans, <span className="text-primary">Designed by You</span>
        </h1>
        <p className="font-cormorant text-xl md:text-2xl text-pearl mb-12">
          Experience bespoke luxury in every piece. Timeless elegance reimagined for the modern connoisseur.
        </p>
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6 justify-center">
          <Button 
            asChild
            className="font-montserrat font-medium bg-primary text-pearl px-8 py-4 rounded hover:bg-accent transition duration-300 hover-shine h-auto"
          >
            <Link href="/collections">
              Explore Collection
            </Link>
          </Button>
          <Button 
            asChild
            variant="outline"
            className="font-montserrat font-medium border-2 border-primary text-pearl px-8 py-4 rounded hover:bg-primary transition duration-300 h-auto"
          >
            <Link href="/custom-design">
              Create Custom Design
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center animate-bounce">
        <a href="#collections" className="text-pearl">
          <ChevronDown className="h-6 w-6" />
        </a>
      </div>
    </section>
  );
}

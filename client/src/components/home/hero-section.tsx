import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import backgroundImage from "../../assets/zhang-liven-MbImicTZK54-unsplash.jpg";

export default function HeroSection() {
  const [scrollY, setScrollY] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Preload the background image
  useEffect(() => {
    const img = new Image();
    img.src = backgroundImage;
    img.onload = () => setImageLoaded(true);
    
    // If the image is already in cache, it might be loaded instantly
    if (imageRef.current?.complete) {
      setImageLoaded(true);
    }
  }, []);
  
  // Subtle parallax effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="relative h-[80vh] overflow-hidden">
      {/* Placeholder background color while image loads */}
      <div className="absolute inset-0 z-0 bg-charcoal"></div>
      
      {/* Full-width background image with beautiful jewelry */}
      <div className={`absolute inset-0 z-0 transition-opacity duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}>
        <img 
          ref={imageRef}
          src={backgroundImage} 
          alt="Elegant yellow diamond earrings on black stone" 
          className="w-full h-full object-cover brightness-110 contrast-110 saturate-120"
          style={{ transform: `translateY(${scrollY * 0.05}px) scale(${1 + scrollY * 0.0002})` }}
          onLoad={() => setImageLoaded(true)}
          fetchPriority="high"
          loading="eager"
          decoding="sync"
        />
        {/* Semi-transparent gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-charcoal/70 via-charcoal/55 to-charcoal/30"></div>
      </div>
      
      {/* Gold and purple accent lines */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/80 via-accent/60 to-transparent"></div>
      <div className="absolute bottom-0 right-0 w-full h-1 bg-gradient-to-l from-accent/80 via-primary/60 to-transparent"></div>
      
      {/* Decorative diamond pattern overlay with alternating gold and purple */}
      <div className="absolute inset-0 z-5 opacity-5 pointer-events-none">
        <div className="h-full w-full" 
             style={{ 
               backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M20 10 L30 20 L20 30 L10 20 Z\' stroke=\'%23D4AF37\' stroke-width=\'0.5\' fill=\'none\'/%3E%3C/svg%3E"), url("data:image/svg+xml,%3Csvg width=\'80\' height=\'80\' viewBox=\'0 0 80 80\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M40 20 L60 40 L40 60 L20 40 Z\' stroke=\'%23a855f7\' stroke-width=\'0.5\' fill=\'none\'/%3E%3C/svg%3E")',
               backgroundSize: '40px 40px, 80px 80px'
             }}>
        </div>
      </div>
      
      {/* Subtle purple accent in top right */}
      <div className="absolute top-6 right-6 w-32 h-32 rounded-full bg-accent/5 blur-3xl"></div>
      
      {/* Content - only displays after image is loaded */}
      <div className={`relative z-20 container h-full mx-auto px-6 flex flex-col justify-center transition-opacity duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}>
        <div className="max-w-2xl md:ml-10 lg:ml-20">
          {/* Small luxury badge */}
          <div className="mb-4">
            <div className="inline-flex items-center px-3 py-1 border border-primary/40 rounded-full bg-charcoal/60 backdrop-blur-sm shadow-lg">
              <Sparkles className="h-3.5 w-3.5 text-primary mr-2" />
              <span className="text-xs uppercase tracking-widest font-montserrat text-primary font-semibold">
                Luxury Custom Jewelry
              </span>
            </div>
          </div>
          
          {/* Heading with enhanced elegant typography */}
          <h1 className="font-playfair font-bold text-3xl md:text-5xl lg:text-6xl mb-5 leading-tight">
            <span className="block text-shadow-lg text-white">Crafted by</span>
            <span className="block text-primary text-glow font-extrabold my-1">Artisans</span>
            <span className="block mt-2 text-shadow-lg text-white">Designed by You</span>
          </h1>
          
          {/* Tagline with elegant styling using gold for better visibility */}
          <div className="mb-8 max-w-xl">
            <p className="font-cormorant text-xl md:text-2xl leading-relaxed border-l-2 border-primary pl-4 text-primary text-glow">
              <span className="font-semibold">Experience bespoke luxury in every piece.</span>{" "}
              <span className="font-medium">Timeless elegance reimagined for the modern connoisseur.</span>
            </p>
          </div>
          
          {/* Call to action buttons */}
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
            <Button 
              asChild
              className="font-montserrat font-medium bg-primary/90 text-white px-6 py-3 md:px-8 md:py-4 rounded-none border border-primary/80 hover:bg-primary transition duration-300 hover-shine h-auto group shadow-lg"
            >
              <Link href="/collections" className="flex items-center">
                <span>Explore Collection</span>
                <ArrowRight className="ml-2 h-4 w-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
              </Link>
            </Button>
            <Button 
              asChild
              className="font-montserrat font-medium bg-accent/90 text-white px-6 py-3 md:px-8 md:py-4 rounded-none border border-accent/80 hover:bg-accent transition duration-300 hover-shine h-auto group shadow-lg"
            >
              <Link href="/custom-design" className="flex items-center">
                <span>Create Custom Design</span>
                <span className="ml-2">✦</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Decorative corner elements with alternating colors - only shows after image loads */}
      <div className={`absolute top-6 left-6 h-16 w-16 border-t-2 border-l-2 border-primary/40 pointer-events-none transition-opacity duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}></div>
      <div className={`absolute bottom-6 right-6 h-16 w-16 border-b-2 border-r-2 border-accent/40 pointer-events-none transition-opacity duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}></div>
      
      {/* Scroll indicator with purple accents - only shows after image loads */}
      <div className={`absolute bottom-6 left-0 right-0 flex justify-center z-20 transition-opacity duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}>
        <a href="#collections" className="flex flex-col items-center group">
          <span className="text-xs text-pearl/70 uppercase tracking-widest mb-2 font-montserrat group-hover:text-accent transition-colors duration-300">Discover</span>
          <div className="relative w-6 h-10 border-2 border-pearl/30 rounded-full flex justify-center p-1">
            <div className="w-1 h-2 bg-accent rounded-full animate-scroll"></div>
          </div>
        </a>
      </div>
    </section>
  );
}

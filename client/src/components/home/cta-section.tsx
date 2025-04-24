import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function CTASection() {
  return (
    <section className="py-20 px-4 md:px-8 bg-background relative">
      <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1579272734090-3861446418e5?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')" }}></div>
      
      <div className="container mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-playfair text-3xl md:text-4xl font-bold text-foreground mb-6">
            Begin Your Jewelry Journey Today
          </h2>
          <p className="font-montserrat text-lg text-foreground/80 mb-10">
            Whether you choose from our collection or create something entirely unique, we're ready to craft a piece that tells your story.
          </p>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 justify-center">
            <Button 
              asChild
              className="font-montserrat font-medium bg-primary text-background px-8 py-4 rounded hover:bg-accent transition duration-300 hover-shine h-auto"
            >
              <Link href="/collections">
                Explore Collection
              </Link>
            </Button>
            <Button 
              asChild
              className="font-montserrat font-medium bg-amber-600 text-white px-8 py-4 rounded hover:bg-amber-700 transition duration-300 h-auto"
              style={{ opacity: 1, visibility: 'visible' }}
            >
              <Link href="/custom-design">
                Start Custom Design
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

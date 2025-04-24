import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function StorySection() {
  return (
    <section id="story" className="py-20 px-4 md:px-8 bg-charcoal text-pearl">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-playfair text-3xl md:text-4xl font-bold text-pearl mb-4">Founder's Story</h2>
            <div className="w-24 h-1 bg-primary mb-8"></div>
            
            <blockquote className="font-cormorant text-2xl italic text-pearl/90 mb-8">
              "Every jewel begins with a spark — mine began with passion."
            </blockquote>
            
            <p className="font-montserrat text-pearl/80 mb-6">
              Luster Legacy wasn't born from a family lineage in jewelry — it was born from a personal fascination with craftsmanship, design, and the timeless beauty of fine stones.
            </p>
            
            <p className="font-montserrat text-pearl/80 mb-6">
              At Luster Legacy, we believe jewelry is deeply personal – a reflection of your story and style. We are a luxury jewelry house specializing in custom-made pieces that celebrate individuality and timeless elegance.
            </p>
            
            <p className="font-montserrat text-pearl/80 mb-6">
              Each creation is meticulously handcrafted by our master artisans using only the finest materials, resulting in heirloom-quality jewelry that can be cherished for generations.
            </p>
            
            <Button 
              asChild
              className="font-montserrat font-medium bg-primary text-pearl px-6 py-3 rounded hover:bg-accent transition duration-300 mt-4 h-auto"
            >
              <Link href="/about">
                Read More About Us
              </Link>
            </Button>
          </div>
          
          <div>
            <div className="relative">
              <img 
                src="/assets/cad-design.jpg" 
                alt="Designer working on jewelry CAD design" 
                className="rounded-lg shadow-xl"
                onError={(e) => {
                  // Fallback image in case the custom one fails to load
                  e.currentTarget.src = "https://images.pexels.com/photos/3861964/pexels-photo-3861964.jpeg?auto=compress&cs=tinysrgb&w=800";
                }}
              />
                
              <img 
                src="/assets/finished-jewelry.jpg" 
                alt="Finished luxury jewelry piece" 
                className="absolute -bottom-10 -right-10 w-48 h-48 object-cover rounded-lg shadow-xl border-4 border-background"
                onError={(e) => {
                  // Fallback image in case the custom one fails to load
                  e.currentTarget.src = "https://images.pexels.com/photos/11640323/pexels-photo-11640323.jpeg?auto=compress&cs=tinysrgb&w=400";
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

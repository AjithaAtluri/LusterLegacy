import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import cadImage from "../../../src/assets/WhatsApp Image 2025-03-28 at 3.06.26 AM.jpeg";
import jewelryImage from "../../../src/assets/final image.jpeg";
import collageImage1 from "@assets/ChatGPT Image Apr 23, 2025, 09_12_34 PM.png";
import collageImage2 from "@assets/WhatsApp Image 2025-03-21 at 10.26.13 PM.jpeg";

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
            <div className="grid grid-cols-12 gap-3 h-full">
              {/* Main image */}
              <div className="col-span-8 row-span-2 relative">
                <img 
                  src={cadImage} 
                  alt="Designer working on jewelry CAD design" 
                  className="w-full h-full object-cover rounded-lg shadow-lg"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.pexels.com/photos/3861964/pexels-photo-3861964.jpeg?auto=compress&cs=tinysrgb&w=800";
                  }}
                />
              </div>
              
              {/* Top right image */}
              <div className="col-span-4 row-span-1">
                <img 
                  src={collageImage1} 
                  alt="Lavender gemstones and finished jewelry" 
                  className="w-full h-full object-cover rounded-lg shadow-lg"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.pexels.com/photos/5370706/pexels-photo-5370706.jpeg?auto=compress&cs=tinysrgb&w=800";
                  }}
                />
              </div>
              
              {/* Bottom right image */}
              <div className="col-span-4 row-span-1">
                <img 
                  src={collageImage2} 
                  alt="Crafting process" 
                  className="w-full h-full object-cover rounded-lg shadow-lg"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.pexels.com/photos/3094344/pexels-photo-3094344.jpeg?auto=compress&cs=tinysrgb&w=800";
                  }}
                />
              </div>
              
              {/* Bottom wider image */}
              <div className="col-span-6 row-span-1 mt-3">
                <img 
                  src={jewelryImage} 
                  alt="Finished luxury jewelry piece" 
                  className="w-full h-full object-cover rounded-lg shadow-lg"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.pexels.com/photos/11640323/pexels-photo-11640323.jpeg?auto=compress&cs=tinysrgb&w=800";
                  }}
                />
              </div>
              
              {/* Quote box */}
              <div className="col-span-6 row-span-1 bg-accent/90 rounded-lg shadow-lg p-4 flex items-center mt-3">
                <blockquote className="font-cormorant text-base italic text-white">
                  "I believe that true luxury isn't just about precious materials — it's about the meaning we invest in our possessions."
                </blockquote>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

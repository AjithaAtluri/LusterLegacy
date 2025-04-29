import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import passionImage from "../assets/passion-meets-craftsmanship-new.png";

export default function About() {
  return (
    <>
      <Helmet>
        <title>Founder's Story | Luster Legacy</title>
        <meta name="description" content="Discover the story behind Luster Legacy, a luxury jewelry house specializing in custom-made pieces that celebrate individuality and timeless elegance." />
      </Helmet>
      
      <div className="bg-charcoal py-20">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <h1 className="font-playfair text-3xl md:text-5xl font-bold text-pearl mb-4">Founder's Story</h1>
          <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
          <p className="font-cormorant text-lg md:text-xl text-pearl/80 max-w-2xl mx-auto">
            Every jewel begins with a spark — ours began with passion.
          </p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 md:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="font-playfair text-2xl md:text-3xl font-bold text-foreground mb-6">The Founder's Journey</h2>
            <div className="prose prose-lg max-w-none font-montserrat text-foreground/80">
              <p>
                Luster Legacy wasn't born from a family lineage in jewelry — it was born from a personal fascination with craftsmanship, design, and the timeless beauty of fine stones.
              </p>
              <p>
                I've always been drawn to creativity, and over the years, that curiosity led me deep into the world of jewelry. I began sourcing my own stones, studying traditional and modern designs, and working closely with skilled artisans.
              </p>
              <p>
                Slowly but surely, I discovered a calling — to create jewelry that carries personal significance, pieces that tell stories and become treasured heirlooms. This journey of learning and creation eventually blossomed into Luster Legacy.
              </p>
              <blockquote className="font-cormorant text-xl italic border-l-4 border-primary pl-4">
                "I believe that true luxury isn't just about precious materials — it's about the meaning we invest in our possessions and the stories they carry forward."
              </blockquote>
            </div>
          </div>
          <div>
            <img 
              src={passionImage} 
              alt="Where passion meets craftsmanship - every masterpiece begins with a spark" 
              className="rounded-lg shadow-xl w-full"
            />
          </div>
        </div>
        
        <div className="mb-16">
          <h2 className="font-playfair text-2xl md:text-3xl font-bold text-foreground mb-6 text-center">Our Philosophy</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card p-8 rounded-lg shadow-md">
              <h3 className="font-playfair text-xl font-semibold text-foreground mb-4">Artisanal Excellence</h3>
              <p className="font-montserrat text-foreground/70">
                Each piece is meticulously handcrafted by our master artisans using traditional techniques passed down through generations. We blend these time-honored methods with modern innovation to create jewelry of exceptional quality.
              </p>
            </div>
            <div className="bg-card p-8 rounded-lg shadow-md">
              <h3 className="font-playfair text-xl font-semibold text-foreground mb-4">Personal Significance</h3>
              <p className="font-montserrat text-foreground/70">
                We believe jewelry should be deeply personal – a reflection of your story and style. Whether customizing one of our designs or creating something entirely bespoke, we ensure each piece speaks to your individual journey.
              </p>
            </div>
            <div className="bg-card p-8 rounded-lg shadow-md">
              <h3 className="font-playfair text-xl font-semibold text-foreground mb-4">Timeless Elegance</h3>
              <p className="font-montserrat text-foreground/70">
                While we embrace contemporary aesthetics, we design with longevity in mind. Our pieces transcend trends, becoming treasured heirlooms that can be passed down through generations with pride.
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="order-2 lg:order-1">
            <h2 className="font-playfair text-2xl md:text-3xl font-bold text-foreground mb-6">Our Craftsmanship</h2>
            <div className="prose prose-lg max-w-none font-montserrat text-foreground/80">
              <p>
                At Luster Legacy, the journey of creation is as important as the final piece. We take pride in our meticulous process that honors both traditional craftsmanship and modern precision.
              </p>
              <p>
                Our artisans have spent decades perfecting their craft, specializing in techniques like Kundan, Polki, and Meenakari work. Each piece passes through multiple stages of refinement – from initial sketches to wax carving, metal casting, stone setting, and final polishing.
              </p>
              <p>
                We source only the finest materials – ethically acquired stones, premium metals, and quality embellishments. Our dedication to excellence means that we never cut corners, ensuring that each creation meets our exacting standards before it reaches you.
              </p>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <img 
              src="https://images.unsplash.com/photo-1605100804763-247f67b3557e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
              alt="Detailed jewelry craftsmanship" 
              className="rounded-lg shadow-xl w-full"
            />
          </div>
        </div>
        
        <div className="text-center mb-16">
          <h2 className="font-playfair text-2xl md:text-3xl font-bold text-foreground mb-6">Our Commitment</h2>
          <p className="font-montserrat text-lg text-foreground/80 max-w-3xl mx-auto mb-8">
            Beyond creating beautiful jewelry, we're committed to ethical practices, sustainable sourcing, and giving back to the artisan communities that make our work possible. Every purchase supports our mission of preserving traditional craftsmanship while empowering the next generation of artisans.
          </p>
          <Button asChild className="font-montserrat bg-primary text-background hover:bg-accent">
            <Link href="/contact">
              Connect With Us
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="bg-accent/10 py-16">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <h2 className="font-playfair text-2xl md:text-3xl font-bold text-foreground mb-6">Begin Your Luster Legacy Journey</h2>
          <p className="font-montserrat text-lg text-foreground/80 max-w-3xl mx-auto mb-8">
            Whether you're drawn to our curated collections or inspired to create something uniquely yours, we invite you to experience the exceptional quality and personalized service that defines Luster Legacy.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild className="font-montserrat bg-primary text-background hover:bg-accent">
              <Link href="/collections">
                Explore Our Collections
              </Link>
            </Button>
            <Button asChild variant="outline" className="font-montserrat">
              <Link href="/custom-design">
                Design Your Custom Piece
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

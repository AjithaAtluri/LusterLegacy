import { Helmet } from "react-helmet";

import { ArrowRight, Heart, ZoomIn } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import rubyLeafPendant from "@/assets/ruby-leaf-pendant.png";
import pearlNecklaceSet from "@/assets/pearl-necklace-set.png";
import polkiPendantNecklace from "@/assets/polki-pendant-necklace.png";
import diamondBracelet from "@/assets/diamond-bracelet.jpeg";
import emeraldRing from "@/assets/emerald-ring.jpeg";
import goldEarrings from "@/assets/gold-earrings.jpeg";
import emeraldNecklace from "@/assets/emerald-necklace.png";
import jewelry1 from "@/assets/jewelry1.jpeg";
import jewelry2 from "@/assets/jewelry2.jpeg";
import jewelry3 from "@/assets/jewelry3.jpeg";
import jewelry4 from "@/assets/jewelry4.jpeg";
import jewelry5 from "@/assets/jewelry5.jpeg";
import jewelry6 from "@/assets/jewelry6.jpeg";
import jewelry7 from "@/assets/jewelry7.jpeg";
import jewelry8 from "@/assets/jewelry8.jpeg";
import jewelry9 from "@/assets/jewelry9.jpeg";
import jewelry10 from "@/assets/jewelry10.jpeg";
import jewelry11 from "@/assets/jewelry11.jpeg";
import jewelry12 from "@/assets/jewelry12.jpeg";
import jewelry13 from "@/assets/jewelry13.jpeg";
import jewelry14 from "@/assets/jewelry14.jpeg";
import jewelry15 from "@/assets/jewelry15.jpeg";

// Gallery image interface
interface GalleryImage {
  id: number;
  src: string;
  alt: string;
  title: string;
  description?: string; // Made optional
}

export default function Inspiration() {
  // Image gallery data with design inspiration images
  const galleryImages: GalleryImage[] = [
    {
      id: 1,
      src: rubyLeafPendant,
      alt: "Carved ruby leaf pendant in gold setting",
      title: "Autumn Ruby Leaf",
      description: "An exquisite carved ruby leaf pendant set in a luxurious 18K gold bezel, showcasing the natural beauty of the gemstone with its translucent quality."
    },
    {
      id: 2,
      src: pearlNecklaceSet,
      alt: "Multi-strand pearl necklace with diamond accents",
      title: "Royal Pearl Cascade",
      description: "A stunning multi-strand pearl necklace featuring elegant gold and diamond spacers, creating a luxurious collar effect perfect for special occasions."
    },
    {
      id: 3,
      src: polkiPendantNecklace,
      alt: "Polki diamond necklace with emerald and ruby pendant",
      title: "Dual Gemstone Elegance",
      description: "A sophisticated polki diamond necklace featuring a stunning dual pendant with ruby and emerald gemstones, surrounded by intricate diamond detailing."
    },
    {
      id: 4,
      src: diamondBracelet,
      alt: "Diamond and pearl bracelet with gold accents",
      title: "Celestial Diamond Band",
      description: "A luxurious bracelet featuring a perfect balance of brilliant-cut diamonds and delicate pearls set in high-polish gold, creating a timeless statement piece."
    },
    {
      id: 5,
      src: emeraldRing,
      alt: "Emerald and diamond cocktail ring",
      title: "Emerald Majesty",
      description: "A statement cocktail ring featuring a magnificent emerald center stone surrounded by a halo of brilliant-cut diamonds, set in polished gold for maximum brilliance."
    },
    {
      id: 6,
      src: goldEarrings,
      alt: "Gold chandelier earrings with intricate filigree",
      title: "Golden Chandelier",
      description: "Exquisite gold chandelier earrings featuring delicate filigree work and intricate detailing, creating a dramatic statement piece that captures movement and light."
    },
    {
      id: 7,
      src: emeraldNecklace,
      alt: "Emerald and diamond statement necklace",
      title: "Emerald Cascade",
      description: "A spectacular statement necklace featuring multiple emerald gemstones surrounded by brilliant diamonds in a cascading pattern, perfect for grand occasions."
    },
    {
      id: 8,
      src: jewelry1,
      alt: "Diamond solitaire ring with platinum band",
      title: "Exquisite Craftsmanship",
      description: "A stunning diamond solitaire ring with a platinum band, showcasing the perfect blend of traditional craftsmanship and contemporary minimalist design."
    },
    {
      id: 9,
      src: jewelry2,
      alt: "Ruby and diamond pendant necklace",
      title: "Timeless Elegance",
      description: "A timeless ruby and diamond pendant necklace in 18K gold that exemplifies luxury through meticulous attention to detail and premium gemstone selection."
    },
    {
      id: 10,
      src: jewelry3,
      alt: "Sapphire and diamond drop earrings",
      title: "Artisan Excellence",
      description: "Handcrafted sapphire and diamond drop earrings, demonstrating the pinnacle of jewelry craftsmanship with their intricate settings and brilliant gemstones."
    },
    {
      id: 11,
      src: jewelry4,
      alt: "Gold and pearl chandelier earrings",
      title: "Royal Heritage",
      description: "Inspired by royal heritage designs, these gold and pearl chandelier earrings combine traditional Indian motifs with contemporary elegance and movement."
    },
    {
      id: 12,
      src: jewelry5,
      alt: "Modern diamond bracelet with geometric design",
      title: "Modern Luxury",
      description: "A modern diamond bracelet featuring bold geometric patterns in white gold, balancing contemporary design with wearable elegance for the discerning collector."
    },
    {
      id: 13,
      src: jewelry6,
      alt: "Emerald and diamond cocktail ring",
      title: "Precious Creation",
      description: "A precious emerald and diamond cocktail ring featuring rare gemstones and platinum, meticulously selected and crafted to create a one-of-a-kind statement piece."
    },
    {
      id: 14,
      src: jewelry7,
      alt: "Diamond tennis bracelet with white gold links",
      title: "Diamond Excellence",
      description: "A classic diamond tennis bracelet with white gold links, featuring exceptionally cut diamonds that catch and reflect light beautifully, exemplifying luxury in its purest form."
    },
    {
      id: 15,
      src: jewelry8,
      alt: "Traditional gold temple necklace with rubies",
      title: "Heritage Collection",
      description: "From our heritage collection, this traditional gold temple necklace with rubies tells a story of tradition and craftsmanship passed down through generations of master jewelers."
    },
    {
      id: 16,
      src: jewelry9,
      alt: "Pearl and diamond collar necklace",
      title: "Opulent Treasures",
      description: "An opulent pearl and diamond collar necklace showcasing the finest South Sea pearls and brilliant-cut diamonds, perfect for those who appreciate luxury and distinctive style."
    },
    {
      id: 17,
      src: jewelry10,
      alt: "Kundan polki necklace with emeralds",
      title: "Royal Splendor",
      description: "A magnificent kundan polki necklace with emeralds, combining traditional Indian artisanship with modern luxury, exemplifying the pinnacle of jewelry craftsmanship."
    },
    {
      id: 18,
      src: jewelry11,
      alt: "Diamond floral brooch with sapphire accents",
      title: "Artistic Expression",
      description: "An artistic diamond floral brooch with sapphire accents that captures the essence of natural beauty and transforms it into a sophisticated wearable art piece."
    },
    {
      id: 19,
      src: jewelry12,
      alt: "Multi-gem statement cuff bracelet",
      title: "Eternal Radiance",
      description: "A multi-gem statement cuff bracelet featuring a rainbow of precious stones that radiates eternal beauty and transcends time and fashion trends with its bold design."
    },
    {
      id: 20,
      src: jewelry13,
      alt: "Emerald and diamond tiara-inspired necklace",
      title: "Regal Elegance",
      description: "Regal elegance embodied in this extraordinary emerald and diamond tiara-inspired necklace, designed for those who appreciate the finest craftsmanship and materials."
    },
    {
      id: 21,
      src: jewelry14,
      alt: "Vintage-inspired diamond and ruby earrings",
      title: "Heritage Masterpiece",
      description: "Vintage-inspired diamond and ruby earrings that honor traditional techniques while embracing contemporary aesthetics, creating a timeless appeal with modern wearability."
    },
    {
      id: 22,
      src: jewelry15,
      alt: "Star motif diamond and sapphire pendant",
      title: "Celestial Wonder",
      description: "A celestial star motif pendant with diamonds and sapphires that captures the mystery and beauty of the night sky in an expertly crafted piece of fine jewelry."
    }
  ];
  
  return (
    <>
      <Helmet>
        <title>Jewelry Inspiration | Luster Legacy</title>
        <meta name="description" content="Browse our gallery of stunning jewelry pieces for inspiration. Discover exceptional craftsmanship in various styles from Luster Legacy." />
      </Helmet>
      
      {/* Hero section */}
      <div className="bg-charcoal py-20">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <h1 className="font-playfair text-3xl md:text-5xl font-bold text-pearl mb-4">Jewelry Inspiration</h1>
          <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
          <p className="font-cormorant text-lg md:text-xl text-pearl/80 max-w-2xl mx-auto">
            Discover exquisite pieces that showcase exceptional craftsmanship and timeless beauty. Let these creations inspire your unique jewelry journey.
          </p>
        </div>
      </div>
      
      {/* Gallery section */}
      <div className="container mx-auto px-4 md:px-8 py-12">
        
        {/* Gallery grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {galleryImages.map((image: GalleryImage) => (
            <Dialog key={image.id}>
              <div className="group relative overflow-hidden rounded-lg bg-card shadow-md transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="aspect-auto overflow-hidden h-[400px]">
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    {/* Title removed as requested */}
                  </div>
                </div>
                
                <div className="absolute right-3 top-3 flex flex-col gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <DialogTrigger asChild>
                    <button className="rounded-full bg-white/90 p-2 text-primary hover:bg-white">
                      <ZoomIn className="h-4 w-4" />
                    </button>
                  </DialogTrigger>
                </div>
              </div>
              
              {/* Modal for larger image view */}
              <DialogContent className="sm:max-w-3xl bg-charcoal border-accent/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-center h-[600px]">
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="max-h-full max-w-full object-contain rounded-md"
                    />
                  </div>
                  <div className="flex flex-col justify-center">
                    {/* Title removed as requested */}
                    <div className="flex flex-col gap-3 mt-6">
                      <Button asChild variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        <a 
                          href="/custom-design" 
                          onClick={(e) => {
                            e.preventDefault();
                            console.log("Inspiration - Using localStorage method");
                            
                            try {
                              // Store the image source in localStorage
                              localStorage.setItem('INSPIRATION_IMAGE', image.src);
                              console.log("Inspiration - Saved to localStorage:", image.src);
                              
                              // Navigate using a small delay to ensure localStorage is set
                              setTimeout(() => {
                                window.location.href = '/custom-design';
                              }, 100);
                            } catch (err) {
                              console.error("Inspiration - Error using localStorage:", err);
                              // If localStorage fails, redirect immediately
                              window.location.href = '/custom-design';
                            }
                          }}
                          className="flex items-center justify-center"
                        >
                          Request Similar Design <ArrowRight className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
        
        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-accent/20 to-primary/20 rounded-lg p-8 text-center">
          <h2 className="font-playfair text-2xl md:text-3xl font-bold mb-4">Find Your Perfect Piece</h2>
          <p className="max-w-2xl mx-auto mb-6 text-foreground/80">
            Let these inspirational pieces guide your journey to finding or creating your perfect jewelry. 
            Our expert artisans are ready to help bring your vision to life.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild variant="default" size="lg" className="bg-accent text-white hover:bg-accent/90">
              <Link href="/custom-design">Create Custom Design</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/collections">Browse Collections</Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
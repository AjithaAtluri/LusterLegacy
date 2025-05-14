import { Helmet } from "react-helmet";
import { useState } from "react";
import { ArrowRight, Heart, ZoomIn } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import rubyLeafPendant from "@/assets/ruby-leaf-pendant.png";
import pearlNecklaceSet from "@/assets/pearl-necklace-set.png";
import polkiPendantNecklace from "@/assets/polki-pendant-necklace.png";
import diamondBracelet from "@/assets/diamond-bracelet.jpeg";

// Gallery image interface
interface GalleryImage {
  id: number;
  src: string;
  alt: string;
  category: string;
  title: string;
  description: string;
}

export default function Inspiration() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const categories = ["all", "pendants", "necklaces", "earrings", "rings", "bracelets", "sets"];
  
  // Image gallery data with design inspiration images
  const galleryImages: GalleryImage[] = [
    {
      id: 1,
      src: rubyLeafPendant,
      alt: "Carved ruby leaf pendant in gold setting",
      category: "pendants",
      title: "Autumn Ruby Leaf",
      description: "An exquisite carved ruby leaf pendant set in a luxurious 18K gold bezel, showcasing the natural beauty of the gemstone with its translucent quality."
    },
    {
      id: 2,
      src: pearlNecklaceSet,
      alt: "Multi-strand pearl necklace with diamond accents",
      category: "necklaces",
      title: "Royal Pearl Cascade",
      description: "A stunning multi-strand pearl necklace featuring elegant gold and diamond spacers, creating a luxurious collar effect perfect for special occasions."
    },
    {
      id: 3,
      src: polkiPendantNecklace,
      alt: "Polki diamond necklace with emerald and ruby pendant",
      category: "necklaces",
      title: "Dual Gemstone Elegance",
      description: "A sophisticated polki diamond necklace featuring a stunning dual pendant with ruby and emerald gemstones, surrounded by intricate diamond detailing."
    },
    {
      id: 4,
      src: diamondBracelet,
      alt: "Diamond and pearl bracelet with gold accents",
      category: "bracelets",
      title: "Celestial Diamond Band",
      description: "A luxurious bracelet featuring a perfect balance of brilliant-cut diamonds and delicate pearls set in high-polish gold, creating a timeless statement piece."
    }
  ];
  
  // Filter images based on selected category
  const filteredImages = selectedCategory === "all" 
    ? galleryImages 
    : galleryImages.filter(img => img.category === selectedCategory);

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
        {/* Category filter */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-10">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors ${
                selectedCategory === category
                  ? "bg-accent text-white"
                  : "bg-muted/50 text-foreground/80 hover:bg-muted"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        
        {/* Gallery grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {filteredImages.map((image) => (
            <Dialog key={image.id}>
              <div className="group relative overflow-hidden rounded-lg bg-card shadow-md transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="aspect-square overflow-hidden">
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h3 className="font-playfair text-lg font-semibold">{image.title}</h3>
                    <p className="text-sm text-white/80 mt-1 line-clamp-2">{image.description}</p>
                  </div>
                </div>
                
                <div className="absolute right-3 top-3 flex flex-col gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <DialogTrigger asChild>
                    <button className="rounded-full bg-white/90 p-2 text-primary hover:bg-white">
                      <ZoomIn className="h-4 w-4" />
                    </button>
                  </DialogTrigger>
                  <button className="rounded-full bg-white/90 p-2 text-primary hover:bg-white">
                    <Heart className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {/* Modal for larger image view */}
              <DialogContent className="sm:max-w-3xl bg-charcoal border-accent/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-center">
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="max-h-[70vh] object-contain rounded-md"
                    />
                  </div>
                  <div className="flex flex-col justify-center">
                    <h3 className="font-playfair text-2xl font-bold text-white mb-3">{image.title}</h3>
                    <p className="text-white/80 mb-6">{image.description}</p>
                    <div className="mb-6">
                      <span className="inline-block bg-accent/20 text-accent-foreground text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                        {image.category}
                      </span>
                    </div>
                    <div className="flex flex-col gap-3">
                      <Button asChild variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        <Link href="/custom-design" className="flex items-center justify-center">
                          Request Similar Design <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="outline" className="border-primary/30 text-white hover:bg-primary/10">
                        Add to Wishlist
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
import { Helmet } from "react-helmet";
import { useState } from "react";
import { ArrowRight, Heart, ZoomIn } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import rubyLeafPendant from "@/assets/ruby-leaf-pendant.png";
import pearlNecklaceSet from "@/assets/pearl-necklace-set.png";

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
      src: "/attached_assets/Where passion meets craftsmanship — every masterpiece begins with a spark..png",
      alt: "Ruby pendant sketch with diamond surround",
      category: "pendants",
      title: "Ruby Teardrop Design",
      description: "A conceptual sketch of a teardrop ruby pendant with an intricate diamond surround design, showcasing the initial creative process."
    },
    {
      id: 4,
      src: "/uploads/e97f1746-c8fd-4ebb-9efb-8b603ae50c8e.jpeg",
      alt: "Sapphire necklace initial design sketch",
      category: "necklaces",
      title: "Sapphire Statement",
      description: "A design inspiration for a statement sapphire necklace featuring multiple gems arranged in a cascade pattern."
    },
    {
      id: 5,
      src: "/uploads/ade2c1ec-880e-424a-b4cb-86973e188c92.jpeg",
      alt: "Vintage-inspired diamond ring sketch",
      category: "rings",
      title: "Vintage Brilliance",
      description: "A hand-sketched design for a vintage-inspired diamond ring with filigree details and side stone accents."
    },
    {
      id: 6,
      src: "/uploads/ce266b9c-6666-4300-828e-f0442d6d4292.jpeg",
      alt: "Gold and sapphire bracelet design",
      category: "bracelets",
      title: "Sapphire Links",
      description: "An innovative design concept for a gold link bracelet with sapphire focal points, blending modern and classical elements."
    },
    {
      id: 7,
      src: "/uploads/cb2369a1-95c3-47b9-a817-52d1fcc6afbc.jpeg",
      alt: "Complete bridal jewelry set sketch",
      category: "sets",
      title: "Royal Wedding Collection",
      description: "A comprehensive design for a bridal jewelry set including tiara, necklace, bracelet and earrings with matching motifs."
    },
    {
      id: 8,
      src: "/uploads/c9e7f866-e41a-45e0-a2e9-8da85040d572.jpeg",
      alt: "Modern pearl necklace concept",
      category: "necklaces",
      title: "Contemporary Pearls",
      description: "A fresh take on pearl necklace design featuring asymmetrical placement and mixed metal elements."
    },
    {
      id: 9,
      src: "/uploads/c5b70277-7af7-43d8-97ee-7b51f16b29a4.jpeg",
      alt: "Art deco inspired earring design",
      category: "earrings",
      title: "Art Deco Revival",
      description: "An artistically rendered concept for earrings inspired by Art Deco geometric patterns and symmetry."
    },
    {
      id: 10,
      src: "/uploads/9cffd119-20ca-461d-be69-fd53a03b177d.jpeg",
      alt: "Minimalist diamond ring sketch",
      category: "rings",
      title: "Minimalist Marvel",
      description: "A clean, minimalist design sketch for a contemporary ring featuring a solitaire diamond in an innovative setting."
    },
    {
      id: 11,
      src: "/uploads/97c32e6e-50e4-40cc-8f6f-22ca94a98d85.jpeg",
      alt: "Woven gold bracelet concept",
      category: "bracelets",
      title: "Woven Gold",
      description: "A detailed design for a bracelet with interwoven gold strands creating a textured, natural appearance."
    },
    {
      id: 12,
      src: "/uploads/9e0ee12c-3349-41a6-b615-f574b4e71549.jpeg",
      alt: "Colorful gemstone collection concept",
      category: "sets",
      title: "Rainbow Treasure",
      description: "A vibrant design concept for a coordinated set using various colored gemstones arranged in a rainbow pattern."
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
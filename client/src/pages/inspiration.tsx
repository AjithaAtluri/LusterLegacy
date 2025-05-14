import { Helmet } from "react-helmet";
import { useState } from "react";
import { ArrowRight, Heart, ZoomIn } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

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
  const categories = ["all", "necklaces", "earrings", "rings", "bracelets", "sets"];
  
  // Image gallery data with jewelry images from the uploads folder
  const galleryImages: GalleryImage[] = [
    {
      id: 1,
      src: "/uploads/01221cbf-56b0-4650-ac56-9ec5ad2300f7.jpg",
      alt: "Elegant diamond necklace",
      category: "necklaces",
      title: "Diamond Elegance",
      description: "A stunning diamond necklace featuring brilliant-cut stones set in white gold."
    },
    {
      id: 2,
      src: "/uploads/0462fef0-dafd-422b-b315-a14a92964bb5.jpeg",
      alt: "Ruby earrings with gold details",
      category: "earrings",
      title: "Ruby Cascade",
      description: "Exquisite drop earrings showcasing vibrant rubies surrounded by delicate gold work."
    },
    {
      id: 3,
      src: "/uploads/08a3cf15-9317-45ac-9968-aa58a5bf2220.jpeg",
      alt: "Sapphire and diamond ring",
      category: "rings",
      title: "Ocean Blue",
      description: "A captivating sapphire ring surrounded by a halo of diamonds."
    },
    {
      id: 4,
      src: "/uploads/08c8568a-3a66-4ec9-a4a0-e7d42ee5ecef.jpeg",
      alt: "Gold bracelet with intricate details",
      category: "bracelets",
      title: "Golden Embrace",
      description: "A handcrafted gold bracelet featuring intricate filigree work and subtle gemstone accents."
    },
    {
      id: 5,
      src: "/uploads/08eca768-8ea6-4d12-974b-eb7707daca49.jpeg",
      alt: "Complete jewelry set with emeralds",
      category: "sets",
      title: "Emerald Ensemble",
      description: "A coordinated set of emerald jewelry pieces including necklace, earrings, and bracelet."
    },
    {
      id: 6,
      src: "/uploads/12a5a5d9-9c7f-462b-ad6b-5976328a7796.jpg",
      alt: "Pink sapphire necklace",
      category: "necklaces",
      title: "Blush Pink Sapphire",
      description: "A delicate necklace featuring pink sapphire beads interspersed with gold accents."
    },
    {
      id: 7,
      src: "/uploads/13631ce7-c646-4066-bf76-017ae2f510af.jpg",
      alt: "Pearl and diamond earrings",
      category: "earrings",
      title: "Pearl Radiance",
      description: "Classic pearl earrings with diamond halos for added brilliance."
    },
    {
      id: 8,
      src: "/uploads/15fd9f79-894d-43fe-955f-8fec3716c4fc.jpg",
      alt: "Gold and diamond cocktail ring",
      category: "rings",
      title: "Statement Sparkle",
      description: "A bold cocktail ring featuring a cluster of diamonds set in textured gold."
    },
    {
      id: 9,
      src: "/uploads/18d1287a-966e-4b61-8c7e-90812bdefae4.jpeg",
      alt: "Gold bangle bracelet with gemstones",
      category: "bracelets",
      title: "Jeweled Bangle",
      description: "A solid gold bangle bracelet with inset colorful gemstones around the circumference."
    },
    {
      id: 10,
      src: "/uploads/19996d53-9c84-4e64-adfb-f734b5265990.jpeg",
      alt: "Diamond and ruby bridal set",
      category: "sets",
      title: "Bridal Elegance",
      description: "A matching set designed for special occasions featuring diamonds and rubies."
    },
    {
      id: 11,
      src: "/uploads/1e698a05-8415-4873-864b-7ed5553b5bf3.jpg",
      alt: "Beaded gemstone necklace",
      category: "necklaces",
      title: "Multi-Gem Harmony",
      description: "A colorful beaded necklace featuring a variety of gemstones in complementary hues."
    },
    {
      id: 12,
      src: "/uploads/22ad5224-ac43-4442-aeb0-bf2f127c3f0b.jpg",
      alt: "Chandelier earrings with colored stones",
      category: "earrings",
      title: "Cascade Chandelier",
      description: "Dramatic chandelier earrings with multiple tiers of colored gemstones."
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
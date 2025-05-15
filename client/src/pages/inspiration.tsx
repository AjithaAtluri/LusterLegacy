import { Helmet } from "react-helmet";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { ArrowRight, Heart, ZoomIn, PlusCircle, Upload, X, Image, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
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
  const [uploadOpen, setUploadOpen] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [alt, setAlt] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Clear form
  const resetForm = () => {
    setImage(null);
    setImagePreview(null);
    setTitle("");
    setAlt("");
    setDescription("");
    setUploading(false);
  };
  
  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest('POST', '/api/inspiration-images', undefined, formData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload image');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Image uploaded",
        description: "The inspiration image was added successfully",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/inspiration'] });
      resetForm();
      setUploadOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      setUploading(false);
    }
  });
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!image) {
      toast({
        title: "No image selected",
        description: "Please select an image to upload",
        variant: "destructive",
      });
      return;
    }
    
    setUploading(true);
    
    const formData = new FormData();
    formData.append('image', image);
    formData.append('title', title);
    formData.append('alt', alt);
    formData.append('description', description);
    
    uploadMutation.mutate(formData);
  };
  
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
  
  // Delete image mutation
  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: number) => {
      const response = await apiRequest(
        "DELETE", 
        `/api/admin/inspiration/${imageId}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete image");
      }
      
      return imageId;
    },
    onSuccess: () => {
      toast({
        title: "Image deleted",
        description: "The image has been successfully removed from the gallery",
      });
      
      // Invalidate and refetch the inspiration images data
      queryClient.invalidateQueries({ queryKey: ['/api/inspiration'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete the image",
        variant: "destructive",
      });
    }
  });
  
  // Function to handle image deletion
  const handleDeleteImage = (imageId: number) => {
    if (window.confirm("Are you sure you want to delete this image? This action cannot be undone.")) {
      deleteImageMutation.mutate(imageId);
    }
  };
  

  
  // Fetch inspiration images from API
  const { data: apiImages, isLoading } = useQuery({
    queryKey: ['/api/inspiration'],
    queryFn: async () => {
      const response = await fetch('/api/inspiration');
      if (!response.ok) {
        throw new Error('Failed to fetch inspiration images');
      }
      return response.json();
    },
  });
  
  // Transform API images to match GalleryImage format or use fallback data
  const images: GalleryImage[] = apiImages?.length > 0 
    ? apiImages.map((img: any) => ({
        id: img.id,
        src: img.imageUrl,
        alt: img.title || 'Inspiration image',
        title: img.title || 'Jewelry piece',
        description: img.description
      }))
    : galleryImages;

  const { user } = useAuth();

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
        {/* Admin Add Inspiration Image Button */}
        {user && user.role === 'admin' && (
          <div className="flex justify-end mb-4">
            <Button 
              variant="default"
              className="bg-primary hover:bg-primary/90 text-white"
              onClick={() => setUploadOpen(true)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Inspiration Image
            </Button>
            
            {/* Image Upload Dialog */}
            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Inspiration Image</DialogTitle>
                  <DialogDescription>
                    Upload a new image to the inspiration gallery. High-quality images work best.
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="image">Image</Label>
                    <div className="flex items-center gap-4">
                      <div 
                        className={`border-2 border-dashed rounded-md p-4 w-full flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors ${
                          imagePreview ? 'h-40' : 'h-32'
                        }`}
                        onClick={() => document.getElementById('image-upload')?.click()}
                      >
                        {imagePreview ? (
                          <div className="relative w-full h-full">
                            <img 
                              src={imagePreview} 
                              alt="Preview" 
                              className="w-full h-full object-contain" 
                            />
                            <button 
                              type="button"
                              className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                setImage(null);
                                setImagePreview(null);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <Image className="h-10 w-10 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">Click to select an image</p>
                          </>
                        )}
                      </div>
                      <input 
                        type="file"
                        id="image-upload"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title</Label>
                    <Input 
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter image title"
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="alt">Alt Text</Label>
                    <Input 
                      id="alt"
                      value={alt}
                      onChange={(e) => setAlt(e.target.value)}
                      placeholder="Descriptive alternate text for accessibility"
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter detailed description"
                      required
                    />
                  </div>
                  
                  <DialogFooter className="mt-4">
                    <Button type="button" variant="outline" onClick={() => setUploadOpen(false)} disabled={uploading}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={!image || uploading}>
                      {uploading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Uploading...
                        </>
                      ) : 'Upload Image'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
        
        {/* Gallery grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {images.map((image: GalleryImage) => (
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
                
                <div className="absolute right-3 top-3 flex flex-col gap-2 opacity-80 transition-opacity group-hover:opacity-100">
                  <DialogTrigger asChild>
                    <button className="rounded-full bg-black/70 p-2.5 text-white hover:bg-black hover:shadow-lg border-2 border-white/80 shadow-xl">
                      <ZoomIn className="h-5 w-5" />
                    </button>
                  </DialogTrigger>
                  
                  {/* Delete button - only visible for admin users */}
                  {user && user.role === 'admin' && (
                    <button 
                      className="rounded-full bg-red-600/90 p-2.5 text-white hover:bg-red-700 hover:shadow-lg border-2 border-white/80 shadow-xl mt-2"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteImage(image.id);
                      }}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
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
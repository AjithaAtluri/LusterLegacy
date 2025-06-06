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

// Gallery image interface
interface GalleryImage {
  id: number;
  src: string;
  alt: string;
  title: string;
  description?: string;
}



export default function Inspiration() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
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
    setUploading(false);
  };

  // Fetch inspiration images from API
  const { data: apiImages, isLoading } = useQuery({
    queryKey: ['/api/inspiration-images'],
    queryFn: async () => {
      const response = await fetch('/api/inspiration-images');
      if (!response.ok) {
        throw new Error('Failed to fetch inspiration images');
      }
      return response.json();
    },
  });
  
  // Transform API images to GalleryImage format
  const images: GalleryImage[] = apiImages?.map((img: any) => ({
    id: img.id,
    src: img.imageUrl,
    alt: img.title || 'Inspiration image',
    title: img.title || 'Jewelry piece',
    description: img.description
  })) || [];
  
  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // Also include admin headers for image upload
      const headers = {
        'X-Admin-Debug-Auth': 'true',
        'X-Admin-API-Key': 'dev_admin_key_12345',
        'X-Admin-Username': user?.username || 'admin'
      };
      
      console.log('Uploading new inspiration image with headers:', headers);
      
      const response = await fetch('/api/inspiration-images', {
        method: 'POST',
        headers, // No Content-Type as browser sets it automatically with boundary for FormData
        body: formData,
        credentials: 'include'
      });
      
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
      queryClient.invalidateQueries({ queryKey: ['/api/inspiration-images'] });
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
    formData.append('alt', title);

    
    uploadMutation.mutate(formData);
  };
  
  // Delete image mutation
  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: number) => {
      // Include admin headers for authentication
      const headers = {
        'Content-Type': 'application/json',
        'X-Admin-Debug-Auth': 'true',
        'X-Admin-API-Key': 'dev_admin_key_12345',
        'X-Admin-Username': user?.username || 'admin'
      };
      
      console.log('Deleting inspiration image:', imageId, 'with headers:', headers);
      
      const response = await fetch(`/api/admin/inspiration/${imageId}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      });
      
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
      queryClient.invalidateQueries({ queryKey: ['/api/inspiration-images'] });
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
                            <Image className="h-10 w-10 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500 text-center">
                              Click to upload or drag and drop<br />
                              JPG, JPEG, PNG (max 10MB)
                            </p>
                          </>
                        )}
                      </div>
                      <input 
                        id="image-upload"
                        type="file" 
                        className="hidden"
                        accept="image/jpeg,image/png,image/jpg"
                        onChange={handleFileChange}
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
                  

                  

                  
                  <DialogFooter className="mt-4">
                    <Button type="button" variant="outline" onClick={() => setUploadOpen(false)} disabled={uploading}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={!image || !title || uploading}>
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
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Image className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-playfair text-xl font-semibold mb-2">No Inspiration Images</h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              There are no inspiration images available at the moment. Check back later for new additions to our gallery.
            </p>
            {user && user.role === 'admin' && (
              <Button 
                variant="default"
                onClick={() => setUploadOpen(true)}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add First Inspiration Image
              </Button>
            )}
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
                  
                  <div className="p-4">
                    <h3 className="font-playfair text-xl font-semibold mb-2">{image.title}</h3>

                    
                    <div className="flex items-center justify-between">
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="rounded-full">
                          <ZoomIn className="mr-1 h-4 w-4" /> View Details
                        </Button>
                      </DialogTrigger>
                      
                      {/* Admin Delete Button */}
                      {user && user.role === 'admin' && (
                        <Button 
                          variant="destructive" 
                          size="icon" 
                          className="rounded-full" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteImage(image.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>{image.title}</DialogTitle>
                  </DialogHeader>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="aspect-auto overflow-hidden">
                      <img
                        src={image.src}
                        alt={image.alt}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    
                    <div>
                      <h3 className="font-playfair text-2xl font-semibold mb-4">{image.title}</h3>

                      
                      <div className="pt-4 border-t border-border">
                        <p className="text-sm mb-4">Inspired by this piece?</p>
                        <Link href="/design-consultation">
                          <Button className="w-full">
                            Start Your Custom Design <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        )}
        
        {/* Call to action */}
        <div className="text-center mt-16 max-w-2xl mx-auto">
          <h2 className="font-playfair text-2xl md:text-3xl font-bold mb-4">Turn Inspiration Into Reality</h2>
          <p className="text-muted-foreground mb-6">
            Our design consultants are ready to bring your vision to life. Begin your custom jewelry journey today.
          </p>
          <Link href="/design-consultation">
            <Button size="lg" className="rounded-full px-8">
              Start Custom Design Process <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}
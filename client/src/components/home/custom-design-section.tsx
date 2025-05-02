import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { Upload, X, CheckCircle, Image as ImageIcon, Check, ChevronsUpDown, MessageCircle, Pencil, Gem } from "lucide-react";
import { METAL_TYPES, STONE_TYPES, PAYMENT_TERMS } from "@/lib/constants";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useDropzone } from "react-dropzone";
import { isImageFile, getFileExtension, cn } from "@/lib/utils";
import type { SubmitHandler } from "react-hook-form";
import designProcessImage from "@/assets/amethyst-necklace-design.png";

const designFormSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Please enter a valid email address"),
  metalType: z.string().min(1, "Metal type is required"),
  primaryStones: z.array(z.string()).min(1, "Select at least one stone"),
  // Add primaryStone for backward compatibility
  primaryStone: z.string().optional(),
  notes: z.string().optional(),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms to continue"
  })
});

type DesignFormValues = z.infer<typeof designFormSchema>;

export default function CustomDesignSection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null); // Main image (for backward compatibility)
  const [uploadedImages, setUploadedImages] = useState<File[]>([]); // Array to store multiple images
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // Main image preview
  const [previewUrls, setPreviewUrls] = useState<string[]>([]); // Array to store multiple image previews
  const [selectedStones, setSelectedStones] = useState<string[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const form = useForm<DesignFormValues>({
    resolver: zodResolver(designFormSchema),
    defaultValues: {
      fullName: user?.username || "",
      email: user?.email || "",
      metalType: "",
      primaryStones: [],
      primaryStone: "",
      notes: "",
      agreeToTerms: false
    }
  });
  
  // Update the form with user data when user logs in or changes
  useEffect(() => {
    if (user) {
      form.setValue("fullName", user.username);
      form.setValue("email", user.email);
    }
  }, [user, form]);
  
  const onSubmit: SubmitHandler<DesignFormValues> = async (data) => {
    // Check if user is logged in
    if (!user) {
      toast({
        title: "Login required",
        description: "Your design details have been saved. Please log in or create an account to continue."
      });
      
      // Create a more detailed returnTo URL with design details as query parameters
      const redirectParams = new URLSearchParams();
      
      // Add design details to query parameters
      if (data.metalType) redirectParams.append('metalType', data.metalType);
      
      // Handle primaryStones array - convert to comma-separated list
      if (Array.isArray(data.primaryStones) && data.primaryStones.length > 0) {
        redirectParams.append('primaryStones', data.primaryStones.join(','));
      }
      
      // Add notes if available
      if (data.notes) redirectParams.append('notes', data.notes);
      
      // Get the full redirect URL with parameters
      const customDesignUrl = `/custom-design?${redirectParams.toString()}`;
      console.log("Redirecting to custom design with params:", customDesignUrl);
      
      // Redirect to auth page with detailed return URL
      window.location.href = `/auth?returnTo=${encodeURIComponent(customDesignUrl)}`;
      return;
    }
    
    if (uploadedImages.length === 0) {
      toast({
        title: "Image required",
        description: "Please upload at least one reference image for your design.",
        variant: "destructive"
      });
      return;
    }
    
    // Save form data to session storage before submitting
    try {
      // Create form data structure that matches the one expected by design-form.tsx
      let formData: any = {
        ...data,
        phone: "", // Add missing fields required by design-form.tsx
        country: "us", // Default to US
        imageInfo: uploadedImage ? {
          name: uploadedImage.name,
          type: uploadedImage.type,
          size: uploadedImage.size,
          lastModified: uploadedImage.lastModified
        } : null
      };
      
      // Log form data for debugging
      console.log("Home form data being saved:", {
        formData,
        primaryStones: formData.primaryStones,
        metalType: formData.metalType
      });
      
      // Make sure primaryStones is properly saved as an array
      formData.primaryStones = Array.isArray(data.primaryStones) ? data.primaryStones : [];
      
      // Set primaryStone field for backward compatibility
      if (formData.primaryStones.length > 0) {
        formData.primaryStone = formData.primaryStones[0];
      }
      
      // Update selectedStones state to match form data
      setSelectedStones(formData.primaryStones);
      
      // Save the initial form data first (without images)
      sessionStorage.setItem('designFormData', JSON.stringify(formData));
      
      // Then handle multiple images if available
      if (uploadedImages.length > 0) {
        try {
          // Get the latest form data to update it
          const existingData = sessionStorage.getItem('designFormData');
          if (existingData) {
            const parsedData = JSON.parse(existingData);
            
            // Save main image info first
            if (uploadedImage) {
              parsedData.mainImageInfo = {
                name: uploadedImage.name,
                size: uploadedImage.size,
                type: uploadedImage.type,
                lastModified: uploadedImage.lastModified
              };
            }
            
            // Save info about all images
            parsedData.allImagesInfo = uploadedImages.map(img => ({
              name: img.name,
              size: img.size,
              type: img.type,
              lastModified: img.lastModified
            }));
            
            // Save updated metadata
            sessionStorage.setItem('designFormData', JSON.stringify(parsedData));
            
            // Now handle image data conversion for each image (limit to 5MB total)
            let totalSize = 0;
            const promises = uploadedImages.map((file, index) => {
              return new Promise((resolve) => {
                // Skip excessively large files
                if (file.size > 2 * 1024 * 1024 || totalSize > 5 * 1024 * 1024) {
                  resolve(null);
                  return;
                }
                
                totalSize += file.size;
                const reader = new FileReader();
                reader.onload = function() {
                  resolve({
                    index,
                    dataUrl: reader.result
                  });
                };
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(file);
              });
            });
            
            // Process all image conversions
            Promise.all(promises).then((results: any[]) => {
              // Filter out null results and create a map of valid data URLs
              const imageDataUrls: Record<string, string> = {};
              results.filter(r => r !== null).forEach(result => {
                if (result && typeof result.index === 'number' && result.dataUrl) {
                  imageDataUrls[result.index.toString()] = result.dataUrl as string;
                }
              });
              
              // Get the latest form data again to update it with image data URLs
              const latestData = sessionStorage.getItem('designFormData');
              if (latestData) {
                try {
                  const latestParsedData = JSON.parse(latestData);
                  latestParsedData.imageDataUrls = imageDataUrls;
                  sessionStorage.setItem('designFormData', JSON.stringify(latestParsedData));
                  console.log("Multiple image data saved to session storage");
                } catch (parseError) {
                  console.error('Error parsing form data for multiple image update:', parseError);
                }
              }
            });
          }
        } catch (imageError) {
          console.error('Error processing multiple images for storage:', imageError);
        }
      }
    } catch (error) {
      console.error('Error saving form data to session storage', error);
    }
    
    setIsSubmitting(true);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      
      // For backward compatibility, include the main image as designImage
      if (uploadedImage) {
        formData.append("designImage", uploadedImage);
      }
      
      // Append all images with a different field name for multiple image support
      uploadedImages.forEach((file) => {
        formData.append("designImages", file);
      });
      
      // Convert complex fields to strings to avoid issues
      const dataToSend = {
        ...data,
        // Ensure primaryStones is a simple string array
        primaryStones: Array.isArray(data.primaryStones) ? data.primaryStones : []
      };
      
      // Set primaryStone field for backward compatibility if not already set
      if (!dataToSend.primaryStone && dataToSend.primaryStones.length > 0) {
        dataToSend.primaryStone = dataToSend.primaryStones[0];
      }
      
      // Convert the entire object to a JSON string
      const jsonData = JSON.stringify(dataToSend);
      
      // Append as a simple string field
      formData.append("data", jsonData);
      
      // Send form data to server
      const response = await fetch("/api/custom-design", {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      
      if (response.status === 401) {
        // Show toast notification
        toast({
          title: "Login required",
          description: "Your design details have been saved. Please log in or create an account to continue."
        });
        
        // Create a more detailed returnTo URL with design details as query parameters
        const redirectParams = new URLSearchParams();
        
        // Add design details to query parameters
        if (data.metalType) redirectParams.append('metalType', data.metalType);
        
        // Handle primaryStones array - convert to comma-separated list
        if (Array.isArray(data.primaryStones) && data.primaryStones.length > 0) {
          redirectParams.append('primaryStones', data.primaryStones.join(','));
        }
        
        // Add notes if available
        if (data.notes) redirectParams.append('notes', data.notes);
        
        // Get the full redirect URL with parameters
        const customDesignUrl = `/custom-design?${redirectParams.toString()}`;
        console.log("Redirecting to custom design with params:", customDesignUrl);
        
        // Redirect to auth page with detailed return URL
        window.location.href = `/auth?returnTo=${encodeURIComponent(customDesignUrl)}`;
        return; // Exit early
      }
      
      if (!response.ok) {
        throw new Error("Failed to submit design request");
      }
      
      toast({
        title: "Design submitted successfully!",
        description: "We'll review your request and get back to you soon.",
      });
      
      // Reset form and uploaded images
      form.reset();
      setUploadedImage(null);
      setUploadedImages([]);
      setPreviewUrl(null);
      setPreviewUrls([]);
      
      // Clean up all image preview URLs to prevent memory leaks
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      
      previewUrls.forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
      
      // Remove stored form data if any
      sessionStorage.removeItem("designFormData");
      
      // Redirect to customer dashboard after a short delay
      setTimeout(() => {
        window.location.href = window.location.origin + "/customer-dashboard?tab=requests";
      }, 1500); // Give the toast a moment to be seen before redirecting
    } catch (error) {
      console.error("Design form error:", error);
      toast({
        title: "Error submitting design",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // File upload handling for multiple files
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/pdf': ['.pdf']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 5, // Allow up to 5 files
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        // Store all the files in the uploadedImages array
        setUploadedImages([...uploadedImages, ...acceptedFiles]);
        
        // For backward compatibility, set the first image as the main image if it's not already set
        if (!uploadedImage && acceptedFiles.length > 0) {
          const mainFile = acceptedFiles[0];
          setUploadedImage(mainFile);
          
          // Create preview URL for the main image
          if (isImageFile(mainFile)) {
            const mainPreviewUrl = URL.createObjectURL(mainFile);
            setPreviewUrl(mainPreviewUrl);
          }
        }
        
        // Create preview URLs for all the new images
        const newPreviewUrls = acceptedFiles.map(file => {
          if (isImageFile(file)) {
            return URL.createObjectURL(file);
          }
          return ''; // Empty string for non-image files
        }).filter(url => url !== ''); // Remove empty strings
        
        // Update the previewUrls array with the new URLs
        setPreviewUrls([...previewUrls, ...newPreviewUrls]);
      }
    },
    onDropRejected: (fileRejections) => {
      const error = fileRejections[0]?.errors[0];
      let message = "File upload failed";
      
      if (error?.code === "file-too-large") {
        message = "File is too large. Maximum size is 5MB.";
      } else if (error?.code === "file-invalid-type") {
        message = "Invalid file type. Please upload an image or PDF.";
      } else if (error?.code === "too-many-files") {
        message = "Too many files. Maximum is 5 files.";
      }
      
      toast({
        title: "Upload Error",
        description: message,
        variant: "destructive"
      });
    }
  });
  
  const removeUploadedFile = (index: number) => {
    // Get the file we're removing
    const fileToRemove = uploadedImages[index];
    
    // Special handling for main image
    if (uploadedImage && fileToRemove === uploadedImage) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      
      // If we have other images, set the next one as main
      if (uploadedImages.length > 1) {
        const newMainIndex = index === 0 ? 1 : 0; // If removing first image, use second; otherwise use first
        setUploadedImage(uploadedImages[newMainIndex]);
        setPreviewUrl(previewUrls[newMainIndex]);
      } else {
        // No other images, clear main image
        setUploadedImage(null);
        setPreviewUrl(null);
      }
    }
    
    // Remove the file from uploadedImages
    const newUploadedImages = [...uploadedImages];
    newUploadedImages.splice(index, 1);
    setUploadedImages(newUploadedImages);
    
    // Revoke the URL to prevent memory leaks
    if (previewUrls[index]) {
      URL.revokeObjectURL(previewUrls[index]);
    }
    
    // Remove the preview URL
    const newPreviewUrls = [...previewUrls];
    newPreviewUrls.splice(index, 1);
    setPreviewUrls(newPreviewUrls);
  };
  
  const renderUploadArea = () => {
    return (
      <div className="mt-2 relative">
        {/* Display all uploaded images */}
        {uploadedImages.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2 font-montserrat">Uploaded Images ({uploadedImages.length}/5)</h4>
            
            {/* Horizontal gallery layout */}
            <div className="flex flex-wrap gap-3">
              {uploadedImages.map((file, index) => (
                <div 
                  key={index} 
                  className="relative flex flex-col items-center border border-foreground/20 rounded-lg bg-background/50 p-2 w-[120px]"
                >
                  {/* Image preview */}
                  {previewUrls[index] ? (
                    <div className="relative w-full h-[80px] mb-2">
                      <img 
                        src={previewUrls[index]} 
                        alt={`Design preview ${index + 1}`}
                        className="w-full h-full object-cover rounded-md"
                      />
                      {file === uploadedImage && (
                        <div className="absolute -top-2 -right-2 bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-sm">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-[80px] flex items-center justify-center bg-accent/10 rounded-md mb-2">
                      <ImageIcon className="h-8 w-8 text-accent" />
                    </div>
                  )}
                  
                  {/* File info */}
                  <div className="w-full">
                    <p className="text-xs font-medium truncate text-foreground">
                      {file.name.length > 12 ? file.name.substring(0, 10) + "..." : file.name}
                    </p>
                    <p className="text-xs text-foreground/60">
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                  
                  {/* Remove button */}
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="absolute -top-2 -left-2 h-6 w-6 bg-background shadow-sm rounded-full border border-foreground/20 hover:bg-destructive hover:text-white" 
                    onClick={() => removeUploadedFile(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Upload more images button/area */}
        {uploadedImages.length < 5 && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed ${
              isDragActive ? 'border-primary' : 'border-foreground/30'
            } rounded-lg p-8 text-center cursor-pointer hover:border-primary transition duration-300`}
          >
            <input {...getInputProps()} />
            <Upload className="h-10 w-10 text-foreground/50 mx-auto mb-3" />
            <p className="font-montserrat text-foreground/70">
              {isDragActive
                ? "Drop your images here..."
                : uploadedImages.length > 0 
                  ? `Add more images (${uploadedImages.length}/5 uploaded)`
                  : "Drag and drop your images here, or click to browse"
              }
            </p>
            <p className="font-montserrat text-xs text-foreground/50 mt-2">
              Upload up to 5 images • Accepts JPG, PNG, PDF (Max size: 5MB each)
            </p>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <section id="customize" className="py-20 px-4 md:px-8 bg-charcoal">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-playfair text-3xl md:text-4xl font-bold text-pearl mb-4">
            Design Your Dream Jewelry
          </h2>
          <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
          <p className="font-montserrat text-lg text-pearl/80 max-w-2xl mx-auto">
            Upload your vision and our master artisans will bring it to life with exquisite craftsmanship.
            From sketch to stunning reality, we're with you at every step.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
          {/* Submit Your Design Section */}
          <div className="bg-background p-8 rounded-lg shadow-xl flex flex-col">
            <h4 className="font-playfair text-2xl font-semibold text-foreground mb-3">Submit Your Design</h4>
            <p className="font-montserrat text-sm text-foreground/70 mb-6">Login required. Your design details will be saved when you submit.</p>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="mb-6">
                  <FormLabel className="block font-montserrat text-sm font-medium text-foreground mb-2">
                    Upload Reference Image*
                  </FormLabel>
                  {renderUploadArea()}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <FormField
                    control={form.control}
                    name="metalType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-montserrat text-sm font-medium text-foreground">
                          Metal Type*
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full p-3 border border-foreground/20 rounded font-montserrat text-sm">
                              <SelectValue placeholder="Select metal type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {METAL_TYPES.map((metal) => (
                              <SelectItem key={metal.id} value={metal.id}>
                                {metal.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="primaryStones"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-montserrat text-sm font-medium text-foreground">
                          Stone Types* (Select one or more)
                        </FormLabel>
                        <div className="relative">
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className="w-full p-3 h-auto border border-foreground/20 rounded font-montserrat text-sm justify-between"
                                >
                                  {field.value && field.value.length > 0
                                    ? field.value.length === 1
                                      ? STONE_TYPES.find(stone => stone.id === field.value[0])?.name || "Selected stones"
                                      : `${field.value.length} stones selected`
                                    : "Select stone types"}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Search stones..." />
                                <CommandEmpty>No stone type found.</CommandEmpty>
                                <CommandGroup>
                                  {STONE_TYPES.map((stone) => {
                                    const isSelected = field.value?.includes(stone.id);
                                    return (
                                      <CommandItem
                                        key={stone.id}
                                        value={stone.id}
                                        onSelect={() => {
                                          const updatedValue = isSelected
                                            ? field.value.filter((value) => value !== stone.id)
                                            : [...(field.value || []), stone.id];
                                          field.onChange(updatedValue);
                                        }}
                                      >
                                        <div className={cn(
                                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                          isSelected ? "bg-primary text-primary-foreground" : "opacity-50"
                                        )}>
                                          {isSelected && <Check className="h-3 w-3" />}
                                        </div>
                                        <span>{stone.name}</span>
                                      </CommandItem>
                                    );
                                  })}
                                </CommandGroup>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="mb-6">
                      <FormLabel className="font-montserrat text-sm font-medium text-foreground">
                        Additional Notes
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          rows={4}
                          placeholder="Share specific details about your vision, size requirements, or any other preferences..."
                          className="w-full p-3 border border-foreground/20 rounded font-montserrat text-sm" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="mb-6">
                  <FormLabel className="block font-montserrat text-sm font-medium text-foreground mb-2">
                    Contact Information*
                  </FormLabel>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Full Name" 
                              className="p-3 border border-foreground/20 rounded font-montserrat text-sm" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Email Address" 
                              readOnly={user !== null}
                              className={`p-3 border border-foreground/20 rounded font-montserrat text-sm ${user ? 'bg-accent/5' : ''}`}
                            />
                          </FormControl>
                          {user && (
                            <p className="text-xs text-muted-foreground mt-1">Email is auto-filled from your account</p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <FormField
                  control={form.control}
                  name="agreeToTerms"
                  render={({ field }) => (
                    <FormItem className="mb-6 flex items-start space-x-2">
                      <FormControl>
                        <Checkbox 
                          checked={field.value} 
                          onCheckedChange={field.onChange} 
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="font-montserrat text-sm text-foreground/70">
                          I understand that if my design is accepted, a ${PAYMENT_TERMS.cadFee} {PAYMENT_TERMS.cadFeeDescription} will be required before design work begins. This fee will be adjusted against my final order.
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                
                <div className="flex flex-col">
                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full font-montserrat font-medium bg-primary text-background hover:bg-accent transition duration-300"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Design Request"}
                  </Button>
                  
                  {!user && (
                    <div className="mt-2 text-center">
                      <p className="text-xs text-foreground/60">
                        Login required. Your design details will be saved when you submit.
                      </p>
                    </div>
                  )}
                </div>
              </form>
            </Form>
          </div>
          
          {/* Our Design Process */}
          <div className="bg-background p-8 rounded-lg shadow-xl flex flex-col">
            <h4 className="font-playfair text-2xl font-semibold text-foreground mb-6 text-center">Our Design Consultation Process</h4>
            
            <div className="space-y-4 mb-auto">
              <div className="flex items-start p-4 rounded-lg bg-background/50 border border-foreground/10 hover:border-primary/30 hover:bg-primary/5 transition-colors">
                <div className="bg-primary text-pearl w-8 h-8 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <div>
                  <h5 className="font-playfair text-lg font-semibold text-foreground mb-1">Initial Design Consultation</h5>
                  <p className="font-montserrat text-sm text-foreground/70">Share your vision with our expert designers who will guide you through the possibilities</p>
                </div>
              </div>
              
              <div className="flex items-start p-4 rounded-lg bg-background/50 border border-foreground/10 hover:border-primary/30 hover:bg-primary/5 transition-colors">
                <div className="bg-primary text-pearl w-8 h-8 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  <Pencil className="h-4 w-4" />
                </div>
                <div>
                  <h5 className="font-playfair text-lg font-semibold text-foreground mb-1">CAD Design Development</h5>
                  <p className="font-montserrat text-sm text-foreground/70">Our designers create detailed 3D renderings of your custom piece for your review</p>
                </div>
              </div>
              
              <div className="flex items-start p-4 rounded-lg bg-background/50 border border-foreground/10 hover:border-primary/30 hover:bg-primary/5 transition-colors">
                <div className="bg-primary text-pearl w-8 h-8 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  <Gem className="h-4 w-4" />
                </div>
                <div>
                  <h5 className="font-playfair text-lg font-semibold text-foreground mb-1">Design Refinements</h5>
                  <p className="font-montserrat text-sm text-foreground/70">We'll incorporate your feedback to perfect every detail until you're completely satisfied</p>
                </div>
              </div>
              
              <div className="flex items-start p-4 rounded-lg bg-background/50 border border-foreground/10 hover:border-primary/30 hover:bg-primary/5 transition-colors">
                <div className="bg-primary text-pearl w-8 h-8 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  <Check className="h-4 w-4" />
                </div>
                <div>
                  <h5 className="font-playfair text-lg font-semibold text-foreground mb-1">Final Design Approval</h5>
                  <p className="font-montserrat text-sm text-foreground/70">Approve your custom design to proceed to creation with a 50% advance payment</p>
                </div>
              </div>
            </div>
            
            <div className="mt-auto text-center">
              <img 
                src={designProcessImage} 
                alt="Custom jewelry design process" 
                className="rounded-lg shadow-md w-full h-60 object-cover hover:scale-[1.02] transition-transform duration-300"
              />
              <p className="font-montserrat text-xs text-foreground/70 mt-2 italic">
                From raw lavender quartz gemstones to exquisite handcrafted necklace
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

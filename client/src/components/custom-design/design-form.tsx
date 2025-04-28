import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { METAL_TYPES, STONE_TYPES, PAYMENT_TERMS, COUNTRIES } from "@/lib/constants";
import { useDropzone } from "react-dropzone";
import { Upload, X, Image as ImageIcon, CheckCircle, Check, ChevronsUpDown } from "lucide-react";
import { isImageFile, getFileExtension, cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const designFormSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(8, "Phone number is required"),
  country: z.string().min(2, "Country is required"),
  metalType: z.string().min(1, "Metal type is required"),
  primaryStones: z.array(z.string()).min(1, "Select at least one stone type"),
  notes: z.string().optional(),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms to continue" 
  })
});

type DesignFormValues = z.infer<typeof designFormSchema>;

export default function DesignForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedStones, setSelectedStones] = useState<string[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const form = useForm<DesignFormValues>({
    resolver: zodResolver(designFormSchema),
    defaultValues: {
      fullName: user?.username || "",
      email: user?.email || "",
      phone: "",
      country: "us", // Default to United States
      metalType: "",
      primaryStones: [],
      notes: "",
      agreeToTerms: false
    }
  });
  
  // Update the form with user data when user loads
  useEffect(() => {
    if (user) {
      form.setValue("fullName", user.username);
      form.setValue("email", user.email);
      
      // Try to restore saved form data from session storage
      try {
        const savedFormData = sessionStorage.getItem('designFormData');
        if (savedFormData) {
          // Parse the saved data and put it in a local variable
          const parsedData = JSON.parse(savedFormData);
          console.log("Restoring form data:", parsedData);
          
          // Check if we have the old format data with primaryStone instead of primaryStones
          if (parsedData.primaryStone && !parsedData.primaryStones) {
            parsedData.primaryStones = parsedData.primaryStone ? [parsedData.primaryStone] : [];
          }
          
          // Restore form fields - make sure to set these right away
          form.setValue("fullName", user.username); // Always use logged-in username
          form.setValue("email", user.email); // Always use logged-in email
          
          // Important: Use reset function to update all form values at once
          // This helps ensure the Select components are properly updated
          form.reset({
            fullName: user.username,
            email: user.email,
            phone: parsedData.phone || "",
            country: parsedData.country || "us",
            metalType: parsedData.metalType || "",
            primaryStones: parsedData.primaryStones || [],
            notes: parsedData.notes || "",
            agreeToTerms: parsedData.agreeToTerms || false
          });
          
          // Restore image data if available
          if (parsedData.imageDataUrl) {
            // For images saved as data URLs, we need to convert them back to a File object
            try {
              // First, create an image element to get dimensions
              const img = new Image();
              img.onload = function() {
                // Create a canvas element
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                
                // Draw the image on the canvas
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0);
                
                // Convert canvas to blob
                canvas.toBlob((blob) => {
                  if (blob && parsedData.imageInfo) {
                    // Create a new File object from the blob
                    const restoredFile = new File([blob], 
                      parsedData.imageInfo.name || "restored-image.jpg", 
                      { 
                        type: parsedData.imageInfo.type || "image/jpeg",
                        lastModified: parsedData.imageInfo.lastModified || Date.now()
                      }
                    );
                    
                    // Set the preview URL
                    const previewUrl = URL.createObjectURL(restoredFile);
                    setPreviewUrl(previewUrl);
                    
                    // Set the uploadedImage state
                    setUploadedImage(restoredFile);
                  }
                }, parsedData.imageInfo?.type || "image/jpeg");
              };
              
              // Start loading the image
              img.src = parsedData.imageDataUrl;
            } catch (imageError) {
              console.error('Error restoring image from data URL:', imageError);
            }
          }
          
          // Show a success message
          toast({
            title: "Design details restored",
            description: "We've restored your previous design information.",
          });
          
          // Clear the saved data to prevent reloading it on subsequent visits
          sessionStorage.removeItem('designFormData');
        }
      } catch (error) {
        console.error('Error restoring form data from session storage', error);
      }
    }
  }, [user, form, toast]);
  
  const onSubmit = async (data: DesignFormValues) => {
    // Check if user is logged in
    if (!user) {
      // Save form data to session storage before redirecting
      try {
        // We'll need to handle the image conversion synchronously to ensure it's stored correctly
        let formData: any = {
          ...data,
          imageInfo: uploadedImage ? {
            name: uploadedImage.name,
            type: uploadedImage.type,
            size: uploadedImage.size,
            lastModified: uploadedImage.lastModified
          } : null,
          imageDataUrl: null // Will be populated below if image is small enough
        };
        
        // Make sure primaryStones is properly saved as an array
        formData.primaryStones = Array.isArray(data.primaryStones) ? data.primaryStones : [];
        
        // Update selectedStones state to match form data
        setSelectedStones(formData.primaryStones);
        
        // Save the initial form data first (without image)
        sessionStorage.setItem('designFormData', JSON.stringify(formData));
        
        // Then handle the image separately if available
        if (uploadedImage && previewUrl && uploadedImage.size < 2 * 1024 * 1024) { // Only for images under 2MB
          try {
            // Convert image to data URL synchronously to ensure it's saved
            const reader = new FileReader();
            reader.onload = function() {
              const dataUrl = reader.result;
              // Get the latest form data to update it
              const existingData = sessionStorage.getItem('designFormData');
              if (existingData) {
                try {
                  const parsedData = JSON.parse(existingData);
                  parsedData.imageDataUrl = dataUrl;
                  sessionStorage.setItem('designFormData', JSON.stringify(parsedData));
                  console.log("Image data saved to session storage");
                } catch (parseError) {
                  console.error('Error parsing form data for image update:', parseError);
                }
              }
            };
            // Start reading the file as a data URL
            reader.readAsDataURL(uploadedImage);
          } catch (imageError) {
            console.error('Error converting image to data URL:', imageError);
          }
        }
      } catch (error) {
        console.error('Error saving form data to session storage', error);
      }
      
      toast({
        title: "Login required",
        description: "Your design details have been saved. Please log in or create an account to continue."
      });
      
      // Redirect to auth page with return URL
      window.location.href = `/auth?returnTo=${encodeURIComponent('/custom-design')}`;
      return;
    }
    
    if (!uploadedImage) {
      toast({
        title: "Image required",
        description: "Please upload a reference image for your design.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Ensure primaryStones is an array
      const processedData = {
        ...data,
        primaryStones: Array.isArray(data.primaryStones) ? data.primaryStones : []
      };
      
      // Log the form data for debugging
      console.log("Submitting design form with data:", JSON.stringify(processedData, null, 2));
      console.log("User authentication state:", user ? `Authenticated as ${user.username} (${user.id})` : "Not authenticated");
      
      // Log data to debug
      console.log("Final processed data before submitting:", processedData);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("designImage", uploadedImage);
      
      // Convert complex fields to strings to avoid issues
      const dataToSend = {
        ...processedData,
        // Ensure primaryStones is a simple string array
        primaryStones: Array.isArray(processedData.primaryStones) 
          ? processedData.primaryStones 
          : []
      };
      
      // Convert the entire object to a JSON string
      const jsonData = JSON.stringify(dataToSend);
      console.log("JSON data being sent:", jsonData);
      
      // Append as a simple string field
      formData.append("data", jsonData);
      
      // Send form data to server
      const response = await fetch("/api/custom-design", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      // Log the response status
      console.log("Design form submission response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        console.error("Design form server error:", errorData);
        throw new Error(errorData.message || "Failed to submit design request");
      }
      
      const responseData = await response.json();
      console.log("Design form submission successful:", responseData);
      
      toast({
        title: "Design submitted successfully!",
        description: "We'll review your request and get back to you soon.",
      });
      
      // Reset form and uploaded image
      form.reset();
      setUploadedImage(null);
      setPreviewUrl(null);
      setSelectedStones([]);
    } catch (error) {
      console.error("Design form error:", error);
      toast({
        title: "Error submitting design",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // File upload handling
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/pdf': ['.pdf']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setUploadedImage(file);
        
        // Create preview URL for images
        if (isImageFile(file)) {
          const previewUrl = URL.createObjectURL(file);
          setPreviewUrl(previewUrl);
        } else {
          // For PDFs, just show icon
          setPreviewUrl(null);
        }
      }
    },
    onDropRejected: (fileRejections) => {
      const error = fileRejections[0]?.errors[0];
      let message = "File upload failed";
      
      if (error?.code === "file-too-large") {
        message = "File is too large. Maximum size is 5MB.";
      } else if (error?.code === "file-invalid-type") {
        message = "Invalid file type. Please upload an image or PDF.";
      }
      
      toast({
        title: "Upload Error",
        description: message,
        variant: "destructive"
      });
    }
  });
  
  const removeUploadedFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setUploadedImage(null);
    setPreviewUrl(null);
  };
  
  const renderUploadArea = () => {
    if (uploadedImage) {
      return (
        <div className="mt-2 relative">
          <div className="flex items-center p-4 border border-foreground/20 rounded-lg bg-background/50">
            {previewUrl ? (
              <div className="relative w-20 h-20 mr-4">
                <img 
                  src={previewUrl} 
                  alt="Design preview" 
                  className="w-full h-full object-cover rounded-md"
                />
              </div>
            ) : (
              <div className="w-20 h-20 flex items-center justify-center bg-accent/10 rounded-md mr-4">
                <ImageIcon className="h-10 w-10 text-accent" />
              </div>
            )}
            
            <div className="flex-1">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                <p className="font-montserrat text-sm font-medium text-foreground">
                  {uploadedImage.name}
                </p>
              </div>
              <p className="font-montserrat text-xs text-foreground/60 mt-1">
                {(uploadedImage.size / 1024 / 1024).toFixed(2)} MB • {getFileExtension(uploadedImage.name).toUpperCase()}
              </p>
            </div>
            
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className="ml-2" 
              onClick={removeUploadedFile}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      );
    }
    
    return (
      <div
        {...getRootProps()}
        className={`border-2 border-dashed ${
          isDragActive ? 'border-primary' : 'border-foreground/30'
        } rounded-lg p-8 text-center cursor-pointer hover:border-primary transition duration-300 mt-2`}
      >
        <input {...getInputProps()} />
        <Upload className="h-10 w-10 text-foreground/50 mx-auto mb-3" />
        <p className="font-montserrat text-foreground/70">
          {isDragActive
            ? "Drop your image here..."
            : "Drag and drop your image here, or click to browse"
          }
        </p>
        <p className="font-montserrat text-xs text-foreground/50 mt-2">
          Accepts JPG, PNG, PDF (Max size: 5MB)
        </p>
      </div>
    );
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit as any)} className="bg-background rounded-lg shadow-lg p-8">
        <h3 className="font-playfair text-2xl font-semibold text-foreground mb-6">Submit Your Design</h3>
        
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
                          className={cn(
                            "w-full justify-between p-3 border border-foreground/20 rounded font-montserrat text-sm",
                            !field.value.length && "text-muted-foreground"
                          )}
                        >
                          {field.value.length > 0
                            ? `${field.value.length} stone${field.value.length > 1 ? "s" : ""} selected`
                            : "Select stone types"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command className="w-full">
                        <CommandInput placeholder="Search stone types..." />
                        <CommandEmpty>No stone type found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-y-auto">
                          {STONE_TYPES.map((stone) => {
                            const isSelected = field.value.includes(stone.id);
                            return (
                              <CommandItem
                                key={stone.id}
                                value={stone.id}
                                onSelect={() => {
                                  const updatedValue = isSelected
                                    ? field.value.filter((value) => value !== stone.id)
                                    : [...field.value, stone.id];
                                  field.onChange(updatedValue);
                                  setSelectedStones(updatedValue);
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
          <div className="grid grid-cols-1 gap-4">
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-montserrat text-sm font-medium text-foreground">
                      Phone Number*
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Phone Number" 
                        className="p-3 border border-foreground/20 rounded font-montserrat text-sm" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-montserrat text-sm font-medium text-foreground">
                      Country*
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full p-3 border border-foreground/20 rounded font-montserrat text-sm">
                          <SelectValue placeholder="Select your country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COUNTRIES.map((country) => (
                          <SelectItem key={country.id} value={country.id}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
        
        <Button 
          type="submit"
          disabled={isSubmitting}
          className="w-full font-montserrat font-medium bg-primary text-background px-6 py-3 rounded hover:bg-accent transition duration-300 h-auto"
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
      </form>
    </Form>
  );
}

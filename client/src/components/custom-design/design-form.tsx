import React, { useState, useEffect, createContext } from "react";
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
import { Upload, X, Image as ImageIcon, CheckCircle, Check, ChevronsUpDown, Plus } from "lucide-react";
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
  // Ensure primaryStones is always processed as a string array
  primaryStones: z.array(z.string())
    .min(1, "Select at least one stone type")
    .default([]),
  // Add primaryStone for backward compatibility
  primaryStone: z.string().optional(),
  notes: z.string().optional(),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms to continue" 
  })
});

type DesignFormValues = z.infer<typeof designFormSchema>;

// Define a context to share form data with AI consultation component
export const DesignFormContext = createContext<{
  formValues: DesignFormValues | null;
  selectedStones: string[];
  metalType: string;
}>({
  formValues: null,
  selectedStones: [],
  metalType: "",
});

export default function DesignForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null); // Main image (for backward compatibility)
  const [uploadedImages, setUploadedImages] = useState<File[]>([]); // Array to store multiple images
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // Main image preview
  const [previewUrls, setPreviewUrls] = useState<string[]>([]); // Array to store multiple image previews
  const [selectedStones, setSelectedStones] = useState<string[]>([]);
  const [currentFormValues, setCurrentFormValues] = useState<DesignFormValues | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Debug log - new variable to track context values
  const [contextMetalType, setContextMetalType] = useState<string>("");
  
  const form = useForm<DesignFormValues>({
    resolver: zodResolver(designFormSchema),
    defaultValues: {
      fullName: user?.name || user?.loginID || "",
      email: user?.email || "",
      phone: user?.phone || "",
      country: user?.country || "us", // Default to United States if not available
      metalType: "",
      primaryStones: [],
      notes: "",
      agreeToTerms: false
    }
  });
  
  // Function to parse URL query parameters
  const getQueryParams = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const params: Record<string, any> = {};
    
    // Get metalType from query param
    if (searchParams.has('metalType')) {
      params.metalType = searchParams.get('metalType');
    }
    
    // Get primaryStones from query param (as comma-separated list)
    if (searchParams.has('primaryStones')) {
      const stonesParam = searchParams.get('primaryStones');
      params.primaryStones = stonesParam ? stonesParam.split(',') : [];
    }
    
    // Get notes from query param
    if (searchParams.has('notes')) {
      params.notes = searchParams.get('notes');
    }
    
    console.log("DesignForm - URL query parameters:", params);
    return params;
  };
  
  // Update the form with user data when user loads
  useEffect(() => {
    if (user) {
      form.setValue("fullName", user.name || user.loginID);
      form.setValue("email", user.email);
      
      // First, always check session storage
      console.log("DesignForm - Checking for saved form data in sessionStorage...");
      const savedFormData = sessionStorage.getItem('designFormData');
      console.log("DesignForm - savedFormData exists:", !!savedFormData);
      
      // Only check for URL query parameters if session storage is empty
      if (!savedFormData) {
        const queryParams = getQueryParams();
        if (Object.keys(queryParams).length > 0) {
          console.log("DesignForm - Applying query parameters to form");
          
          // Apply each parameter to the form
          if (queryParams.metalType) {
            form.setValue("metalType", queryParams.metalType);
          }
          
          if (queryParams.primaryStones && queryParams.primaryStones.length > 0) {
            form.setValue("primaryStones", queryParams.primaryStones);
            setSelectedStones(queryParams.primaryStones);
          }
          
          if (queryParams.notes) {
            form.setValue("notes", queryParams.notes);
          }
          
          // Clean URL after applying parameters
          window.history.replaceState({}, document.title, window.location.pathname);
          return; // Skip checking session storage if we applied URL parameters
        }
        return; // No session storage or URL parameters found
      }
      
      // If no URL params, try to restore saved form data from session storage
      try {
        console.log("DesignForm - Checking for saved form data in sessionStorage...");
        const savedFormData = sessionStorage.getItem('designFormData');
        console.log("DesignForm - savedFormData exists:", !!savedFormData);
        
        if (savedFormData) {
          // Parse the saved data and put it in a local variable
          let parsedData: any = {};
          try {
            parsedData = JSON.parse(savedFormData);
            console.log("DesignForm - Successfully parsed form data:", parsedData);
            console.log("DesignForm - Form data details:", {
              hasPrimaryStones: !!parsedData.primaryStones,
              primaryStonesCount: parsedData.primaryStones?.length || 0,
              primaryStonesValues: parsedData.primaryStones || [],
              hasPrimaryStone: !!parsedData.primaryStone,
              primaryStone: parsedData.primaryStone || "none",
              hasMetalType: !!parsedData.metalType,
              metalType: parsedData.metalType || "none",
              hasPhone: !!parsedData.phone,
              hasCountry: !!parsedData.country,
              hasImageInfo: !!parsedData.imageInfo,
              hasImageDataUrl: !!parsedData.imageDataUrl,
              hasAllImagesInfo: !!parsedData.allImagesInfo
            });
            
            // Check if we have the old format data with primaryStone instead of primaryStones
            if (parsedData.primaryStone && !parsedData.primaryStones) {
              parsedData.primaryStones = parsedData.primaryStone ? [parsedData.primaryStone] : [];
            }
          } catch (parseJsonError) {
            console.error("DesignForm - Error parsing JSON data:", parseJsonError);
          }
          
          // Restore form fields - make sure to set these right away
          form.setValue("fullName", user.name || user.loginID); // Always use logged-in name or loginID
          form.setValue("email", user.email); // Always use logged-in email
          
          // Important: Use reset function to update all form values at once
          // This helps ensure the Select components are properly updated
          form.reset({
            fullName: user.name || user.loginID,
            email: user.email,
            phone: parsedData.phone || "",
            country: parsedData.country || "us",
            metalType: parsedData.metalType || "",
            primaryStones: parsedData.primaryStones || [],
            notes: parsedData.notes || "",
            agreeToTerms: parsedData.agreeToTerms || false
          });
          
          // Restore multiple images if available
          if (parsedData.imageDataUrls && Object.keys(parsedData.imageDataUrls).length > 0) {
            try {
              // Function to convert a data URL to a File object
              const convertDataUrlToFile = (dataUrl: string, imageInfo: any): Promise<File | null> => {
                return new Promise((resolve) => {
                  const img = new Image();
                  img.onload = function() {
                    // Create a canvas with the same dimensions as the image
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    
                    // Draw the image on the canvas
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0);
                    
                    // Convert the canvas to a blob
                    canvas.toBlob((blob) => {
                      if (blob) {
                        // Create a new File object
                        const restoredFile = new File(
                          [blob],
                          imageInfo?.name || "restored-image.jpg",
                          {
                            type: imageInfo?.type || "image/jpeg",
                            lastModified: imageInfo?.lastModified || Date.now()
                          }
                        );
                        resolve(restoredFile);
                      } else {
                        resolve(null);
                      }
                    }, imageInfo?.type || "image/jpeg");
                  };
                  
                  img.onerror = () => resolve(null);
                  // Start loading the image
                  img.src = dataUrl;
                });
              };
              
              // Get all the data URLs from the parsed data
              const dataUrls = parsedData.imageDataUrls as Record<string, string>;
              const imagesInfo = parsedData.allImagesInfo || [];
              
              // Convert each data URL to a File object
              const restoredFiles: File[] = [];
              const newPreviewUrls: Array<{index: number, previewUrl: string}> = [];
              
              // Create an array of promises for each image conversion
              const conversionPromises = Object.keys(dataUrls).map(async (key) => {
                const index = parseInt(key);
                const dataUrl = dataUrls[key];
                const imageInfo = imagesInfo[index] || null;
                
                try {
                  const restoredFile = await convertDataUrlToFile(dataUrl, imageInfo);
                  if (restoredFile) {
                    restoredFiles.push(restoredFile);
                    const previewUrl = URL.createObjectURL(restoredFile);
                    newPreviewUrls.push({ index, previewUrl });
                    
                    // If this is the main image or we don't have a main image yet, set it as the main image
                    if ((parsedData.mainImageInfo && 
                         imageInfo && 
                         parsedData.mainImageInfo.name === imageInfo.name) || 
                        !uploadedImage) {
                      setUploadedImage(restoredFile);
                      setPreviewUrl(previewUrl);
                    }
                  }
                } catch (error) {
                  console.error('Error converting data URL to file:', error);
                }
              });
              
              // Wait for all conversions to complete
              Promise.all(conversionPromises).then(() => {
                if (restoredFiles.length > 0) {
                  // Set the uploadedImages state with all restored files
                  setUploadedImages(restoredFiles);
                  
                  // Set the previewUrls state with all preview URLs
                  const sortedPreviewUrls = newPreviewUrls
                    .sort((a, b) => a.index - b.index)
                    .map(item => item.previewUrl);
                  
                  setPreviewUrls(sortedPreviewUrls);
                  
                  console.log(`Restored ${restoredFiles.length} images from session storage`);
                }
              });
            } catch (imageError) {
              console.error('Error restoring multiple images from data URLs:', imageError);
            }
          }
          // For backwards compatibility, also handle old single image format
          else if (parsedData.imageDataUrl) {
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
                    
                    // Set the uploadedImages array for multiple image compatibility
                    setUploadedImages([restoredFile]);
                    setPreviewUrls([previewUrl]);
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
    // Always save form data to session storage before submitting or redirecting
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
      
      // Then handle multiple images separately if available
      if (uploadedImages.length > 0) {
        try {
          // First, update the form data with image metadata
          // Get the latest form data to update it
          const existingData = sessionStorage.getItem('designFormData');
          if (existingData) {
            try {
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
            } catch (parseError) {
              console.error('Error parsing form data for image metadata update:', parseError);
            }
          }
        } catch (imageError) {
          console.error('Error processing multiple images for storage:', imageError);
        }
      }
    } catch (error) {
      console.error('Error saving form data to session storage', error);
    }
    
    // Check if user is logged in
    if (!user) {
      toast({
        title: "Login required",
        description: "Your design details have been saved. Please log in or create an account to continue."
      });
      
      // Redirect to auth page with return URL
      window.location.href = `/auth?returnTo=${encodeURIComponent('/custom-design')}`;
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
    
    setIsSubmitting(true);
    
    try {
      // Ensure primaryStones is an array
      const processedData = {
        ...data,
        primaryStones: Array.isArray(data.primaryStones) ? data.primaryStones : []
      };
      
      // Log the form data for debugging
      console.log("Submitting design form with data:", JSON.stringify(processedData, null, 2));
      console.log("User authentication state:", user ? `Authenticated as ${user.name || user.loginID} (${user.id})` : "Not authenticated");
      console.log("Uploaded images count:", uploadedImages.length);
      
      // Print out form validation information
      console.log("Form validation state:", form.formState.isValid ? "Valid" : "Invalid");
      if (!form.formState.isValid) {
        console.log("Form validation errors:", form.formState.errors);
      }
      
      // Create FormData for file upload
      const formData = new FormData();
      
      // For backward compatibility, include the main image as designImage
      if (uploadedImage) {
        formData.append("designImage", uploadedImage);
      }
      
      // Append all images with a different field name for multiple image support
      uploadedImages.forEach((file, index) => {
        formData.append(`designImages`, file);
      });
      
      // Convert complex fields to strings to avoid issues
      // For logged-in users, make sure we include their profile information
      const dataToSend = {
        ...processedData,
        // Ensure primaryStones is a simple string array
        primaryStones: Array.isArray(processedData.primaryStones) 
          ? processedData.primaryStones 
          : []
      };
      
      // If user is logged in but form fields are empty (because they're hidden in the UI),
      // populate them from the user profile
      if (user) {
        if (!dataToSend.fullName || dataToSend.fullName.trim() === '') {
          dataToSend.fullName = user.name || user.loginID;
          console.log("Using name from profile:", user.name || user.loginID);
        }
        
        if (!dataToSend.email || dataToSend.email.trim() === '') {
          dataToSend.email = user.email;
          console.log("Using email from profile:", user.email);
        }
        
        // Phone handling - either use from profile or set a placeholder if missing
        if (!dataToSend.phone || dataToSend.phone.trim() === '') {
          if (user.phone) {
            dataToSend.phone = user.phone;
            console.log("Using phone from profile:", user.phone);
          } else {
            // Set placeholder for required field
            dataToSend.phone = "Not provided";
            console.log("Using placeholder for missing phone number");
          }
        }
        
        // Country handling - either use from profile or set a default if missing
        if (!dataToSend.country || dataToSend.country.trim() === '') {
          if (user.country) {
            dataToSend.country = user.country;
            console.log("Using country from profile:", user.country);
          } else {
            // Set default country code
            dataToSend.country = "us";
            console.log("Using default country code: us");
          }
        }
      }
      
      // Make 100% sure primaryStones is properly serialized as an array
      if (!Array.isArray(dataToSend.primaryStones)) {
        console.error("primaryStones is not an array, forcing it to be an array", dataToSend.primaryStones);
        dataToSend.primaryStones = [];
      }
      
      // Set primaryStone field for backward compatibility if not already set
      if (!dataToSend.primaryStone && dataToSend.primaryStones.length > 0) {
        dataToSend.primaryStone = dataToSend.primaryStones[0];
      }
      
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
      
      // Special handling for 401 Unauthorized responses
      if (response.status === 401) {
        // Show toast notification
        toast({
          title: "Login required",
          description: "Your design details have been saved. Please log in or create an account to continue."
        });
        
        // Redirect to auth page with return URL
        window.location.href = `/auth?returnTo=${encodeURIComponent('/custom-design')}`;
        return; // Exit early
      }
      
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
      
      // Reset form and uploaded images
      form.reset({
        // Reset form to initial state with default values
        fullName: (user?.name || user?.loginID) || "",
        email: user?.email || "",
        phone: user?.phone || "",
        country: user?.country || "us",
        metalType: "",
        primaryStones: [],
        notes: "",
        agreeToTerms: false
      });
      
      // Clean up all image preview URLs to prevent memory leaks
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      
      previewUrls.forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
      
      // Reset all image-related state
      setUploadedImage(null);
      setUploadedImages([]);
      setPreviewUrl(null);
      setPreviewUrls([]);
      setSelectedStones([]);
      
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
        description: error instanceof Error ? error.message : "Please try again later.",
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
                  <div className="w-full text-center">
                    <p className="font-montserrat text-xs font-medium text-foreground truncate max-w-full px-1">
                      {file.name.length > 10 ? file.name.substring(0, 10) + '...' : file.name}
                    </p>
                    <p className="font-montserrat text-xs text-foreground/60">
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                  
                  {/* Remove button */}
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full" 
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
  
  // Create a context provider value for the AI consultation component
  const currentMetalType = form.watch('metalType');
  const currentNotes = form.watch('notes');
  
  const contextValue = {
    formValues: currentFormValues || {
      fullName: form.getValues('fullName'),
      email: form.getValues('email'),
      phone: form.getValues('phone'),
      country: form.getValues('country'),
      metalType: form.getValues('metalType'),
      primaryStones: form.getValues('primaryStones'),
      notes: form.getValues('notes'),
      agreeToTerms: form.getValues('agreeToTerms')
    },
    selectedStones: selectedStones,
    metalType: currentMetalType || ""
  };
  
  // Debug log for context value updates
  useEffect(() => {
    console.log("Design Form - Context Value Updated:", contextValue);
    console.log("Design Form - Current metal type:", currentMetalType);
    console.log("Design Form - Current notes:", currentNotes);
    console.log("Design Form - Selected stones:", selectedStones);
  }, [currentMetalType, currentNotes, selectedStones]);

  // Watch form changes to update currentFormValues
  useEffect(() => {
    const subscription = form.watch((value) => {
      setCurrentFormValues(value as DesignFormValues);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  return (
    <DesignFormContext.Provider value={contextValue}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit as any)} className="bg-background rounded-lg shadow-lg p-8">
          <h3 className="font-playfair text-2xl font-semibold text-foreground mb-3">Submit Your Design</h3>
          {!user && (
            <p className="font-montserrat text-sm text-foreground/70 mb-6">Login required. Your design details will be saved when you submit.</p>
          )}
        
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
                  value={field.value}
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
          
          {user ? (
            <div className="bg-accent/10 rounded-md p-4 mb-4">
              <p className="text-sm text-muted-foreground font-medium mb-2">
                Your contact information will be used from your account:
              </p>
              <div className="space-y-1 text-sm">
                <p><span className="font-semibold">Name:</span> {user.name || user.loginID}</p>
                <p><span className="font-semibold">Email:</span> {user.email}</p>
                {user.phone && <p><span className="font-semibold">Phone:</span> {user.phone}</p>}
                {user.country && (
                  <p><span className="font-semibold">Country:</span> {
                    COUNTRIES.find(c => c.id === user.country)?.name || user.country
                  }</p>
                )}
              </div>
            </div>
          ) : (
            <>
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
                          className="p-3 border border-foreground/20 rounded font-montserrat text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
                          type="tel"
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
                          value={field.value}
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
            </>
          )}
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
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            type="submit"
            disabled={isSubmitting}
            className="flex-1 font-montserrat font-medium bg-primary text-background px-6 py-3 rounded hover:bg-accent transition duration-300 h-auto"
          >
            {isSubmitting ? "Submitting..." : "Submit Design Request"}
          </Button>
          
          <div className="flex-1" id="ai-consultation-button-container">
            {/* This container will be used by the AI consultation component */}
          </div>
        </div>
        
        {!user && (
          <div className="mt-2 text-center">
            <p className="text-xs text-foreground/60">
              Login required. Your design details will be saved when you submit.
            </p>
          </div>
        )}
      </form>
    </Form>
    </DesignFormContext.Provider>
  );
}

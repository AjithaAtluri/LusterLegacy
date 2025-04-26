import { useState, useCallback, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import AdminLayout from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Save, Upload, X, PiggyBank } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import EditProductAIGenerator from "@/components/admin/edit-product-ai-generator";
import { PriceCalculatorDisplay } from "@/components/admin/price-calculator-display";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { AIGeneratedContent } from "@/lib/ai-content-generator";
import { useDropzone } from "react-dropzone";
import type { ProductType, StoneType } from "@shared/schema";

// Simplified Stone Type for the form
type SimpleStoneType = {
  id: number;
  name: string;
};

interface FormValues {
  title: string;
  tagline: string;
  shortDescription: string;
  detailedDescription: string;
  priceUSD: number;
  priceINR: number;
  productType: string;
  metalType: string;
  metalWeight: string;
  dimensions: {
    length: string;
    width: string;
    height: string;
  };
  mainStoneType: string;
  mainStoneWeight: string;
  secondaryStoneTypes: SimpleStoneType[];
  secondaryStoneWeight: string;
  otherStoneType: string;
  otherStoneWeight: string;
  featured: boolean;
  userDescription: string;
  inStock: boolean;
}

export default function EditProductNew() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<"loading" | "ai-generator" | "form">("loading");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [additionalImageFiles, setAdditionalImageFiles] = useState<File[]>([]);
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState<string[]>([]);
  const [generatedContent, setGeneratedContent] = useState<AIGeneratedContent | null>(null);

  // Form setup
  const form = useForm<FormValues>({
    defaultValues: {
      title: "",
      tagline: "",
      shortDescription: "",
      detailedDescription: "",
      priceUSD: 0,
      priceINR: 0,
      productType: "1", // Default to first product type
      metalType: "14K Yellow Gold", // Default metal type
      metalWeight: "",
      dimensions: {
        length: "0",
        width: "0",
        height: "0",
      },
      mainStoneType: "none_selected",
      mainStoneWeight: "",
      secondaryStoneTypes: [],
      secondaryStoneWeight: "",
      otherStoneType: "none_selected",
      otherStoneWeight: "",
      featured: false,
      userDescription: "",
      inStock: true,
    },
  });

  // First fetch user data to ensure we have admin authentication
  const { data: userData } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: 1
  });

  // Define a custom query function to properly fetch product data
  const fetchProduct = async () => {
    if (!params.id) {
      throw new Error("No product ID provided");
    }

    try {
      console.log(`Fetching product data for ID: ${params.id}`);
      console.log(`Current authenticated user:`, userData);

      // Make sure cookies are included for authentication
      const response = await fetch(`/api/admin/products/${params.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        credentials: 'include', // Important for authentication cookies
      });

      console.log(`Product fetch response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Server error response: ${errorText}`);

        // If authentication error, redirect to login
        if (response.status === 401) {
          toast({
            title: "Authentication Required",
            description: "Please log in to access this product",
            variant: "destructive"
          });
          setLocation('/admin');
          throw new Error('Authentication required');
        }

        throw new Error(`Failed to fetch product: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`Product data retrieved successfully:`, data);
      return data;
    } catch (error) {
      console.error('Error fetching product data:', error);
      throw error;
    }
  };

  // Fetch product data with custom query function
  const { data: productData, isLoading, error } = useQuery<any>({
    queryKey: ['/api/admin/products', params.id],
    queryFn: fetchProduct,
    enabled: !!params.id,
    retry: 3,
    refetchOnWindowFocus: false,
    staleTime: 0 // Force fresh data
  });

  // Fetch product types with custom query function
  const fetchProductTypes = async () => {
    try {
      const response = await fetch('/api/product-types', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for authentication cookies
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch product types: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching product types:', error);
      throw error;
    }
  };

  // Fetch stone types with custom query function
  const fetchStoneTypes = async () => {
    try {
      const response = await fetch('/api/admin/stone-types', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for authentication cookies
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch stone types: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching stone types:', error);
      throw error;
    }
  };

  // Use the custom query functions
  const { data: productTypes } = useQuery<ProductType[]>({
    queryKey: ['/api/product-types'],
    queryFn: fetchProductTypes,
    retry: 3,
    refetchOnWindowFocus: false
  });

  const { data: stoneTypes } = useQuery<StoneType[]>({
    queryKey: ['/api/admin/stone-types'],
    queryFn: fetchStoneTypes,
    retry: 3,
    refetchOnWindowFocus: false
  });

  // Update form when product data is loaded
  useEffect(() => {
    if (productData) {
      console.log("Product data received:", productData); // Add debug logging

      // Parse the details JSON if it exists and is a string
      let details;
      try {
        details = typeof productData.details === 'string' 
          ? JSON.parse(productData.details) 
          : productData.details;
        console.log("Parsed details:", details); // Add debug logging
      } catch (e) {
        details = {};
        console.error("Failed to parse product details:", e);
      }

      // Get additionalData from details if it exists
      const additionalData = details?.additionalData || {};
      console.log("Additional data:", additionalData); // Add debug logging
      
      // Get AI inputs if available
      const aiInputs = additionalData.aiInputs || {};
      console.log("AI inputs:", aiInputs); // Add debug logging
      
      // Extract metal type with better fallbacks
      let metalType = '';
      if (aiInputs.metalType) {
        console.log("Using metalType from aiInputs:", aiInputs.metalType);
        metalType = aiInputs.metalType;
      } else if (additionalData.metalType) {
        console.log("Using metalType from additionalData:", additionalData.metalType);
        metalType = additionalData.metalType;
      } else if (productData.metalType) {
        console.log("Using metalType from productData:", productData.metalType);
        metalType = productData.metalType;
      } else {
        console.log("No metalType found, using default");
        metalType = "14K Yellow Gold";
      }
      
      // Extract metal weight with better fallbacks
      let metalWeight = '';
      if (aiInputs.metalWeight) {
        console.log("Using metalWeight from aiInputs:", aiInputs.metalWeight);
        metalWeight = aiInputs.metalWeight.toString();
      } else if (additionalData.metalWeight) {
        console.log("Using metalWeight from additionalData:", additionalData.metalWeight);
        metalWeight = additionalData.metalWeight.toString();
      } else if (productData.metalWeight) {
        console.log("Using metalWeight from productData:", productData.metalWeight);
        metalWeight = productData.metalWeight.toString();
      } else {
        console.log("No metalWeight found, using default");
        metalWeight = "0";
      }
      
      // Extract stone types with better fallbacks
      let mainStoneType = 'none_selected';
      if (aiInputs.mainStoneType) {
        console.log("Using mainStoneType from aiInputs:", aiInputs.mainStoneType);
        mainStoneType = aiInputs.mainStoneType;
      } else if (additionalData.mainStoneType) {
        console.log("Using mainStoneType from additionalData:", additionalData.mainStoneType);
        mainStoneType = additionalData.mainStoneType;
      } else if (details?.mainStoneType) {
        console.log("Using mainStoneType from details:", details.mainStoneType);
        mainStoneType = details.mainStoneType;
      }
      
      // Extract main stone weight with better fallbacks
      let mainStoneWeight = '';
      if (aiInputs.mainStoneWeight) {
        console.log("Using mainStoneWeight from aiInputs:", aiInputs.mainStoneWeight);
        mainStoneWeight = aiInputs.mainStoneWeight.toString();
      } else if (additionalData.mainStoneWeight) {
        console.log("Using mainStoneWeight from additionalData:", additionalData.mainStoneWeight);
        mainStoneWeight = additionalData.mainStoneWeight.toString();
      } else if (details?.mainStoneWeight) {
        console.log("Using mainStoneWeight from details:", details.mainStoneWeight);
        mainStoneWeight = details.mainStoneWeight.toString();
      } else {
        mainStoneWeight = "0";
      }
      
      // Extract secondary stone types with better fallbacks and proper formatting
      let secondaryStoneTypes = [];
      if (aiInputs.secondaryStoneTypes && Array.isArray(aiInputs.secondaryStoneTypes)) {
        console.log("Using secondaryStoneTypes from aiInputs:", aiInputs.secondaryStoneTypes);
        // Convert array of strings to array of objects with id and name
        secondaryStoneTypes = aiInputs.secondaryStoneTypes.map((name: string, index: number) => ({
          id: index + 1, // Use index as ID for now
          name: name
        }));
      } else if (additionalData.secondaryStoneTypes && Array.isArray(additionalData.secondaryStoneTypes)) {
        console.log("Using secondaryStoneTypes from additionalData:", additionalData.secondaryStoneTypes);
        secondaryStoneTypes = additionalData.secondaryStoneTypes.map((name: string, index: number) => ({
          id: index + 1,
          name: name
        }));
      } else if (productData.stoneTypes && Array.isArray(productData.stoneTypes)) {
        console.log("Using stoneTypes from productData:", productData.stoneTypes);
        secondaryStoneTypes = productData.stoneTypes;
      }
      
      // Format the secondaryStoneTypes properly if they're not already in the right format
      if (secondaryStoneTypes.length > 0 && typeof secondaryStoneTypes[0] === 'string') {
        console.log("Converting secondaryStoneTypes from strings to objects");
        secondaryStoneTypes = secondaryStoneTypes.map((name: string, index: number) => ({
          id: index + 1,
          name: name
        }));
      }
      
      console.log("Final secondaryStoneTypes:", secondaryStoneTypes);
      
      // Extract secondary stone weight with better fallbacks
      let secondaryStoneWeight = '';
      if (aiInputs.secondaryStoneWeight) {
        console.log("Using secondaryStoneWeight from aiInputs:", aiInputs.secondaryStoneWeight);
        secondaryStoneWeight = aiInputs.secondaryStoneWeight.toString();
      } else if (additionalData.secondaryStoneWeight) {
        console.log("Using secondaryStoneWeight from additionalData:", additionalData.secondaryStoneWeight);
        secondaryStoneWeight = additionalData.secondaryStoneWeight.toString();
      } else if (details?.secondaryStoneWeight) {
        console.log("Using secondaryStoneWeight from details:", details.secondaryStoneWeight);
        secondaryStoneWeight = details.secondaryStoneWeight.toString();
      } else {
        secondaryStoneWeight = "0";
      }
      
      // Extract other stone type with better fallbacks
      let otherStoneType = 'none_selected';
      if (aiInputs.otherStoneType) {
        console.log("Using otherStoneType from aiInputs:", aiInputs.otherStoneType);
        otherStoneType = aiInputs.otherStoneType;
      } else if (additionalData.otherStoneType) {
        console.log("Using otherStoneType from additionalData:", additionalData.otherStoneType);
        otherStoneType = additionalData.otherStoneType;
      } else if (details?.otherStoneType) {
        console.log("Using otherStoneType from details:", details.otherStoneType);
        otherStoneType = details.otherStoneType;
      }
      
      // Extract other stone weight with better fallbacks
      let otherStoneWeight = '';
      if (aiInputs.otherStoneWeight) {
        console.log("Using otherStoneWeight from aiInputs:", aiInputs.otherStoneWeight);
        otherStoneWeight = aiInputs.otherStoneWeight.toString();
      } else if (additionalData.otherStoneWeight) {
        console.log("Using otherStoneWeight from additionalData:", additionalData.otherStoneWeight);
        otherStoneWeight = additionalData.otherStoneWeight.toString();
      } else if (details?.otherStoneWeight) {
        console.log("Using otherStoneWeight from details:", details.otherStoneWeight);
        otherStoneWeight = details.otherStoneWeight.toString();
      } else {
        otherStoneWeight = "0";
      }

      // Set form values from product data with improved fallbacks
      const formValues = {
        title: productData.name || "",
        tagline: additionalData.tagline || details?.tagline || "",
        shortDescription: productData.description || "",
        detailedDescription: details?.detailedDescription || "",
        priceUSD: productData.priceUSD || 0,
        priceINR: additionalData.basePriceINR || productData.basePrice || 0,
        productType: productData.productTypeId?.toString() || "",
        metalType: metalType,
        metalWeight: metalWeight,
        dimensions: {
          length: details?.dimensions?.length?.toString() || "0",
          width: details?.dimensions?.width?.toString() || "0",
          height: details?.dimensions?.height?.toString() || "0",
        },
        mainStoneType: mainStoneType,
        mainStoneWeight: mainStoneWeight,
        secondaryStoneTypes: secondaryStoneTypes,
        secondaryStoneWeight: secondaryStoneWeight,
        otherStoneType: otherStoneType,
        otherStoneWeight: otherStoneWeight,
        featured: productData.isFeatured || productData.featured || false,
        userDescription: aiInputs.userDescription || additionalData.userDescription || details?.userDescription || "",
        inStock: productData.inStock !== false, // default to true if undefined
      };

      console.log("Setting form values:", formValues); // Add debug logging
      form.reset(formValues);

      // Set image previews
      if (productData.imageUrl) {
        console.log("Setting main image preview:", productData.imageUrl); // Add debug logging
        setMainImagePreview(productData.imageUrl);
      }

      if (productData.additionalImages && Array.isArray(productData.additionalImages)) {
        console.log("Setting additional image previews:", productData.additionalImages); // Add debug logging
        setAdditionalImagePreviews(productData.additionalImages);
      }

      // Move to the form step
      setStep("form");

      // Force an update after a small delay to ensure form is populated
      setTimeout(() => {
        form.reset(formValues);
      }, 100);
    }
  }, [productData, form]);

  // Handler for content generation from AI
  const handleContentGenerated = (content: AIGeneratedContent) => {
    setGeneratedContent(content);

    // Update form with generated content
    form.setValue("title", content.title);
    form.setValue("tagline", content.tagline);
    form.setValue("shortDescription", content.shortDescription);
    form.setValue("detailedDescription", content.detailedDescription);
    form.setValue("priceUSD", content.priceUSD);
    form.setValue("priceINR", content.priceINR);

    // Handle the imageInsights field if available
    if (content.imageInsights) {
      // Store image insights in the database - add a note to the description
      const enhancedDescription = content.detailedDescription + 
        "\n\n-- Image Analysis Notes --\n" + content.imageInsights;
      form.setValue("detailedDescription", enhancedDescription);
    }

    // Save this info to localStorage for potential regeneration
    localStorage.setItem('aiGeneratedContent', JSON.stringify(content));
    
    // Save inputs for potential regeneration
    const aiGeneratorInputs = {
      productType: form.getValues("productType"),
      metalType: form.getValues("metalType"),
      metalWeight: form.getValues("metalWeight"),
      mainStoneType: form.getValues("mainStoneType"),
      mainStoneWeight: form.getValues("mainStoneWeight"),
      secondaryStoneTypes: form.getValues("secondaryStoneTypes"),
      secondaryStoneWeight: form.getValues("secondaryStoneWeight"),
      otherStoneType: form.getValues("otherStoneType"),
      otherStoneWeight: form.getValues("otherStoneWeight"),
      userDescription: form.getValues("userDescription")
    };
    localStorage.setItem('aiGeneratorInputs', JSON.stringify(aiGeneratorInputs));

    // Save the image data if available
    if (mainImagePreview) {
      localStorage.setItem('aiGeneratedImagePreview', mainImagePreview);
    }
    
    // Save additional images if available
    if (additionalImagePreviews.length > 0) {
      localStorage.setItem('aiGeneratedAdditionalImages', JSON.stringify(additionalImagePreviews));
    }

    setStep("form");

    // Show success notification
    toast({
      title: "Content Generated",
      description: "The AI has generated content for your product. You can now review and edit it before saving."
    });
  };

  // Dropzone configuration for main image
  const onMainImageDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setMainImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setMainImagePreview(previewUrl);
    }
  }, []);

  const { getRootProps: getMainImageRootProps, getInputProps: getMainImageInputProps } = useDropzone({
    onDrop: onMainImageDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1
  });

  // Dropzone configuration for additional images
  const onAdditionalImagesDrop = useCallback((acceptedFiles: File[]) => {
    // Limit to 3 additional images
    const files = acceptedFiles.slice(0, 3);
    setAdditionalImageFiles((prev) => [...prev, ...files].slice(0, 3));

    const previews = files.map(file => URL.createObjectURL(file));
    setAdditionalImagePreviews((prev) => [...prev, ...previews].slice(0, 3));
  }, []);

  const { getRootProps: getAdditionalImagesRootProps, getInputProps: getAdditionalImagesInputProps } = useDropzone({
    onDrop: onAdditionalImagesDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 3
  });

  // Function to remove an additional image
  const removeAdditionalImage = (index: number) => {
    setAdditionalImageFiles(prev => prev.filter((_, i) => i !== index));
    setAdditionalImagePreviews(prev => {
      // Revoke URL to prevent memory leaks
      if (prev[index]) URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Function to go to AI generator with current form values
  const goToAIGenerator = () => {
    // Prepare the form with the current values before going to AI generator
    // This ensures all the latest values are available to the AI generator
    
    // Show toast notification to inform the user
    toast({
      title: "AI Content Generator",
      description: "Use the AI to regenerate product content based on your current specifications."
    });
    
    // Switch to AI generator step
    setStep("ai-generator");
  };

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest(
        "PUT", 
        `/api/admin/products/${params.id}`, 
        formData,
        true  // isFormData flag
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update product");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products', params.id] });
      toast({
        title: "Product Updated",
        description: "Your product has been updated successfully."
      });
      setLocation('/admin/products');
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update product. Please try again.",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  });

  // Form submission handler
  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);

      const formData = new FormData();

      // Add main image if there's a new file
      if (mainImageFile) {
        formData.append('mainImage', mainImageFile);
      }

      // Add additional images if there are new files
      additionalImageFiles.forEach((file, index) => {
        formData.append(`additionalImage${index + 1}`, file);
      });

      // Prepare product data with same structure as creation
      const productData = {
        name: values.title,
        description: values.shortDescription,
        basePrice: values.priceINR,
        priceUSD: values.priceUSD,
        productTypeId: values.productType,
        isFeatured: values.featured,
        inStock: values.inStock,
        details: JSON.stringify({
          detailedDescription: values.detailedDescription,
          additionalData: {
            tagline: values.tagline,
            basePriceINR: values.priceINR,
            priceUSD: values.priceUSD,
            metalType: values.metalType,
            metalWeight: parseFloat(values.metalWeight) || 0,
            stoneTypes: values.secondaryStoneTypes,
            mainStoneType: values.mainStoneType === "none_selected" ? "" : values.mainStoneType,
            mainStoneWeight: parseFloat(values.mainStoneWeight) || 0,
            secondaryStoneTypes: values.secondaryStoneTypes,
            secondaryStoneWeight: parseFloat(values.secondaryStoneWeight) || 0,
            otherStoneType: values.otherStoneType === "none_selected" ? "" : values.otherStoneType,
            otherStoneWeight: parseFloat(values.otherStoneWeight) || 0,
            productTypeId: values.productType || '',
            userDescription: values.userDescription,
            dimensions: values.dimensions,
            // Save all AI generator inputs as a dedicated structure for easier retrieval
            aiInputs: {
              metalType: values.metalType,
              metalWeight: parseFloat(values.metalWeight) || 0,
              mainStoneType: values.mainStoneType === "none_selected" ? "" : values.mainStoneType,
              mainStoneWeight: parseFloat(values.mainStoneWeight) || 0,
              secondaryStoneTypes: values.secondaryStoneTypes.map(stone => stone.name),
              secondaryStoneWeight: parseFloat(values.secondaryStoneWeight) || 0,
              otherStoneType: values.otherStoneType === "none_selected" ? "" : values.otherStoneType,
              otherStoneWeight: parseFloat(values.otherStoneWeight) || 0,
              userDescription: values.userDescription,
              productType: values.productType || '',
            }
          }
        }),
      };

      // Add product data to form
      formData.append('data', JSON.stringify(productData));

      // Add existing image URLs for preservation
      if (mainImagePreview && !mainImageFile) {
        formData.append('existingMainImage', mainImagePreview);
      }

      additionalImagePreviews.forEach((url, index) => {
        // Only include URLs for images that weren't replaced with new files
        if (index >= additionalImageFiles.length) {
          formData.append(`existingAdditionalImage${index + 1}`, url);
        }
      });

      // Submit the form
      await updateProductMutation.mutateAsync(formData);

    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Error",
        description: "Failed to update product. Please try again.",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading || step === "loading") {
    return (
      <AdminLayout title="Edit Product">
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
            <p className="text-lg text-muted-foreground">Loading product data...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Error state
  if (error || !params.id) {
    return (
      <AdminLayout title="Edit Product">
        <div className="container p-6 text-center py-24">
          <h2 className="text-xl font-semibold mb-2">Error Loading Product</h2>
          <p className="text-muted-foreground mb-6">
            Could not load the product data. Please try again or go back to products.
          </p>
          <Button onClick={() => setLocation('/admin/products')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>
        </div>
      </AdminLayout>
    );
  }

  // AI Generator step
  if (step === "ai-generator") {
    return (
      <AdminLayout title="Edit Product - AI Generator">
        <div className="container p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline"
                onClick={() => setStep("form")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Form
              </Button>
              <h1 className="text-2xl font-semibold">AI Content Generator</h1>
            </div>
          </div>

          <EditProductAIGenerator
            productType={form.watch("productType")}
            metalType={form.watch("metalType")}
            metalWeight={form.watch("metalWeight")}
            mainStoneType={form.watch("mainStoneType")}
            mainStoneWeight={form.watch("mainStoneWeight")}
            secondaryStoneTypes={form.watch("secondaryStoneTypes")}
            secondaryStoneWeight={form.watch("secondaryStoneWeight")}
            otherStoneType={form.watch("otherStoneType")}
            otherStoneWeight={form.watch("otherStoneWeight")}
            userDescription={form.watch("userDescription")}
            mainImageUrl={mainImagePreview}
            additionalImageUrls={additionalImagePreviews}
            onContentGenerated={handleContentGenerated}
            onMainImageChange={(file, preview) => {
              setMainImageFile(file);
              setMainImagePreview(preview);
            }}
            onAdditionalImagesChange={(files, previews) => {
              setAdditionalImageFiles(files);
              setAdditionalImagePreviews(previews);
            }}
          />
        </div>
      </AdminLayout>
    );
  }

  // Form step
  return (
    <AdminLayout title="Edit Product">
      <div className="container p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline"
              onClick={() => setLocation('/admin/products')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
            <h1 className="text-2xl font-semibold">Edit Product</h1>
          </div>
          <div className="flex space-x-2">
            <Button 
              onClick={goToAIGenerator}
              variant="outline"
            >
              <Upload className="h-4 w-4 mr-2" />
              Regenerate Content
            </Button>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Product Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter product title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tagline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tagline</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter product tagline" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="shortDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Short Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter a brief description" 
                              className="min-h-[80px] resize-y"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="detailedDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Detailed Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter a detailed description" 
                              className="min-h-[120px] resize-y"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Pricing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="priceINR"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price (INR)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                step="0.01"
                                placeholder="Price in INR" 
                                {...field}
                                value={field.value}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="priceUSD"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price (USD)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                step="0.01"
                                placeholder="Price in USD" 
                                {...field}
                                value={field.value}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {/* Price Comparison */}
                    <div className="mt-6">
                      <Card className="border-amber-200">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center">
                            <PiggyBank className="mr-2 h-5 w-5 text-amber-600" />
                            Price Comparison
                          </CardTitle>
                          <CardDescription>
                            Compare AI-generated prices with real-time calculated prices
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="border rounded-md p-3 bg-background">
                              <h3 className="text-sm font-medium mb-2 text-primary">AI-Generated Price</h3>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm">USD:</span>
                                  <span className="font-medium">${form.watch("priceUSD")}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">INR:</span>
                                  <span className="font-medium">₹{form.watch("priceINR")}</span>
                                </div>
                              </div>
                            </div>
                            <div className="border rounded-md p-3 bg-background">
                              <h3 className="text-sm font-medium mb-2 text-amber-600">Calculated Price</h3>
                              <PriceCalculatorDisplay 
                                metalType={form.watch("metalType")}
                                metalWeight={form.watch("metalWeight")}
                                mainStoneType={form.watch("mainStoneType")}
                                mainStoneWeight={form.watch("mainStoneWeight")}
                                secondaryStoneTypes={form.watch("secondaryStoneTypes")}
                                secondaryStoneWeight={form.watch("secondaryStoneWeight")}
                                otherStoneType={form.watch("otherStoneType")}
                                otherStoneWeight={form.watch("otherStoneWeight")}
                                compact={true}
                              />
                            </div>
                          </div>
                          <div className="mt-3 text-xs text-muted-foreground">
                            <p>The calculated price is based on current gold prices and selected materials.</p>
                            <p className="mt-1">You can manually adjust the prices in the fields above if needed.</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Images</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <FormLabel className="block mb-2">Main Product Image</FormLabel>
                      {mainImagePreview ? (
                        <div className="relative w-full h-[300px] rounded-md overflow-hidden border border-input">
                          <img
                            src={mainImagePreview}
                            alt="Product preview"
                            className="w-full h-full object-cover"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1"
                            onClick={() => {
                              if (mainImagePreview) URL.revokeObjectURL(mainImagePreview);
                              setMainImagePreview(null);
                              setMainImageFile(null);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div
                          {...getMainImageRootProps()}
                          className="border-2 border-dashed border-input rounded-md p-10 text-center hover:border-primary/50 cursor-pointer transition-colors"
                        >
                          <input {...getMainImageInputProps()} />
                          <div className="flex flex-col items-center">
                            <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground mb-1">Drag & drop or click to upload</p>
                            <p className="text-xs text-muted-foreground">Recommended size: 1200x1200px</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <FormLabel className="block mb-2">Additional Images (Up to 3)</FormLabel>
                      <div className="grid grid-cols-3 gap-4">
                        {additionalImagePreviews.map((preview, index) => (
                          <div key={index} className="relative w-full h-[120px] rounded-md overflow-hidden border border-input">
                            <img
                              src={preview}
                              alt={`Additional preview ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1"
                              onClick={() => removeAdditionalImage(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        {additionalImagePreviews.length < 3 && (
                          <div
                            {...getAdditionalImagesRootProps()}
                            className="border-2 border-dashed border-input rounded-md p-4 text-center hover:border-primary/50 cursor-pointer transition-colors h-[120px] flex flex-col items-center justify-center"
                          >
                            <input {...getAdditionalImagesInputProps()} />
                            <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                            <p className="text-xs text-muted-foreground">Upload</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Product Classification</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="productType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Type</FormLabel>
                          <Select 
                            value={field.value} 
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select product type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {productTypes?.map(type => (
                                <SelectItem key={type.id} value={type.id.toString()}>
                                  {type.name}
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
                      name="metalType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Metal Type</FormLabel>
                          <Select 
                            value={field.value} 
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select metal type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="18K Yellow Gold">18K Yellow Gold</SelectItem>
                              <SelectItem value="18K White Gold">18K White Gold</SelectItem>
                              <SelectItem value="18K Rose Gold">18K Rose Gold</SelectItem>
                              <SelectItem value="14K Yellow Gold">14K Yellow Gold</SelectItem>
                              <SelectItem value="14K White Gold">14K White Gold</SelectItem>
                              <SelectItem value="14K Rose Gold">14K Rose Gold</SelectItem>
                              <SelectItem value="Sterling Silver">Sterling Silver</SelectItem>
                              <SelectItem value="Platinum">Platinum</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="metalWeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Metal Weight (grams)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              step="0.01" 
                              placeholder="Enter metal weight"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="dimensions.length"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Length (mm)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" step="0.1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="dimensions.width"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Width (mm)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" step="0.1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="dimensions.height"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Height (mm)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" step="0.1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Gemstones</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="mainStoneType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Main Stone Type</FormLabel>
                          <Select 
                            value={field.value} 
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select main stone" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none_selected">None</SelectItem>
                              {stoneTypes?.map(stone => (
                                <SelectItem key={stone.id} value={stone.name}>
                                  {stone.name}
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
                      name="mainStoneWeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Main Stone Weight (carat)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              step="0.01"
                              placeholder="Enter stone weight" 
                              {...field}
                              disabled={!form.watch("mainStoneType") || form.watch("mainStoneType") === "none_selected"}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="secondaryStoneTypes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Secondary Stone Types</FormLabel>
                          <div className="mt-2 border rounded-md p-4 max-h-[200px] overflow-y-auto">
                            {stoneTypes?.map(stone => (
                              <div key={stone.id} className="flex items-center space-x-2 mb-2">
                                <Checkbox 
                                  id={`stone-${stone.id}`}
                                  checked={field.value.some(s => s.id === stone.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      field.onChange([...field.value, stone]);
                                    } else {
                                      field.onChange(field.value.filter(s => s.id !== stone.id));
                                    }
                                  }}
                                />
                                <label 
                                  htmlFor={`stone-${stone.id}`}
                                  className="text-sm cursor-pointer"
                                >
                                  {stone.name}
                                </label>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="secondaryStoneWeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Secondary Stone Weight (carat)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              step="0.01"
                              placeholder="Enter total weight" 
                              {...field}
                              disabled={form.watch("secondaryStoneTypes").length === 0}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="otherStoneType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Other Stone Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select other stone" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none_selected">None</SelectItem>
                              {stoneTypes?.map(stone => (
                                <SelectItem key={stone.id} value={stone.name}>
                                  {stone.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Use this for an additional stone type that doesn't fit the main or secondary categories
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="otherStoneWeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Other Stone Weight (carat)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              step="0.01"
                              placeholder="Enter stone weight" 
                              {...field}
                              disabled={!form.watch("otherStoneType") || form.watch("otherStoneType") === "none_selected"}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Additional Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="userDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Custom Description (for AI)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter any additional details you'd like the AI to consider" 
                              className="min-h-[100px] resize-y"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            This will be used by the AI to generate more custom content
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex space-x-4">
                      <FormField
                        control={form.control}
                        name="featured"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox 
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="cursor-pointer">Featured Product</FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="inStock"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox 
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="cursor-pointer">In Stock</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end space-x-4">
                  <Button 
                    variant="outline" 
                    type="button"
                    onClick={() => setLocation('/admin/products')}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Product
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}
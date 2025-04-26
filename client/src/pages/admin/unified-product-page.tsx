import { useState, useEffect, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDropzone } from "react-dropzone";
import AdminLayout from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Upload, X, RefreshCw, ArrowRight, Gem } from "lucide-react";
import AIContentGenerator from "@/components/admin/ai-content-generator";
import type { AIGeneratedContent } from "@/lib/ai-content-generator";
import type { ProductType, StoneType, MetalType } from "@shared/schema";

// Define schema for form validation
const productFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  tagline: z.string().optional(),
  shortDescription: z.string().min(10, "Short description must be at least 10 characters"),
  detailedDescription: z.string().min(20, "Detailed description must be at least 20 characters"),
  priceUSD: z.coerce.number().min(1, "Price must be greater than 0"),
  priceINR: z.coerce.number().min(1, "Price must be greater than 0"),
  productType: z.string().min(1, "Product type is required"),
  metalType: z.string().min(1, "Metal type is required"),
  metalWeight: z.string().min(1, "Metal weight is required"),
  dimensions: z.object({
    length: z.string().optional(),
    width: z.string().optional(),
    height: z.string().optional(),
  }),
  mainStoneType: z.string().optional(),
  mainStoneWeight: z.string().optional(),
  secondaryStoneTypes: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
    })
  ).optional(),
  secondaryStoneWeight: z.string().optional(),
  featured: z.boolean().default(false),
  userDescription: z.string().optional(),
  inStock: z.boolean().default(true),
});

// Helper type for our form values
type FormValues = z.infer<typeof productFormSchema>;

// Extract any stone types from an object into a structured format
const extractStoneTypes = (obj: any): { id: number; name: string }[] => {
  // If we have an array of objects with the right shape, return it
  if (Array.isArray(obj) && obj.length > 0 && typeof obj[0] === 'object' && 'name' in obj[0]) {
    return obj.map((stone, idx) => ({
      id: 'id' in stone ? stone.id : idx + 1,
      name: stone.name
    }));
  }
  
  // If we have an array of strings, convert it
  if (Array.isArray(obj) && obj.length > 0 && typeof obj[0] === 'string') {
    return obj.map((name, idx) => ({
      id: idx + 1,
      name
    }));
  }
  
  return [];
};

export default function UnifiedProductPage() {
  const [tab, setTab] = useState<string>("form");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<AIGeneratedContent | null>(null);
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [additionalImageFiles, setAdditionalImageFiles] = useState<File[]>([]);
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState<string[]>([]);
  
  const [, setLocation] = useLocation();
  const params = useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Initialize form with default values for a new product or placeholder values when editing
  const form = useForm<FormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      title: "",
      tagline: "",
      shortDescription: "",
      detailedDescription: "",
      priceUSD: 0,
      priceINR: 0,
      productType: "", // Will be populated with options from API
      metalType: "14K Yellow Gold", // Default metal type
      metalWeight: "",
      dimensions: {
        length: "0",
        width: "0",
        height: "0",
      },
      mainStoneType: "",
      mainStoneWeight: "",
      secondaryStoneTypes: [],
      secondaryStoneWeight: "",
      featured: false,
      userDescription: "",
      inStock: true,
    },
  });
  
  // Watch form values for AI generator
  const formValues = form.watch();
  const productType = form.watch("productType");
  const metalType = form.watch("metalType");
  const metalWeight = form.watch("metalWeight");
  const mainStoneType = form.watch("mainStoneType");
  const mainStoneWeight = form.watch("mainStoneWeight");
  const secondaryStoneTypes = form.watch("secondaryStoneTypes") || [];
  const secondaryStoneWeight = form.watch("secondaryStoneWeight");
  const userDescription = form.watch("userDescription");
  
  // Get product ID from URL if it exists (for editing)
  const productId = params?.id ? parseInt(params.id) : null;
  const isEditMode = !!productId;
  
  // Fetch product types
  const { data: productTypes } = useQuery<ProductType[]>({
    queryKey: ['/api/product-types'],
  });
  
  // Fetch stone types
  const { data: stoneTypes } = useQuery<StoneType[]>({
    queryKey: ['/api/admin/stone-types'],
  });
  
  // Fetch metal types
  const { data: metalTypes } = useQuery<MetalType[]>({
    queryKey: ['/api/admin/metal-types'],
  });
  
  // Fetch product data if in edit mode
  const { data: productData, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['/api/admin/products', productId],
    enabled: isEditMode && !!productId,
    queryFn: async () => {
      console.log(`Fetching product data for ID: ${productId}`);
      
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        credentials: 'include',
      });
      
      console.log(`Product fetch response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Server error response: ${errorText}`);
        
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
    }
  });
  
  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest(
        "POST", 
        "/api/admin/products", 
        formData,
        true  // isFormData flag
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create product");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      toast({
        title: "Product Created",
        description: "New product has been created successfully"
      });
      setLocation('/admin/products');
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
        variant: "destructive"
      });
    }
  });
  
  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest(
        "PUT", 
        `/api/admin/products/${productId}`, 
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
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products', productId] });
      toast({
        title: "Product Updated",
        description: "Product has been updated successfully"
      });
      setLocation('/admin/products');
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive"
      });
    }
  });
  
  // Update form when product data is loaded (edit mode)
  useEffect(() => {
    if (productData && isEditMode) {
      console.log("Populating form with product data:", productData);
      
      // Parse the details JSON if it exists and is a string
      let details;
      try {
        details = typeof productData.details === 'string' 
          ? JSON.parse(productData.details) 
          : productData.details;
        console.log("Parsed details:", details);
      } catch (e) {
        details = {};
        console.error("Failed to parse product details:", e);
      }
      
      // Get additionalData from details if it exists
      const additionalData = details?.additionalData || {};
      console.log("Additional data:", additionalData);
      
      // Get AI inputs if available
      const aiInputs = additionalData.aiInputs || {};
      console.log("AI inputs:", aiInputs);
      
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
      let mainStoneType = '';
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
      let secondaryStonesList: { id: number; name: string }[] = [];
      if (aiInputs.secondaryStoneTypes) {
        console.log("Using secondaryStoneTypes from aiInputs:", aiInputs.secondaryStoneTypes);
        secondaryStonesList = extractStoneTypes(aiInputs.secondaryStoneTypes);
      } else if (additionalData.secondaryStoneTypes) {
        console.log("Using secondaryStoneTypes from additionalData:", additionalData.secondaryStoneTypes);
        secondaryStonesList = extractStoneTypes(additionalData.secondaryStoneTypes);
      } else if (productData.stoneTypes) {
        console.log("Using stoneTypes from productData:", productData.stoneTypes);
        secondaryStonesList = extractStoneTypes(productData.stoneTypes);
      }
      
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
        secondaryStoneTypes: secondaryStonesList,
        secondaryStoneWeight: secondaryStoneWeight,
        featured: productData.isFeatured || productData.featured || false,
        userDescription: aiInputs.userDescription || additionalData.userDescription || details?.userDescription || "",
        inStock: productData.inStock !== false, // default to true if undefined
      };
      
      console.log("Setting form values:", formValues);
      form.reset(formValues);
      
      // Set image previews
      if (productData.imageUrl) {
        console.log("Setting main image preview:", productData.imageUrl);
        setMainImagePreview(productData.imageUrl);
      }
      
      if (productData.additionalImages && Array.isArray(productData.additionalImages)) {
        console.log("Setting additional image previews:", productData.additionalImages);
        setAdditionalImagePreviews(productData.additionalImages);
      }
      
      // Force an update after a small delay to ensure form is populated
      setTimeout(() => {
        form.reset(formValues);
      }, 100);
    }
  }, [productData, form, isEditMode]);
  
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
    
    setTab("form");
    
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
  
  // Form submission handler
  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      
      // Create FormData for file uploads
      const formData = new FormData();
      
      // Add text fields
      formData.append("name", values.title);
      formData.append("description", values.shortDescription);
      formData.append("basePrice", values.priceINR.toString());
      formData.append("priceUSD", values.priceUSD.toString());
      formData.append("productTypeId", values.productType);
      formData.append("featured", values.featured.toString());
      formData.append("inStock", values.inStock.toString());
      
      // Add detailed information as JSON
      const detailsData = {
        detailedDescription: values.detailedDescription,
        tagline: values.tagline,
        dimensions: values.dimensions,
        additionalData: {
          metalType: values.metalType,
          metalWeight: values.metalWeight,
          mainStoneType: values.mainStoneType,
          mainStoneWeight: values.mainStoneWeight,
          secondaryStoneTypes: values.secondaryStoneTypes?.map(s => s.name) || [],
          secondaryStoneWeight: values.secondaryStoneWeight,
          userDescription: values.userDescription,
          basePriceINR: values.priceINR,
          // Store AI inputs for regeneration
          aiInputs: {
            productType: values.productType,
            metalType: values.metalType,
            metalWeight: values.metalWeight,
            primaryGems: [
              ...(values.mainStoneType ? [{
                name: values.mainStoneType,
                carats: parseFloat(values.mainStoneWeight || '0')
              }] : []),
              ...(values.secondaryStoneTypes ? values.secondaryStoneTypes.map(stone => ({
                name: stone.name,
                carats: values.secondaryStoneWeight ? parseFloat(values.secondaryStoneWeight) / (values.secondaryStoneTypes?.length || 1) : 0
              })) : [])
            ],
            userDescription: values.userDescription,
          }
        }
      };
      
      formData.append("details", JSON.stringify(detailsData));
      
      // Add main image if available
      if (mainImageFile) {
        formData.append("mainImage", mainImageFile);
      } else if (mainImagePreview && !mainImagePreview.includes("blob:")) {
        // If we have a preview URL but no file (when editing), pass the URL
        formData.append("mainImageUrl", mainImagePreview);
      }
      
      // Add additional images if available
      additionalImageFiles.forEach((file, index) => {
        formData.append(`additionalImage${index + 1}`, file);
      });
      
      // For existing additional images in edit mode
      if (isEditMode && additionalImagePreviews.length > 0) {
        const existingUrls = additionalImagePreviews
          .filter(url => !url.includes("blob:"))
          .map(url => url);
        
        if (existingUrls.length > 0) {
          formData.append("additionalImageUrls", JSON.stringify(existingUrls));
        }
      }
      
      // Add stone types
      if (values.secondaryStoneTypes && values.secondaryStoneTypes.length > 0) {
        const stoneTypeIds = values.secondaryStoneTypes
          .filter(st => typeof st.id === 'number')
          .map(st => st.id);
        
        if (stoneTypeIds.length > 0) {
          formData.append("stoneTypeIds", JSON.stringify(stoneTypeIds));
        }
      }
      
      // Execute the appropriate mutation
      if (isEditMode && productId) {
        await updateProductMutation.mutateAsync(formData);
      } else {
        await createProductMutation.mutateAsync(formData);
      }
      
      return true;
    } catch (error) {
      console.error("Submission error:", error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Loading state
  if (isEditMode && isLoadingProduct) {
    return (
      <AdminLayout title={isEditMode ? "Edit Product" : "Add Product"}>
        <div className="container p-6 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <h3 className="text-lg">Loading product data...</h3>
          </div>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout title={isEditMode ? "Edit Product" : "Add Product"}>
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
            <h1 className="text-2xl font-semibold">{isEditMode ? "Edit Product" : "Add Product"}</h1>
          </div>
        </div>
        
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="form">Product Form</TabsTrigger>
            <TabsTrigger value="ai">AI Content Generator</TabsTrigger>
          </TabsList>
          
          <TabsContent value="form" className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left column - Basic info */}
                  <div className="lg:col-span-2 space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Product Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Title */}
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
                        
                        {/* Tagline */}
                        <FormField
                          control={form.control}
                          name="tagline"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tagline</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter a catchy tagline (optional)" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Short Description */}
                        <FormField
                          control={form.control}
                          name="shortDescription"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Short Description</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Brief description for product listings" 
                                  className="min-h-[80px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Detailed Description */}
                        <FormField
                          control={form.control}
                          name="detailedDescription"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Detailed Description</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Detailed product description" 
                                  className="min-h-[150px]"
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
                        <CardTitle>Product Classification</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Product Type */}
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
                                  {productTypes?.map((type) => (
                                    <SelectItem key={type.id} value={type.id?.toString() || ""}>
                                      {type.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Metal Type */}
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
                                  <SelectItem value="14K Yellow Gold">14K Yellow Gold</SelectItem>
                                  <SelectItem value="14K White Gold">14K White Gold</SelectItem>
                                  <SelectItem value="14K Rose Gold">14K Rose Gold</SelectItem>
                                  <SelectItem value="18K Yellow Gold">18K Yellow Gold</SelectItem>
                                  <SelectItem value="18K White Gold">18K White Gold</SelectItem>
                                  <SelectItem value="18K Rose Gold">18K Rose Gold</SelectItem>
                                  <SelectItem value="Sterling Silver">Sterling Silver</SelectItem>
                                  <SelectItem value="Platinum">Platinum</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Metal Weight */}
                        <FormField
                          control={form.control}
                          name="metalWeight"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Metal Weight (grams)</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Metal weight in grams" 
                                  type="number" 
                                  min="0" 
                                  step="0.01" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Dimensions */}
                        <div className="grid grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="dimensions.length"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Length (mm)</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Length" 
                                    type="number" 
                                    min="0" 
                                    step="0.1" 
                                    {...field} 
                                  />
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
                                  <Input 
                                    placeholder="Width" 
                                    type="number" 
                                    min="0" 
                                    step="0.1" 
                                    {...field} 
                                  />
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
                                  <Input 
                                    placeholder="Height" 
                                    type="number" 
                                    min="0" 
                                    step="0.1" 
                                    {...field} 
                                  />
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
                      <CardContent className="space-y-6">
                        {/* Main Stone Type */}
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
                                    <SelectValue placeholder="Select stone type (optional)" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="">None</SelectItem>
                                  {stoneTypes?.map((type) => (
                                    <SelectItem key={type.id} value={type.name || ""}>
                                      {type.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Main Stone Weight */}
                        <FormField
                          control={form.control}
                          name="mainStoneWeight"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Main Stone Weight (carats)</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Main stone weight in carats" 
                                  type="number" 
                                  min="0" 
                                  step="0.01" 
                                  {...field} 
                                  disabled={!form.watch("mainStoneType")}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Secondary Stone Types */}
                        <div className="space-y-2">
                          <FormLabel>Secondary Stone Types</FormLabel>
                          <ScrollArea className="h-[150px] border rounded-md p-4">
                            {stoneTypes?.map((type) => (
                              <div key={type.id} className="flex items-center space-x-2 mb-2">
                                <Checkbox 
                                  id={`stone-${type.id}`} 
                                  checked={form.watch("secondaryStoneTypes")?.some(s => s.name === type.name)} 
                                  onCheckedChange={(checked) => {
                                    const currentStones = form.getValues("secondaryStoneTypes") || [];
                                    if (checked) {
                                      form.setValue("secondaryStoneTypes", [
                                        ...currentStones,
                                        { id: type.id, name: type.name }
                                      ]);
                                    } else {
                                      form.setValue("secondaryStoneTypes", 
                                        currentStones.filter(s => s.name !== type.name)
                                      );
                                    }
                                  }}
                                />
                                <Label htmlFor={`stone-${type.id}`} className="text-sm">
                                  {type.name}
                                </Label>
                              </div>
                            ))}
                          </ScrollArea>
                          <FormMessage />
                        </div>
                        
                        {/* Secondary Stone Weight */}
                        <FormField
                          control={form.control}
                          name="secondaryStoneWeight"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Secondary Stones Total Weight (carats)</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Total weight of secondary stones in carats" 
                                  type="number" 
                                  min="0" 
                                  step="0.01" 
                                  {...field} 
                                  disabled={!form.watch("secondaryStoneTypes")?.length}
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
                      <CardContent className="space-y-6">
                        {/* Price USD */}
                        <FormField
                          control={form.control}
                          name="priceUSD"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price (USD)</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Price in USD" 
                                  type="number"
                                  min="0" 
                                  step="0.01" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Price INR */}
                        <FormField
                          control={form.control}
                          name="priceINR"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price (INR)</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Price in INR" 
                                  type="number" 
                                  min="0" 
                                  step="1" 
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
                        <CardTitle>Status & Visibility</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Featured */}
                        <FormField
                          control={form.control}
                          name="featured"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Featured Product</FormLabel>
                                <FormDescription>
                                  Display this product on the homepage and featured collections
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        {/* In Stock */}
                        <FormField
                          control={form.control}
                          name="inStock"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">In Stock</FormLabel>
                                <FormDescription>
                                  Mark whether this product is available for purchase
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Right column - Image upload and custom description */}
                  <div className="space-y-6">
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
                                  if (mainImagePreview && mainImagePreview.startsWith('blob:')) {
                                    URL.revokeObjectURL(mainImagePreview);
                                  }
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
                                  alt={`Additional image ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1"
                                  onClick={() => removeAdditionalImage(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            
                            {additionalImagePreviews.length < 3 && (
                              <div
                                {...getAdditionalImagesRootProps()}
                                className="border-2 border-dashed border-input rounded-md flex items-center justify-center hover:border-primary/50 cursor-pointer transition-colors"
                              >
                                <input {...getAdditionalImagesInputProps()} />
                                <div className="flex flex-col items-center p-4">
                                  <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                                  <p className="text-xs text-muted-foreground text-center">Add Image</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Custom Description</CardTitle>
                        <CardDescription>
                          Add unique details about this product for AI content generation
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <FormField
                          control={form.control}
                          name="userDescription"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Textarea 
                                  placeholder="Describe any unique features or special notes for this product" 
                                  className="min-h-[150px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                This description will be used as input for AI content generation
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                    
                    <div className="sticky bottom-6 bg-card rounded-lg p-4 border shadow-sm">
                      <Button 
                        type="submit" 
                        className="w-full" 
                        size="lg"
                        disabled={isSubmitting}
                      >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditMode ? "Update Product" : "Create Product"}
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="ai" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Content Generator</CardTitle>
                <CardDescription>
                  Generate product details automatically using AI based on product specifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AIContentGenerator
                  productType={productTypes?.find(pt => pt.id.toString() === productType)?.name || ""}
                  metalType={metalType}
                  metalWeight={parseFloat(metalWeight || "0")}
                  primaryGems={[
                    ...(mainStoneType ? [{
                      name: mainStoneType,
                      carats: mainStoneWeight ? parseFloat(mainStoneWeight) : undefined
                    }] : []),
                    ...(secondaryStoneTypes?.map(stone => ({
                      name: stone.name,
                      carats: secondaryStoneWeight ? parseFloat(secondaryStoneWeight) / secondaryStoneTypes.length : undefined
                    })) || [])
                  ]}
                  userDescription={userDescription}
                  imageUrls={[
                    ...(mainImagePreview ? [mainImagePreview] : []),
                    ...additionalImagePreviews
                  ]}
                  onContentGenerated={handleContentGenerated}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
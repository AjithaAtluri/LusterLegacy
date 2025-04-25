import { useState, useCallback, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import AdminLayout from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Save, Upload, X } from "lucide-react";
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
      metalType: "18K Yellow Gold", // Default metal type
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
      const response = await fetch('/api/stone-types', {
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
    queryKey: ['/api/stone-types'],
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

      // Extract stone types from the product data
      const secondaryStones = productData.stoneTypes 
        ? Array.isArray(productData.stoneTypes) 
          ? productData.stoneTypes 
          : [] 
        : [];
      console.log("Secondary stones:", secondaryStones); // Add debug logging

      // Set form values from product data
      const formValues = {
        title: productData.name || "",
        tagline: details?.tagline || "",
        shortDescription: productData.description || "",
        detailedDescription: details?.detailedDescription || "",
        priceUSD: productData.priceUSD || 0,
        priceINR: productData.basePrice || 0,
        productType: productData.productTypeId?.toString() || "",
        metalType: productData.metalType || "",
        metalWeight: productData.metalWeight?.toString() || "",
        dimensions: {
          length: details?.dimensions?.length?.toString() || "0",
          width: details?.dimensions?.width?.toString() || "0",
          height: details?.dimensions?.height?.toString() || "0",
        },
        mainStoneType: details?.mainStoneType || "none_selected",
        mainStoneWeight: details?.mainStoneWeight?.toString() || "",
        secondaryStoneTypes: secondaryStones,
        secondaryStoneWeight: details?.secondaryStoneWeight?.toString() || "",
        featured: productData.featured || false,
        userDescription: details?.userDescription || "",
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

  // Function to go back to AI generator
  const goToAIGenerator = () => {
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

      // Prepare product data
      const productData = {
        name: values.title,
        description: values.shortDescription,
        basePrice: values.priceINR,
        priceUSD: values.priceUSD,
        productTypeId: values.productType,
        metalType: values.metalType,
        metalWeight: values.metalWeight,
        featured: values.featured,
        inStock: values.inStock,
        stoneTypes: values.secondaryStoneTypes,
        details: JSON.stringify({
          tagline: values.tagline,
          detailedDescription: values.detailedDescription,
          dimensions: values.dimensions,
          mainStoneType: values.mainStoneType === "none_selected" ? "" : values.mainStoneType,
          mainStoneWeight: values.mainStoneWeight,
          secondaryStoneWeight: values.secondaryStoneWeight,
          userDescription: values.userDescription,
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
              AI Generator
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
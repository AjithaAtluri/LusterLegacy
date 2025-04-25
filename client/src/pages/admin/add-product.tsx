import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertCircle, CheckCircle, Loader2, Upload, X, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import AdminLayout from "@/components/admin/admin-layout";
import { Helmet } from "react-helmet";

// AI Generated Content interface (same as in AI content generator)
interface AIGeneratedContent {
  title: string;
  tagline: string;
  shortDescription: string;
  detailedDescription: string;
  priceUSD: number;
  priceINR: number;
  imageInsights?: string;
}

// Define interfaces for form data types
interface ProductType {
  id: number;
  name: string;
  description?: string;
}

interface StoneType {
  id: number;
  name: string;
  priceModifier: number;
  description?: string;
}

// Create product schema for form validation
const productSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  basePrice: z.coerce.number().min(1, "Price must be greater than 0"),
  details: z.string().optional(),
  dimensions: z.string().optional(),
  isNew: z.boolean().default(false),
  isBestseller: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  category: z.string().optional(),
  productTypeId: z.coerce.number().min(1, "Product type is required"),
  selectedStones: z.array(z.number()).optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

// Simple image upload component
interface ImageUploadProps {
  label: string;
  onChange: (file: File) => void;
  onRemove: () => void;
  imagePreview?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ label, onChange, onRemove, imagePreview }) => {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {imagePreview ? (
        <div className="relative border rounded-md overflow-hidden aspect-square">
          <img 
            src={imagePreview} 
            alt={label} 
            className="w-full h-full object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 rounded-full"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div 
          onClick={() => document.getElementById('mainImage')?.click()}
          className="border border-dashed rounded-md aspect-square flex flex-col items-center justify-center gap-2 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
        >
          <Upload className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Click to upload image</p>
          <p className="text-xs text-muted-foreground">JPG, PNG, WEBP up to 5MB</p>
          <Input 
            id="mainImage" 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const file = e.target.files?.[0];
              if (file) onChange(file);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default function AddProductPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  // Load saved AI content from localStorage
  const [savedContent, setSavedContent] = useState<AIGeneratedContent | null>(null);
  
  // State for image management
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState<string[]>([]);
  
  // State for upload tracking
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Load product types and stone types
  const { data: productTypes, isLoading: loadingProductTypes } = useQuery<ProductType[]>({
    queryKey: ['/api/admin/product-types'],
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
  
  const { data: stoneTypes, isLoading: loadingStoneTypes } = useQuery<StoneType[]>({
    queryKey: ['/api/admin/stone-types'],
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
  
  // Initialize react-hook-form
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      basePrice: 0,
      details: "",
      dimensions: "",
      isNew: true,
      isBestseller: false,
      isFeatured: false,
      category: "",
      productTypeId: 0,
      selectedStones: [],
    }
  });
  
  // Load AI generated content from localStorage
  useEffect(() => {
    const savedContentJson = localStorage.getItem('aiGeneratedContent');
    if (savedContentJson) {
      try {
        const parsedContent: AIGeneratedContent = JSON.parse(savedContentJson);
        setSavedContent(parsedContent);
        
        // Pre-fill form with AI generated content
        form.setValue('name', parsedContent.title);
        form.setValue('description', parsedContent.shortDescription);
        form.setValue('details', parsedContent.detailedDescription);
        form.setValue('basePrice', Math.round(parsedContent.priceINR)); // Use INR as base price
        
        // Load the saved image preview
        const savedImagePreview = localStorage.getItem('aiGeneratedImagePreview');
        if (savedImagePreview) {
          setMainImagePreview(savedImagePreview);
        }
        
        // Load the saved image data and convert it back to a File object
        const savedImageData = localStorage.getItem('aiGeneratedImageData');
        if (savedImageData) {
          // Convert base64 back to File
          const fetchResponse = fetch(savedImageData);
          fetchResponse.then(res => {
            return res.blob();
          }).then(blob => {
            const file = new File([blob], "ai-generated-image.jpg", { type: "image/jpeg" });
            setMainImage(file);
          }).catch(error => {
            console.error('Error converting image data to File:', error);
          });
        }
      } catch (error) {
        console.error('Error parsing saved content:', error);
      }
    }
  }, [form]);
  
  // Handle image uploads
  const handleMainImageChange = (file: File) => {
    setMainImage(file);
    const imageUrl = URL.createObjectURL(file);
    setMainImagePreview(imageUrl);
  };
  
  const handleAdditionalImageChange = (file: File) => {
    if (additionalImages.length < 3) {
      setAdditionalImages([...additionalImages, file]);
      const imageUrl = URL.createObjectURL(file);
      setAdditionalImagePreviews([...additionalImagePreviews, imageUrl]);
    } else {
      toast({
        title: "Image Limit Reached",
        description: "Maximum 3 additional images allowed.",
        variant: "destructive",
      });
    }
  };
  
  const removeMainImage = () => {
    setMainImage(null);
    if (mainImagePreview) {
      URL.revokeObjectURL(mainImagePreview);
      setMainImagePreview(null);
    }
  };
  
  const removeAdditionalImage = (index: number) => {
    const newImages = [...additionalImages];
    newImages.splice(index, 1);
    setAdditionalImages(newImages);
    
    const newPreviews = [...additionalImagePreviews];
    if (newPreviews[index]) {
      URL.revokeObjectURL(newPreviews[index]);
    }
    newPreviews.splice(index, 1);
    setAdditionalImagePreviews(newPreviews);
  };
  
  // Mutation for creating a product
  const createProductMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        body: data,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create product");
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Show success toast
      toast({
        title: "Product Created",
        description: "Product has been created successfully.",
      });
      
      // Clear the saved AI content and images from localStorage
      localStorage.removeItem('aiGeneratedContent');
      localStorage.removeItem('aiGeneratedImagePreview');
      localStorage.removeItem('aiGeneratedImageData');
      
      // Invalidate products cache
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      
      // Navigate to products list
      navigate('/admin/products');
    },
    onError: (error) => {
      // Show error toast
      toast({
        title: "Product Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create product.",
        variant: "destructive",
      });
      
      setUploadError(error instanceof Error ? error.message : "Unknown error");
      setIsUploading(false);
    }
  });
  
  // Form submission handler
  const onSubmit = async (values: ProductFormValues) => {
    try {
      setIsUploading(true);
      setUploadError(null);
      
      // Validate required fields
      if (!mainImage) {
        throw new Error("Main product image is required");
      }
      
      // Create form data for file upload
      const formData = new FormData();
      
      // Add all form fields
      Object.entries(values).forEach(([key, value]) => {
        if (key === 'selectedStones') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      });
      
      // Add images
      formData.append('mainImage', mainImage);
      
      additionalImages.forEach((image, index) => {
        formData.append(`additionalImage${index + 1}`, image);
      });
      
      // Create the product
      await createProductMutation.mutateAsync(formData);
    } catch (err) {
      console.error("Error creating product:", err);
      setUploadError(err instanceof Error ? err.message : "An unknown error occurred");
      setIsUploading(false);
      
      toast({
        title: "Product Creation Failed",
        description: err instanceof Error ? err.message : "Failed to create product.",
        variant: "destructive",
      });
    }
  };
  
  // Clear AI content
  const clearAIContent = () => {
    localStorage.removeItem('aiGeneratedContent');
    localStorage.removeItem('aiGeneratedImagePreview');
    localStorage.removeItem('aiGeneratedImageData');
    setSavedContent(null);
    
    // Reset form fields that might have been populated by AI
    form.setValue('name', '');
    form.setValue('description', '');
    form.setValue('details', '');
    
    // Clear the main image
    removeMainImage();
    
    toast({
      title: "AI Content Cleared",
      description: "AI generated content has been cleared.",
    });
  };
  
  // Generate a new AI product
  const navigateToAIGenerator = () => {
    navigate('/admin/ai-generator');
  };
  
  return (
    <AdminLayout title="Add New Product">
      <Helmet>
        <title>Add New Product | Luster Legacy Admin</title>
      </Helmet>
      
      <div className="space-y-6">
        {/* AI Generated Content Card */}
        {savedContent && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle size={20} className="text-primary" />
                  AI Generated Content
                </div>
              </CardTitle>
              <CardDescription>
                The form has been pre-filled with AI generated content. You can edit it as needed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <div className="px-3 py-1 bg-primary/10 rounded-full text-xs">
                  Title: {savedContent.title}
                </div>
                <div className="px-3 py-1 bg-primary/10 rounded-full text-xs">
                  Price USD: ${savedContent.priceUSD.toFixed(2)}
                </div>
                <div className="px-3 py-1 bg-primary/10 rounded-full text-xs">
                  Price INR: ₹{savedContent.priceINR.toFixed(2)}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" onClick={clearAIContent}>
                Clear AI Content
              </Button>
            </CardFooter>
          </Card>
        )}
        
        {/* Main Product Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Product Information
              <Button variant="outline" onClick={navigateToAIGenerator}>
                Generate With AI
              </Button>
            </CardTitle>
            <CardDescription>
              Enter the product details to create a new product listing
            </CardDescription>
            {uploadError && (
              <div className="mt-2 flex items-center gap-2 text-destructive bg-destructive/10 p-2 rounded-md">
                <AlertCircle size={16} />
                <p className="text-sm">{uploadError}</p>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Image Upload Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <ImageUpload
                    label="Main Product Image *"
                    onChange={handleMainImageChange}
                    onRemove={removeMainImage}
                    imagePreview={mainImagePreview || undefined}
                  />
                  
                  <div className="space-y-2">
                    <Label>Additional Images (Optional)</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {additionalImagePreviews.map((preview, index) => (
                        <div key={index} className="relative border rounded-md overflow-hidden aspect-square">
                          <img 
                            src={preview} 
                            alt={`Additional ${index + 1}`} 
                            className="w-full h-full object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6 rounded-full"
                            onClick={() => removeAdditionalImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      
                      {additionalImagePreviews.length < 3 && (
                        <div 
                          className="border border-dashed rounded-md aspect-square flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => document.getElementById('additionalImage')?.click()}
                        >
                          <PlusCircle className="h-6 w-6 opacity-50" />
                          <Input 
                            id="additionalImage" 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              const file = e.target.files?.[0];
                              if (file) handleAdditionalImageChange(file);
                              // Reset the input value to allow selecting the same file again
                              e.target.value = '';
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Product Type */}
                <FormField
                  control={form.control}
                  name="productTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Type *</FormLabel>
                      <Select 
                        disabled={loadingProductTypes}
                        onValueChange={(value: string) => field.onChange(parseInt(value))}
                        value={field.value ? String(field.value) : undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select product type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {loadingProductTypes ? (
                            <SelectItem value="loading" disabled>
                              Loading...
                            </SelectItem>
                          ) : productTypes && productTypes.length > 0 ? (
                            productTypes.map((type) => (
                              <SelectItem key={type.id} value={String(type.id)}>
                                {type.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>
                              No product types available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Price */}
                <FormField
                  control={form.control}
                  name="basePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Price (INR) *</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>
                        The base price in Indian Rupees (₹)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Short Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short Description *</FormLabel>
                      <FormControl>
                        <Textarea {...field} className="min-h-[100px]" />
                      </FormControl>
                      <FormDescription>
                        A brief description that will appear on product cards and search results
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Detailed Description */}
                <FormField
                  control={form.control}
                  name="details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Detailed Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} className="min-h-[150px]" />
                      </FormControl>
                      <FormDescription>
                        A comprehensive description with all product details
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Dimensions */}
                <FormField
                  control={form.control}
                  name="dimensions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dimensions</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        The dimensions of the product (e.g., "25mm x 15mm")
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Category (Legacy) */}
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category (Legacy)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        Optional category for backwards compatibility
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Stone Types (Multi-select) */}
                <div className="space-y-3">
                  <FormLabel>Stone Types</FormLabel>
                  <FormDescription>
                    Select all stone types available for this product
                  </FormDescription>
                  
                  <div className="border rounded-md p-3 max-h-[200px] overflow-y-auto grid grid-cols-2 gap-2">
                    {loadingStoneTypes ? (
                      <div className="col-span-2 flex items-center">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Loading stone types...
                      </div>
                    ) : stoneTypes && stoneTypes.length > 0 ? (
                      stoneTypes.map((stoneType) => (
                        <div key={stoneType.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`stone-type-${stoneType.id}`} 
                            checked={form.watch('selectedStones')?.includes(stoneType.id)}
                            onCheckedChange={(checked) => {
                              const currentValues = form.watch('selectedStones') || [];
                              if (checked) {
                                form.setValue('selectedStones', [...currentValues, stoneType.id]);
                              } else {
                                form.setValue('selectedStones', currentValues.filter(id => id !== stoneType.id));
                              }
                            }}
                          />
                          <label 
                            htmlFor={`stone-type-${stoneType.id}`}
                            className="text-sm cursor-pointer"
                          >
                            {stoneType.name}
                          </label>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2">No stone types available</div>
                    )}
                  </div>
                </div>
                
                {/* Flags */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="isNew"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox 
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1">
                          <FormLabel>New Item</FormLabel>
                          <FormDescription>
                            Mark as a new product
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isBestseller"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox 
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1">
                          <FormLabel>Bestseller</FormLabel>
                          <FormDescription>
                            Mark as a bestselling item
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isFeatured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox 
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1">
                          <FormLabel>Featured</FormLabel>
                          <FormDescription>
                            Show in featured sections
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              onClick={form.handleSubmit(onSubmit)} 
              disabled={isUploading || !mainImage}
              className="gap-2"
            >
              {isUploading && <Loader2 size={16} className="animate-spin" />}
              {isUploading ? "Creating..." : "Create Product"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AdminLayout>
  );
}
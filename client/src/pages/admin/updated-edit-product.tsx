import { useState, useCallback, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Save, Upload, X, AlertTriangle } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import AIContentGenerator from "@/components/admin/ai-content-generator";
import { useToast } from "@/hooks/use-toast";
import type { AIGeneratedContent } from "@/lib/ai-content-generator";
import { useDropzone } from "react-dropzone";
import type { ProductType, StoneType } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface ProductDetails {
  id: number;
  title: string;
  tagline: string;
  category: string;
  basePrice: number;
  basePriceINR: number;
  description: string;
  detailedDescription: string;
  metalType: string;
  metalWeight: number;
  imageUrl: string;
  additionalImages?: string[];
  stoneTypes?: string[];
  mainStoneType?: string;
  mainStoneWeight?: number;
  secondaryStoneWeight?: number;
  isNew: boolean;
  isBestseller: boolean;
  isFeatured: boolean;
  userDescription?: string;
}

interface FormValues {
  title: string;
  tagline: string;
  category: string;
  basePrice: string;
  basePriceINR: string;
  description: string;
  detailedDescription: string;
  metalType: string;
  metalWeight: string;
  userDescription: string;
  isNew: boolean;
  isBestseller: boolean;
  isFeatured: boolean;
}

export default function EditProduct() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute<{ id: string }>("/admin/products/edit/:id");
  const productId = params?.id ? parseInt(params.id) : null;
  const { toast } = useToast();
  const [selectedStoneTypes, setSelectedStoneTypes] = useState<string[]>([]);
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [mainImageChanged, setMainImageChanged] = useState<boolean>(false);
  const [additionalImageFiles, setAdditionalImageFiles] = useState<File[]>([]);
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState<string[]>([]);
  const [additionalImagesChanged, setAdditionalImagesChanged] = useState<boolean>(false);
  const [mainStoneType, setMainStoneType] = useState<string>("");
  const [mainStoneWeight, setMainStoneWeight] = useState<string>("");
  const [secondaryStoneType, setSecondaryStoneType] = useState<string>("none_selected");
  const [secondaryStoneWeight, setSecondaryStoneWeight] = useState<string>("");
  const queryClient = useQueryClient();
  
  // Fetch product types from database
  const { data: productTypes, isLoading: isLoadingProductTypes } = useQuery<ProductType[]>({
    queryKey: ['/api/admin/product-types'],
    refetchOnWindowFocus: false,
  });
  
  // Fetch stone types from database
  const { data: stoneTypes, isLoading: isLoadingStoneTypes } = useQuery<StoneType[]>({
    queryKey: ['/api/admin/stone-types'],
    refetchOnWindowFocus: false,
  });
  
  // Fetch product details
  const { data: productData, isLoading: isLoadingProduct, error: productError } = useQuery<ProductDetails>({
    queryKey: ['/api/admin/products', productId],
    enabled: !!productId,
    refetchOnWindowFocus: false,
  });
  
  // Initialize form with default values
  const form = useForm<FormValues>({
    defaultValues: {
      title: "",
      tagline: "",
      category: "",
      basePrice: "",
      basePriceINR: "",
      description: "",
      detailedDescription: "",
      metalType: "",
      metalWeight: "",
      userDescription: "",
      isNew: false,
      isBestseller: false,
      isFeatured: false,
    },
  });

  // Update form with product data when available
  useEffect(() => {
    if (productData) {
      form.reset({
        title: productData.title,
        tagline: productData.tagline || "",
        category: productData.category || "",
        basePrice: productData.basePrice.toString(),
        basePriceINR: productData.basePriceINR ? productData.basePriceINR.toString() : "",
        description: productData.description,
        detailedDescription: productData.detailedDescription || "",
        metalType: productData.metalType || "",
        metalWeight: productData.metalWeight ? productData.metalWeight.toString() : "",
        userDescription: productData.userDescription || "",
        isNew: productData.isNew || false,
        isBestseller: productData.isBestseller || false,
        isFeatured: productData.isFeatured || false,
      });
      
      // Set stone types
      if (productData.stoneTypes) {
        setSelectedStoneTypes(productData.stoneTypes);
      }
      
      if (productData.mainStoneType) {
        setMainStoneType(productData.mainStoneType);
      }
      
      if (productData.mainStoneWeight) {
        setMainStoneWeight(productData.mainStoneWeight.toString());
      }
      
      if (productData.secondaryStoneWeight) {
        setSecondaryStoneWeight(productData.secondaryStoneWeight.toString());
      }
      
      // Set image previews
      if (productData.imageUrl) {
        setMainImagePreview(productData.imageUrl);
      }
      
      if (productData.additionalImages && productData.additionalImages.length > 0) {
        setAdditionalImagePreviews(productData.additionalImages);
      }
    }
  }, [productData, form]);

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest("PATCH", `/api/admin/products/${productId}`, formData, {
        headers: {
          // Don't set Content-Type, browser will set it with the correct boundary for FormData
        },
        rawResponse: true, // We'll handle the response manually
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update product: ${response.status} ${errorText}`);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Product Updated",
        description: "Your product has been updated successfully.",
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      
      // Redirect back to products list
      setLocation('/admin/products');
    },
    onError: (error: Error) => {
      toast({
        title: "Error Updating Product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (!productId) return;
    
    try {
      // Show loading toast
      toast({
        title: "Updating Product",
        description: "Please wait while your product is being updated...",
      });
      
      // Prepare FormData for submission
      const formData = new FormData();
      
      // Add all form fields
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });
      
      // Add stone types as a JSON string
      formData.append('stoneTypes', JSON.stringify(selectedStoneTypes));
      formData.append('mainStoneType', mainStoneType);
      
      if (mainStoneWeight) {
        formData.append('mainStoneWeight', mainStoneWeight);
      }
      
      if (secondaryStoneWeight) {
        formData.append('secondaryStoneWeight', secondaryStoneWeight);
      }
      
      // Add main image if changed
      if (mainImageFile && mainImageChanged) {
        formData.append('mainImage', mainImageFile);
        formData.append('mainImageChanged', 'true');
      }
      
      // Add additional images if changed
      if (additionalImageFiles.length > 0 && additionalImagesChanged) {
        additionalImageFiles.forEach((file) => {
          formData.append('additionalImages', file);
        });
        formData.append('additionalImagesChanged', 'true');
      }
      
      // Execute the mutation
      await updateProductMutation.mutateAsync(formData);
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  // Handle AI generated content
  const handleContentGenerated = async (content: AIGeneratedContent) => {
    form.setValue("title", content.title);
    form.setValue("tagline", content.tagline);
    form.setValue("description", content.shortDescription);
    form.setValue("detailedDescription", content.detailedDescription);
    form.setValue("basePrice", content.priceUSD.toString());
    form.setValue("basePriceINR", content.priceINR.toString());
    
    // Handle the imageInsights field if available
    if (content.imageInsights) {
      // Store image insights in the database - add a note to the description
      const enhancedDescription = form.getValues("detailedDescription") + 
        "\n\n-- Image Analysis Notes --\n" + content.imageInsights;
      form.setValue("detailedDescription", enhancedDescription);
    }
    
    toast({
      title: "Content Applied",
      description: "The regenerated AI content has been applied to the form",
    });
  };

  // Get values for AI content generator
  const productType = form.watch("category");
  const metalType = form.watch("metalType");
  const metalWeight = form.watch("metalWeight") ? parseFloat(form.watch("metalWeight")) : undefined;
  
  // Main image dropzone
  const onMainImageDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setMainImageFile(file);
      setMainImageChanged(true);
      
      // Create preview for the image
      const objectUrl = URL.createObjectURL(file);
      setMainImagePreview(objectUrl);
      
      toast({
        title: "Main Image Updated",
        description: "The main product image has been updated successfully.",
      });
    }
  }, [toast]);
  
  const { getRootProps: getMainImageRootProps, getInputProps: getMainImageInputProps } = useDropzone({
    onDrop: onMainImageDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
    },
    maxFiles: 1,
  });
  
  // Additional images dropzone
  const onAdditionalImagesDrop = useCallback((acceptedFiles: File[]) => {
    // Limit to 3 additional images total
    const availableSlots = 3 - additionalImageFiles.length;
    const filesToAdd = acceptedFiles.slice(0, availableSlots);
    
    if (filesToAdd.length > 0) {
      setAdditionalImageFiles(prev => [...prev, ...filesToAdd]);
      setAdditionalImagesChanged(true);
      
      // Create previews for the images
      const objectUrls = filesToAdd.map(file => URL.createObjectURL(file));
      setAdditionalImagePreviews(prev => [...prev, ...objectUrls]);
      
      toast({
        title: "Additional Images Updated",
        description: `${filesToAdd.length} additional images have been uploaded successfully.`,
      });
    }
  }, [additionalImageFiles.length, toast]);
  
  const { getRootProps: getAdditionalImagesRootProps, getInputProps: getAdditionalImagesInputProps } = useDropzone({
    onDrop: onAdditionalImagesDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
    },
    disabled: additionalImageFiles.length >= 3,
  });
  
  // Remove additional image
  const removeAdditionalImage = (index: number) => {
    // If it's an existing image from the server, mark as changed
    setAdditionalImagesChanged(true);
    
    // Remove from files if it's a new upload
    if (index < additionalImageFiles.length) {
      setAdditionalImageFiles(prev => prev.filter((_, i) => i !== index));
    }
    
    // Revoke object URL and remove preview
    if (additionalImagePreviews[index]) {
      // Only revoke if it's a blob URL (new upload) not a server URL
      if (additionalImagePreviews[index].startsWith('blob:')) {
        URL.revokeObjectURL(additionalImagePreviews[index]);
      }
    }
    setAdditionalImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // If there's an error loading the product or the product doesn't exist
  if (productError) {
    return (
      <AdminLayout title="Edit Product">
        <div className="container p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => setLocation('/admin/products')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
            <h1 className="text-2xl font-semibold">Edit Product</h1>
          </div>
          
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                Error Loading Product
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Could not load product details. The product may have been deleted or you may not have permission to edit it.</p>
              <Button
                variant="outline"
                onClick={() => setLocation('/admin/products')}
                className="mt-4"
              >
                Return to Products List
              </Button>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  // Show loading state while fetching product data
  if (isLoadingProduct) {
    return (
      <AdminLayout title="Edit Product">
        <div className="container p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => setLocation('/admin/products')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
            <h1 className="text-2xl font-semibold">Edit Product</h1>
          </div>
          
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Edit Product">
      <div className="container p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => setLocation('/admin/products')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
            <h1 className="text-2xl font-semibold">Edit Product</h1>
          </div>
          
          <Button 
            type="submit" 
            onClick={form.handleSubmit(onSubmit)}
            disabled={updateProductMutation.isPending}
          >
            {updateProductMutation.isPending ? (
              <>
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
        
        <Form {...form}>
          <div className="w-full space-y-8">
            {/* Section Heading for Basic Details */}
            <div className="border-b pb-2">
              <h2 className="text-xl font-semibold">Basic Details</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Diamond Solitaire Ring" {...field} />
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
                          <Input placeholder="e.g. Timeless elegance for every occasion" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="basePrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Base Price (USD)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="0.01" placeholder="e.g. 599.99" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="basePriceINR"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Base Price (INR)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="0.01" placeholder="e.g. 45000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="isNew"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>New</FormLabel>
                            <FormDescription>
                              Mark as new product
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="isBestseller"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Bestseller</FormLabel>
                            <FormDescription>
                              Mark as bestseller
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="isFeatured"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Featured</FormLabel>
                            <FormDescription>
                              Show on homepage
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Section Heading for Product Description */}
            <div className="border-b pb-2 pt-6">
              <h2 className="text-xl font-semibold">Product Description</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Product Description</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Short Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Brief description of the product (3-5 lines)"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          This will appear in product listings and cards
                        </FormDescription>
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
                            placeholder="Detailed description with materials, craftsmanship and usage information"
                            className="min-h-[200px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          This will appear on the product detail page
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
            
            {/* Section Heading for AI Content Generator */}
            <div className="border-b pb-2 pt-6">
              <h2 className="text-xl font-semibold">AI Content Generator</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Upload images and fill in details to regenerate product content using AI
              </p>
            </div>
            
            <div className="space-y-6 mb-6">
              {/* Image Upload Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Image Upload */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">1. Main Product Image</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      {...getMainImageRootProps()}
                      className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-primary/5 transition-colors flex flex-col items-center justify-center h-[180px] ${mainImagePreview ? 'border-green-500/50 bg-green-50/20' : 'border-primary/20'}`}
                    >
                      <input {...getMainImageInputProps()} />
                      {mainImagePreview ? (
                        <div className="relative w-full h-full flex items-center justify-center">
                          <img
                            src={mainImagePreview}
                            alt="Product preview"
                            className="max-h-full max-w-full object-contain rounded-md"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-0 right-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMainImageChanged(true);
                              if (mainImagePreview && mainImagePreview.startsWith('blob:')) {
                                URL.revokeObjectURL(mainImagePreview);
                              }
                              setMainImageFile(null);
                              setMainImagePreview(null);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground text-center">
                            Click to upload main product image
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            PNG, JPG or JPEG (max 5MB)
                          </p>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      This will be used as the primary image for AI analysis
                    </p>
                  </CardContent>
                </Card>
                
                {/* Additional Images */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">2. Additional Images</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      {...getAdditionalImagesRootProps()}
                      className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-primary/5 transition-colors h-[100px] flex flex-col items-center justify-center mb-2 ${additionalImagePreviews.length >= 3 ? 'opacity-50' : ''}`}
                    >
                      <input {...getAdditionalImagesInputProps()} />
                      <Upload className="h-6 w-6 mb-1 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Add more images (up to 3)</p>
                    </div>
                    
                    {additionalImagePreviews.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {additionalImagePreviews.map((preview, index) => (
                          <div key={index} className="relative">
                            <img 
                              src={preview} 
                              alt={`Additional image ${index + 1}`} 
                              className="h-20 w-full object-cover rounded-md"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-5 w-5"
                              onClick={() => removeAdditionalImage(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground mt-2 flex items-center justify-between">
                      <span>Additional images for the product gallery</span>
                      <span className={`${additionalImagePreviews.length > 0 ? 'text-green-600' : 'text-amber-600'} font-medium`}>
                        {additionalImagePreviews.length}/3
                      </span>
                    </p>
                  </CardContent>
                </Card>
                
                {/* AI Description */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">3. Description for AI</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="userDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea 
                              placeholder="Provide any additional details for the AI to consider (not shown to customers)"
                              className="min-h-[150px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            For AI content generation only
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>
              
              {/* Product Details for AI */}
              <Card>
                <CardHeader>
                  <CardTitle>Product Details for AI</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    These details will be used to generate AI content
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      {/* 4. Product Type */}
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>4. Product Type</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select product type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {isLoadingProductTypes ? (
                                  <div className="flex items-center justify-center p-2">
                                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                                  </div>
                                ) : productTypes?.length ? (
                                  productTypes.map(type => (
                                    <SelectItem key={type.id} value={type.name}>
                                      {type.name}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <>
                                    <SelectItem value="rings">Rings</SelectItem>
                                    <SelectItem value="necklaces">Necklaces</SelectItem>
                                    <SelectItem value="earrings">Earrings</SelectItem>
                                    <SelectItem value="bracelets">Bracelets</SelectItem>
                                    <SelectItem value="pendants">Pendants</SelectItem>
                                  </>
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* 5. Metal Type */}
                      <FormField
                        control={form.control}
                        name="metalType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>5. Metal Type</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select metal type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="18k Gold">18k Gold</SelectItem>
                                <SelectItem value="14k Gold">14k Gold</SelectItem>
                                <SelectItem value="22k Gold">22k Gold</SelectItem>
                                <SelectItem value="24k Gold">24k Gold</SelectItem>
                                <SelectItem value="Platinum">Platinum</SelectItem>
                                <SelectItem value="Sterling Silver">Sterling Silver</SelectItem>
                                <SelectItem value="Rose Gold 18k">Rose Gold 18k</SelectItem>
                                <SelectItem value="White Gold 18k">White Gold 18k</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* 6. Metal Weight */}
                      <FormField
                        control={form.control}
                        name="metalWeight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>6. Metal Weight (grams)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" step="0.1" placeholder="e.g. 5.2" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="space-y-4">
                      {/* 7. Main Stone Type */}
                      <div className="space-y-2">
                        <FormLabel htmlFor="mainStoneType">7. Main Stone Type</FormLabel>
                        <Select
                          value={mainStoneType}
                          onValueChange={setMainStoneType}
                        >
                          <SelectTrigger id="mainStoneType">
                            <SelectValue placeholder="Select main stone" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">No Main Stone</SelectItem>
                            {isLoadingStoneTypes ? (
                              <div className="flex items-center justify-center p-2">
                                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                              </div>
                            ) : stoneTypes?.length ? (
                              stoneTypes.map(stone => (
                                <SelectItem key={stone.id} value={stone.name}>
                                  {stone.name}
                                </SelectItem>
                              ))
                            ) : (
                              <>
                                <SelectItem value="Diamond">Diamond</SelectItem>
                                <SelectItem value="Ruby">Ruby</SelectItem>
                                <SelectItem value="Sapphire">Sapphire</SelectItem>
                                <SelectItem value="Emerald">Emerald</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* 8. Main Stone Weight */}
                      <div className="space-y-2">
                        <FormLabel htmlFor="mainStoneWeight">8. Main Stone Weight (carats)</FormLabel>
                        <Input
                          id="mainStoneWeight"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="e.g. 1.2"
                          value={mainStoneWeight}
                          onChange={(e) => setMainStoneWeight(e.target.value)}
                          disabled={!mainStoneType}
                        />
                      </div>
                      
                      {/* 10. Secondary Stone Weight */}
                      <div className="space-y-2">
                        <FormLabel htmlFor="secondaryStoneWeight">
                          10. Secondary Stones Total Weight (carats)
                        </FormLabel>
                        <Input
                          id="secondaryStoneWeight"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="e.g. 0.5"
                          value={secondaryStoneWeight}
                          onChange={(e) => setSecondaryStoneWeight(e.target.value)}
                          disabled={selectedStoneTypes.length === 0}
                        />
                        <p className="text-xs text-muted-foreground">
                          Combined total weight of all secondary stones
                        </p>
                      </div>
                    </div>
                    
                    {/* 9. Secondary Stones */}
                    <div className="space-y-2">
                      <FormLabel>9. Secondary Stones</FormLabel>
                      <div className="border rounded-md p-3 h-[220px] overflow-y-auto">
                        <div className="grid grid-cols-1 gap-2">
                          {isLoadingStoneTypes ? (
                            <div className="flex items-center justify-center p-4 h-full">
                              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                            </div>
                          ) : stoneTypes?.length ? (
                            stoneTypes.map(stone => (
                              stone.name !== mainStoneType && (
                                <div key={stone.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`stone-${stone.id}`}
                                    checked={selectedStoneTypes.includes(stone.name)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedStoneTypes(prev => [...prev, stone.name]);
                                      } else {
                                        setSelectedStoneTypes(prev => prev.filter(s => s !== stone.name));
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
                              )
                            ))
                          ) : (
                            ["Diamond", "Ruby", "Sapphire", "Emerald", "Amethyst", "Aquamarine"].map(stone => (
                              stone !== mainStoneType && (
                                <div key={stone} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`stone-${stone}`}
                                    checked={selectedStoneTypes.includes(stone)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedStoneTypes(prev => [...prev, stone]);
                                      } else {
                                        setSelectedStoneTypes(prev => prev.filter(s => s !== stone));
                                      }
                                    }}
                                  />
                                  <label
                                    htmlFor={`stone-${stone}`}
                                    className="text-sm cursor-pointer"
                                  >
                                    {stone}
                                  </label>
                                </div>
                              )
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Image and Content Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Status Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${mainImagePreview ? 'bg-green-500' : 'bg-amber-500'}`}>
                          {mainImagePreview ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="12" y1="8" x2="12" y2="16"></line>
                              <line x1="8" y1="12" x2="16" y2="12"></line>
                            </svg>
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">Main Product Image</h4>
                          <p className="text-sm text-muted-foreground">
                            {mainImagePreview 
                              ? (mainImageChanged ? 'Changed' : 'Unchanged')
                              : 'Not yet uploaded'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${productType ? 'bg-green-500' : 'bg-amber-500'}`}>
                          {productType ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="12" y1="8" x2="12" y2="16"></line>
                              <line x1="8" y1="12" x2="16" y2="12"></line>
                            </svg>
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">Product Type</h4>
                          <p className="text-sm text-muted-foreground">
                            {productType || 'Not selected'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${metalType ? 'bg-green-500' : 'bg-amber-500'}`}>
                          {metalType ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="12" y1="8" x2="12" y2="16"></line>
                              <line x1="8" y1="12" x2="16" y2="12"></line>
                            </svg>
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">Metal Type</h4>
                          <p className="text-sm text-muted-foreground">
                            {metalType ? `${metalType}${metalWeight ? ` (${metalWeight}g)` : ''}` : 'Not selected'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${mainStoneType ? 'bg-green-500' : 'bg-amber-500'}`}>
                          {mainStoneType ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="12" y1="8" x2="12" y2="16"></line>
                              <line x1="8" y1="12" x2="16" y2="12"></line>
                            </svg>
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">Main Stone</h4>
                          <p className="text-sm text-muted-foreground">
                            {mainStoneType ? `${mainStoneType}${mainStoneWeight ? ` (${mainStoneWeight} ct)` : ''}` : 'None selected'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${selectedStoneTypes.length > 0 ? 'bg-green-500' : 'bg-amber-500'}`}>
                          {selectedStoneTypes.length > 0 ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="12" y1="8" x2="12" y2="16"></line>
                              <line x1="8" y1="12" x2="16" y2="12"></line>
                            </svg>
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">Secondary Stones</h4>
                          <p className="text-sm text-muted-foreground">
                            {selectedStoneTypes.length > 0 
                              ? `${selectedStoneTypes.length} stones selected${secondaryStoneWeight ? ` (${secondaryStoneWeight} ct total)` : ''}` 
                              : 'None selected'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${additionalImagePreviews.length > 0 ? 'bg-green-500' : 'bg-amber-500'}`}>
                          {additionalImagePreviews.length > 0 ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="12" y1="8" x2="12" y2="16"></line>
                              <line x1="8" y1="12" x2="16" y2="12"></line>
                            </svg>
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">Additional Images</h4>
                          <p className="text-sm text-muted-foreground">
                            {additionalImagePreviews.length > 0 
                              ? `${additionalImagePreviews.length} images uploaded${additionalImagesChanged ? ' (changed)' : ''}` 
                              : 'No additional images'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* AI Content Generator */}
              <AIContentGenerator
                productType={productType}
                metalType={metalType}
                metalWeight={metalWeight}
                primaryGems={[
                  ...(mainStoneType ? [{
                    name: mainStoneType,
                    carats: mainStoneWeight ? parseFloat(mainStoneWeight) : undefined
                  }] : []),
                  ...selectedStoneTypes.map(stone => ({
                    name: stone,
                    carats: secondaryStoneWeight ? parseFloat(secondaryStoneWeight) / selectedStoneTypes.length : undefined
                  }))
                ]}
                userDescription={form.watch("userDescription")}
                imageUrls={[
                  ...(mainImagePreview ? [mainImagePreview] : []),
                  ...additionalImagePreviews
                ]}
                onContentGenerated={handleContentGenerated}
              />
            </div>
          </div>
        </Form>
      </div>
    </AdminLayout>
  );
}
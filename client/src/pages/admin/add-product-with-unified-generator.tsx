import { useState, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Upload, X } from "lucide-react";
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
import UnifiedAIGenerator from "@/components/admin/unified-ai-generator";
import { useToast } from "@/hooks/use-toast";
import type { AIGeneratedContent } from "@/lib/ai-content-generator";
import { useDropzone } from "react-dropzone";
import type { ProductType, StoneType } from "@shared/schema";

interface FormValues {
  title: string;
  tagline: string;
  category: string; // Legacy field being phased out (use productTypeId instead)
  productTypeId: string; // Main field referencing product_types table
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

export default function AddProduct() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedStoneTypes, setSelectedStoneTypes] = useState<string[]>([]);
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [additionalImageFiles, setAdditionalImageFiles] = useState<File[]>([]);
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState<string[]>([]);
  const [mainStoneType, setMainStoneType] = useState<string>("");
  const [mainStoneWeight, setMainStoneWeight] = useState<string>("");
  const [secondaryStoneWeight, setSecondaryStoneWeight] = useState<string>("");
  
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
  
  // Initialize form with default values
  const form = useForm<FormValues>({
    defaultValues: {
      title: "",
      tagline: "",
      category: "",
      productTypeId: "",
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

  const onSubmit = async (data: FormValues) => {
    try {
      // Show loading toast
      toast({
        title: "Saving Product",
        description: "Please wait while your product is being saved...",
      });
      
      // Convert images to base64 for API submission
      const formData = new FormData();
      
      // Add all form fields
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });
      
      // Add stone types as a JSON string
      formData.append('stoneTypes', JSON.stringify(selectedStoneTypes));
      
      // Add main image if available
      if (mainImageFile) {
        formData.append('mainImage', mainImageFile);
      }
      
      // Add additional images if available
      if (additionalImageFiles.length > 0) {
        additionalImageFiles.forEach((file) => {
          formData.append('additionalImages', file);
        });
      }
      
      // Send the API request
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type, browser will set it with the correct boundary for FormData
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save product: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Show success toast
      toast({
        title: "Product Saved",
        description: "Your product has been saved successfully.",
      });
      
      // Redirect to products list
      setLocation('/admin/products');
    } catch (error) {
      console.error('Error saving product:', error);
      
      // Show error toast
      toast({
        title: "Error Saving Product",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
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
      description: "The AI generated content has been applied to the form",
    });
  };
  
  // Main image dropzone
  const onMainImageDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setMainImageFile(file);
      
      // Create preview for the image
      const objectUrl = URL.createObjectURL(file);
      setMainImagePreview(objectUrl);
      
      toast({
        title: "Main Image Uploaded",
        description: "The main product image has been uploaded successfully and will be used for AI content generation.",
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
    setAdditionalImageFiles(prev => [...prev, ...acceptedFiles]);
    
    // Create previews for the images
    const objectUrls = acceptedFiles.map(file => URL.createObjectURL(file));
    setAdditionalImagePreviews(prev => [...prev, ...objectUrls]);
    
    toast({
      title: "Additional Images Uploaded",
      description: `${acceptedFiles.length} additional images have been uploaded successfully.`,
    });
  }, [toast]);
  
  const { getRootProps: getAdditionalImagesRootProps, getInputProps: getAdditionalImagesInputProps } = useDropzone({
    onDrop: onAdditionalImagesDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
    },
  });
  
  // Remove additional image
  const removeAdditionalImage = (index: number) => {
    setAdditionalImageFiles(prev => prev.filter((_, i) => i !== index));
    
    // Revoke object URL and remove preview
    if (additionalImagePreviews[index]) {
      URL.revokeObjectURL(additionalImagePreviews[index]);
    }
    setAdditionalImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <AdminLayout title="Add Product">
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
            <h1 className="text-2xl font-semibold">Add New Product</h1>
          </div>
          
          <Button type="submit" onClick={form.handleSubmit(onSubmit)}>
            <Save className="h-4 w-4 mr-2" />
            Save Product
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
                  
                  <FormField
                    control={form.control}
                    name="productTypeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
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
                                <SelectItem key={type.id} value={type.id.toString()}>
                                  {type.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-types">No product types found</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select the product type
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Product Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="isNew"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>New Arrival</FormLabel>
                          <FormDescription>
                            Mark this product as a new arrival
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isBestseller"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Bestseller</FormLabel>
                          <FormDescription>
                            Mark this product as a bestseller
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isFeatured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Featured Product</FormLabel>
                          <FormDescription>
                            Show this product in featured sections
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
            
            {/* Pricing Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pricing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="basePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (USD)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="e.g. 199.99" {...field} />
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
                        <FormLabel>Price (INR)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g. 14999" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
            
            {/* Unified AI Generator */}
            <UnifiedAIGenerator
              form={form}
              productTypes={productTypes}
              stoneTypes={stoneTypes}
              isLoadingProductTypes={isLoadingProductTypes}
              isLoadingStoneTypes={isLoadingStoneTypes}
              mainImageFile={mainImageFile}
              setMainImageFile={setMainImageFile}
              mainImagePreview={mainImagePreview}
              setMainImagePreview={setMainImagePreview}
              additionalImageFiles={additionalImageFiles}
              setAdditionalImageFiles={setAdditionalImageFiles}
              additionalImagePreviews={additionalImagePreviews}
              setAdditionalImagePreviews={setAdditionalImagePreviews}
              mainStoneType={mainStoneType}
              setMainStoneType={setMainStoneType}
              mainStoneWeight={mainStoneWeight}
              setMainStoneWeight={setMainStoneWeight}
              selectedStoneTypes={selectedStoneTypes}
              setSelectedStoneTypes={setSelectedStoneTypes}
              secondaryStoneWeight={secondaryStoneWeight}
              setSecondaryStoneWeight={setSecondaryStoneWeight}
              handleContentGenerated={handleContentGenerated}
              getMainImageRootProps={getMainImageRootProps}
              getMainImageInputProps={getMainImageInputProps}
              getAdditionalImagesRootProps={getAdditionalImagesRootProps}
              getAdditionalImagesInputProps={getAdditionalImagesInputProps}
              removeAdditionalImage={removeAdditionalImage}
            />
            
            {/* Section Heading for Product Images */}
            <div className="border-b pb-2 pt-6">
              <h2 className="text-xl font-semibold">Product Images</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Product Images Status</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Manage all product images from this tab
                  </p>
                </CardHeader>
                <CardContent>
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
                          {mainImagePreview ? 'Uploaded in the "AI Content Generator" section' : 'Not yet uploaded'}
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
                            ? `${additionalImagePreviews.length} additional images uploaded` 
                            : 'No additional images uploaded yet'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {mainImagePreview && (
                <Card>
                  <CardHeader>
                    <CardTitle>Main Image Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-square w-full relative overflow-hidden rounded-lg border">
                      <img 
                        src={mainImagePreview}
                        alt="Main product"
                        className="object-cover w-full h-full"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* Additional Images Grid */}
            {additionalImagePreviews.length > 0 && (
              <div>
                <div className="border-b pb-2 pt-2">
                  <h3 className="text-lg font-medium">Additional Images</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  {additionalImagePreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-square">
                      <img
                        src={preview}
                        alt={`Product image ${index + 1}`}
                        className="object-cover w-full h-full rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => removeAdditionalImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Form>
      </div>
    </AdminLayout>
  );
}
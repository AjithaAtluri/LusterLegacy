import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import AdminLayout from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Upload, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import AIContentGenerator from "@/components/admin/ai-content-generator";
// Temporarily disabled until fixed
// import ImprovedAIContentGenerator from "@/components/admin/improved-ai-content-generator";
import { useToast } from "@/hooks/use-toast";
import type { AIGeneratedContent } from "@/lib/ai-content-generator";
import { useDropzone } from "react-dropzone";

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

export default function AddProduct() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedStoneTypes, setSelectedStoneTypes] = useState<string[]>([]);
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [additionalImageFiles, setAdditionalImageFiles] = useState<File[]>([]);
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState<string[]>([]);
  
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

  // Convert file to base64 for API submission
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Extract the base64 part by removing the data URL prefix
          const base64String = reader.result.split(',')[1];
          resolve(base64String);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = error => reject(error);
    });
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

  // Get values for AI content generator
  const productType = form.watch("category");
  const metalType = form.watch("metalType");
  const metalWeight = form.watch("metalWeight") ? parseFloat(form.watch("metalWeight")) : undefined;
  
  // Create gems array for AI content generator
  const primaryGems = selectedStoneTypes.map(stone => ({
    name: stone,
    // We would normally have carats here, but keeping it simple for now
  }));
  
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
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="details">Basic Details</TabsTrigger>
              <TabsTrigger value="description">Description & AI</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details">
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
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="rings">Rings</SelectItem>
                              <SelectItem value="necklaces">Necklaces</SelectItem>
                              <SelectItem value="earrings">Earrings</SelectItem>
                              <SelectItem value="bracelets">Bracelets</SelectItem>
                              <SelectItem value="pendants">Pendants</SelectItem>
                              <SelectItem value="bridal">Bridal</SelectItem>
                              <SelectItem value="customized">Customized</SelectItem>
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
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
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
                    
                    <FormField
                      control={form.control}
                      name="metalWeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Metal Weight (grams)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" placeholder="e.g. 4.5" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div>
                      <FormLabel>Gems & Stones</FormLabel>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {[
                          "Diamond", "Ruby", "Sapphire", "Emerald", "Amethyst", 
                          "Aquamarine", "Tanzanite", "Topaz", "Opal", "Pearl", "Garnet"
                        ].map((stone) => (
                          <div key={stone} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`stone-${stone}`}
                              checked={selectedStoneTypes.includes(stone)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedStoneTypes(prev => [...prev, stone]);
                                } else {
                                  setSelectedStoneTypes(prev => 
                                    prev.filter(s => s !== stone)
                                  );
                                }
                              }}
                            />
                            <label 
                              htmlFor={`stone-${stone}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {stone}
                            </label>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Select the gems used in this product (optional)
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Pricing & Flags</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="basePrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Base Price (USD)</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="e.g. 1299" {...field} />
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
                              <Input type="number" placeholder="e.g. 95999" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="space-y-2 mt-4">
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
                            <FormLabel>Mark as New Arrival</FormLabel>
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
                            <FormLabel>Mark as Bestseller</FormLabel>
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
                            <FormLabel>Feature on Homepage</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="description">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
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
                
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>AI Content Generator Inputs</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Fill in details and upload an image to generate AI content
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="category"
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
                                    <SelectItem value="rings">Rings</SelectItem>
                                    <SelectItem value="necklaces">Necklaces</SelectItem>
                                    <SelectItem value="earrings">Earrings</SelectItem>
                                    <SelectItem value="bracelets">Bracelets</SelectItem>
                                    <SelectItem value="pendants">Pendants</SelectItem>
                                    <SelectItem value="bridal">Bridal</SelectItem>
                                    <SelectItem value="customized">Customized</SelectItem>
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
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
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
                          
                          <FormField
                            control={form.control}
                            name="metalWeight"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Metal Weight (grams)</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.1" placeholder="e.g. 4.5" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="userDescription"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Custom Description (Optional)</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Add any specific details you want to include in the AI generation"
                                    className="min-h-[80px]"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="space-y-4">
                          <FormItem>
                            <FormLabel>Product Image (for AI analysis)</FormLabel>
                            <div
                              {...getMainImageRootProps()}
                              className={`border-2 border-dashed rounded-md p-4 ${
                                mainImagePreview ? "border-green-500" : "border-gray-300"
                              } hover:border-primary cursor-pointer transition-colors flex flex-col items-center justify-center h-[240px]`}
                            >
                              <input {...getMainImageInputProps()} />
                              
                              {mainImagePreview ? (
                                <div className="relative w-full h-full">
                                  <img
                                    src={mainImagePreview}
                                    alt="Main product"
                                    className="w-full h-full object-contain"
                                  />
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-0 right-0"
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      URL.revokeObjectURL(mainImagePreview);
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
                                    Upload product image for AI analysis
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    JPG or PNG, recommended size: 1000x1000px
                                  </p>
                                </>
                              )}
                            </div>
                            <FormDescription>
                              Adding an image will help the AI generate more accurate descriptions
                            </FormDescription>
                          </FormItem>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Standard AI Content Generator */}
                  <AIContentGenerator
                    productType={productType}
                    metalType={metalType}
                    metalWeight={metalWeight}
                    primaryGems={primaryGems}
                    userDescription={form.watch("userDescription")}
                    imageUrls={[
                      ...(mainImagePreview ? [mainImagePreview] : []),
                      ...additionalImagePreviews
                    ]}
                    onContentGenerated={handleContentGenerated}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="images">
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
                            {mainImagePreview ? 'Uploaded in the "Description & AI" tab' : 'Not yet uploaded'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${additionalImageFiles.length > 0 ? 'bg-green-500' : 'bg-amber-500'}`}>
                          {additionalImageFiles.length > 0 ? (
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
                          <h4 className="text-sm font-medium">Additional Product Images</h4>
                          <p className="text-sm text-muted-foreground">
                            {additionalImageFiles.length > 0 
                              ? `${additionalImageFiles.length} images uploaded` 
                              : 'No additional images yet'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Product Images</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      These will be shown in the product detail gallery
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div
                      {...getAdditionalImagesRootProps()}
                      className="border-2 border-dashed rounded-md p-6 border-gray-300 hover:border-primary cursor-pointer transition-colors flex flex-col items-center justify-center h-32 mb-4"
                    >
                      <input {...getAdditionalImagesInputProps()} />
                      <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Drag & drop additional product images here or click to browse
                      </p>
                    </div>
                    
                    {additionalImagePreviews.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-4">
                        {additionalImagePreviews.map((preview, index) => (
                          <div key={index} className="relative">
                            <img
                              src={preview}
                              alt={`Product view ${index + 1}`}
                              className="w-full h-20 object-cover rounded-md"
                            />
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6"
                              onClick={() => removeAdditionalImage(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </Form>
      </div>
    </AdminLayout>
  );
}
import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AdminLayout from "@/components/admin/admin-layout";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, ArrowLeft, Upload, Plus, X, Info } from "lucide-react";
import { useDropzone } from 'react-dropzone';
import { apiRequest } from "@/lib/queryClient";
import AIContentGenerator from "@/components/admin/ai-content-generator";
import { type AIGeneratedContent } from "@/lib/ai-content-generator";

// Define the form schema
const productFormSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters"),
  tagline: z.string().optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  detailedDescription: z.string().optional(),
  basePrice: z.coerce.number().min(10, "Base price must be at least $10"),
  basePriceINR: z.coerce.number().min(800, "Base price INR must be at least ₹800"),
  category: z.string().min(1, "Category is required"),
  metalType: z.string().min(1, "Metal type is required"),
  metalWeight: z.coerce.number().min(0, "Weight cannot be negative"),
  stoneTypeIds: z.array(z.number()).optional(),
  isNew: z.boolean().default(false),
  isBestseller: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function AddProduct() {
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedMainImage, setUploadedMainImage] = useState<File | null>(null);
  const [uploadedAdditionalImages, setUploadedAdditionalImages] = useState<File[]>([]);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState<string[]>([]);
  const [metalTypes, setMetalTypes] = useState<any[]>([]);
  const [stoneTypes, setStoneTypes] = useState<any[]>([]);
  const [selectedStoneTypes, setSelectedStoneTypes] = useState<any[]>([]);
  const [userDescription, setUserDescription] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Initialize form
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      tagline: "",
      description: "",
      detailedDescription: "",
      basePrice: 0,
      basePriceINR: 0,
      category: "",
      metalType: "",
      metalWeight: 0,
      stoneTypeIds: [],
      isNew: false,
      isBestseller: false,
      isFeatured: false,
    },
  });
  
  // Fetch metal types and stone types on component mount
  useState(() => {
    fetchMetalTypes();
    fetchStoneTypes();
  });
  
  // Fetch metal types
  const fetchMetalTypes = async () => {
    try {
      const response = await apiRequest("GET", "/api/admin/metal-types");
      const data = await response.json();
      setMetalTypes(data);
    } catch (error) {
      console.error("Error fetching metal types:", error);
      toast({
        title: "Error",
        description: "Failed to fetch metal types",
        variant: "destructive",
      });
    }
  };
  
  // Fetch stone types
  const fetchStoneTypes = async () => {
    try {
      const response = await apiRequest("GET", "/api/admin/stone-types");
      const data = await response.json();
      setStoneTypes(data);
    } catch (error) {
      console.error("Error fetching stone types:", error);
      toast({
        title: "Error",
        description: "Failed to fetch stone types",
        variant: "destructive",
      });
    }
  };
  
  // Handle main image drop
  const onMainImageDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setUploadedMainImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setMainImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle additional images drop
  const onAdditionalImagesDrop = (acceptedFiles: File[]) => {
    const newFiles = [...uploadedAdditionalImages, ...acceptedFiles].slice(0, 5); // Limit to 5 images
    setUploadedAdditionalImages(newFiles);
    
    // Create previews
    const newPreviews = newFiles.map(file => {
      if (file instanceof File) {
        return URL.createObjectURL(file);
      }
      return "";
    });
    
    setAdditionalImagePreviews(newPreviews);
  };
  
  // Dropzone for main image
  const { getRootProps: getMainImageRootProps, getInputProps: getMainImageInputProps } = useDropzone({
    onDrop: onMainImageDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
  });
  
  // Dropzone for additional images
  const { getRootProps: getAdditionalImagesRootProps, getInputProps: getAdditionalImagesInputProps } = useDropzone({
    onDrop: onAdditionalImagesDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 5,
  });
  
  // Handle stone type selection
  const toggleStoneType = (stoneType: any) => {
    const isSelected = selectedStoneTypes.some(s => s.id === stoneType.id);
    
    if (isSelected) {
      setSelectedStoneTypes(selectedStoneTypes.filter(s => s.id !== stoneType.id));
    } else {
      setSelectedStoneTypes([...selectedStoneTypes, stoneType]);
    }
  };
  
  // Handle form submission
  const onSubmit = async (data: ProductFormValues) => {
    if (!uploadedMainImage) {
      toast({
        title: "Error",
        description: "Please upload a main product image",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create form data for file upload
      const formData = new FormData();
      
      // Add main image
      formData.append('mainImage', uploadedMainImage);
      
      // Add additional images
      uploadedAdditionalImages.forEach(file => {
        formData.append('additionalImages', file);
      });
      
      // Add other form data
      for (const [key, value] of Object.entries(data)) {
        if (key === 'stoneTypeIds') {
          // Handle arrays
          formData.append(key, JSON.stringify(selectedStoneTypes.map(st => st.id)));
        } else {
          formData.append(key, value.toString());
        }
      }
      
      // Submit the form
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create product: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Show success message
      toast({
        title: "Success",
        description: "Product created successfully",
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      
      // Redirect to products page
      setLocation('/admin/products');
      
    } catch (error) {
      console.error('Error creating product:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create product",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle removing an additional image
  const removeAdditionalImage = (index: number) => {
    const newFiles = [...uploadedAdditionalImages];
    newFiles.splice(index, 1);
    setUploadedAdditionalImages(newFiles);
    
    const newPreviews = [...additionalImagePreviews];
    URL.revokeObjectURL(newPreviews[index]); // Clean up
    newPreviews.splice(index, 1);
    setAdditionalImagePreviews(newPreviews);
  };

  // Handle AI content generation
  const handleContentGenerated = (content: AIGeneratedContent) => {
    // Update form with AI generated content
    form.setValue("name", content.title);
    form.setValue("tagline", content.tagline);
    form.setValue("description", content.shortDescription);
    form.setValue("detailedDescription", content.detailedDescription);
    form.setValue("basePrice", content.priceUSD);
    form.setValue("basePriceINR", content.priceINR);
    
    // Show success message
    toast({
      title: "AI Content Applied",
      description: "The product details have been updated with AI-generated content.",
    });
  };
  
  return (
    <AdminLayout title="Add Product">
      <Helmet>
        <title>Add New Product - Admin | Luster Legacy</title>
      </Helmet>
      
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
          
          <Button
            type="button"
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Product
              </>
            )}
          </Button>
        </div>
        
        <Tabs defaultValue="info">
          <TabsList className="mb-6">
            <TabsTrigger value="info">Basic Information</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="ai-content">AI Content Generation</TabsTrigger>
            <TabsTrigger value="materials">Materials & Stones</TabsTrigger>
          </TabsList>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <TabsContent value="info">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Product Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Diamond Eternity Ring" {...field} />
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
                  
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle>Description</CardTitle>
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
              </TabsContent>
              
              <TabsContent value="images">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Main Product Image</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div 
                        {...getMainImageRootProps()}
                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                          mainImagePreview ? 'border-primary/40 bg-primary/5' : 'border-gray-300 hover:border-primary/40 hover:bg-primary/5'
                        }`}
                      >
                        <input {...getMainImageInputProps()} />
                        
                        {mainImagePreview ? (
                          <div className="space-y-4">
                            <img 
                              src={mainImagePreview}
                              alt="Product preview"
                              className="max-h-64 mx-auto rounded-md"
                            />
                            <p className="text-sm text-muted-foreground">
                              Click or drag to replace image
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                            <p className="text-sm font-medium">
                              Upload main product image
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Drag and drop or click to select file<br />
                              JPG, PNG or WebP (max 5MB)
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {!mainImagePreview && (
                        <p className="text-sm text-red-500 mt-2">
                          * Main product image is required
                        </p>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Additional Images (Optional)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div 
                          {...getAdditionalImagesRootProps()}
                          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors border-gray-300 hover:border-primary/40 hover:bg-primary/5"
                        >
                          <input {...getAdditionalImagesInputProps()} />
                          
                          <div className="space-y-2">
                            <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                            <p className="text-sm font-medium">
                              Add additional product images
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Drag and drop or click to select files<br />
                              Up to 5 images (JPG, PNG or WebP)
                            </p>
                          </div>
                        </div>
                        
                        {additionalImagePreviews.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                            {additionalImagePreviews.map((preview, index) => (
                              <div key={index} className="relative group">
                                <img 
                                  src={preview}
                                  alt={`Additional image ${index + 1}`}
                                  className="h-24 w-full object-cover rounded-md"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeAdditionalImage(index)}
                                  className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="ai-content">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>User Input for AI Generation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
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
                                  <SelectItem value="rings">Ring</SelectItem>
                                  <SelectItem value="necklaces">Necklace</SelectItem>
                                  <SelectItem value="earrings">Earrings</SelectItem>
                                  <SelectItem value="bracelets">Bracelet</SelectItem>
                                  <SelectItem value="pendants">Pendant</SelectItem>
                                  <SelectItem value="bridal">Bridal Set</SelectItem>
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
                                  {metalTypes.map(metal => (
                                    <SelectItem key={metal.id} value={metal.name}>
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
                          name="metalWeight"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Metal Weight (grams)</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div>
                          <FormLabel>Stone Types</FormLabel>
                          <div className="mt-2 space-y-2">
                            {stoneTypes.length > 0 ? (
                              <div className="grid grid-cols-2 gap-2">
                                {stoneTypes.map(stone => (
                                  <div 
                                    key={stone.id} 
                                    className={`flex items-center p-2 rounded border cursor-pointer ${
                                      selectedStoneTypes.some(s => s.id === stone.id)
                                        ? 'bg-primary/10 border-primary'
                                        : 'border-gray-200 hover:border-primary/50'
                                    }`}
                                    onClick={() => toggleStoneType(stone)}
                                  >
                                    <Checkbox 
                                      checked={selectedStoneTypes.some(s => s.id === stone.id)}
                                      className="mr-2"
                                      onCheckedChange={() => toggleStoneType(stone)}
                                    />
                                    <span>{stone.name}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                No stone types available
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="pt-4">
                          <FormLabel>Your Description (Optional)</FormLabel>
                          <Textarea
                            placeholder="Add any additional details about the product that might help the AI generate better content..."
                            className="mt-2 min-h-[100px]"
                            value={userDescription}
                            onChange={(e) => setUserDescription(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            This won't be saved as part of the product, it's just to help the AI
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <div className="space-y-6">
                    <AIContentGenerator
                      productType={form.watch("category")}
                      metalType={form.watch("metalType")}
                      metalWeight={form.watch("metalWeight")}
                      primaryGems={selectedStoneTypes.map(st => ({ name: st.name }))}
                      userDescription={userDescription}
                      imageUrls={mainImagePreview ? [mainImagePreview] : []}
                      onContentGenerated={handleContentGenerated}
                    />
                    
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="pt-6">
                        <div className="flex items-start">
                          <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                          <div className="space-y-2 text-sm">
                            <p className="font-medium text-blue-700">
                              How the AI Content Generator works:
                            </p>
                            <ol className="space-y-1 list-decimal list-inside text-blue-700/90">
                              <li>Fill in the product details on the left</li>
                              <li>Upload at least the main product image</li>
                              <li>Click "Generate Content" button</li>
                              <li>Review and edit the AI-generated content</li>
                              <li>Save the product when you're satisfied</li>
                            </ol>
                            <p className="text-blue-700/90">
                              You can always edit the generated content before saving!
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="materials">
                <div className="grid grid-cols-1 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Materials & Specifications</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                  {metalTypes.map(metal => (
                                    <SelectItem key={metal.id} value={metal.name}>
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
                          name="metalWeight"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Metal Weight (grams)</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-4">Stone Selection</h3>
                        
                        {stoneTypes.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {stoneTypes.map(stone => (
                              <div 
                                key={stone.id} 
                                className={`border rounded-md overflow-hidden cursor-pointer transition-colors ${
                                  selectedStoneTypes.some(s => s.id === stone.id)
                                    ? 'ring-2 ring-primary border-transparent'
                                    : 'border-gray-200 hover:border-primary/50'
                                }`}
                                onClick={() => toggleStoneType(stone)}
                              >
                                <div className="p-3 flex items-start space-x-3">
                                  <Checkbox 
                                    checked={selectedStoneTypes.some(s => s.id === stone.id)}
                                    onCheckedChange={() => toggleStoneType(stone)}
                                    className="mt-0.5"
                                  />
                                  <div>
                                    <p className="font-medium">{stone.name}</p>
                                    {stone.description && (
                                      <p className="text-sm text-muted-foreground">{stone.description}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-amber-50 border border-amber-200 p-4 rounded-md">
                            <p className="text-amber-700">
                              No stone types available. Please add stone types in the Stone Types section first.
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </form>
          </Form>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
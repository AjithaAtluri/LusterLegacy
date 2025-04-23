import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Loader2, X, Upload, Gem, FileImage } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

// Define the form schema
const productFormSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  basePrice: z.coerce.number().min(1000, "Base price must be at least ₹1,000"),
  details: z.string().optional(),
  dimensions: z.string().optional(),
  isNew: z.boolean().default(false),
  isBestseller: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  category: z.string().min(1, "Category is required"),
  // We'll handle images and stone types separately
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  initialData?: any;
  productId?: number;
  onSuccess?: () => void;
}

export default function ProductFormEnhanced({ initialData, productId, onSuccess }: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStoneTypes, setSelectedStoneTypes] = useState<number[]>([]);
  const [uploadedMainImage, setUploadedMainImage] = useState<File | null>(null);
  const [uploadedMainImagePreview, setUploadedMainImagePreview] = useState<string | null>(initialData?.imageUrl || null);
  const [uploadedAdditionalImages, setUploadedAdditionalImages] = useState<File[]>([]);
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState<string[]>(initialData?.additionalImages || []);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch metal types and stone types
  const { data: metalTypes, isLoading: isLoadingMetalTypes } = useQuery({
    queryKey: ['/api/admin/metal-types'],
  });
  
  const { data: stoneTypes, isLoading: isLoadingStoneTypes } = useQuery({
    queryKey: ['/api/admin/stone-types'],
  });
  
  // Set selected stone types from initial data
  useEffect(() => {
    if (initialData?.stoneTypes && Array.isArray(initialData.stoneTypes)) {
      setSelectedStoneTypes(initialData.stoneTypes.map((stone: any) => stone.id));
    }
  }, [initialData]);
  
  const defaultValues: Partial<ProductFormValues> = {
    name: "",
    description: "",
    basePrice: 0,
    details: "",
    dimensions: "",
    isNew: false,
    isBestseller: false,
    isFeatured: false,
    category: "",
    ...initialData
  };
  
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues
  });
  
  // Handle main image upload
  const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 5MB",
        variant: "destructive"
      });
      return;
    }
    
    // Check file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive"
      });
      return;
    }
    
    setUploadedMainImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedMainImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  // Handle additional images upload
  const handleAdditionalImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Check if adding these files would exceed max (5)
    if (uploadedAdditionalImages.length + files.length > 5) {
      toast({
        title: "Too many images",
        description: "You can upload maximum 5 additional images",
        variant: "destructive"
      });
      return;
    }
    
    // Process each file
    const newFiles: File[] = [];
    const newPreviews: string[] = [];
    
    Array.from(files).forEach(file => {
      // Check file size
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `Image "${file.name}" must be less than 5MB`,
          variant: "destructive"
        });
        return;
      }
      
      // Check file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: `File "${file.name}" is not an image`,
          variant: "destructive"
        });
        return;
      }
      
      newFiles.push(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target?.result as string);
        
        // Update state if all previews are created
        if (newPreviews.length === newFiles.length) {
          setUploadedAdditionalImages(prev => [...prev, ...newFiles]);
          setAdditionalImagePreviews(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };
  
  // Clear uploaded main image
  const clearMainImage = () => {
    setUploadedMainImage(null);
    setUploadedMainImagePreview(null);
  };
  
  // Remove additional image
  const removeAdditionalImage = (index: number) => {
    if (index < uploadedAdditionalImages.length) {
      // Remove from uploaded files
      setUploadedAdditionalImages(prev => {
        const updated = [...prev];
        updated.splice(index, 1);
        return updated;
      });
      
      // Remove from preview
      setAdditionalImagePreviews(prev => {
        const updated = [...prev];
        updated.splice(index, 1);
        return updated;
      });
    } else {
      // Remove from existing URLs (from initialData)
      const adjustedIndex = index - uploadedAdditionalImages.length;
      setAdditionalImagePreviews(prev => {
        const updated = [...prev];
        updated.splice(index, 1);
        return updated;
      });
    }
  };
  
  // Toggle stone type selection
  const toggleStoneType = (stoneTypeId: number) => {
    setSelectedStoneTypes(prev => {
      if (prev.includes(stoneTypeId)) {
        return prev.filter(id => id !== stoneTypeId);
      } else {
        return [...prev, stoneTypeId];
      }
    });
  };
  
  // Handle form submission
  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      
      // Add form fields
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'boolean') {
            formData.append(key, value ? 'true' : 'false');
          } else {
            formData.append(key, String(value));
          }
        }
      });
      
      // Add stone types
      if (selectedStoneTypes.length > 0) {
        formData.append('stoneTypeIds', JSON.stringify(selectedStoneTypes));
      }
      
      // Add main image if present
      if (uploadedMainImage) {
        formData.append('mainImage', uploadedMainImage);
      }
      
      // Add additional images if present
      uploadedAdditionalImages.forEach((file) => {
        formData.append('additionalImages', file);
      });
      
      // Set flag to replace existing images if needed
      if (uploadedAdditionalImages.length > 0 && initialData?.additionalImages?.length > 0) {
        formData.append('replaceExistingImages', 'true');
      }
      
      if (productId) {
        // Update existing product
        const response = await fetch(`/api/admin/products/${productId}`, {
          method: 'PUT',
          body: formData,
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to update product');
        }
        
        toast({
          title: "Product updated",
          description: "The product has been updated successfully"
        });
      } else {
        // Create new product
        const response = await fetch('/api/admin/products', {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to create product');
        }
        
        toast({
          title: "Product created",
          description: "The product has been created successfully"
        });
        
        // Reset form
        form.reset(defaultValues);
        setSelectedStoneTypes([]);
        clearMainImage();
        setUploadedAdditionalImages([]);
        setAdditionalImagePreviews([]);
      }
      
      // Invalidate products query to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Product form error:", error);
      toast({
        title: "Error",
        description: productId ? "Failed to update product" : "Failed to create product",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const categories = [
    { id: "necklace", name: "Necklace" },
    { id: "earrings", name: "Earrings" },
    { id: "ring", name: "Ring" },
    { id: "bracelet", name: "Bracelet" },
    { id: "pendant", name: "Pendant" },
    { id: "other", name: "Other" },
  ];
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h3 className="font-playfair text-lg font-semibold">Basic Information</h3>
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Royal Elegance Necklace" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Handcrafted polki diamonds set in pure gold with pearl accents." 
                          rows={3} 
                        />
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
                        <FormLabel>Base Price (₹) *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            min={1000}
                            step={1000}
                            placeholder="175000" 
                          />
                        </FormControl>
                        <FormDescription>
                          Starting price in INR
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
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
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
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
            </CardContent>
          </Card>
          
          {/* Stone Types */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-playfair text-lg font-semibold">Available Stone Types</h3>
                  {isLoadingStoneTypes && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
                
                {stoneTypes && stoneTypes.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {stoneTypes.map((stoneType: any) => (
                      <div
                        key={stoneType.id}
                        className={`border rounded-md p-3 cursor-pointer ${
                          selectedStoneTypes.includes(stoneType.id)
                            ? "bg-primary/10 border-primary"
                            : "hover:bg-muted/30"
                        }`}
                        onClick={() => toggleStoneType(stoneType.id)}
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            checked={selectedStoneTypes.includes(stoneType.id)}
                            onCheckedChange={() => toggleStoneType(stoneType.id)}
                          />
                          <div className="flex items-center">
                            <Gem 
                              className="h-4 w-4 mr-1.5"
                              style={{
                                color: stoneType.color || 'var(--color-primary)'
                              }}
                            />
                            <span className="font-medium text-sm">{stoneType.name}</span>
                          </div>
                        </div>
                        {stoneType.priceModifier > 0 && (
                          <div className="mt-1 text-xs text-muted-foreground ml-6">
                            +{stoneType.priceModifier}% price modifier
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border rounded-md bg-muted/10">
                    <Gem className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {isLoadingStoneTypes 
                        ? "Loading stone types..." 
                        : "No stone types available. Please add stone types first."}
                    </p>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedStoneTypes.length > 0 && (
                    <div className="w-full">
                      <FormLabel className="text-xs text-muted-foreground mb-1 block">
                        Selected Stones:
                      </FormLabel>
                      <div className="flex flex-wrap gap-1">
                        {selectedStoneTypes.map(id => {
                          const stone = stoneTypes?.find((s: any) => s.id === id);
                          return stone ? (
                            <Badge 
                              key={id} 
                              variant="outline"
                              className="flex items-center gap-1"
                            >
                              <Gem 
                                className="h-3 w-3"
                                style={{
                                  color: stone.color || 'var(--color-primary)'
                                }}
                              />
                              {stone.name}
                              <X 
                                className="h-3 w-3 ml-1 cursor-pointer" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleStoneType(id);
                                }}
                              />
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Main Image */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h3 className="font-playfair text-lg font-semibold">Main Product Image</h3>
                
                <div className="mt-2">
                  {uploadedMainImagePreview ? (
                    <div className="relative w-full h-56 border rounded-md overflow-hidden">
                      <img 
                        src={uploadedMainImagePreview} 
                        alt="Product preview" 
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={clearMainImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-full h-56 border-2 border-dashed rounded-md">
                      <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground mb-1">
                            Click to upload main product image
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PNG, JPG or JPEG (max. 5MB)
                          </p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleMainImageUpload}
                        />
                      </label>
                    </div>
                  )}
                </div>
                
                <FormDescription>
                  This will be the primary image shown for the product
                </FormDescription>
              </div>
            </CardContent>
          </Card>
          
          {/* Additional Images */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h3 className="font-playfair text-lg font-semibold">Additional Images</h3>
                
                <div className="mt-2">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {additionalImagePreviews.map((preview, index) => (
                      <div key={index} className="relative h-32 border rounded-md overflow-hidden">
                        <img 
                          src={preview} 
                          alt={`Additional image ${index + 1}`} 
                          className="w-full h-full object-cover"
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
                    
                    {additionalImagePreviews.length < 5 && (
                      <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-md">
                        <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                          <div className="flex flex-col items-center justify-center p-2 text-center">
                            <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                            <p className="text-xs text-muted-foreground">
                              Add more images
                            </p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            multiple
                            onChange={handleAdditionalImagesUpload}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                  
                  <FormDescription>
                    You can add up to 5 additional product images
                  </FormDescription>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Details */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h3 className="font-playfair text-lg font-semibold">Product Details</h3>
                
                <FormField
                  control={form.control}
                  name="details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Details (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Exquisitely crafted necklace featuring traditional Polki diamond work. Each diamond is hand-cut and set in 22kt gold." 
                          rows={3} 
                        />
                      </FormControl>
                      <FormDescription>
                        Additional details about the product
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dimensions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dimensions (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Length: 18 inches, Weight: 45 grams approximately" 
                          rows={2} 
                        />
                      </FormControl>
                      <FormDescription>
                        Size, weight, or other measurement details
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Product Flags */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h3 className="font-playfair text-lg font-semibold">Product Flags</h3>
                
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
                        <FormLabel>Mark as New</FormLabel>
                        <FormDescription>
                          Adds a "New" badge to the product in the catalog
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
                        <FormLabel>Mark as Bestseller</FormLabel>
                        <FormDescription>
                          Adds a "Bestseller" badge to the product in the catalog
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
                        <FormLabel>Featured on Homepage</FormLabel>
                        <FormDescription>
                          Shows this product in the featured section on the homepage
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onSuccess?.()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {productId ? "Updating..." : "Creating..."}
              </>
            ) : (
              productId ? "Update Product" : "Create Product"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
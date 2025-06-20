import { useState } from "react";
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
import { Loader2 } from "lucide-react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import type { ProductType } from "@shared/schema";

// Define the form schema
const productFormSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  // basePrice field removed - now using calculated price exclusively
  imageUrl: z.string().url("Please enter a valid image URL"),
  additionalImages: z.array(z.string().url("Please enter a valid image URL")).optional(),
  details: z.string().optional(),
  dimensions: z.string().optional(),
  isNew: z.boolean().default(false),
  isBestseller: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  productTypeId: z.string().min(1, "Product Type is required"),
  category: z.string().optional(), // Legacy field being phased out
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  initialData?: Partial<ProductFormValues>;
  productId?: number;
  onSuccess?: () => void;
}

export default function ProductForm({ initialData, productId, onSuccess }: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [additionalImageUrl, setAdditionalImageUrl] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch product types from database using public endpoint
  const { data: productTypesData, isLoading: isLoadingProductTypes } = useQuery<ProductType[]>({
    queryKey: ['/api/product-types'],
    refetchOnWindowFocus: false,
  });
  
  const defaultValues: Partial<ProductFormValues> = {
    name: "",
    description: "",
    // basePrice removed - now using calculated price exclusively
    imageUrl: "",
    additionalImages: [],
    details: "",
    dimensions: "",
    isNew: false,
    isBestseller: false,
    isFeatured: false,
    productTypeId: "",
    category: "", // Legacy field
    ...initialData
  };
  
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues
  });
  
  const { setValue, watch } = form;
  const additionalImages = watch("additionalImages") || [];
  
  const handleAddImage = () => {
    if (!additionalImageUrl) return;
    
    try {
      // Validate URL
      new URL(additionalImageUrl);
      
      setValue("additionalImages", [...additionalImages, additionalImageUrl]);
      setAdditionalImageUrl("");
    } catch (error) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid image URL",
        variant: "destructive"
      });
    }
  };
  
  const handleRemoveImage = (index: number) => {
    const newImages = [...additionalImages];
    newImages.splice(index, 1);
    setValue("additionalImages", newImages);
  };
  
  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);
    
    try {
      if (productId) {
        // Update existing product
        await apiRequest("PUT", `/api/products/${productId}`, data);
        toast({
          title: "Product updated",
          description: "The product has been updated successfully"
        });
      } else {
        // Create new product
        await apiRequest("POST", "/api/products", data);
        toast({
          title: "Product created",
          description: "The product has been created successfully"
        });
        
        // Reset form
        form.reset(defaultValues);
      }
      
      // Invalidate products query to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      
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
  
  // Fallback product types if API fails to load
  const fallbackProductTypes = [
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
                
                <div className="w-full">
                  {/* Base price field removed - now using calculated price exclusively */}
                  
                  <FormField
                    control={form.control}
                    name="productTypeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Type *</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Also set the legacy category field for backward compatibility
                            form.setValue("category", value);
                          }}
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
                                <Loader2 className="h-4 w-4 animate-spin" />
                              </div>
                            ) : productTypesData?.length ? (
                              productTypesData.map(type => (
                                <SelectItem key={type.id} value={type.id.toString()}>
                                  {type.name}
                                </SelectItem>
                              ))
                            ) : (
                              fallbackProductTypes.map(type => (
                                <SelectItem key={type.id} value={type.id}>
                                  {type.name}
                                </SelectItem>
                              ))
                            )}
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
          
          {/* Images */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h3 className="font-playfair text-lg font-semibold">Product Images</h3>
                
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Main Image URL *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://example.com/image.jpg" />
                      </FormControl>
                      <FormDescription>
                        Enter the URL of the main product image
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-2">
                  <FormLabel>Additional Images (Optional)</FormLabel>
                  <div className="flex space-x-2">
                    <Input 
                      value={additionalImageUrl}
                      onChange={(e) => setAdditionalImageUrl(e.target.value)}
                      placeholder="https://example.com/additional-image.jpg"
                    />
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={handleAddImage}
                    >
                      Add
                    </Button>
                  </div>
                  
                  {additionalImages.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {additionalImages.map((url, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Input value={url} readOnly className="flex-1" />
                          <Button 
                            type="button" 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleRemoveImage(index)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
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
                      <FormLabel>Details</FormLabel>
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
                      <FormLabel>Dimensions</FormLabel>
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
            onClick={() => form.reset()}
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
              <>{productId ? "Update Product" : "Create Product"}</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

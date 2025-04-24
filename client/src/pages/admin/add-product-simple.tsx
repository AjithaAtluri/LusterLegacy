import { useState, useCallback } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { useDropzone } from "react-dropzone";
import type { ProductType, StoneType } from "@shared/schema";

interface FormValues {
  title: string;
  category: string;
  basePrice: string;
  basePriceINR: string;
  description: string;
  metalType: string;
  isNew: boolean;
  isBestseller: boolean;
  isFeatured: boolean;
}

export default function AddProductSimple() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedStoneTypes, setSelectedStoneTypes] = useState<string[]>([]);
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  
  // Initialize form with default values
  const form = useForm<FormValues>({
    defaultValues: {
      title: "",
      category: "",
      basePrice: "",
      basePriceINR: "",
      description: "",
      metalType: "",
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
        description: "The main product image has been uploaded successfully.",
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
            <h1 className="text-2xl font-semibold">Add New Product (Simple)</h1>
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
                                  setSelectedStoneTypes(prev => prev.filter(s => s !== stone));
                                }
                              }}
                            />
                            <label
                              htmlFor={`stone-${stone}`}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {stone}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
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
                
                <Card>
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your product..."
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>
              
              {/* Image Upload Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Product Images</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <FormLabel>Main Product Image</FormLabel>
                    <div
                      {...getMainImageRootProps()}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 mt-2 text-center cursor-pointer hover:border-primary transition-colors"
                    >
                      <input {...getMainImageInputProps()} />
                      {mainImagePreview ? (
                        <div className="relative">
                          <img 
                            src={mainImagePreview} 
                            alt="Product preview" 
                            className="mx-auto h-48 object-contain"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-0 right-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMainImageFile(null);
                              URL.revokeObjectURL(mainImagePreview);
                              setMainImagePreview(null);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="text-gray-500">
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          <p className="mt-2 text-sm font-medium">Drag and drop or click to upload</p>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG or JPEG (max 5MB)</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
        </Form>
      </div>
    </AdminLayout>
  );
}
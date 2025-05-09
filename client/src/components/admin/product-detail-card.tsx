import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Pencil, Save, X, RefreshCcw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { useAdminPriceCalculator } from "@/hooks/use-admin-price-calculator";

interface ProductDetailCardProps {
  product: any;
  onClose: () => void;
}

export function ProductDetailCard({ product, onClose }: ProductDetailCardProps) {
  const { toast } = useToast();
  const [editSection, setEditSection] = useState<string | null>(null);
  
  // Fetch metal types and stone types from API
  const { data: metalTypes = [], isLoading: isMetalTypesLoading } = useQuery({
    queryKey: ['/api/metal-types'],
    queryFn: async () => {
      const response = await fetch('/api/metal-types');
      if (!response.ok) {
        throw new Error('Failed to fetch metal types');
      }
      return response.json();
    }
  });

  const { data: stoneTypes = [], isLoading: isStoneTypesLoading } = useQuery({
    queryKey: ['/api/stone-types'],
    queryFn: async () => {
      const response = await fetch('/api/stone-types');
      if (!response.ok) {
        throw new Error('Failed to fetch stone types');
      }
      return response.json();
    }
  });
  
  // State for image upload
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);
  
  // Handle image change
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("Image file selected:", file.name, "Size:", Math.round(file.size / 1024), "KB");
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        console.log("Image preview created successfully");
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle image upload
  const handleImageUpload = async () => {
    if (!imageFile) {
      toast({
        title: "No image selected",
        description: "Please select an image to upload",
        variant: "destructive"
      });
      return;
    }
    
    console.log("Starting image upload for product ID:", product.id);
    console.log("Image file:", imageFile.name, "Size:", Math.round(imageFile.size / 1024), "KB", "Type:", imageFile.type);
    
    setIsImageUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('mainImage', imageFile);
      console.log("FormData created with image file");
      
      console.log("Sending PATCH request to:", `/api/products/${product.id}/image`);
      const response = await apiRequest('PATCH', `/api/products/${product.id}/image`, formData, {
        isFormData: true
      });
      
      console.log("Server response status:", response.status);
      
      if (!response.ok) {
        throw new Error('Failed to update product image');
      }
      
      const updatedProduct = await response.json();
      console.log("Updated product received:", updatedProduct.id, "New image URL:", updatedProduct.imageUrl);
      
      // Update cache
      console.log("Invalidating cache for product queries");
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: [`/api/products/${product.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/direct-product/${product.id}`] });
      
      toast({
        title: "Image updated",
        description: "Product image has been successfully updated",
      });
      
      // Close dialog
      setEditSection(null);
      setImageFile(null);
      setImagePreview(null);
      console.log("Image upload completed successfully");
    } catch (error) {
      console.error("Error updating image:", error);
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update image",
        variant: "destructive"
      });
    } finally {
      setIsImageUploading(false);
    }
  };
  
  // Extract stone details from product
  const getStoneDetails = () => {
    try {
      const details = product.details ? (typeof product.details === 'string' ? JSON.parse(product.details) : product.details) : {};
      const aiInputs = product.aiInputs || {};
      const additionalData = details?.additionalData || {};
      
      console.log("Getting stone details from:", {
        details: details,
        aiInputs: aiInputs,
        additionalData: additionalData
      });
      
      // Collect possible values from different sources
      const metalType = details.metalType || aiInputs.metalType || additionalData.metalType || "Unknown";
      const metalWeight = details.metalWeight || aiInputs.metalWeight || additionalData.metalWeight || 0;
      const primaryStone = details.primaryStone || aiInputs.primaryStone || additionalData.mainStoneType || details.mainStoneType || aiInputs.mainStoneType || "None";
      const primaryStoneWeight = details.primaryStoneWeight || aiInputs.primaryStoneWeight || additionalData.mainStoneWeight || details.mainStoneWeight || aiInputs.mainStoneWeight || 0;
      const secondaryStone = details.secondaryStone || aiInputs.secondaryStone || additionalData.secondaryStone || additionalData.secondaryStoneType || "None";
      const secondaryStoneWeight = details.secondaryStoneWeight || aiInputs.secondaryStoneWeight || additionalData.secondaryStoneWeight || 0;
      const otherStone = details.otherStone || aiInputs.otherStone || additionalData.otherStone || additionalData.otherStoneType || "None";
      const otherStoneWeight = details.otherStoneWeight || aiInputs.otherStoneWeight || additionalData.otherStoneWeight || 0;
      
      // For the detailed description, look at multiple possible locations to ensure we find it
      const detailedDescription = 
        details.detailedDescription || 
        aiInputs.detailedDescription || 
        additionalData.detailedDescription || 
        details.detailed_description || 
        aiInputs.detailed_description || 
        additionalData.detailed_description || 
        "";
      
      console.log("Extracted detailed description:", detailedDescription);
      
      return {
        metalType,
        metalWeight,
        primaryStone,
        primaryStoneWeight,
        secondaryStone,
        secondaryStoneWeight,
        otherStone,
        otherStoneWeight,
        detailedDescription
      };
    } catch (error) {
      console.error("Error parsing product details:", error);
      return {
        metalType: "Unknown",
        metalWeight: 0,
        primaryStone: "None",
        primaryStoneWeight: 0,
        secondaryStone: "None",
        secondaryStoneWeight: 0,
        otherStone: "None",
        otherStoneWeight: 0,
        detailedDescription: ""
      };
    }
  };
  
  const stoneDetails = getStoneDetails();
  
  // Price calculation hook
  const {
    priceUSD,
    priceINR,
    breakdown,
    isCalculating
  } = useAdminPriceCalculator({
    metalType: stoneDetails.metalType,
    metalWeight: String(stoneDetails.metalWeight),
    mainStoneType: stoneDetails.primaryStone,
    mainStoneWeight: String(stoneDetails.primaryStoneWeight),
    secondaryStoneType: stoneDetails.secondaryStone,
    secondaryStoneWeight: String(stoneDetails.secondaryStoneWeight),
    otherStoneType: stoneDetails.otherStone,
    otherStoneWeight: String(stoneDetails.otherStoneWeight)
  });
  
  // Form for basic info editing
  const basicInfoForm = useForm({
    defaultValues: {
      name: product.name || "",
      description: product.description || "",
      detailedDescription: stoneDetails.detailedDescription || ""
    }
  });
  
  // Form for materials editing
  const materialsForm = useForm({
    defaultValues: {
      metalType: stoneDetails.metalType,
      metalWeight: stoneDetails.metalWeight,
      primaryStone: stoneDetails.primaryStone,
      primaryStoneWeight: stoneDetails.primaryStoneWeight,
      secondaryStone: stoneDetails.secondaryStone,
      secondaryStoneWeight: stoneDetails.secondaryStoneWeight,
      otherStone: stoneDetails.otherStone,
      otherStoneWeight: stoneDetails.otherStoneWeight
    }
  });
  
  // Update product mutation
  const updateMutation = useMutation({
    mutationFn: async (updateData: any) => {
      console.log("Sending PATCH request with data:", updateData);
      const response = await apiRequest('PATCH', `/api/products/${product.id}`, updateData);
      if (!response.ok) {
        throw new Error('Failed to update product');
      }
      return response.json();
    },
    onSuccess: (updatedProduct) => {
      toast({
        title: "Product updated",
        description: "Product information has been successfully updated.",
      });
      setEditSection(null);
      
      // Ensure all product-related queries are invalidated
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: [`/api/products/${product.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/direct-product/${product.id}`] });
      
      // Update the product data in cache directly
      queryClient.setQueryData([`/api/products/${product.id}`], updatedProduct);
      queryClient.setQueryData([`/api/direct-product/${product.id}`], updatedProduct);

      // Force a refetch of the current product
      queryClient.refetchQueries({ queryKey: [`/api/products/${product.id}`] });
      queryClient.refetchQueries({ queryKey: [`/api/direct-product/${product.id}`] });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Handle basic info save
  const handleBasicInfoSave = (data: any) => {
    try {
      // Safely parse the existing details
      let existingDetails = {};
      if (product.details) {
        try {
          existingDetails = typeof product.details === 'string' 
            ? JSON.parse(product.details) 
            : product.details;
        } catch (parseError) {
          console.error("Error parsing existing details:", parseError);
          existingDetails = {};
        }
      }
      
      // Create updated details object with the detailed description
      const detailsUpdate = {
        ...existingDetails,
        detailedDescription: data.detailedDescription
      };
      
      console.log("Saving product with updated details:", detailsUpdate);
      
      updateMutation.mutate({
        name: data.name,
        description: data.description,
        details: JSON.stringify(detailsUpdate)
      });
    } catch (error) {
      console.error("Error in handleBasicInfoSave:", error);
      toast({
        title: "Error preparing data for save",
        description: "There was an error processing the form data. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Handle materials save
  const handleMaterialsSave = (data: any) => {
    try {
      // Safely parse the existing details
      let existingDetails = {};
      if (product.details) {
        try {
          existingDetails = typeof product.details === 'string' 
            ? JSON.parse(product.details) 
            : product.details;
        } catch (parseError) {
          console.error("Error parsing existing details:", parseError);
          existingDetails = {};
        }
      }
      
      // Preserve important details that shouldn't be lost during the update
      const detailedDescription = existingDetails.detailedDescription || '';
      
      // Create updated details object with the materials info
      const detailsUpdate = {
        ...existingDetails,
        detailedDescription, // Explicitly preserve this in case it gets lost
        metalType: data.metalType,
        metalWeight: data.metalWeight,
        primaryStone: data.primaryStone,
        primaryStoneWeight: data.primaryStoneWeight,
        secondaryStone: data.secondaryStone,
        secondaryStoneWeight: data.secondaryStoneWeight,
        otherStone: data.otherStone,
        otherStoneWeight: data.otherStoneWeight
      };
      
      console.log("Saving product with updated materials details:", detailsUpdate);
      
      updateMutation.mutate({
        details: JSON.stringify(detailsUpdate)
      });
    } catch (error) {
      console.error("Error in handleMaterialsSave:", error);
      toast({
        title: "Error preparing data for save",
        description: "There was an error processing the form data. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Price update mutation
  const updatePriceMutation = useMutation({
    mutationFn: async () => {
      try {
        // Safely get the existing product details to preserve them during price update
        let existingDetails = {};
        if (product.details) {
          try {
            existingDetails = typeof product.details === 'string' 
              ? JSON.parse(product.details) 
              : product.details;
          } catch (parseError) {
            console.error("Error parsing existing details during price update:", parseError);
            existingDetails = {};
          }
        }
        
        // Add price information to details
        const updatedDetails = {
          ...existingDetails,
          calculatedPriceUSD: priceUSD,
          calculatedPriceINR: priceINR
        };
        
        console.log("Updating prices with details:", updatedDetails);
        
        const response = await apiRequest('PATCH', `/api/products/${product.id}`, {
          basePrice: priceINR,
          calculatedPriceUSD: priceUSD,
          calculatedPriceINR: priceINR,
          details: JSON.stringify(updatedDetails)
        });
        
        if (!response.ok) {
          throw new Error('Failed to update product price');
        }
        return response.json();
      } catch (error) {
        console.error("Price update error:", error);
        throw error;
      }
    },
    onSuccess: (updatedProduct) => {
      toast({
        title: "Price updated",
        description: "Product price has been updated based on the latest calculations.",
      });
      
      // Invalidate all product-related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: [`/api/products/${product.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/direct-product/${product.id}`] });
      
      // Update the product data in cache directly
      queryClient.setQueryData([`/api/products/${product.id}`], updatedProduct);
      queryClient.setQueryData([`/api/direct-product/${product.id}`], updatedProduct);
      
      // Force a refetch of the current product
      queryClient.refetchQueries({ queryKey: [`/api/products/${product.id}`] });
      queryClient.refetchQueries({ queryKey: [`/api/direct-product/${product.id}`] });
    },
    onError: (error) => {
      toast({
        title: "Price update failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  return (
    <Card className="w-full">
      {/* Product Image */}
      <div className="w-full h-64 overflow-hidden bg-muted relative">
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="w-full h-full object-cover"
        />
        <Button 
          variant="outline" 
          size="sm" 
          className="absolute top-2 right-2 bg-white/80 hover:bg-white"
          onClick={() => setEditSection('image')}
        >
          <Pencil className="h-4 w-4 mr-1" /> Edit Image
        </Button>
      </div>
      
      {/* Basic Info Section */}
      <CardHeader className="relative">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl">{product.name}</CardTitle>
            <CardDescription className="mt-2">{product.description}</CardDescription>
            
            {stoneDetails.detailedDescription && (
              <div className="mt-4 text-sm text-muted-foreground">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-1">Detailed Description:</h4>
                <p className="whitespace-pre-wrap">{stoneDetails.detailedDescription}</p>
              </div>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setEditSection('basicInfo')}
          >
            <Pencil className="h-4 w-4 mr-1" /> Edit
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Materials Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Materials</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setEditSection('materials')}
            >
              <Pencil className="h-4 w-4 mr-1" /> Edit
            </Button>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Metal:</span>
              <span className="font-medium">{stoneDetails.metalType} ({stoneDetails.metalWeight}g)</span>
            </div>
            
            {stoneDetails.primaryStone && stoneDetails.primaryStone !== "None" && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Primary Stone:</span>
                <span className="font-medium">{stoneDetails.primaryStone} ({stoneDetails.primaryStoneWeight} ct)</span>
              </div>
            )}
            
            {stoneDetails.secondaryStone && stoneDetails.secondaryStone !== "None" && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Secondary Stone:</span>
                <span className="font-medium">{stoneDetails.secondaryStone} ({stoneDetails.secondaryStoneWeight} ct)</span>
              </div>
            )}
            
            {stoneDetails.otherStone && stoneDetails.otherStone !== "None" && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Other Stone:</span>
                <span className="font-medium">{stoneDetails.otherStone} ({stoneDetails.otherStoneWeight} ct)</span>
              </div>
            )}
          </div>
        </div>
        
        <Separator className="my-6" />
        
        {/* Price Breakdown Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Price Breakdown</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => updatePriceMutation.mutate()}
              disabled={updatePriceMutation.isPending || isCalculating}
            >
              {updatePriceMutation.isPending ? (
                <>Updating...</>
              ) : (
                <>
                  <RefreshCcw className="h-4 w-4 mr-1" /> Update Price
                </>
              )}
            </Button>
          </div>
          
          {isCalculating ? (
            <div className="text-center py-4">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Calculating price...</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {breakdown && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Metal Cost:</span>
                      <span>₹{breakdown.metalCost?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Primary Stone:</span>
                      <span>₹{breakdown.primaryStoneCost?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Secondary Stone:</span>
                      <span>₹{breakdown.secondaryStoneCost?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Other Stone:</span>
                      <span>₹{breakdown.otherStoneCost?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Overhead & Labor:</span>
                      <span>₹{breakdown.overhead?.toLocaleString() || 0}</span>
                    </div>
                  </>
                )}
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex justify-between items-center font-bold text-lg">
                <span>Total Price:</span>
                <div className="text-right">
                  <div>{formatCurrency(priceUSD)}</div>
                  <div className="text-sm font-normal text-muted-foreground">₹{priceINR.toLocaleString()}</div>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground mt-2">
                Base price in database: ₹{product.basePrice?.toLocaleString() || 'N/A'}
              </div>
            </>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t p-4">
        <Button variant="outline" onClick={onClose}>Close</Button>
        <Button 
          variant="default" 
          onClick={() => {
            // Force refresh of product data
            queryClient.invalidateQueries({ queryKey: [`/api/products/${product.id}`] });
            queryClient.invalidateQueries({ queryKey: [`/api/direct-product/${product.id}`] });
            queryClient.refetchQueries({ queryKey: [`/api/products/${product.id}`] });
            
            toast({
              title: "Refreshed",
              description: "Product data has been refreshed",
            });
          }}
        >
          <RefreshCcw className="h-4 w-4 mr-2" /> Refresh View
        </Button>
      </CardFooter>
      
      {/* Edit Dialogs */}
      
      {/* Basic Info Edit Dialog */}
      <Dialog open={editSection === 'basicInfo'} onOpenChange={(open) => !open && setEditSection(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Basic Information</DialogTitle>
            <DialogDescription>
              Update the product name and description.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...basicInfoForm}>
            <form onSubmit={basicInfoForm.handleSubmit(handleBasicInfoSave)} className="space-y-4">
              <FormField
                control={basicInfoForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={basicInfoForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">
                      Brief description shown in product listings
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={basicInfoForm.control}
                name="detailedDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detailed Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={6} />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">
                      Comprehensive product details shown on the product page
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditSection(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Materials Edit Dialog */}
      <Dialog open={editSection === 'materials'} onOpenChange={(open) => !open && setEditSection(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Materials</DialogTitle>
            <DialogDescription>
              Update the metal and stones used in this product.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...materialsForm}>
            <form onSubmit={materialsForm.handleSubmit(handleMaterialsSave)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={materialsForm.control}
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
                            <SelectValue placeholder="Select a metal type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isMetalTypesLoading ? (
                            <SelectItem value="loading" disabled>Loading...</SelectItem>
                          ) : metalTypes && metalTypes.length > 0 ? (
                            metalTypes.map((metalType: any) => (
                              <SelectItem key={metalType.id} value={metalType.name}>
                                {metalType.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>No metal types available</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={materialsForm.control}
                  name="metalWeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Metal Weight (g)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={materialsForm.control}
                  name="primaryStone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Stone</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a stone type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="None">None</SelectItem>
                          {isStoneTypesLoading ? (
                            <SelectItem value="loading" disabled>Loading...</SelectItem>
                          ) : stoneTypes && stoneTypes.length > 0 ? (
                            stoneTypes.map((stoneType: any) => (
                              <SelectItem key={stoneType.id} value={stoneType.name}>
                                {stoneType.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>No stone types available</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={materialsForm.control}
                  name="primaryStoneWeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Stone Weight (ct)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={materialsForm.control}
                  name="secondaryStone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secondary Stone</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a stone type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="None">None</SelectItem>
                          {isStoneTypesLoading ? (
                            <SelectItem value="loading" disabled>Loading...</SelectItem>
                          ) : stoneTypes && stoneTypes.length > 0 ? (
                            stoneTypes.map((stoneType: any) => (
                              <SelectItem key={stoneType.id} value={stoneType.name}>
                                {stoneType.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>No stone types available</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={materialsForm.control}
                  name="secondaryStoneWeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secondary Stone Weight (ct)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={materialsForm.control}
                  name="otherStone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Other Stone</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a stone type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="None">None</SelectItem>
                          {isStoneTypesLoading ? (
                            <SelectItem value="loading" disabled>Loading...</SelectItem>
                          ) : stoneTypes && stoneTypes.length > 0 ? (
                            stoneTypes.map((stoneType: any) => (
                              <SelectItem key={stoneType.id} value={stoneType.name}>
                                {stoneType.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>No stone types available</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={materialsForm.control}
                  name="otherStoneWeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Other Stone Weight (ct)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditSection(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Image Edit Dialog */}
      <Dialog open={editSection === 'image'} onOpenChange={(open) => !open && setEditSection(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Update Product Image</DialogTitle>
            <DialogDescription>
              Upload a new image for this product.
            </DialogDescription>
          </DialogHeader>
          
          {/* We're not using FormProvider/Form here since this isn't a standard form submission */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium mb-2">Current Image</p>
                <div className="relative w-full aspect-square rounded-md overflow-hidden border border-border">
                  <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className="object-cover w-full h-full"
                  />
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">New Image Preview</p>
                <div className="relative w-full aspect-square rounded-md overflow-hidden border border-border bg-muted">
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-sm text-muted-foreground">No image selected</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="product-image">Select Image</Label>
              <Input 
                id="product-image" 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange}
                className="cursor-pointer mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Recommended size: 1000 x 1000 pixels. Maximum file size: 5MB.
              </p>
            </div>
            
            <div className="flex justify-between mt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setEditSection(null);
                  setImageFile(null);
                  setImagePreview(null);
                }}
              >
                Cancel
              </Button>
              <div className="space-x-2">
                <Button 
                  type="button" 
                  disabled={!imageFile || isImageUploading}
                  onClick={handleImageUpload}
                >
                  {isImageUploading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span> Uploading...
                    </>
                  ) : (
                    'Upload Image'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
import { useState, useEffect, useReducer, useRef } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Pencil, Save, X, RefreshCcw, ChevronUp, ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { useAdminPriceCalculator } from "@/hooks/use-admin-price-calculator";

interface ProductDetailCardProps {
  product: any;
  onClose: () => void;
  isFullPage?: boolean;
}

export function ProductDetailCard({ product, onClose, isFullPage = false }: ProductDetailCardProps) {
  // When not in full page mode (i.e., in a dialog), we'll hide descriptions
  const { toast } = useToast();
  const [editSection, setEditSection] = useState<string | null>(null);
  const [scrollPosition, setScrollPosition] = useState<number>(0);
  const contentRef = useRef<HTMLDivElement | null>(null);
  
  // Add forceUpdate to trigger re-renders when needed (especially for checkbox state changes)
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  
  // Scroll functions
  const scrollUp = () => {
    if (contentRef.current) {
      contentRef.current.scrollBy({ top: -300, behavior: 'smooth' });
      setScrollPosition(contentRef.current.scrollTop - 300);
    }
  };
  
  const scrollDown = () => {
    if (contentRef.current) {
      contentRef.current.scrollBy({ top: 300, behavior: 'smooth' });
      setScrollPosition(contentRef.current.scrollTop + 300);
    }
  };
  
  // Fetch metal types, stone types, and product types from API
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
  
  const { data: productTypes = [], isLoading: isProductTypesLoading } = useQuery({
    queryKey: ['/api/product-types/active'],
    queryFn: async () => {
      const response = await fetch('/api/product-types/active');
      if (!response.ok) {
        throw new Error('Failed to fetch product types');
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
      
      // Force a refresh of the current product
      const refreshPromises = [
        queryClient.refetchQueries({ queryKey: [`/api/products/${product.id}`] }),
        queryClient.refetchQueries({ queryKey: [`/api/direct-product/${product.id}`] }),
      ];
      
      // Wait for cache to be refreshed
      await Promise.all(refreshPromises);
      
      // Update any price calculations if needed
      await updatePriceMutation.mutateAsync();
      
      toast({
        title: "Image updated",
        description: "Product image has been successfully updated and view refreshed",
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
      
      // Process metalWeight - ensure it's a number and use proper priority
      console.log("Admin product detail card - raw metal weight values:", {
        rootLevel: details.metalWeight,
        typeOfRootLevel: typeof details.metalWeight,
        aiLevel: aiInputs.metalWeight,
        typeOfAiLevel: typeof aiInputs.metalWeight,
        additionalDataLevel: additionalData.metalWeight,
        typeOfAdditionalDataLevel: typeof additionalData.metalWeight
      });
      
      let metalWeight = 0;
      // First check root-level metalWeight (highest priority)
      if (details.metalWeight) {
        // Handle case where metalWeight might be a string or a number
        const parsedWeight = typeof details.metalWeight === 'string' 
          ? parseFloat(details.metalWeight) 
          : details.metalWeight;
        console.log("Admin using root-level metal weight:", parsedWeight);
        metalWeight = parsedWeight;
      } 
      // Fall back to other sources if root level is not available or is NaN
      else if (aiInputs.metalWeight) {
        console.log("Admin using AI-level metal weight:", aiInputs.metalWeight);
        metalWeight = aiInputs.metalWeight;
      } 
      else if (additionalData.metalWeight) {
        console.log("Admin using additional data metal weight:", additionalData.metalWeight);
        metalWeight = additionalData.metalWeight;
      }
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
  
  // Use state for stone details so it can be updated
  const [stoneDetails, setStoneDetails] = useState(() => getStoneDetails());
  
  // Flag to prevent automatic state updates during our own mutations
  const [preventAutoStateUpdate, setPreventAutoStateUpdate] = useState(false);
  
  // Keep stone details in sync with product changes
  useEffect(() => {
    if (!preventAutoStateUpdate) {
      console.log("Syncing stone details with product data");
      setStoneDetails(getStoneDetails());
    }
  }, [product.details, preventAutoStateUpdate]);
  
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
    otherStoneWeight: String(stoneDetails.otherStoneWeight),
    // Prevent calculation when editing text-only sections 
    // (basic info, detailed description, or product flags)
    preventCalculation: editSection === 'basic' || 
                        editSection === 'description' || 
                        editSection === 'flags'
  });
  
  // Form for basic info editing
  const basicInfoForm = useForm({
    defaultValues: {
      name: product.name || "",
      description: product.description || "",
      detailedDescription: stoneDetails.detailedDescription || "",
      productTypeId: product.productTypeId ? String(product.productTypeId) : ""
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
    onSuccess: async (updatedProduct) => {
      console.log("Product update successful:", updatedProduct);
      
      // Store whether we need to update prices (if we were editing materials)
      const needsPriceUpdate = editSection === 'materials';
      
      // Reset the prevent auto state update flag after any type of edit
      // This ensures that future updates will work properly
      if (editSection === 'basicInfo' || editSection === 'materials') {
        console.log(`${editSection} update completed. Resetting preventAutoStateUpdate flag...`);
        setPreventAutoStateUpdate(false);
      }
      
      // For product flags (checkboxes), directly update the component state
      if ('isNew' in updatedProduct) {
        product.isNew = updatedProduct.isNew;
      }
      if ('isBestseller' in updatedProduct) {
        product.isBestseller = updatedProduct.isBestseller;
      }
      if ('isFeatured' in updatedProduct) {
        product.isFeatured = updatedProduct.isFeatured;
      }
      
      // Update product details for material updates
      if (editSection === 'materials' && updatedProduct.details) {
        console.log("Materials update detected - applying changes to local state");
        try {
          // Parse the updated details
          const updatedDetails = typeof updatedProduct.details === 'string'
            ? JSON.parse(updatedProduct.details)
            : updatedProduct.details;
            
          // Update the product object directly for immediate UI updates
          product.details = updatedProduct.details;
          
          // Ensure complete replacement of the stoneDetails state with new values
          setStoneDetails({
            metalType: String(updatedDetails.metalType || ''),
            metalWeight: String(updatedDetails.metalWeight || '0'),
            primaryStone: String(updatedDetails.primaryStone || ''),
            primaryStoneWeight: String(updatedDetails.primaryStoneWeight || '0'),
            secondaryStone: String(updatedDetails.secondaryStone || ''),
            secondaryStoneWeight: String(updatedDetails.secondaryStoneWeight || '0'),
            otherStone: String(updatedDetails.otherStone || ''),
            otherStoneWeight: String(updatedDetails.otherStoneWeight || '0'),
            detailedDescription: updatedDetails.detailedDescription || ''
          });
          
          console.log("Material details updated in local state:", updatedDetails);
          
          // Force update to ensure UI reflects changes
          forceUpdate();
        } catch (error) {
          console.error("Error updating material details in local state:", error);
        }
      }
      
      // Force UI update for immediate reflection of changes
      forceUpdate();
      
      // Immediately update cache with new data
      queryClient.setQueryData([`/api/products/${product.id}`], updatedProduct);
      queryClient.setQueryData([`/api/direct-product/${product.id}`], updatedProduct);
      
      // Invalidate all product-related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] });
      queryClient.invalidateQueries({ queryKey: [`/api/products/${product.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/direct-product/${product.id}`] });
      
      // Force a refetch to ensure the UI displays the latest data
      try {
        // Force a hard refresh of the data with fetchQuery instead of refetchQueries
        await Promise.all([
          queryClient.fetchQuery({ queryKey: [`/api/direct-product/${product.id}`] }),
          queryClient.fetchQuery({ queryKey: [`/api/products/${product.id}`] })
        ]);
        
        console.log("Product data refreshed after update:", updatedProduct);
        
        // Update prices after data is refreshed if we were editing materials
        if (needsPriceUpdate) {
          console.log("Updating prices after materials change");
          await updatePriceMutation.mutateAsync();
        }
      } catch (error) {
        console.error("Error refreshing product data after update:", error);
      }
      
      // Now close the edit dialog AFTER all updates are complete
      setEditSection(null);
      
      // Re-render the component by triggering a state update
      setEditSection(prevState => {
        // Just a trick to force re-render
        setTimeout(() => null, 0);
        return null;
      });
      
      toast({
        title: "Product updated",
        description: "Product information has been successfully updated and view refreshed.",
      });
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
      console.log("Saving basic info with name, description, and detailed description...");
      
      // Set the preventAutoStateUpdate flag to true to prevent
      // automatic price recalculations when just updating text fields
      setPreventAutoStateUpdate(true);
      
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
      
      // Set the edit section to basicInfo to help track what we're updating
      setEditSection('basicInfo');
      
      // Update stoneDetails locally for immediate UI update
      setStoneDetails(prevDetails => ({
        ...prevDetails,
        detailedDescription: data.detailedDescription
      }));
      
      // Convert productTypeId to number if it exists, treat "0" as null (no product type)
      const productTypeId = data.productTypeId && data.productTypeId !== "0" ? parseInt(data.productTypeId, 10) : null;
      
      updateMutation.mutate({
        name: data.name,
        description: data.description,
        productTypeId,
        details: JSON.stringify(detailsUpdate)
      });
    } catch (error) {
      // Always reset the flag on error
      setPreventAutoStateUpdate(false);
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
      console.log("Materials save initiated with data:", data);
      
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
      
      // Create updated details object with the materials info - make sure all values are converted to strings
      // This ensures they will be properly saved and retrieved from the database
      const detailsUpdate = {
        ...existingDetails,
        detailedDescription, // Explicitly preserve this in case it gets lost
        metalType: String(data.metalType || ''),
        metalWeight: String(data.metalWeight || '0'),
        primaryStone: String(data.primaryStone || ''),
        primaryStoneWeight: String(data.primaryStoneWeight || '0'),
        secondaryStone: String(data.secondaryStone || ''),
        secondaryStoneWeight: String(data.secondaryStoneWeight || '0'),
        otherStone: String(data.otherStone || ''),
        otherStoneWeight: String(data.otherStoneWeight || '0')
      };
      
      console.log("Saving product with updated materials details:", detailsUpdate);
      
      // Set the material values globally in the state BEFORE making API call
      // This ensures the UI reflects the changes immediately
      product.details = JSON.stringify(detailsUpdate);
      
      // Force a re-render of the current component to reflect the changes
      forceUpdate();
      
      // Ensure the editSection is set to 'materials' before the mutation triggers
      // This guarantees the price update will run after the update succeeds
      setEditSection('materials');
      
      // Prevent auto updates from useEffect during our own mutations
      setPreventAutoStateUpdate(true);
      
      // Immediately update the local stoneDetails state to match the form values
      // This ensures the UI reflects the changes even before the server responds
      setStoneDetails({
        metalType: String(data.metalType || ''),
        metalWeight: String(data.metalWeight || '0'),
        primaryStone: String(data.primaryStone || ''),
        primaryStoneWeight: String(data.primaryStoneWeight || '0'),
        secondaryStone: String(data.secondaryStone || ''),
        secondaryStoneWeight: String(data.secondaryStoneWeight || '0'),
        otherStone: String(data.otherStone || ''),
        otherStoneWeight: String(data.otherStoneWeight || '0'),
        detailedDescription
      });
      
      console.log("Updated local stoneDetails state:", {
        metalType: String(data.metalType || ''),
        metalWeight: String(data.metalWeight || '0'),
        primaryStone: String(data.primaryStone || ''),
        primaryStoneWeight: String(data.primaryStoneWeight || '0')
      });
      
      updateMutation.mutate({
        details: JSON.stringify(detailsUpdate)
      });
    } catch (error) {
      // Always reset the flag on error
      setPreventAutoStateUpdate(false);
      
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
        console.log("Starting price update. Setting preventAutoStateUpdate to true...");
        // Prevent automatic state updates during our own mutation
        setPreventAutoStateUpdate(true);
        
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
        // Always reset the flag on error
        setPreventAutoStateUpdate(false);
        console.error("Price update error:", error);
        throw error;
      }
    },
    onSuccess: async (updatedProduct) => {
      console.log("Price update successful:", updatedProduct);
      
      try {
        // If product.details exists, parse it to extract updated stone details
        if (updatedProduct.details) {
          let updatedDetails = {};
          try {
            updatedDetails = typeof updatedProduct.details === 'string' 
              ? JSON.parse(updatedProduct.details) 
              : updatedProduct.details;
              
            // Immediately update the stoneDetails state with the parsed values
            // This ensures the UI displays the correct updated information
            setStoneDetails(prevDetails => ({
              ...prevDetails,
              metalType: updatedDetails.metalType || prevDetails.metalType,
              metalWeight: updatedDetails.metalWeight || prevDetails.metalWeight,
              primaryStone: updatedDetails.primaryStone || prevDetails.primaryStone,
              primaryStoneWeight: updatedDetails.primaryStoneWeight || prevDetails.primaryStoneWeight,
              secondaryStone: updatedDetails.secondaryStone || prevDetails.secondaryStone,
              secondaryStoneWeight: updatedDetails.secondaryStoneWeight || prevDetails.secondaryStoneWeight,
              otherStone: updatedDetails.otherStone || prevDetails.otherStone,
              otherStoneWeight: updatedDetails.otherStoneWeight || prevDetails.otherStoneWeight,
              detailedDescription: updatedDetails.detailedDescription || prevDetails.detailedDescription
            }));
          } catch (parseError) {
            console.error("Error parsing updated product details:", parseError);
          }
        }
        
        // Now that we've successfully updated, we can reset the flag
        // This will allow normal useEffect updates to work again
        console.log("Price update successful, resetting preventAutoStateUpdate flag to false");
        setPreventAutoStateUpdate(false);
        
      } catch (error) {
        // Make sure we reset the flag even on error in the success handler
        setPreventAutoStateUpdate(false);
        console.error("Error updating local state after price update:", error);
      }
      
      // Immediately update cache with new data
      queryClient.setQueryData([`/api/products/${product.id}`], updatedProduct);
      queryClient.setQueryData([`/api/direct-product/${product.id}`], updatedProduct);
      
      // Invalidate all related product queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] });
      queryClient.invalidateQueries({ queryKey: [`/api/products/${product.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/direct-product/${product.id}`] });
      
      // Force a refetch to ensure the UI displays the latest data with the newest price calculation
      try {
        const [directProductResult, productResult] = await Promise.all([
          queryClient.refetchQueries({ queryKey: [`/api/direct-product/${product.id}`] }),
          queryClient.refetchQueries({ queryKey: [`/api/products/${product.id}`] })
        ]);
        console.log("Product data refreshed after price update:", {
          directProductResult,
          productResult
        });
      } catch (error) {
        console.error("Error refreshing product data after price update:", error);
      }
      
      toast({
        title: "Price updated",
        description: "Product price has been recalculated and saved successfully.",
      });
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
    <Card className={`w-full ${isFullPage ? "shadow-none border-0" : ""}`}>
      {/* Header with Close Button for non-fullpage view */}
      {!isFullPage && (
        <div className="flex justify-end p-3">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}
      
      {/* Product Image - only shown in full page mode */}
      {isFullPage && (
        <div className="w-full h-64 overflow-hidden bg-muted relative">
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover"
          />
          <Button 
            variant="secondary" 
            size="default" 
            className="absolute top-2 right-2 bg-amber-400 hover:bg-amber-500 text-black font-medium shadow-md border border-amber-600"
            onClick={() => setEditSection('image')}
          >
            <Pencil className="h-4 w-4 mr-2" /> Edit Image
          </Button>
        </div>
      )}
      
      {/* Basic Info Section */}
      <CardHeader className="relative">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl">{product.name}</CardTitle>
            
            {/* Product Type Badge - only shown in full page mode */}
            {isFullPage && product.productTypeId && (
              <div className="mt-1 mb-2">
                <Badge variant="outline" className="text-xs">
                  {isProductTypesLoading 
                    ? "Loading..." 
                    : productTypes.find((pt: { id: number, name: string }) => pt.id === product.productTypeId)?.name || "Unknown Type"}
                </Badge>
              </div>
            )}
            
            {isFullPage && (
              <>
                <CardDescription className="mt-2">{product.description}</CardDescription>
                
                {stoneDetails.detailedDescription && (
                  <div className="mt-4 text-sm text-muted-foreground">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-1">Detailed Description:</h4>
                    <p className="whitespace-pre-wrap">{stoneDetails.detailedDescription}</p>
                  </div>
                )}
              </>
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
      
      <CardContent ref={contentRef} className="overflow-y-auto max-h-[80vh]">
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
            {/* Update Price button removed */}
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
                      <div className="text-right">
                        <span>₹{(product.calculatedBreakdown?.metalCost || breakdown.metalCost || 0).toLocaleString()}</span>
                        <div className="text-xs text-muted-foreground">
                          {stoneDetails.metalWeight}g × ₹{Math.round((product.calculatedBreakdown?.metalCost || breakdown.metalCost || 1) / Number(stoneDetails.metalWeight || 1)).toLocaleString()}/g
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Primary Stone:</span>
                      <div className="text-right">
                        <span>₹{(product.calculatedBreakdown?.primaryStoneCost || breakdown.primaryStoneCost || 0) > 0 ? 
                              (product.calculatedBreakdown?.primaryStoneCost || breakdown.primaryStoneCost).toLocaleString() : "0"}</span>
                        {Number(stoneDetails.primaryStoneWeight) > 0 && (product.calculatedBreakdown?.primaryStoneCost || breakdown.primaryStoneCost) > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {stoneDetails.primaryStoneWeight} ct × ₹{Math.round((product.calculatedBreakdown?.primaryStoneCost || breakdown.primaryStoneCost) / Number(stoneDetails.primaryStoneWeight)).toLocaleString()}/ct
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Secondary Stone:</span>
                      <div className="text-right">
                        <span>₹{(product.calculatedBreakdown?.secondaryStoneCost || breakdown.secondaryStoneCost || 0) > 0 ? 
                              (product.calculatedBreakdown?.secondaryStoneCost || breakdown.secondaryStoneCost).toLocaleString() : "0"}</span>
                        {Number(stoneDetails.secondaryStoneWeight) > 0 && (product.calculatedBreakdown?.secondaryStoneCost || breakdown.secondaryStoneCost) > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {stoneDetails.secondaryStoneWeight} ct × ₹{Math.round((product.calculatedBreakdown?.secondaryStoneCost || breakdown.secondaryStoneCost) / Number(stoneDetails.secondaryStoneWeight)).toLocaleString()}/ct
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Other Stone:</span>
                      <div className="text-right">
                        <span>₹{(product.calculatedBreakdown?.otherStoneCost || breakdown.otherStoneCost || 0) > 0 ? 
                              (product.calculatedBreakdown?.otherStoneCost || breakdown.otherStoneCost).toLocaleString() : "0"}</span>
                        {Number(stoneDetails.otherStoneWeight) > 0 && (product.calculatedBreakdown?.otherStoneCost || breakdown.otherStoneCost) > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {stoneDetails.otherStoneWeight} ct × ₹{Math.round((product.calculatedBreakdown?.otherStoneCost || breakdown.otherStoneCost) / Number(stoneDetails.otherStoneWeight)).toLocaleString()}/ct
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Calculate base materials subtotal */}
                    {(() => {
                      // Use server values from product.calculatedBreakdown if available, otherwise use local breakdown
                      const useServerValues = product.calculatedBreakdown && (
                        product.calculatedBreakdown.metalCost > 0 || 
                        product.calculatedBreakdown.primaryStoneCost > 0 || 
                        product.calculatedBreakdown.secondaryStoneCost > 0 || 
                        product.calculatedBreakdown.otherStoneCost > 0
                      );
                      
                      const baseMaterialsCost = useServerValues ?
                        (product.calculatedBreakdown.metalCost || 0) + 
                        (product.calculatedBreakdown.primaryStoneCost || 0) + 
                        (product.calculatedBreakdown.secondaryStoneCost || 0) + 
                        (product.calculatedBreakdown.otherStoneCost || 0) :
                        (breakdown.metalCost || 0) + 
                        (breakdown.primaryStoneCost || 0) + 
                        (breakdown.secondaryStoneCost || 0) + 
                        (breakdown.otherStoneCost || 0);
                      
                      // Calculate 25% overhead
                      const calculatedOverhead = Math.round(baseMaterialsCost * 0.25);
                      // Use server overhead if available
                      const displayedOverhead = useServerValues ? 
                        (product.calculatedBreakdown.overhead || calculatedOverhead) : calculatedOverhead;
                      
                      return (
                        <>
                          <div className="flex justify-between pt-2 border-t border-border">
                            <span className="text-muted-foreground font-medium">Base Materials Subtotal:</span>
                            <span className="font-medium">₹{baseMaterialsCost.toLocaleString()}</span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Overhead & Labor (25%):</span>
                            <span>₹{displayedOverhead.toLocaleString()}</span>
                          </div>
                        </>
                      );
                    })()}
                    
                  </>
                )}
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex justify-between items-center font-bold text-lg">
                <span>Total Price:</span>
                <div className="text-right">
                  {(() => {
                    // Prioritize server-calculated price - it's the source of truth
                    if (product.calculatedPriceUSD && product.calculatedPriceINR) {
                      return (
                        <>
                          <div>{formatCurrency(product.calculatedPriceUSD)}</div>
                          <div className="text-sm font-normal text-muted-foreground">₹{product.calculatedPriceINR.toLocaleString()}</div>
                        </>
                      );
                    }
                    
                    // Fall back to local calculation if server calculation is not available
                    if (priceUSD > 0 && priceINR > 0) {
                      return (
                        <>
                          <div>{formatCurrency(priceUSD)}</div>
                          <div className="text-sm font-normal text-muted-foreground">₹{priceINR.toLocaleString()}</div>
                        </>
                      );
                    }
                    
                    // Last resort fallback - calculate from the breakdown
                    const baseMaterialsCost = 
                      (breakdown.metalCost || 0) + 
                      (breakdown.primaryStoneCost || 0) + 
                      (breakdown.secondaryStoneCost || 0) + 
                      (breakdown.otherStoneCost || 0);
                    
                    // Calculate 25% overhead
                    const calculatedOverhead = Math.round(baseMaterialsCost * 0.25);
                    
                    // Total is base materials + calculated overhead
                    const recalculatedTotalINR = baseMaterialsCost + calculatedOverhead;
                    
                    // Convert to USD using a default exchange rate of 84
                    const exchangeRate = 84;
                    const recalculatedTotalUSD = Math.round(recalculatedTotalINR / exchangeRate);
                    
                    return (
                      <>
                        <div>{formatCurrency(recalculatedTotalUSD)}</div>
                        <div className="text-sm font-normal text-muted-foreground">₹{recalculatedTotalINR.toLocaleString()}</div>
                      </>
                    );
                  })()}
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground mt-2 space-y-1">
                <div>Base price in database: ₹{product.basePrice?.toLocaleString() || 'N/A'}</div>
                {/* Always show server calculation for clarity */}
                {product.calculatedPriceUSD && product.calculatedPriceINR && (
                  <div className="text-green-600">
                    Server calculation: {formatCurrency(product.calculatedPriceUSD)} (₹{product.calculatedPriceINR.toLocaleString()})
                  </div>
                )}
                {/* Only show local calculation if different from server */}
                {priceUSD > 0 && priceINR > 0 && 
                 product.calculatedPriceUSD && product.calculatedPriceINR &&
                 (product.calculatedPriceUSD !== priceUSD || product.calculatedPriceINR !== priceINR) && (
                  <div className="text-amber-600">
                    Local calculation: {formatCurrency(priceUSD)} (₹{priceINR.toLocaleString()})
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        {/* Product Flags Section - only shown in full page mode */}
        {isFullPage && (
          <div className="space-y-4 mt-8">
            <h3 className="text-lg font-medium">Product Flags</h3>
            <div className="space-y-4 bg-muted/50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Checkbox 
                  id="isNew" 
                  checked={product.isNew || false}
                  onCheckedChange={(checked) => {
                    // Update the local product state immediately for the UI
                    product.isNew = checked === true;
                    // Force a re-render
                    forceUpdate();
                    
                    // Then send the update to the server
                    updateMutation.mutate({
                      isNew: checked === true
                    });
                  }}
                />
                <div className="space-y-1">
                  <Label htmlFor="isNew" className="font-medium">Mark as New</Label>
                  <p className="text-sm text-muted-foreground">Adds a "New" badge to the product in the catalog</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Checkbox 
                  id="isBestseller" 
                  checked={product.isBestseller || false}
                  onCheckedChange={(checked) => {
                    // Update the local product state immediately for the UI
                    product.isBestseller = checked === true;
                    // Force a re-render
                    forceUpdate();
                    
                    // Then send the update to the server
                    updateMutation.mutate({
                      isBestseller: checked === true
                    });
                  }}
                />
                <div className="space-y-1">
                  <Label htmlFor="isBestseller" className="font-medium">Mark as Bestseller</Label>
                  <p className="text-sm text-muted-foreground">Adds a "Bestseller" badge to the product in the catalog</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Checkbox 
                  id="isFeatured" 
                  checked={product.isFeatured || false}
                  onCheckedChange={(checked) => {
                    // Update the local product state immediately for the UI
                    product.isFeatured = checked === true;
                    // Force a re-render
                    forceUpdate();
                    
                    // Then send the update to the server
                    updateMutation.mutate({
                      isFeatured: checked === true
                    });
                  }}
                />
                <div className="space-y-1">
                  <Label htmlFor="isFeatured" className="font-medium">Featured on Homepage</Label>
                  <p className="text-sm text-muted-foreground">Shows this product in the featured section on the homepage</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between border-t p-4">
        {!isFullPage && (
          // For dialog mode, show Close button only
          <Button variant="outline" onClick={onClose}>Close</Button>
        )}
      </CardFooter>
      
      {/* Scroll navigation buttons (only in dialog mode, not full page) */}
      {!isFullPage && (
        <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
          <Button 
            variant="secondary" 
            size="icon" 
            onClick={scrollUp}
            className="rounded-full shadow-lg"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button 
            variant="secondary" 
            size="icon" 
            onClick={scrollDown}
            className="rounded-full shadow-lg"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {/* Edit Dialogs */}
      
      {/* Basic Info Edit Dialog */}
      <Dialog 
        open={editSection === 'basicInfo'} 
        onOpenChange={(open) => !open && setEditSection(null)}
      >
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
                name="productTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a product type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isProductTypesLoading ? (
                          <SelectItem value="" disabled>Loading product types...</SelectItem>
                        ) : (
                          <>
                            <SelectItem value="0">None</SelectItem>
                            {productTypes.map((type: { id: number, name: string }) => (
                              <SelectItem key={type.id} value={String(type.id)}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>
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
      <Dialog 
        open={editSection === 'materials'} 
        onOpenChange={(open) => !open && setEditSection(null)}
      >
        <DialogContent 
          className="max-w-xl"
        >
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
      <Dialog 
        open={editSection === 'image'} 
        onOpenChange={(open) => !open && setEditSection(null)}
      >
        <DialogContent 
          className="max-w-xl"
        >
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
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Pencil, Save, X, RefreshCcw } from "lucide-react";
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
  
  // Extract stone details from product
  const getStoneDetails = () => {
    try {
      const details = product.details ? (typeof product.details === 'string' ? JSON.parse(product.details) : product.details) : {};
      const aiInputs = product.aiInputs || {};
      
      return {
        metalType: details.metalType || aiInputs.metalType || "Unknown",
        metalWeight: details.metalWeight || aiInputs.metalWeight || 0,
        primaryStone: details.primaryStone || aiInputs.primaryStone || "None",
        primaryStoneWeight: details.primaryStoneWeight || aiInputs.primaryStoneWeight || 0,
        secondaryStone: details.secondaryStone || aiInputs.secondaryStone || "None",
        secondaryStoneWeight: details.secondaryStoneWeight || aiInputs.secondaryStoneWeight || 0,
        otherStone: details.otherStone || aiInputs.otherStone || "None", 
        otherStoneWeight: details.otherStoneWeight || aiInputs.otherStoneWeight || 0
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
        otherStoneWeight: 0
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
      description: product.description || ""
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
      const response = await apiRequest('PATCH', `/api/products/${product.id}`, updateData);
      if (!response.ok) {
        throw new Error('Failed to update product');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Product updated",
        description: "Product information has been successfully updated.",
      });
      setEditSection(null);
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
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
    updateMutation.mutate({
      name: data.name,
      description: data.description
    });
  };
  
  // Handle materials save
  const handleMaterialsSave = (data: any) => {
    const detailsUpdate = {
      ...product.details ? (typeof product.details === 'string' ? JSON.parse(product.details) : product.details) : {},
      metalType: data.metalType,
      metalWeight: data.metalWeight,
      primaryStone: data.primaryStone,
      primaryStoneWeight: data.primaryStoneWeight,
      secondaryStone: data.secondaryStone,
      secondaryStoneWeight: data.secondaryStoneWeight,
      otherStone: data.otherStone,
      otherStoneWeight: data.otherStoneWeight
    };
    
    updateMutation.mutate({
      details: JSON.stringify(detailsUpdate)
    });
  };
  
  // Price update mutation
  const updatePriceMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('PATCH', `/api/products/${product.id}`, {
        basePrice: priceINR,
        calculatedPriceUSD: priceUSD,
        calculatedPriceINR: priceINR
      });
      if (!response.ok) {
        throw new Error('Failed to update product price');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Price updated",
        description: "Product price has been updated based on the latest calculations.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
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
        <Button variant="default" onClick={() => window.location.href = `/admin/edit-product/${product.id}`}>
          Full Edit
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
                      <Textarea {...field} />
                    </FormControl>
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
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
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
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
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
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
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
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Image</DialogTitle>
            <DialogDescription>
              This feature is not implemented in this simplified version. Please use the Full Edit option to manage images.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSection(null)}>
              Close
            </Button>
            <Button onClick={() => window.location.href = `/admin/edit-product/${product.id}`}>
              Go to Full Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
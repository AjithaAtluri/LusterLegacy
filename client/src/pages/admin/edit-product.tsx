import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/admin-layout";
import ProductFormEnhanced from "@/components/admin/product-form-enhanced";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import AIContentGenerator from "@/components/admin/ai-content-generator";
import type { AIGeneratedContent } from "@/lib/ai-content-generator";

export default function EditProduct() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [product, setProduct] = useState<any>(null);
  
  // Fetch product data
  const { data: productData, isLoading, error } = useQuery({
    queryKey: ['/api/admin/products', params.id],
    enabled: !!params.id
  });
  
  // Set product data once fetched
  useEffect(() => {
    if (productData) {
      setProduct(productData);
    }
  }, [productData]);
  
  // Handle form success
  const handleFormSuccess = () => {
    toast({
      title: "Product Updated",
      description: "The product has been updated successfully."
    });
    setLocation('/admin/products');
  };
  
  // State to track modified AI input values
  const [aiInputs, setAiInputs] = useState({
    productType: '',
    metalType: '',
    metalWeight: undefined as number | undefined,
    userDescription: ''
  });
  
  // Set up event listener for AI field updates
  useEffect(() => {
    // Initialize with product data when it's loaded
    if (product) {
      setAiInputs({
        productType: product.productTypeId || product.category || '',
        metalType: product.metalType || '',
        metalWeight: product.metalWeight ? parseFloat(product.metalWeight) : undefined,
        userDescription: product.userDescription || ''
      });
    }
    
    // Add event listener for AI field updates from the component
    const handleAiFieldUpdate = (event: CustomEvent) => {
      const { field, value } = event.detail;
      
      setAiInputs(prev => ({
        ...prev,
        [field]: value
      }));
      
      console.log(`AI field updated: ${field} = ${value}`);
    };
    
    document.addEventListener('ai-field-update', handleAiFieldUpdate as EventListener);
    
    // Cleanup
    return () => {
      document.removeEventListener('ai-field-update', handleAiFieldUpdate as EventListener);
    };
  }, [product]);

  // Handle AI generated content
  const handleContentGenerated = async (content: AIGeneratedContent) => {
    try {
      setIsRegenerating(true);
      
      // Update product with AI generated content
      const updatedProduct = {
        ...product,
        name: content.title,
        description: content.shortDescription,
        details: content.detailedDescription,
        basePrice: content.priceINR,
        // Also update the product's type and metal type with the values from AI inputs
        productTypeId: aiInputs.productType || product?.productTypeId,
        category: aiInputs.productType || product?.category, // Keep category for backward compatibility
        metalType: aiInputs.metalType || product?.metalType,
        metalWeight: aiInputs.metalWeight !== undefined ? aiInputs.metalWeight : product?.metalWeight,
        userDescription: aiInputs.userDescription || product?.userDescription
      };
      
      // Update the product in state
      setProduct(updatedProduct);
      
      // Show success notification
      toast({
        title: "Content Updated",
        description: "AI generated content has been applied to the product."
      });
    } catch (error) {
      console.error("Error updating with AI content:", error);
      toast({
        title: "Error",
        description: "Failed to update product with AI content.",
        variant: "destructive"
      });
    } finally {
      setIsRegenerating(false);
    }
  };
  
  // Get values for AI content generator - use aiInputs state which is updated by UI interactions
  const getProductType = () => aiInputs.productType || product?.productTypeId || product?.category || "";
  const getMetalType = () => aiInputs.metalType || product?.metalType || "";
  const getMetalWeight = () => aiInputs.metalWeight !== undefined ? aiInputs.metalWeight : product?.metalWeight ? parseFloat(product.metalWeight) : undefined;
  
  // Create gems array for AI content generator
  const getPrimaryGems = () => {
    if (!product?.stoneTypes || !Array.isArray(product.stoneTypes)) {
      return [];
    }
    
    return product.stoneTypes.map((stone: any) => ({
      name: stone.name
    }));
  };
  
  if (isLoading) {
    return (
      <AdminLayout title="Edit Product">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <span className="ml-2">Loading product data...</span>
        </div>
      </AdminLayout>
    );
  }
  
  if (error || !params.id) {
    return (
      <AdminLayout title="Edit Product">
        <div className="text-center py-24">
          <h2 className="text-xl font-semibold mb-2">Error Loading Product</h2>
          <p className="text-muted-foreground mb-6">
            Could not load the product data. Please try again or go back to products.
          </p>
          <Button onClick={() => setLocation('/admin/products')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>
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
        </div>
        
        {product ? (
          <>
            {/* AI Content Generator Section */}
            <Card className="mb-8">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-playfair text-lg font-semibold">AI Content Generator</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={isRegenerating}
                    onClick={() => {
                      if (window.confirm("This will regenerate the product content. Are you sure you want to continue?")) {
                        document.getElementById('ai-content-form')?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
                    Regenerate Content
                  </Button>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">
                  Use our AI to automatically generate product titles, descriptions, and pricing 
                  based on the product's details and uploaded images.
                </p>
                
                <div id="ai-content-form">
                  <AIContentGenerator
                    productType={getProductType()}
                    metalType={getMetalType()}
                    metalWeight={getMetalWeight()}
                    primaryGems={getPrimaryGems()}
                    userDescription={aiInputs.userDescription || product?.userDescription || ""}
                    imageUrls={product?.imageUrl ? [product.imageUrl] : []}
                    onContentGenerated={handleContentGenerated}
                  />
                </div>
              </CardContent>
            </Card>
            
            <ProductFormEnhanced 
              initialData={product} 
              productId={parseInt(params.id)}
              onSuccess={handleFormSuccess}
            />
          </>
        ) : (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
            <p>Loading product data...</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { ProductDetailCard } from "@/components/admin/product-detail-card";
import AdminLayout from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ProductForm from "@/components/admin/product-form";

export default function ProductDetailPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  
  // Fetch the product data - set refetchInterval to ensure regular updates
  const { data: product, isLoading, error } = useQuery({
    queryKey: [`/api/products/${id}`],
    refetchInterval: 2000, // Refresh every 2 seconds to capture updates from popups
    staleTime: 1000, // Consider data stale after 1 second
  });
  
  // Force refresh of product data when component mounts or remounts
  useEffect(() => {
    // Fetch fresh data when the component mounts
    const refreshData = async () => {
      await queryClient.invalidateQueries({ queryKey: [`/api/products/${id}`] });
      await queryClient.fetchQuery({ queryKey: [`/api/products/${id}`] });
    };
    
    refreshData();
  }, [id, queryClient]);
  
  const handleBack = () => {
    // Invalidate products query to refresh data when going back
    queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    setLocation("/admin/products");
  };
  
  const handleFormClose = () => {
    setIsEditing(false);
    
    // Refresh product data after edit - using fetchQuery for guaranteed fresh data
    const refreshData = async () => {
      await queryClient.invalidateQueries({ queryKey: [`/api/products/${id}`] });
      await queryClient.fetchQuery({ queryKey: [`/api/products/${id}`] });
    };
    
    refreshData();
  };

  if (isLoading) {
    return (
      <AdminLayout title="Product Details">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !product) {
    return (
      <AdminLayout title="Product Details">
        <div className="space-y-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
          </Button>
          <div className="p-8 text-center">
            <h2 className="text-xl font-bold mb-2">Product Not Found</h2>
            <p className="text-muted-foreground">
              The product you are looking for could not be found.
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`Product: ${product.name}`}>
      <Helmet>
        <title>{product.name} | Luster Legacy Admin</title>
      </Helmet>
      
      <div className="space-y-6">
        <div className="flex justify-start items-center">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
          </Button>
        </div>
        
        <ProductDetailCard 
          product={product} 
          onClose={handleBack} 
          isFullPage={true}
        />
        
        {/* Edit Product Dialog */}
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle className="font-playfair text-xl">Edit Product</DialogTitle>
              <DialogDescription>
                Make changes to the selected product.
              </DialogDescription>
            </DialogHeader>
            
            <ProductForm 
              initialData={product} 
              productId={parseInt(id as string)} 
              onSuccess={handleFormClose} 
            />
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
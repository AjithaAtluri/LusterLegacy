import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { ProductDetailCard } from "@/components/admin/product-detail-card";
import AdminLayout from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function ProductDetailPage() {
  const { productId } = useParams();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  // Fetch the product data
  const { data: product, isLoading, error } = useQuery({
    queryKey: [`/api/products/${productId}`],
  });
  
  const handleBack = () => {
    // Invalidate products query to refresh data when going back
    queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    setLocation("/admin/products");
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
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
          </Button>
        </div>
        
        <ProductDetailCard 
          product={product} 
          onClose={handleBack} 
          isFullPage={true}
        />
      </div>
    </AdminLayout>
  );
}
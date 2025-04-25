import { useState } from "react";
import { Helmet } from "react-helmet";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/admin-layout";
import ProductForm from "@/components/admin/product-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Search, Pencil, Trash2, FileImage } from "lucide-react";

export default function AdminProducts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Get URL search params
  const params = new URLSearchParams(window.location.search);
  const action = params.get('action');
  
  // If action=new, redirect to AI generator page
  useState(() => {
    if (action === 'new') {
      setLocation("/admin/ai-generator");
    }
  });
  
  // Fetch products
  const { data: products, isLoading } = useQuery({
    queryKey: ['/api/admin/products'],
  });
  
  // Filter products by search query
  const filteredProducts = products?.filter(product => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    );
  });
  
  // Handle create product
  const handleCreateProduct = () => {
    // Navigate directly to the AI generator page
    setLocation("/admin/ai-generator");
  };
  
  // Handle edit product
  const handleEditProduct = (product: any) => {
    // Navigate to the edit product page
    setLocation(`/admin/edit-product/${product.id}`);
  };
  
  // Handle delete product
  const handleDeleteClick = (product: any) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!selectedProduct) return;
    
    setIsDeleting(true);
    
    try {
      await apiRequest("DELETE", `/api/admin/products/${selectedProduct.id}`, {});
      
      toast({
        title: "Product deleted",
        description: "The product has been deleted successfully",
      });
      
      // Invalidate products query to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      
      // Close dialog
      setIsDeleteDialogOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Delete failed",
        description: "Failed to delete product",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Handle form close
  const handleFormClose = () => {
    setIsCreating(false);
    setIsEditing(false);
    setSelectedProduct(null);
    
    // Remove action=new from URL
    if (action === 'new') {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };
  
  return (
    <AdminLayout title="Products">
      <Helmet>
        <title>Manage Products | Luster Legacy Admin</title>
      </Helmet>
      
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6">
        <div>
          <h1 className="font-playfair text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your product catalog
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button onClick={handleCreateProduct}>
            <Plus className="mr-2 h-4 w-4" /> Add New Product
          </Button>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search products..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : filteredProducts && filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <Card key={product.id} className="overflow-hidden">
              <div className="aspect-video w-full overflow-hidden bg-muted">
                {product.imageUrl ? (
                  <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <FileImage className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-playfair font-medium">{product.name}</h3>
                  <span className="font-medium text-sm">
                    {formatCurrency(product.basePrice)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {product.description}
                </p>
                <div className="flex flex-wrap gap-1 mb-3">
                  <Badge variant="outline">{product.category}</Badge>
                  {product.isNew && <Badge className="bg-blue-500 text-white">New</Badge>}
                  {product.isBestseller && <Badge className="bg-green-500 text-white">Bestseller</Badge>}
                  {product.isFeatured && <Badge className="bg-primary text-white">Featured</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => handleEditProduct(product)} 
                    size="sm" 
                    className="flex-1"
                  >
                    <Pencil className="mr-1 h-4 w-4" /> Edit
                  </Button>
                  <Button 
                    onClick={() => handleDeleteClick(product)} 
                    size="sm" 
                    variant="destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 border rounded-lg bg-muted/10">
          <FileImage className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
          <h3 className="font-playfair text-lg font-medium mb-1">No products found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery 
              ? "No products match your search criteria. Try a different search term." 
              : "Start by adding your first product to the catalog."}
          </p>
          {!searchQuery && (
            <Button onClick={handleCreateProduct}>
              <Plus className="mr-2 h-4 w-4" /> Add New Product
            </Button>
          )}
        </div>
      )}
      
      {/* Create Product Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle className="font-playfair text-xl">Add New Product</DialogTitle>
            <DialogDescription>
              Create a new product to add to your catalog.
            </DialogDescription>
          </DialogHeader>
          
          <ProductForm onSuccess={handleFormClose} />
        </DialogContent>
      </Dialog>
      
      {/* Edit Product Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle className="font-playfair text-xl">Edit Product</DialogTitle>
            <DialogDescription>
              Make changes to the selected product.
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <ProductForm 
              initialData={selectedProduct} 
              productId={selectedProduct.id} 
              onSuccess={handleFormClose} 
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-playfair text-xl">Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="flex items-center space-x-4 py-4">
              {selectedProduct.imageUrl && (
                <div className="h-16 w-16 rounded overflow-hidden bg-muted flex-shrink-0">
                  <img 
                    src={selectedProduct.imageUrl} 
                    alt={selectedProduct.name} 
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div>
                <h3 className="font-medium">{selectedProduct.name}</h3>
                <p className="text-sm text-muted-foreground">{formatCurrency(selectedProduct.basePrice)}</p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Product"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

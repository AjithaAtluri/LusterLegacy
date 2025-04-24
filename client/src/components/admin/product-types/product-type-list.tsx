import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ProductTypeForm } from "./product-type-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type ProductType = {
  id: number;
  name: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  icon: string | null;
  color: string | null;
  createdAt: string | null;
};

export function ProductTypeList() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProductType, setEditingProductType] = useState<ProductType | null>(null);
  const [deletingProductTypeId, setDeletingProductTypeId] = useState<number | null>(null);
  
  const { data: productTypes, isLoading } = useQuery({
    queryKey: ["/api/product-types"],
    queryFn: async ({ signal }) => {
      const res = await apiRequest("GET", "/api/product-types", undefined, { signal });
      if (!res.ok) throw new Error("Failed to fetch product types");
      return res.json() as Promise<ProductType[]>;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/product-types/${id}`);
      if (!res.ok) throw new Error("Failed to delete product type");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-types"] });
      toast({
        title: "Product type deleted",
        description: "The product type has been successfully deleted.",
      });
      setDeletingProductTypeId(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete product type: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await apiRequest("PUT", `/api/product-types/${id}`, { isActive });
      if (!res.ok) throw new Error("Failed to update product type");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-types"] });
      toast({
        title: "Status updated",
        description: "The product type status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update status: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const handleToggleActive = (id: number, currentStatus: boolean) => {
    toggleActiveMutation.mutate({ id, isActive: !currentStatus });
  };

  const handleEditClick = (productType: ProductType) => {
    setEditingProductType(productType);
  };

  const handleAddSuccess = () => {
    setIsAddDialogOpen(false);
  };

  const handleEditSuccess = () => {
    setEditingProductType(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Product Types</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Product Type
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Product Type</DialogTitle>
              <DialogDescription>
                Create a new product type for jewelry categorization.
              </DialogDescription>
            </DialogHeader>
            <ProductTypeForm onSuccess={handleAddSuccess} onCancel={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      {editingProductType && (
        <Dialog open={!!editingProductType} onOpenChange={(open) => !open && setEditingProductType(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Product Type</DialogTitle>
              <DialogDescription>
                Update the details for this product type.
              </DialogDescription>
            </DialogHeader>
            <ProductTypeForm 
              productType={editingProductType}
              onSuccess={handleEditSuccess} 
              onCancel={() => setEditingProductType(null)} 
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingProductTypeId} onOpenChange={(open) => !open && setDeletingProductTypeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product type.
              Products using this type may need to be reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletingProductTypeId && handleDelete(deletingProductTypeId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Product Types Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">Order</TableHead>
              <TableHead className="w-[180px]">Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-20 text-center">Status</TableHead>
              <TableHead className="w-24 text-center">Color</TableHead>
              <TableHead className="w-20 text-center">Icon</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productTypes && productTypes.length > 0 ? (
              productTypes.map((type) => (
                <TableRow key={type.id}>
                  <TableCell className="text-center">{type.displayOrder}</TableCell>
                  <TableCell className="font-medium">{type.name}</TableCell>
                  <TableCell className="max-w-[300px] truncate">{type.description}</TableCell>
                  <TableCell className="text-center">
                    <button
                      onClick={() => handleToggleActive(type.id, type.isActive)}
                      className="inline-flex items-center justify-center"
                      title={type.isActive ? "Click to deactivate" : "Click to activate"}
                    >
                      {type.isActive ? (
                        <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                          <Check className="h-3 w-3 mr-1" /> Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                          <X className="h-3 w-3 mr-1" /> Inactive
                        </Badge>
                      )}
                    </button>
                  </TableCell>
                  <TableCell>
                    {type.color ? (
                      <div className="flex items-center justify-center">
                        <div 
                          className="w-6 h-6 rounded-full border" 
                          style={{ backgroundColor: type.color }}
                          title={type.color}
                        />
                      </div>
                    ) : (
                      <span className="text-center block text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {type.icon ? type.icon : <span className="text-gray-400">-</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditClick(type)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => setDeletingProductTypeId(type.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                  No product types found. Add your first product type to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
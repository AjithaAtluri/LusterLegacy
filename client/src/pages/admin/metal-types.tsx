import { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/admin-layout";
import MetalTypeForm from "@/components/admin/metal-type-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Search, Pencil, Trash2, Diamond } from "lucide-react";

export default function AdminMetalTypes() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMetalType, setSelectedMetalType] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Fetch metal types
  const { data: metalTypes, isLoading } = useQuery({
    queryKey: ['/api/admin/metal-types'],
  });
  
  // Filter metal types by search query
  const filteredMetalTypes = metalTypes?.filter(metalType => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      metalType.name.toLowerCase().includes(query) ||
      (metalType.description && metalType.description.toLowerCase().includes(query))
    );
  });
  
  // Handle create metal type
  const handleCreateMetalType = () => {
    setIsCreating(true);
  };
  
  // Handle edit metal type
  const handleEditMetalType = (metalType: any) => {
    setSelectedMetalType(metalType);
    setIsEditing(true);
  };
  
  // Handle delete metal type
  const handleDeleteClick = (metalType: any) => {
    setSelectedMetalType(metalType);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!selectedMetalType) return;
    
    setIsDeleting(true);
    
    try {
      await apiRequest("DELETE", `/api/admin/metal-types/${selectedMetalType.id}`, {});
      
      toast({
        title: "Metal type deleted",
        description: "The metal type has been deleted successfully",
      });
      
      // Invalidate metal types query to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/metal-types'] });
      
      // Close dialog
      setIsDeleteDialogOpen(false);
      setSelectedMetalType(null);
    } catch (error) {
      console.error("Error deleting metal type:", error);
      toast({
        title: "Delete failed",
        description: "Failed to delete metal type",
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
    setSelectedMetalType(null);
  };
  
  return (
    <AdminLayout title="Metal Types">
      <Helmet>
        <title>Manage Metal Types | Luster Legacy Admin</title>
      </Helmet>
      
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6">
        <div>
          <h1 className="font-playfair text-2xl font-bold tracking-tight">Metal Types</h1>
          <p className="text-muted-foreground">
            Manage metal options for your jewelry pieces
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button onClick={handleCreateMetalType}>
            <Plus className="mr-2 h-4 w-4" /> Add New Metal Type
          </Button>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search metal types..."
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
      ) : filteredMetalTypes && filteredMetalTypes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMetalTypes.map(metalType => (
            <Card key={metalType.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center">
                    <Diamond className="h-5 w-5 mr-2 text-primary" />
                    <h3 className="font-playfair font-medium">{metalType.name}</h3>
                  </div>
                  <span className="text-sm font-medium">
                    +{metalType.priceModifier}%
                  </span>
                </div>
                
                {metalType.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {metalType.description}
                  </p>
                )}
                
                <div className="flex items-center gap-2 mt-3">
                  <Button 
                    onClick={() => handleEditMetalType(metalType)} 
                    size="sm" 
                    className="flex-1"
                  >
                    <Pencil className="mr-1 h-4 w-4" /> Edit
                  </Button>
                  <Button 
                    onClick={() => handleDeleteClick(metalType)} 
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
          <Diamond className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
          <h3 className="font-playfair text-lg font-medium mb-1">No metal types found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery 
              ? "No metal types match your search criteria. Try a different search term." 
              : "Start by adding your first metal type to the catalog."}
          </p>
          {!searchQuery && (
            <Button onClick={handleCreateMetalType}>
              <Plus className="mr-2 h-4 w-4" /> Add New Metal Type
            </Button>
          )}
        </div>
      )}
      
      {/* Create Metal Type Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-playfair text-xl">Add New Metal Type</DialogTitle>
            <DialogDescription>
              Create a new metal type option for jewelry pieces.
            </DialogDescription>
          </DialogHeader>
          
          <MetalTypeForm onSuccess={handleFormClose} />
        </DialogContent>
      </Dialog>
      
      {/* Edit Metal Type Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-playfair text-xl">Edit Metal Type</DialogTitle>
            <DialogDescription>
              Make changes to the selected metal type.
            </DialogDescription>
          </DialogHeader>
          
          {selectedMetalType && (
            <MetalTypeForm 
              initialData={selectedMetalType} 
              metalTypeId={selectedMetalType.id} 
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
              Are you sure you want to delete this metal type? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedMetalType && (
            <div className="flex items-center space-x-4 py-4">
              <Diamond className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-medium">{selectedMetalType.name}</h3>
                <p className="text-sm text-muted-foreground">Price Modifier: +{selectedMetalType.priceModifier}%</p>
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
                "Delete Metal Type"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
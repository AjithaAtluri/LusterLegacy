import React, { useState } from 'react';
import AdminLayout from '@/components/admin/admin-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, Eye, Plus, Save, X, Upload, Image, Tag } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { apiRequest } from '@/lib/queryClient';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import ReliableProductImage from '@/components/ui/reliable-product-image';

// Define types for inspiration gallery items
type InspirationGalleryItem = {
  id: number;
  imageUrl: string;
  title: string | null;
  description: string | null;
  category: string | null;
  tags: string[] | null;
  sortOrder?: number | null;
};

// Form validation schema
const inspirationFormSchema = z.object({
  imageUrl: z.string().min(1, "Image URL is required"),
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  sortOrder: z.number().nullable().optional(),
});

type InspirationFormValues = z.infer<typeof inspirationFormSchema>;

export default function ManageInspiration() {
  const [selectedItem, setSelectedItem] = useState<InspirationGalleryItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all inspiration gallery items
  const { data: inspirationItems = [], isLoading, isError } = useQuery({
    queryKey: ['/api/inspiration-gallery'],
    queryFn: async () => {
      const response = await fetch('/api/inspiration-gallery');
      if (!response.ok) {
        throw new Error('Failed to fetch inspiration gallery items');
      }
      return response.json();
    },
  });

  // Add new inspiration gallery item
  const addMutation = useMutation({
    mutationFn: async (newItem: Omit<InspirationGalleryItem, 'id'>) => {
      const response = await apiRequest('POST', '/api/inspiration-gallery', newItem);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Inspiration gallery item added successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/inspiration-gallery'] });
      setIsAddModalOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to add inspiration gallery item: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Update existing inspiration gallery item
  const updateMutation = useMutation({
    mutationFn: async (updatedItem: InspirationGalleryItem) => {
      const response = await apiRequest(
        'PATCH',
        `/api/inspiration-gallery/${updatedItem.id}`,
        updatedItem
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Inspiration gallery item updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/inspiration-gallery'] });
      setIsEditModalOpen(false);
      setSelectedItem(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to update inspiration gallery item: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Delete inspiration gallery item
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/inspiration-gallery/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Inspiration gallery item deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/inspiration-gallery'] });
      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to delete inspiration gallery item: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Upload image mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: 'Image uploaded successfully',
      });
      // Use the uploaded image URL in the add form
      if (addForm.getValues()) {
        addForm.setValue('imageUrl', data.imageUrl);
      }
      setIsUploadDialogOpen(false);
      setUploadFile(null);
      setUploadPreview('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to upload image: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Form for adding a new inspiration gallery item
  const addForm = useForm<InspirationFormValues>({
    resolver: zodResolver(inspirationFormSchema),
    defaultValues: {
      imageUrl: '',
      title: '',
      description: '',
      category: '',
      tags: [],
      sortOrder: null,
    },
  });

  // Form for editing an existing inspiration gallery item
  const editForm = useForm<InspirationFormValues>({
    resolver: zodResolver(inspirationFormSchema),
    defaultValues: {
      imageUrl: '',
      title: '',
      description: '',
      category: '',
      tags: [],
      sortOrder: null,
    },
  });

  // Handle opening the edit modal
  const handleEditClick = (item: InspirationGalleryItem) => {
    setSelectedItem(item);
    editForm.reset({
      imageUrl: item.imageUrl,
      title: item.title || '',
      description: item.description || '',
      category: item.category || '',
      tags: item.tags || [],
      sortOrder: item.sortOrder || null,
    });
    setIsEditModalOpen(true);
  };

  // Handle opening the delete dialog
  const handleDeleteClick = (item: InspirationGalleryItem) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  // Handle file input change for image upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadFile(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submission for adding a new item
  const onAddSubmit = (values: InspirationFormValues) => {
    addMutation.mutate({
      imageUrl: values.imageUrl,
      title: values.title || null,
      description: values.description || null,
      category: values.category || null,
      tags: values.tags || null,
      sortOrder: values.sortOrder || null,
    });
  };

  // Handle form submission for editing an existing item
  const onEditSubmit = (values: InspirationFormValues) => {
    if (!selectedItem) return;
    
    updateMutation.mutate({
      id: selectedItem.id,
      imageUrl: values.imageUrl,
      title: values.title || null,
      description: values.description || null,
      category: values.category || null,
      tags: values.tags || null,
      sortOrder: values.sortOrder || null,
    });
  };

  // Handle submitting the upload form
  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      toast({
        title: 'Error',
        description: 'Please select a file to upload',
        variant: 'destructive',
      });
      return;
    }
    
    uploadMutation.mutate(uploadFile);
  };

  return (
    <AdminLayout title="Manage Inspiration Gallery">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Inspiration Gallery</h2>
            <p className="text-muted-foreground">
              Manage inspiration images that appear in the gallery and throughout the site.
            </p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Inspiration
          </Button>
        </div>

        <Separator />

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : isError ? (
          <div className="bg-destructive/10 p-4 rounded-md text-center">
            <p className="text-destructive">Error loading inspiration gallery items</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inspirationItems.map((item: InspirationGalleryItem) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="relative aspect-square">
                  <ReliableProductImage 
                    productId={0}
                    imageUrl={item.imageUrl} 
                    alt={item.title || "Inspiration image"} 
                    className="w-full h-full object-cover"
                    allowDownload={true}
                  />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{item.title || "Untitled Inspiration"}</CardTitle>
                  {item.category && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Tag className="mr-1 h-3 w-3" />
                      {item.category}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="pb-2">
                  {item.description && <p className="text-sm">{item.description}</p>}
                </CardContent>
                <CardFooter className="flex justify-end gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleEditClick(item)}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleDeleteClick(item)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add New Inspiration Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Inspiration</DialogTitle>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-6">
              <div className="flex gap-4 items-start">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsUploadDialogOpen(true)}
                  className="flex-shrink-0 h-20"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image
                </Button>
                <FormField
                  control={addForm.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Image URL *</FormLabel>
                      <FormControl>
                        <Input placeholder="/uploads/image-filename.jpg" {...field} />
                      </FormControl>
                      <FormDescription>
                        The image URL starting with /uploads/
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={addForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Beautiful Diamond Ring" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={addForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="A stunning diamond ring with intricate details..." 
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <FormField
                  control={addForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="Rings" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addForm.control}
                  name="sortOrder"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Sort Order</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field}
                          value={field.value === null ? '' : field.value}
                          onChange={(e) => field.onChange(e.target.value === '' ? null : parseInt(e.target.value, 10))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={addMutation.isPending}>
                  {addMutation.isPending && (
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                  )}
                  Save
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Inspiration Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Inspiration</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
              <div className="flex gap-4 items-start">
                <div className="w-20 h-20 overflow-hidden rounded-md flex-shrink-0">
                  {selectedItem && (
                    <ReliableProductImage
                      productId={0}
                      imageUrl={selectedItem.imageUrl}
                      alt={selectedItem.title || "Inspiration image"}
                      className="w-full h-full object-cover"
                      allowDownload={true}
                    />
                  )}
                </div>
                <FormField
                  control={editForm.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Image URL *</FormLabel>
                      <FormControl>
                        <Input placeholder="/uploads/image-filename.jpg" {...field} />
                      </FormControl>
                      <FormDescription>
                        The image URL starting with /uploads/
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Beautiful Diamond Ring" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="A stunning diamond ring with intricate details..." 
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <FormField
                  control={editForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="Rings" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="sortOrder"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Sort Order</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field}
                          value={field.value === null ? '' : field.value}
                          onChange={(e) => field.onChange(e.target.value === '' ? null : parseInt(e.target.value, 10))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && (
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                  )}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Are you sure you want to delete this inspiration gallery item?
              {selectedItem?.title && (
                <span className="font-semibold block mt-2">"{selectedItem.title}"</span>
              )}
            </p>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => selectedItem && deleteMutation.mutate(selectedItem.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending && (
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                )}
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Upload Image</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="image-upload" className="block text-sm font-medium text-gray-700">
                Select Image
              </label>
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
            
            {uploadPreview && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Preview:</p>
                <div className="aspect-square w-full max-w-[300px] mx-auto overflow-hidden rounded-md">
                  <img
                    src={uploadPreview}
                    alt="Upload preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsUploadDialogOpen(false);
                  setUploadFile(null);
                  setUploadPreview('');
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!uploadFile || uploadMutation.isPending}
              >
                {uploadMutation.isPending && (
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                )}
                Upload
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
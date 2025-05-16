import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, Eye, Plus, Save, X, Upload, Image, Tag } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { apiRequest } from '@/lib/queryClient';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ReliableProductImage } from '@/components/ui/reliable-product-image';

// Define types for inspiration gallery items
type InspirationGalleryItem = {
  id: number;
  title: string | null;
  description: string | null;
  imageUrl: string;
  category: string | null;
  tags: string[];
  featured: boolean;
  createdAt: string;
};

// Create a validation schema for updating inspiration items
const updateInspirationSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  imageUrl: z.string().min(1, "Image URL is required")
});

type UpdateInspirationData = z.infer<typeof updateInspirationSchema>;

// Create a validation schema for creating new inspiration items
const createInspirationSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().optional().default(false),
  imageUrl: z.string().min(1, "Image URL is required")
});

type CreateInspirationData = z.infer<typeof createInspirationSchema>;

const ManageInspirationPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedItem, setSelectedItem] = useState<InspirationGalleryItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');

  // Query to fetch all inspiration items
  const { data: inspirationItems, isLoading, isError } = useQuery({
    queryKey: ['/api/inspiration'],
    queryFn: async () => {
      const response = await fetch('/api/inspiration');
      if (!response.ok) {
        throw new Error('Failed to fetch inspiration items');
      }
      const data = await response.json();
      return data as InspirationGalleryItem[];
    }
  });

  // Form setup for editing an existing item
  const editForm = useForm<UpdateInspirationData>({
    resolver: zodResolver(updateInspirationSchema),
    defaultValues: {
      title: selectedItem?.title || '',
      description: selectedItem?.description || '',
      category: selectedItem?.category || '',
      tags: selectedItem?.tags || [],
      featured: selectedItem?.featured || false,
      imageUrl: selectedItem?.imageUrl || ''
    }
  });

  // Form setup for creating a new item
  const newForm = useForm<CreateInspirationData>({
    resolver: zodResolver(createInspirationSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      tags: [],
      featured: false,
      imageUrl: ''
    }
  });

  // Reset edit form when selected item changes
  React.useEffect(() => {
    if (selectedItem) {
      editForm.reset({
        title: selectedItem.title || '',
        description: selectedItem.description || '',
        category: selectedItem.category || '',
        tags: selectedItem.tags || [],
        featured: selectedItem.featured,
        imageUrl: selectedItem.imageUrl
      });
    }
  }, [selectedItem, editForm]);

  // Mutation to update an inspiration item
  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; updates: UpdateInspirationData }) => {
      const response = await apiRequest('PUT', `/api/admin/inspiration/${data.id}`, data.updates);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update inspiration item');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inspiration'] });
      toast({
        title: 'Success',
        description: 'Inspiration item updated successfully',
      });
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Mutation to create a new inspiration item
  const createMutation = useMutation({
    mutationFn: async (data: CreateInspirationData) => {
      const response = await apiRequest('POST', '/api/admin/inspiration', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create inspiration item');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inspiration'] });
      toast({
        title: 'Success',
        description: 'New inspiration item created successfully',
      });
      setIsNewDialogOpen(false);
      newForm.reset();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Mutation to delete an inspiration item
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/admin/inspiration/${id}`);
      if (!response.ok && response.status !== 204) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete inspiration item');
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inspiration'] });
      toast({
        title: 'Success',
        description: 'Inspiration item deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Function to handle adding a new tag to the edit form
  const handleAddEditTag = () => {
    if (newTagInput.trim() && editForm.getValues().tags) {
      editForm.setValue('tags', [...editForm.getValues().tags!, newTagInput.trim()]);
      setNewTagInput('');
    }
  };

  // Function to handle removing a tag from the edit form
  const handleRemoveEditTag = (index: number) => {
    const currentTags = editForm.getValues().tags || [];
    editForm.setValue('tags', [...currentTags.slice(0, index), ...currentTags.slice(index + 1)]);
  };

  // Function to handle adding a new tag to the new item form
  const handleAddNewTag = () => {
    if (newTagInput.trim() && newForm.getValues().tags) {
      newForm.setValue('tags', [...newForm.getValues().tags!, newTagInput.trim()]);
      setNewTagInput('');
    }
  };

  // Function to handle removing a tag from the new item form
  const handleRemoveNewTag = (index: number) => {
    const currentTags = newForm.getValues().tags || [];
    newForm.setValue('tags', [...currentTags.slice(0, index), ...currentTags.slice(index + 1)]);
  };

  // Filter inspiration items based on the active tab
  const filteredItems = React.useMemo(() => {
    if (!inspirationItems) return [];
    
    if (activeTab === 'all') {
      return inspirationItems;
    } 
    else if (activeTab === 'featured') {
      return inspirationItems.filter(item => item.featured);
    } 
    else {
      return inspirationItems.filter(item => item.category === activeTab);
    }
  }, [inspirationItems, activeTab]);

  // Get unique categories for tab filtering
  const categories = React.useMemo(() => {
    if (!inspirationItems) return [];
    const categorySet = new Set<string>();
    
    inspirationItems.forEach(item => {
      if (item.category) {
        categorySet.add(item.category);
      }
    });
    
    return Array.from(categorySet);
  }, [inspirationItems]);

  if (isLoading) {
    return (
      <AdminLayout title="Manage Inspiration Gallery">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-12 h-12 border-t-2 border-b-2 border-primary rounded-full"></div>
        </div>
      </AdminLayout>
    );
  }

  if (isError) {
    return (
      <AdminLayout title="Manage Inspiration Gallery">
        <div className="text-center p-8">
          <h2 className="text-xl font-bold text-destructive">Error loading inspiration gallery items</h2>
          <p className="mt-2">Please try again later or contact support.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Manage Inspiration Gallery">
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Inspiration Gallery Management</h1>
          <Button onClick={() => setIsNewDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Item
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="mb-2 flex flex-wrap">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="featured">Featured</TabsTrigger>
            {categories.map(category => (
              <TabsTrigger key={category} value={category}>
                {category}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map(item => (
              <Card key={item.id} className="overflow-hidden">
                <div className="aspect-video overflow-hidden relative">
                  <ReliableProductImage
                    src={item.imageUrl}
                    alt={item.title || 'Inspiration image'}
                    className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    {item.featured && (
                      <Badge variant="secondary">Featured</Badge>
                    )}
                  </div>
                </div>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">{item.title || 'Untitled'}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {item.description || 'No description available'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 pb-2">
                  <div className="flex flex-wrap gap-1 mb-2">
                    {item.category && (
                      <Badge variant="outline">{item.category}</Badge>
                    )}
                    {item.tags?.slice(0, 3).map((tag, i) => (
                      <Badge key={i} variant="outline">{tag}</Badge>
                    ))}
                    {item.tags?.length > 3 && <Badge variant="outline">+{item.tags.length - 3}</Badge>}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 p-4">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => {
                      setSelectedItem(item);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="icon"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this inspiration item?')) {
                        deleteMutation.mutate(item.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* Edit Inspiration Item Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Inspiration Item</DialogTitle>
            </DialogHeader>

            {selectedItem && (
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(data => updateMutation.mutate({ id: selectedItem.id, updates: data }))} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-1 space-y-4">
                      <FormField
                        control={editForm.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Image URL*</FormLabel>
                            <FormControl>
                              <Input placeholder="Image URL" {...field} />
                            </FormControl>
                            <FormDescription>Direct URL to the image</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={editForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Title (optional)" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={editForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <FormControl>
                              <Input placeholder="Category (optional)" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormDescription>
                              E.g., rings, necklaces, earrings, bracelets
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={editForm.control}
                        name="featured"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Featured</FormLabel>
                              <FormDescription>
                                Display this item in featured sections
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="md:col-span-1 space-y-4">
                      <FormField
                        control={editForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Description (optional)" 
                                className="min-h-[120px]" 
                                {...field} 
                                value={field.value || ''} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div>
                        <Label>Tags</Label>
                        <div className="flex flex-wrap gap-2 mt-2 mb-4">
                          {editForm.watch('tags')?.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                              {tag}
                              <button 
                                type="button" 
                                onClick={() => handleRemoveEditTag(index)}
                                className="text-xs rounded-full hover:bg-destructive/10 p-1"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input 
                            placeholder="Add a tag" 
                            value={newTagInput} 
                            onChange={(e) => setNewTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddEditTag();
                              }
                            }}
                          />
                          <Button type="button" onClick={handleAddEditTag} size="sm">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="pt-4">
                        <Label>Preview</Label>
                        <div className="border rounded-md mt-2 overflow-hidden">
                          {editForm.watch('imageUrl') ? (
                            <ReliableProductImage
                              src={editForm.watch('imageUrl')}
                              alt="Preview"
                              className="w-full h-48 object-cover"
                            />
                          ) : (
                            <div className="w-full h-48 bg-muted flex items-center justify-center">
                              <Image className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsEditDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending && (
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
                      )}
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </DialogContent>
        </Dialog>

        {/* New Inspiration Item Dialog */}
        <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Inspiration Item</DialogTitle>
            </DialogHeader>

            <Form {...newForm}>
              <form onSubmit={newForm.handleSubmit(data => createMutation.mutate(data))} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-1 space-y-4">
                    <FormField
                      control={newForm.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image URL*</FormLabel>
                          <FormControl>
                            <Input placeholder="Image URL" {...field} />
                          </FormControl>
                          <FormDescription>Direct URL to the image</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={newForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Title (optional)" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={newForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <FormControl>
                            <Input placeholder="Category (optional)" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormDescription>
                            E.g., rings, necklaces, earrings, bracelets
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={newForm.control}
                      name="featured"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Featured</FormLabel>
                            <FormDescription>
                              Display this item in featured sections
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="md:col-span-1 space-y-4">
                    <FormField
                      control={newForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Description (optional)" 
                              className="min-h-[120px]" 
                              {...field} 
                              value={field.value || ''} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div>
                      <Label>Tags</Label>
                      <div className="flex flex-wrap gap-2 mt-2 mb-4">
                        {newForm.watch('tags')?.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {tag}
                            <button 
                              type="button" 
                              onClick={() => handleRemoveNewTag(index)}
                              className="text-xs rounded-full hover:bg-destructive/10 p-1"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Add a tag" 
                          value={newTagInput} 
                          onChange={(e) => setNewTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddNewTag();
                            }
                          }}
                        />
                        <Button type="button" onClick={handleAddNewTag} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="pt-4">
                      <Label>Preview</Label>
                      <div className="border rounded-md mt-2 overflow-hidden">
                        {newForm.watch('imageUrl') ? (
                          <ReliableProductImage
                            src={newForm.watch('imageUrl')}
                            alt="Preview"
                            className="w-full h-48 object-cover"
                          />
                        ) : (
                          <div className="w-full h-48 bg-muted flex items-center justify-center">
                            <Image className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsNewDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending && (
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
                    )}
                    Create Item
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default ManageInspirationPage;
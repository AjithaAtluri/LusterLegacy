import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Image, CheckCircle, AlertTriangle, Trash2, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface InspirationItem {
  id: number;
  title: string | null;
  description: string | null;
  imageUrl: string;
  category: string | null;
  tags: string[];
  featured: boolean;
  createdAt: string;
}

export default function InspirationManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isValidating, setIsValidating] = useState(false);
  const [isPopulating, setIsPopulating] = useState(false);

  // Fetch inspiration gallery items
  const { data: inspirationItems = [], isLoading } = useQuery<InspirationItem[]>({
    queryKey: ['/api/inspiration-gallery'],
    refetchOnWindowFocus: false,
  });

  // Validate and fix images mutation
  const validateMutation = useMutation({
    mutationFn: async () => {
      setIsValidating(true);
      const response = await apiRequest('/api/admin/inspiration/validate', 'POST');
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: 'Validation Complete',
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/inspiration-gallery'] });
      setIsValidating(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Validation Failed',
        description: error.message || 'Failed to validate images',
        variant: 'destructive',
      });
      setIsValidating(false);
    },
  });

  // Populate from products mutation
  const populateMutation = useMutation({
    mutationFn: async () => {
      setIsPopulating(true);
      const response = await apiRequest('/api/admin/inspiration/populate', 'POST');
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: 'Gallery Populated',
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/inspiration-gallery'] });
      setIsPopulating(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Population Failed',
        description: error.message || 'Failed to populate gallery',
        variant: 'destructive',
      });
      setIsPopulating(false);
    },
  });

  // Delete inspiration item mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/inspiration-gallery/${id}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: 'Item Deleted',
        description: 'Inspiration item removed successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/inspiration-gallery'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete item',
        variant: 'destructive',
      });
    },
  });

  // Toggle featured status mutation
  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, featured }: { id: number; featured: boolean }) => {
      return await apiRequest(`/api/inspiration-gallery/${id}`, 'PATCH', { featured });
    },
    onSuccess: () => {
      toast({
        title: 'Featured Status Updated',
        description: 'Item featured status changed successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/inspiration-gallery'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update featured status',
        variant: 'destructive',
      });
    },
  });

  const featuredItems = inspirationItems.filter(item => item.featured);
  const regularItems = inspirationItems.filter(item => !item.featured);

  const categoryColors: Record<string, string> = {
    necklaces: 'bg-blue-100 text-blue-800',
    rings: 'bg-green-100 text-green-800',
    earrings: 'bg-purple-100 text-purple-800',
    bracelets: 'bg-yellow-100 text-yellow-800',
    pendants: 'bg-pink-100 text-pink-800',
    sets: 'bg-indigo-100 text-indigo-800',
    general: 'bg-gray-100 text-gray-800',
  };

  const InspirationCard = ({ item }: { item: InspirationItem }) => (
    <Card className="overflow-hidden">
      <div className="relative">
        <img
          src={item.imageUrl}
          alt={item.title || 'Inspiration'}
          className="w-full h-48 object-cover"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            img.style.display = 'none';
            const parent = img.parentElement;
            if (parent) {
              parent.innerHTML = `<div class="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">
                <AlertTriangle className="w-8 h-8" />
              </div>`;
            }
          }}
        />
        {item.featured && (
          <Badge className="absolute top-2 right-2 bg-yellow-500">
            <Star className="w-3 h-3 mr-1" />
            Featured
          </Badge>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-sm mb-2 line-clamp-2">
          {item.title || 'Untitled'}
        </h3>
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
          {item.description || 'No description'}
        </p>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {item.category && (
            <Badge 
              variant="secondary" 
              className={`text-xs ${categoryColors[item.category] || categoryColors.general}`}
            >
              {item.category}
            </Badge>
          )}
          {item.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {item.tags.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{item.tags.length - 2}
            </Badge>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant={item.featured ? "default" : "outline"}
            onClick={() => toggleFeaturedMutation.mutate({ 
              id: item.id, 
              featured: !item.featured 
            })}
            className="flex-1 text-xs"
          >
            <Star className="w-3 h-3 mr-1" />
            {item.featured ? 'Unfeature' : 'Feature'}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => deleteMutation.mutate(item.id)}
            className="px-2"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Inspiration Gallery Manager</h1>
          <p className="text-gray-600">Manage inspiration gallery images and content</p>
        </div>
        
        <div className="flex gap-3">
          <Button
            onClick={() => validateMutation.mutate()}
            disabled={isValidating}
            variant="outline"
          >
            {isValidating ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            Validate Images
          </Button>
          
          <Button
            onClick={() => populateMutation.mutate()}
            disabled={isPopulating}
          >
            {isPopulating ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Image className="w-4 h-4 mr-2" />
            )}
            Repopulate Gallery
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{inspirationItems.length}</div>
            <p className="text-sm text-gray-600">Total Items</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{featuredItems.length}</div>
            <p className="text-sm text-gray-600">Featured Items</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {new Set(inspirationItems.map(item => item.category)).size}
            </div>
            <p className="text-sm text-gray-600">Categories</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Items ({inspirationItems.length})</TabsTrigger>
          <TabsTrigger value="featured">Featured ({featuredItems.length})</TabsTrigger>
          <TabsTrigger value="regular">Regular ({regularItems.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {inspirationItems.map((item) => (
              <InspirationCard key={item.id} item={item} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="featured" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {featuredItems.map((item) => (
              <InspirationCard key={item.id} item={item} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="regular" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {regularItems.map((item) => (
              <InspirationCard key={item.id} item={item} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {inspirationItems.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>No Inspiration Items</CardTitle>
            <CardDescription>
              Click "Repopulate Gallery" to create inspiration items from your product images.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
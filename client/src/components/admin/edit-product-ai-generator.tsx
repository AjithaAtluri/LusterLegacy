import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { AIInputs } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMultiSelect } from "@/hooks/use-multi-select";
import { MultiSelect } from "@/components/ui/multi-select";
import { useQuery } from "@tanstack/react-query";

// AI Generator component specifically for editing products
export default function EditProductAIGenerator({
  productType,
  metalType,
  metalWeight,
  mainStoneType,
  mainStoneWeight,
  secondaryStoneTypes,
  secondaryStoneWeight,
  userDescription,
  mainImageUrl,
  additionalImageUrls = [],
  onContentGenerated,
  onMainImageChange,
  onAdditionalImagesChange
}: {
  productType: string;
  metalType: string;
  metalWeight: string;
  mainStoneType: string;
  mainStoneWeight: string;
  secondaryStoneTypes: any[];
  secondaryStoneWeight: string;
  userDescription: string;
  mainImageUrl: string | null;
  additionalImageUrls: string[];
  onContentGenerated: (content: any) => void;
  onMainImageChange: (file: File | null, preview: string | null) => void;
  onAdditionalImagesChange: (files: File[], previews: string[]) => void;
}) {
  const { toast } = useToast();
  const [primaryGemsInput, setPrimaryGemsInput] = useState('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(mainImageUrl);
  const params = new URLSearchParams(window.location.search);
  const productId = parseInt(params.get('id') || '0');

  // Fetch product types for selection
  const { data: productTypes } = useQuery<any[]>({
    queryKey: ['/api/product-types'],
  });

  // Fetch metal types for selection
  const { data: metalTypes } = useQuery<any[]>({
    queryKey: ['/api/metal-types'],
  });

  // Fetch stone types for selection
  const { data: stoneTypes } = useQuery<any[]>({
    queryKey: ['/api/stone-types'],
  });

  // Setup form for AI input parameters
  const formSchema = z.object({
    productType: z.string().min(1, "Product type is required"),
    metalType: z.string().min(1, "Metal type is required"),
    metalWeight: z.string().optional(),
    userDescription: z.string().optional(),
  });

  const primaryGemsSchema = z.array(
    z.object({
      name: z.string(),
      carats: z.number().optional(),
    })
  ).optional();

  // Initialize form with provided prop values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productType: productType || "",
      metalType: metalType || "",
      metalWeight: metalWeight || "",
      userDescription: userDescription || "",
    },
  });

  // Setup stone multi-select
  const { selectedItems: selectedGems, setSelectedItems: setSelectedGems } = useMultiSelect([]);

  // Set up the primary gems using secondaryStoneTypes
  useEffect(() => {
    if (secondaryStoneTypes && secondaryStoneTypes.length > 0) {
      // Set selected gems based on secondaryStoneTypes
      setSelectedGems(secondaryStoneTypes);
      
      // Format gems text for display
      const gemsText = secondaryStoneTypes
        .map(gem => {
          if (gem.weight) {
            return `${gem.name} (${gem.weight} carats)`;
          }
          return gem.name;
        })
        .join(", ");
      
      setPrimaryGemsInput(gemsText);
    }
  }, [secondaryStoneTypes]);

  // Handle file upload for AI processing
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Image upload failed");
      }

      const data = await response.json();
      setUploadedImageUrl(data.url);
      toast({
        title: "Image upload successful",
        description: "The image has been uploaded and will be used for content generation.",
      });
    } catch (error) {
      toast({
        title: "Image upload failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  // Process primary gems input field
  const processPrimaryGems = () => {
    // If using multi-select UI
    if (selectedGems && selectedGems.length > 0) {
      return selectedGems.map(gem => ({
        name: gem.name,
        // Extract carats from input if available
        carats: extractCaratsForGem(gem.name)
      }));
    }
    
    // If using text field
    if (primaryGemsInput) {
      // Basic parsing of input like "Diamond (2 carats), Ruby"
      return primaryGemsInput.split(",").map(item => {
        const trimmed = item.trim();
        const match = trimmed.match(/(.+?)\s*\((\d+(?:\.\d+)?)\s*carats?\)/i);
        
        if (match) {
          return {
            name: match[1].trim(),
            carats: parseFloat(match[2])
          };
        }
        
        return { name: trimmed };
      });
    }
    
    return [];
  };

  // Extract carats value from the primary gems input for a specific gem
  const extractCaratsForGem = (gemName: string) => {
    const regex = new RegExp(`${gemName}\\s*\\((\\d+(?:\\.\\d+)?)\\s*carats?\\)`, 'i');
    const match = primaryGemsInput.match(regex);
    return match ? parseFloat(match[1]) : undefined;
  };

  // Mutation for generating content
  const generateContentMutation = useMutation({
    mutationFn: async (formData: any) => {
      const response = await apiRequest("POST", `/api/products/${productId}/regenerate-content`, formData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Content generated successfully",
        description: "The AI has created new content for your product.",
      });
      onContentGenerated(data);
    },
    onError: (error: Error) => {
      toast({
        title: "Content generation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form submission
  const onSubmit = (formData: z.infer<typeof formSchema>) => {
    const primaryGems = processPrimaryGems();

    // Save these inputs for future regeneration
    const aiInputs: AIInputs = {
      productType: formData.productType,
      metalType: formData.metalType,
      metalWeight: formData.metalWeight ? parseFloat(formData.metalWeight) : undefined,
      primaryGems,
      userDescription: formData.userDescription,
      imageUrls: uploadedImageUrl ? [uploadedImageUrl] : undefined,
    };

    // Pass to API for content generation along with aiInputs for storage
    generateContentMutation.mutate({
      ...aiInputs,
      storeAiInputs: true  // Flag to store these inputs with the product
    });
  };

  return (
    <Card className="w-full mx-auto max-w-4xl">
      <CardHeader>
        <CardTitle className="text-2xl">Regenerate Product Content</CardTitle>
        <CardDescription>
          Use AI to generate new product descriptions based on your jewelry details. The content will include a product title, tagline, short description, detailed description, and a suggested price.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Product Type */}
            <FormField
              control={form.control}
              name="productType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Type*</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    >
                      <option value="">Select a product type</option>
                      {productTypes?.map((type) => (
                        <option key={type.id} value={type.name}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Metal Type */}
            <FormField
              control={form.control}
              name="metalType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Metal Type*</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    >
                      <option value="">Select a metal type</option>
                      {metalTypes?.map((type) => (
                        <option key={type.id} value={type.name}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Metal Weight */}
            <FormField
              control={form.control}
              name="metalWeight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Metal Weight (in grams)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter metal weight"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Primary Gems (using multi-select) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Primary Gems</label>
              <div className="flex flex-col space-y-2">
                <MultiSelect
                  options={stoneTypes?.map(stone => ({
                    label: stone.name,
                    value: stone.id.toString(),
                    data: stone
                  })) || []}
                  selected={selectedGems}
                  onChange={setSelectedGems}
                  placeholder="Select gems"
                />
                <Input
                  value={primaryGemsInput}
                  onChange={(e) => setPrimaryGemsInput(e.target.value)}
                  placeholder="Or manually enter gems with carats: Diamond (2 carats), Ruby"
                  className="mt-2"
                />
              </div>
              <p className="text-xs text-gray-500">
                Select stones or manually enter with carat details (e.g., "Diamond (2 carats)")
              </p>
            </div>

            {/* User Description */}
            <FormField
              control={form.control}
              name="userDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Details (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter any additional details about the product, e.g., design inspiration, special features..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Product Image (Optional)</label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="cursor-pointer"
              />
              <p className="text-xs text-gray-500">
                Upload a high-quality image of the product for better AI analysis
              </p>
              {uploadedImageUrl && (
                <div className="mt-2 relative">
                  <img
                    src={uploadedImageUrl}
                    alt="Uploaded product"
                    className="w-32 h-32 object-cover rounded-md"
                  />
                </div>
              )}
            </div>

            {/* Submit buttons */}
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={generateContentMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={generateContentMutation.isPending}
                className={cn(
                  "relative",
                  generateContentMutation.isPending ? "text-transparent" : ""
                )}
              >
                {generateContentMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin absolute" />
                )}
                Regenerate Content
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
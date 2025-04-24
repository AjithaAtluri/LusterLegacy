import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, X, Upload } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

// Define the form schema
const stoneTypeFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.preprocess(
    (val) => val === null || val === undefined ? "" : val,
    z.string().max(500, "Description must be 500 characters or less")
  ),
  priceModifier: z.coerce.number().min(0, "Price per carat cannot be negative"),
  imageUrl: z.preprocess(
    (val) => val === null || val === undefined ? "" : val,
    z.string()
  ),
  color: z.preprocess(
    (val) => val === null || val === undefined ? "" : val,
    z.string().max(20, "Color code must be 20 characters or less")
  ),
});

type StoneTypeFormValues = z.infer<typeof stoneTypeFormSchema>;

interface StoneTypeFormProps {
  initialData?: Partial<StoneTypeFormValues>;
  stoneTypeId?: number;
  onSuccess?: () => void;
}

export default function StoneTypeForm({ initialData, stoneTypeId, onSuccess }: StoneTypeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(initialData?.imageUrl || null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const defaultValues: Partial<StoneTypeFormValues> = {
    name: "",
    description: "",
    priceModifier: 0,
    imageUrl: "",
    color: "",
    ...initialData
  };
  
  const form = useForm<StoneTypeFormValues>({
    resolver: zodResolver(stoneTypeFormSchema),
    defaultValues
  });
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 5MB",
        variant: "destructive"
      });
      return;
    }
    
    // Check file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive"
      });
      return;
    }
    
    setUploadedImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const clearUploadedImage = () => {
    setUploadedImage(null);
    setUploadedImagePreview(null);
    form.setValue("imageUrl", "");
  };
  
  const onSubmit = async (data: StoneTypeFormValues) => {
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("priceModifier", data.priceModifier.toString());
      
      // Always include optional fields, even if empty
      formData.append("description", data.description || "");
      formData.append("color", data.color || "");
      
      // Add image if present
      if (uploadedImage) {
        formData.append("image", uploadedImage);
      } else if (data.imageUrl) {
        formData.append("imageUrl", data.imageUrl);
      } else {
        formData.append("imageUrl", "");
      }
      
      if (stoneTypeId) {
        // Update existing stone type
        const response = await fetch(`/api/admin/stone-types/${stoneTypeId}`, {
          method: "PUT",
          body: formData,
          credentials: "include"
        });
        
        if (!response.ok) {
          throw new Error("Failed to update stone type");
        }
        
        toast({
          title: "Stone type updated",
          description: "The stone type has been updated successfully"
        });
      } else {
        // Create new stone type
        const response = await fetch("/api/admin/stone-types", {
          method: "POST",
          body: formData,
          credentials: "include"
        });
        
        if (!response.ok) {
          throw new Error("Failed to create stone type");
        }
        
        toast({
          title: "Stone type created",
          description: "The stone type has been created successfully"
        });
        
        // Reset form
        form.reset(defaultValues);
        clearUploadedImage();
      }
      
      // Invalidate stone types query to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stone-types'] });
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Stone type form error:", error);
      toast({
        title: "Error",
        description: stoneTypeId ? "Failed to update stone type" : "Failed to create stone type",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stone Type Name *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Diamond" />
                  </FormControl>
                  <FormDescription>
                    Enter the name of the stone type (e.g., Diamond, Ruby, Emerald)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="priceModifier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price per Carat in INR *</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="number" 
                      min={0}
                      step={100}
                      placeholder="10000" 
                    />
                  </FormControl>
                  <FormDescription>
                    Base price per carat of this stone in Indian Rupees (INR)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color Code (Optional)</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input {...field} placeholder="#ffffff" />
                    </FormControl>
                    {field.value && (
                      <div 
                        className="h-9 w-9 rounded-md border"
                        style={{ backgroundColor: field.value }}
                      />
                    )}
                  </div>
                  <FormDescription>
                    Enter a color code for this stone type (e.g., #ff0000 for red)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="A rare and precious gemstone known for its brilliance and durability." 
                      rows={3} 
                    />
                  </FormControl>
                  <FormDescription>
                    Brief description of the stone type
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormItem>
              <FormLabel>Stone Image (Optional)</FormLabel>
              <div className="mt-2">
                {uploadedImagePreview ? (
                  <div className="relative w-full h-48 border rounded-md overflow-hidden">
                    <img 
                      src={uploadedImagePreview} 
                      alt="Stone preview" 
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={clearUploadedImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-md">
                    <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload an image
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                )}
              </div>
              <FormDescription>
                Upload an image of this stone type (Max size: 5MB)
              </FormDescription>
            </FormItem>
            
            {!uploadedImage && initialData?.imageUrl && (
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://example.com/image.jpg" />
                    </FormControl>
                    <FormDescription>
                      Current image URL
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>
        
        <div className="flex justify-end space-x-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onSuccess?.()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {stoneTypeId ? "Updating..." : "Creating..."}
              </>
            ) : (
              stoneTypeId ? "Update Stone Type" : "Create Stone Type"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
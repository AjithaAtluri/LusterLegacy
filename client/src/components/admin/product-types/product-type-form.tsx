import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";

// Form schema validation
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be 50 characters or less"),
  description: z.string().nullable().transform(val => val || "").max(200, "Description must be 200 characters or less"),
  displayOrder: z.coerce.number().int().min(0).default(100),
  isActive: z.boolean().default(true),
  icon: z.string().nullable().transform(val => val || "").max(30, "Icon name must be 30 characters or less"),
  color: z.string().nullable().transform(val => val || "").max(20, "Color code must be 20 characters or less"),
});

type FormValues = z.infer<typeof formSchema>;

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

interface ProductTypeFormProps {
  productType?: ProductType; // If provided, we are editing
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProductTypeForm({ productType, onSuccess, onCancel }: ProductTypeFormProps) {
  const { toast } = useToast();
  const [colorPreview, setColorPreview] = useState<string | null>(productType?.color || null);

  const defaultValues = productType ? {
    name: productType.name,
    description: productType.description || "",
    displayOrder: productType.displayOrder,
    isActive: productType.isActive,
    icon: productType.icon || "",
    color: productType.color || "",
  } : {
    name: "",
    description: "",
    displayOrder: 100,
    isActive: true,
    icon: "",
    color: "",
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return await apiRequest("POST", "/api/product-types", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-types"] });
      toast({
        title: "Product type created",
        description: "The product type has been created successfully.",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create product type: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (!productType) throw new Error("No product type to update");
      return await apiRequest("PUT", `/api/product-types/${productType.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-types"] });
      toast({
        title: "Product type updated",
        description: "The product type has been updated successfully.",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update product type: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data: FormValues) => {
    // Process form data before submitting
    // Convert empty strings to empty strings (not null) to prevent Zod validation errors
    const formData = {
      ...data,
      description: data.description ?? "",
      icon: data.icon ?? "",
      color: data.color ?? "",
    };

    if (productType) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setColorPreview(color || null);
    form.setValue("color", color);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name*</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Rings, Necklaces, Bracelets" {...field} />
              </FormControl>
              <FormDescription>
                The display name for this product type.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="A brief description of this product type"
                  className="resize-none"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                Optional description to help understand the product type.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="displayOrder"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Order</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} />
                </FormControl>
                <FormDescription>
                  Controls the sorting order (lower numbers appear first).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="icon"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Icon Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., ring, diamond, gem" {...field} value={field.value || ""} />
                </FormControl>
                <FormDescription>
                  Optional icon name used for displaying icons.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Color</FormLabel>
                <div className="flex gap-2 items-center">
                  <FormControl>
                    <Input 
                      placeholder="#FFD700" 
                      {...field} 
                      value={field.value || ""} 
                      onChange={handleColorChange}
                    />
                  </FormControl>
                  {colorPreview && (
                    <div 
                      className="w-8 h-8 rounded-full border border-gray-200" 
                      style={{ backgroundColor: colorPreview }}
                    />
                  )}
                </div>
                <FormDescription>
                  Optional hex color code (e.g., #FFD700 for gold).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Active Status</FormLabel>
                <div className="flex items-center gap-2 h-10 mt-1">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <Label htmlFor="is-active">
                    {field.value ? "Active" : "Inactive"}
                  </Label>
                </div>
                <FormDescription>
                  Only active product types will be shown to customers.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {productType ? "Update" : "Create"} Product Type
          </Button>
        </div>
      </form>
    </Form>
  );
}
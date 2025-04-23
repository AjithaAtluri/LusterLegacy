import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

// Define the form schema
const metalTypeFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  priceModifier: z.coerce.number().min(0, "Price modifier cannot be negative"),
  description: z.string().nullable().optional(),
  displayOrder: z.number().default(0),
  isActive: z.boolean().default(true),
  color: z.string().nullable().optional(),
});

type MetalTypeFormValues = z.infer<typeof metalTypeFormSchema>;

interface MetalTypeFormProps {
  initialData?: Partial<MetalTypeFormValues>;
  metalTypeId?: number;
  onSuccess?: () => void;
}

export default function MetalTypeForm({ initialData, metalTypeId, onSuccess }: MetalTypeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const defaultValues: Partial<MetalTypeFormValues> = {
    name: "",
    priceModifier: 0,
    description: null,
    displayOrder: 0,
    isActive: true,
    color: null,
    ...initialData
  };
  
  const form = useForm<MetalTypeFormValues>({
    resolver: zodResolver(metalTypeFormSchema),
    defaultValues
  });
  
  const onSubmit = async (data: MetalTypeFormValues) => {
    setIsSubmitting(true);
    
    try {
      if (metalTypeId) {
        // Update existing metal type
        await apiRequest("PUT", `/api/admin/metal-types/${metalTypeId}`, data);
        toast({
          title: "Metal type updated",
          description: "The metal type has been updated successfully"
        });
      } else {
        // Create new metal type
        await apiRequest("POST", "/api/admin/metal-types", data);
        toast({
          title: "Metal type created",
          description: "The metal type has been created successfully"
        });
        
        // Reset form
        form.reset(defaultValues);
      }
      
      // Invalidate metal types query to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/metal-types'] });
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Metal type form error:", error);
      toast({
        title: "Error",
        description: metalTypeId ? "Failed to update metal type" : "Failed to create metal type",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Metal Type Name *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="22K Yellow Gold" />
                </FormControl>
                <FormDescription>
                  Enter the name of the metal type (e.g., 18K White Gold, 22K Yellow Gold)
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
                <FormLabel>Price Modifier (%) *</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="number" 
                    min={0}
                    step={1}
                    placeholder="10" 
                  />
                </FormControl>
                <FormDescription>
                  Price adjustment percentage relative to base price (0 = no change, 10 = +10%)
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
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="The highest purity gold available for jewelry" 
                    value={field.value || ""}
                  />
                </FormControl>
                <FormDescription>
                  Brief description of the metal type
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end space-x-4">
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
                {metalTypeId ? "Updating..." : "Creating..."}
              </>
            ) : (
              metalTypeId ? "Update Metal Type" : "Create Metal Type"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
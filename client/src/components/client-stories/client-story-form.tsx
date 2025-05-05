import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InsertTestimonial } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Rating } from "./rating";
import { FileUploader } from "@/components/ui/file-uploader";
import { Spinner } from "@/components/ui/spinner";

// Define the form schema with validation
const clientStorySchema = z.object({
  customerName: z.string().min(2, { message: "Name must be at least 2 characters." }),
  location: z.string().optional(),
  productType: z.string().min(1, { message: "Please select a product type." }),
  purchaseDate: z.string().optional(),
  story: z.string().min(10, { message: "Your story must be at least 10 characters." }),
  rating: z.number().min(1).max(5),
  imageUrls: z.array(z.string()).optional(),
});

type ClientStoryFormData = z.infer<typeof clientStorySchema>;

export function ClientStoryForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  
  // Initialize react-hook-form
  const form = useForm<ClientStoryFormData>({
    resolver: zodResolver(clientStorySchema),
    defaultValues: {
      customerName: user?.username || "",
      location: "",
      productType: "",
      purchaseDate: "",
      story: "",
      rating: 5,
      imageUrls: [],
    },
  });
  
  // Submission mutation
  const submitMutation = useMutation({
    mutationFn: async (data: ClientStoryFormData) => {
      const testimonial: InsertTestimonial = {
        ...data,
        imageUrls: uploadedImageUrls,
        status: "pending", // All submissions start as pending for admin approval
        userId: user?.id || null,
      };
      
      const response = await apiRequest("POST", "/api/testimonials", testimonial);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit story");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Story Submitted",
        description: "Thank you for sharing your story. It will be reviewed and published soon.",
        variant: "default",
      });
      
      // Reset form
      form.reset();
      setUploadedImageUrls([]);
      
      // Invalidate testimonials query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/testimonials"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  function onSubmit(data: ClientStoryFormData) {
    submitMutation.mutate(data);
  }
  
  // Handle image upload
  const handleImageUpload = (uploadedUrls: string[]) => {
    setUploadedImageUrls(uploadedUrls);
  };
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Name */}
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="City, Country" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Product Type */}
            <FormField
              control={form.control}
              name="productType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select product type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Necklace">Necklace</SelectItem>
                      <SelectItem value="Earrings">Earrings</SelectItem>
                      <SelectItem value="Ring">Ring</SelectItem>
                      <SelectItem value="Bracelet">Bracelet</SelectItem>
                      <SelectItem value="Custom">Custom Piece</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Purchase Date */}
            <FormField
              control={form.control}
              name="purchaseDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase Date (Optional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Story */}
          <FormField
            control={form.control}
            name="story"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Story</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Share your experience with the jewelry..."
                    className="min-h-[120px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Tell us about your experience with the jewelry, what it means to you, or the occasion it was for.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Rating */}
          <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rate Your Experience</FormLabel>
                <FormControl>
                  <Rating
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Images */}
          <div>
            <FormLabel className="block mb-2">Upload Images (Optional)</FormLabel>
            <FormDescription className="mb-4">
              Upload up to 3 photos of yourself wearing the jewelry or just the jewelry itself.
            </FormDescription>
            <FileUploader
              maxFiles={3}
              acceptedFileTypes={["image/*"]}
              maxFileSizeMB={5}
              endpoint="/api/upload"
              onUploadsComplete={handleImageUpload}
            />
          </div>
          
          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full sm:w-auto"
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending ? (
              <>
                <Spinner className="mr-2" size="sm" />
                Submitting...
              </>
            ) : (
              "Submit Your Story"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
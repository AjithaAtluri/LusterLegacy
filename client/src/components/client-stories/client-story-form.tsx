import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Rating } from "./rating";
import { FileUploader } from "../ui/file-uploader";
import { Spinner } from "../ui/spinner";

const clientStorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  location: z.string().max(100).optional(),
  productType: z.string().min(2, "Please select a product type"),
  rating: z.number().min(1).max(5),
  text: z.string().min(10, "Your testimonial must be at least 10 characters"),
  story: z.string().min(20, "Your story must be at least 20 characters"),
  initials: z.string().min(1, "Please enter your initials"),
  orderId: z.number().optional(),
  productId: z.number().optional(),
  imageUrls: z.array(z.string()).optional(),
});

type ClientStoryFormData = z.infer<typeof clientStorySchema>;

export function ClientStoryForm() {
  const { toast } = useToast();
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  
  const form = useForm<ClientStoryFormData>({
    resolver: zodResolver(clientStorySchema),
    defaultValues: {
      name: "",
      location: "",
      productType: "",
      rating: 5,
      text: "",
      story: "",
      initials: "",
      imageUrls: [],
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: ClientStoryFormData) => {
      const response = await apiRequest("POST", "/api/testimonials", {
        ...data,
        status: "pending", // New testimonials always start as pending
        isApproved: false, // Default to not approved
        imageUrls: uploadedFiles.length > 0 ? uploadedFiles : undefined,
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Story submitted!",
        description: "Thank you for sharing your story. It will be reviewed by our team.",
      });
      form.reset();
      setUploadedFiles([]);
      
      // Invalidate testimonials query to refresh the list if needed
      queryClient.invalidateQueries({ queryKey: ["/api/testimonials"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit story",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: ClientStoryFormData) {
    // Automatically generate initials if not provided
    if (!data.initials || data.initials.trim() === "") {
      const nameParts = data.name.split(" ");
      let initials = "";
      if (nameParts.length >= 2) {
        initials = `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
      } else if (nameParts.length === 1) {
        initials = nameParts[0].substring(0, 2).toUpperCase();
      }
      data.initials = initials;
    }
    
    submitMutation.mutate(data);
  }

  const handleFileUploadComplete = (fileUrls: string[]) => {
    setUploadedFiles((prev) => [...prev, ...fileUrls]);
    form.setValue("imageUrls", [...uploadedFiles, ...fileUrls]);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Share Your Luster Legacy Story</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="New York, USA" {...field} />
                </FormControl>
                <FormDescription>
                  Share your city or country to add a personal touch
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
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
                    <SelectItem value="Pendant">Pendant</SelectItem>
                    <SelectItem value="Set">Jewelry Set</SelectItem>
                    <SelectItem value="Custom">Custom Piece</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select the type of jewelry you purchased
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Rating</FormLabel>
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
          
          <FormField
            control={form.control}
            name="text"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brief Testimonial</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="A short testimonial about your experience..." 
                    className="min-h-[80px]"
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  This shorter testimonial may be featured on our homepage
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="story"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Full Story</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Tell us more about your experience with Luster Legacy..." 
                    className="min-h-[150px]"
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Share your detailed journey and experience with our jewelry
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="initials"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Initials (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="J.D." 
                    maxLength={3} 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  We'll use these if you prefer not to display your full name
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="space-y-2">
            <FormLabel>Photos (Optional)</FormLabel>
            <FileUploader 
              onUploadComplete={handleFileUploadComplete} 
              maxFiles={3}
              acceptedFileTypes={["image/jpeg", "image/png", "image/jpg"]}
              maxSizeMB={5}
              uploadPath="client-stories"
              existingFiles={uploadedFiles}
            />
            <FormDescription>
              Upload up to 3 photos showing yourself with your Luster Legacy jewelry
            </FormDescription>
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending ? (
              <>
                <Spinner className="mr-2" />
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
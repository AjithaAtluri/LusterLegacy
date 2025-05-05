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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Rating } from "./rating";
import { FileUploader } from "../ui/file-uploader";
import { Spinner } from "../ui/spinner";

const clientStorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  location: z.string().max(100).optional(),
  rating: z.number().min(1).max(5),
  content: z.string().min(10, "Your story must be at least 10 characters"),
  orderId: z.number().optional(),
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
      rating: 5,
      content: "",
      imageUrls: [],
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: ClientStoryFormData) => {
      const response = await apiRequest("POST", "/api/testimonials", {
        ...data,
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
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Story</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Tell us about your experience with Luster Legacy..." 
                    className="min-h-[150px]"
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Share your journey and experience with our jewelry
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
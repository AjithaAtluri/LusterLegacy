import { useState, useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertTestimonialSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { FileUploader } from "@/components/ui/file-uploader";
import { Rating } from "./rating";

// Extend the insert schema with additional validations
const storyFormSchema = insertTestimonialSchema.extend({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }).optional(),
  text: z.string().min(10, {
    message: "Please provide a brief testimonial (at least 10 characters).",
  }),
  story: z.string().optional(),
  rating: z.number().min(1, {
    message: "Please rate your purchase.",
  }).max(5),
  productType: z.string().min(1, {
    message: "Please select a product type.",
  }),
  location: z.string().optional(),
  imageUrls: z.array(z.string()).default([]),
  // New fields for expanded form
  purchaseType: z.enum(["self", "gift"]).optional(),
  giftGiver: z.string().optional(),
  occasion: z.enum(["casual", "birthday", "wedding", "anniversary", "special_occasion", "other"]).optional(),
  satisfaction: z.enum(["very_much", "ok", "did_not"]).optional(),
  wouldReturn: z.boolean().default(true),
  // AI generation fields will be handled on the server side
  // Generate initials from name
  initials: z.string().optional(),
});

type StoryFormValues = z.infer<typeof storyFormSchema>;

export function ClientStoryForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  // Default values for the form
  const defaultValues: Partial<StoryFormValues> = {
    userId: user?.id || null,
    rating: 0,
    name: "",
    email: user?.email || "",
    text: "",
    story: "",
    productType: "",
    location: "",
    imageUrls: [],
    // New fields
    purchaseType: undefined,
    giftGiver: "",
    occasion: undefined,
    satisfaction: undefined,
    wouldReturn: true,
    // Original fields
    status: "pending",
    isApproved: false,
  };

  const form = useForm<StoryFormValues>({
    resolver: zodResolver(storyFormSchema),
    defaultValues,
  });
  
  // Auto-fill user data when component loads
  useEffect(() => {
    if (user) {
      // Extract user's name from username or use username directly
      let userName = user.username;
      // If username follows common patterns like FirstLast123, try to extract a proper name
      const nameParts = user.username.match(/^([A-Z][a-z]+)([A-Z][a-z]+)\d*$/);
      if (nameParts) {
        userName = `${nameParts[1]} ${nameParts[2]}`;
      }
      
      // Set form values
      form.setValue("name", userName);
      form.setValue("userId", user.id);
      
      // Set email to hidden field if exists in schema
      if (user.email) {
        form.setValue("email", user.email);
      }
    }
  }, [user, form]);

  const storyMutation = useMutation({
    mutationFn: async (data: StoryFormValues) => {
      // Calculate initials from the name
      const nameWords = data.name.trim().split(/\s+/);
      const initials = nameWords.length > 1
        ? `${nameWords[0][0]}${nameWords[nameWords.length - 1][0]}`.toUpperCase()
        : nameWords[0].slice(0, 2).toUpperCase();

      const testimonialData = {
        ...data,
        initials,
        imageUrls: uploadedImages,
      };

      const res = await apiRequest("POST", "/api/testimonials", testimonialData);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to submit your story");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your story has been submitted for review.",
      });
      form.reset(defaultValues);
      setUploadedImages([]);
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

  const onSubmit = (values: StoryFormValues) => {
    storyMutation.mutate(values);
  };

  const handleRatingChange = (rating: number) => {
    form.setValue("rating", rating, { shouldValidate: true });
  };

  const handleImageUploads = (urls: string[]) => {
    setUploadedImages(urls);
    form.setValue("imageUrls", urls, { shouldValidate: true });
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Share Your Experience</CardTitle>
        <CardDescription>
          Tell us about your Luster Legacy jewelry and help others discover the perfect piece.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
                  <FormDescription>
                    Your name will be displayed with your story.
                  </FormDescription>
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
                    <Input placeholder="City, Country" {...field} />
                  </FormControl>
                  <FormDescription>
                    Sharing your location helps personalize your story.
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
                        <SelectValue placeholder="Select a product type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Necklace">Necklace</SelectItem>
                      <SelectItem value="Earrings">Earrings</SelectItem>
                      <SelectItem value="Bracelet">Bracelet</SelectItem>
                      <SelectItem value="Ring">Ring</SelectItem>
                      <SelectItem value="Pendant">Pendant</SelectItem>
                      <SelectItem value="Jewelry Set">Jewelry Set</SelectItem>
                      <SelectItem value="Custom Design">Custom Design</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The type of jewelry you purchased or had custom-made.
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
                    <div>
                      <Rating 
                        value={field.value} 
                        onChange={handleRatingChange} 
                        size="lg"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    How would you rate your jewelry from 1 to 5 stars?
                  </FormDescription>
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
                      placeholder="Please share a brief summary of your experience with our jewelry."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This will be the main testimonial displayed in featured areas.
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
                  <FormLabel>Your Full Story (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share the detailed story of your jewelry - what occasion it was for, how it made you feel, any compliments you received, etc."
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Tell us the full story behind your piece for our detailed client story section.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <Label>Images of Your Jewelry (Optional)</Label>
              <FileUploader
                maxFiles={3}
                acceptedFileTypes={["image/jpeg", "image/png", "image/jpg"]}
                maxSizeMB={5}
                endpoint="/api/upload"
                onUploadsComplete={handleImageUploads}
              />
              <p className="text-sm text-muted-foreground">
                Share up to 3 images of your jewelry. Max 5MB per image.
              </p>
            </div>

            <div className="pt-2">
              <Button 
                type="submit" 
                disabled={storyMutation.isPending}
                className="w-full"
              >
                {storyMutation.isPending ? (
                  <>
                    <Spinner className="mr-2" size="sm" />
                    Submitting...
                  </>
                ) : (
                  "Submit Your Story"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2 border-t pt-4">
        <p className="text-sm text-muted-foreground">
          Your story will be reviewed by our team before being published. 
          Thank you for sharing your experience with Luster Legacy!
        </p>
      </CardFooter>
    </Card>
  );
}
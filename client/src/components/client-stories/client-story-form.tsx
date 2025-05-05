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
import { Checkbox } from "@/components/ui/checkbox";
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
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Sparkles } from "lucide-react";

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
  const [generatedTestimonial, setGeneratedTestimonial] = useState<string>("");
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [aiErrorMessage, setAiErrorMessage] = useState<string>("");
  
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

  // AI testimonial generation
  const generateAITestimonial = async () => {
    setIsGeneratingAI(true);
    setAiErrorMessage("");

    try {
      // Get current form data
      const formData = form.getValues();
      
      // Validate required fields for AI generation
      if (!formData.name || !formData.productType || formData.rating === 0) {
        setAiErrorMessage("Please fill in your name, product type, and rating before generating AI testimonial");
        setIsGeneratingAI(false);
        return;
      }

      // Build AI input data
      const aiInputData = {
        name: formData.name,
        productType: formData.productType,
        rating: formData.rating,
        purchaseType: formData.purchaseType || "self",
        giftGiver: formData.giftGiver || "",
        occasion: formData.occasion || "casual",
        satisfaction: formData.satisfaction || "very_much",
        wouldReturn: formData.wouldReturn,
        location: formData.location || "",
        imageUrls: uploadedImages,
      };

      // Call the AI generation endpoint
      const response = await apiRequest(
        "POST", 
        "/api/generate-testimonial",
        aiInputData
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate AI testimonial");
      }

      const result = await response.json();
      
      // Set the generated testimonial in form
      setGeneratedTestimonial(result.testimonial);
      form.setValue("text", result.testimonial, { shouldValidate: true });
      
      // If a longer story was generated, set that too
      if (result.story) {
        form.setValue("story", result.story, { shouldValidate: true });
      }
      
      // Store the AI input data for reference (will be saved with testimonial)
      form.setValue("aiInputData", aiInputData);
      
      // Open dialog to preview the generated testimonial
      setIsDialogOpen(true);
    } catch (error) {
      console.error("Error generating AI testimonial:", error);
      setAiErrorMessage(error instanceof Error ? error.message : "Failed to generate AI testimonial");
      toast({
        title: "AI Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate AI testimonial",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Accept AI generated testimonial
  const acceptAITestimonial = () => {
    setIsDialogOpen(false);
    toast({
      title: "AI Testimonial Applied",
      description: "You can still edit it before submitting your story.",
    });
  };

  // Reject and try again
  const rejectAITestimonial = () => {
    setIsDialogOpen(false);
    form.setValue("text", "", { shouldValidate: true });
    form.setValue("story", "", { shouldValidate: true });
    setGeneratedTestimonial("");
    toast({
      title: "AI Testimonial Rejected",
      description: "Please try again or write your own testimonial.",
      variant: "destructive",
    });
  };

  return (
    <>
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
              name="purchaseType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Was this purchase for yourself or a gift?</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select purchase type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="self">For myself</SelectItem>
                      <SelectItem value="gift_for">As a gift for someone</SelectItem>
                      <SelectItem value="gift_from">As a gift from someone</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("purchaseType") === "gift_for" && (
              <FormField
                control={form.control}
                name="giftGiver"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Who was this gift for?</FormLabel>
                    <FormControl>
                      <Input placeholder="Partner, parent, friend, etc." {...field} />
                    </FormControl>
                    <FormDescription>
                      Tell us who received this special gift.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {form.watch("purchaseType") === "gift_from" && (
              <FormField
                control={form.control}
                name="giftGiver"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Who gave you this gift?</FormLabel>
                    <FormControl>
                      <Input placeholder="Partner, parent, friend, etc." {...field} />
                    </FormControl>
                    <FormDescription>
                      Tell us who gifted this special piece to you.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="occasion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What was the occasion?</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select occasion" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="casual">Casual/Everyday</SelectItem>
                      <SelectItem value="birthday">Birthday</SelectItem>
                      <SelectItem value="wedding">Wedding</SelectItem>
                      <SelectItem value="anniversary">Anniversary</SelectItem>
                      <SelectItem value="special_occasion">Special Occasion</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The occasion this jewelry was purchased for.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="satisfaction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>How satisfied were you with this purchase?</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select satisfaction level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="very_much">Very satisfied</SelectItem>
                      <SelectItem value="ok">Somewhat satisfied</SelectItem>
                      <SelectItem value="did_not">Not satisfied</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Your level of satisfaction with your purchase.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="wouldReturn"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Would you consider Luster Legacy for your next custom design?
                    </FormLabel>
                    <FormDescription>
                      Let us know if you'd consider returning to us for future jewelry designs.
                    </FormDescription>
                  </div>
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

            <div className="space-y-4 pt-2">
              <Button 
                type="button" 
                variant="outline"
                onClick={generateAITestimonial}
                disabled={isGeneratingAI || storyMutation.isPending}
                className="w-full flex items-center justify-center"
              >
                {isGeneratingAI ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating AI Testimonial...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate AI Testimonial
                  </>
                )}
              </Button>
              
              {aiErrorMessage && (
                <p className="text-sm text-red-500">{aiErrorMessage}</p>
              )}
              
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
    
    <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Your AI-Generated Testimonial</AlertDialogTitle>
          <AlertDialogDescription>
            <div className="space-y-4">
              <p>Based on your inputs, we've generated the following testimonial:</p>
              
              <div className="bg-muted p-4 rounded-md">
                <p className="italic text-sm font-medium">{generatedTestimonial}</p>
              </div>
              
              <p>Does this capture your experience with Luster Legacy?</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={rejectAITestimonial}>Try Again</AlertDialogCancel>
          <AlertDialogAction onClick={acceptAITestimonial}>It's Perfect</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
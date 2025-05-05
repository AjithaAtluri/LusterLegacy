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
  purchaseType: z.enum(["self", "gift_for", "gift_from"]).optional(),
  giftGiver: z.string().optional(),
  occasion: z.enum(["casual", "birthday", "wedding", "anniversary", "special_occasion", "other"]).optional(),
  satisfaction: z.enum(["very_much", "ok", "did_not"]).optional(),
  wouldReturn: z.boolean().default(true),
  // Additional questions from the latest requirements
  orderType: z.enum(["custom_design", "customization", "as_is"]).optional(),
  designTeamExperience: z.enum(["excellent", "good", "fair", "poor"]).optional(),
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
    // Additional questions
    orderType: undefined,
    designTeamExperience: undefined,
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
      
      // Create a completely fresh set of default values
      const freshDefaults: Partial<StoryFormValues> = {
        userId: user?.id || null,
        rating: 0,
        name: user?.username || "",
        email: user?.email || "",
        text: "",
        story: "",
        productType: "",
        location: "",
        imageUrls: [],
        purchaseType: undefined,
        giftGiver: "",
        occasion: undefined,
        satisfaction: undefined,
        wouldReturn: true,
        orderType: undefined,
        designTeamExperience: undefined,
        status: "pending",
        isApproved: false,
      };
      
      // Properly reset the form, then clear any generated testimonials
      form.reset(freshDefaults);
      setGeneratedTestimonial("");
      setUploadedImages([]);
      
      // Reset all the React state
      setIsGeneratingAI(false);
      setIsDialogOpen(false);
      setAiErrorMessage("");
      
      // Invalidate queries to refresh the testimonials list
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
      // CRITICAL FIX: Explicitly get the current values directly from the form state using watch()
      // This gives us the absolutely current values, not the values that might be stale from getValues()
      const currentPurchaseType = form.watch("purchaseType");
      const currentGiftGiver = form.watch("giftGiver");
      const currentName = form.watch("name");
      const currentProductType = form.watch("productType");
      const currentRating = form.watch("rating");
      const currentOccasion = form.watch("occasion");
      const currentSatisfaction = form.watch("satisfaction");
      const currentWouldReturn = form.watch("wouldReturn");
      const currentLocation = form.watch("location");
      const currentOrderType = form.watch("orderType");
      const currentDesignTeamExperience = form.watch("designTeamExperience");
      
      // Extreme debug mode 
      console.log("==== AI TESTIMONIAL GENERATION - DEBUG ====");
      console.log("PURCHASE TYPE (CURRENT):", currentPurchaseType);
      console.log("GIFT GIVER (CURRENT):", currentGiftGiver);
      console.log("==== END DEBUG ====");
      
      // Validate required fields for AI generation
      if (!currentName || !currentProductType || currentRating === 0) {
        setAiErrorMessage("Please fill in your name, product type, and rating before generating AI testimonial");
        setIsGeneratingAI(false);
        return;
      }
      
      // Force the proper purchase type value into the form data to ensure consistency
      if (currentPurchaseType) {
        form.setValue("purchaseType", currentPurchaseType, { shouldValidate: true, shouldDirty: true });
      }
      
      // Use the explicitly watched values to build the AI input data
      // This is critical to fix the gift context issue
      const aiInputData = {
        name: currentName,
        productType: currentProductType,
        rating: currentRating,
        // IMPORTANT: Use the directly watched value, not the potentially stale form value
        purchaseType: currentPurchaseType || "self",
        // IMPORTANT: Use the directly watched value for gift giver
        giftGiver: currentGiftGiver || "",
        occasion: currentOccasion || "casual",
        satisfaction: currentSatisfaction || "very_much", 
        wouldReturn: currentWouldReturn !== undefined ? currentWouldReturn : true,
        location: currentLocation || "",
        orderType: currentOrderType || "as_is",
        designTeamExperience: currentDesignTeamExperience || "good",
        imageUrls: uploadedImages,
      };
      
      // Debug data being sent to API
      console.log("FINAL DATA SENDING TO API:", aiInputData);

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
      console.log("AI testimonial generation response:", result);
      
      // Set the generated brief testimonial in form
      setGeneratedTestimonial(result.generatedTestimonial);
      form.setValue("text", result.generatedTestimonial, { shouldValidate: true });
      
      // Set the longer detailed story if available
      if (result.generatedStory) {
        console.log("Setting generated story:", result.generatedStory);
        form.setValue("story", result.generatedStory, { shouldValidate: true });
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
          <div className="mt-4 p-4 bg-primary/10 rounded-lg border border-primary/20 shadow-sm">
            <h3 className="font-medium text-primary mb-2 flex items-center">
              <Sparkles className="h-4 w-4 mr-2" />
              AI Testimonial Assistant
            </h3>
            <p className="text-sm">
              Our AI can help craft a compelling testimonial based on your experience. Simply fill in your details, upload photos if available, and click the "Generate AI Testimonial" button to create both a brief testimonial and a detailed story that highlights your unique experience.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Two-column layout for basic info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <Input placeholder="City, Country" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </div>
              
              {/* Second row with product type and rating */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </div>
              
              {/* Purchase type and occasion in two columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="purchaseType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Was this purchase for yourself or a gift?</FormLabel>
                      <Select
                        onValueChange={(value: "self" | "gift_for" | "gift_from") => {
                          // Directly set the value in the form
                          field.onChange(value);
                          // Explicitly update the form value to ensure it's changed
                          form.setValue("purchaseType", value, { shouldValidate: true });
                          console.log("PURCHASE TYPE CHANGED TO:", value);
                        }}
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="orderType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What type of order was this?</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select order type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="custom_design">Custom design (created from scratch)</SelectItem>
                      <SelectItem value="customization">Customization of existing product</SelectItem>
                      <SelectItem value="as_is">Standard product (no customization)</SelectItem>
                    </SelectContent>
                  </Select>

                  <FormMessage />
                </FormItem>
              )}
            />
            
            {(form.watch("orderType") === "custom_design" || form.watch("orderType") === "customization") && (
              <FormField
                control={form.control}
                name="designTeamExperience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How was your experience with our design team?</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select experience with design team" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="excellent">Excellent - exceeded expectations</SelectItem>
                        <SelectItem value="good">Good - met expectations</SelectItem>
                        <SelectItem value="fair">Fair - some issues but resolved</SelectItem>
                        <SelectItem value="poor">Poor - did not meet expectations</SelectItem>
                      </SelectContent>
                    </Select>

                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Move image upload higher up in the form */}
            <div className="space-y-2">
              <Label>Images of Your Jewelry (Optional)</Label>
              <FileUploader
                maxFiles={3}
                acceptedFileTypes={["image/jpeg", "image/png", "image/jpg"]}
                maxSizeMB={5}
                endpoint="/api/process-testimonial-image"
                onUploadsComplete={handleImageUploads}
              />
              <p className="text-sm text-muted-foreground">
                Share up to 3 images of your jewelry. Max 5MB per image.
              </p>
            </div>

            {/* Move AI testimonial generation button higher up */}
            <div className="space-y-4 py-4">
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 shadow-sm">
                <Button 
                  type="button" 
                  variant="default" 
                  size="lg"
                  onClick={generateAITestimonial}
                  disabled={isGeneratingAI || storyMutation.isPending}
                  className="w-full flex items-center justify-center bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 transition-all"
                >
                  {isGeneratingAI ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating AI Testimonial...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate AI Testimonial
                    </>
                  )}
                </Button>
                <p className="text-sm text-center mt-2 text-muted-foreground">
                  Let AI help you create the perfect testimonial based on your inputs
                </p>
              </div>
              
              {aiErrorMessage && (
                <p className="text-sm text-red-500">{aiErrorMessage}</p>
              )}
            </div>

            {/* Place testimonial fields below AI generation */}
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

                  </div>
                </FormItem>
              )}
            />

            {/* Update button text to "Share Your Story" */}
            <div className="space-y-4 pt-4">
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
                  "Share Your Story"
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
              <p>Based on your inputs, we've generated two versions of your testimonial:</p>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Brief Testimonial (for testimonial cards):</h4>
                <div className="bg-muted p-4 rounded-md">
                  <p className="italic text-sm font-medium">{generatedTestimonial}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Detailed Story (for your profile):</h4>
                <div className="bg-muted p-4 rounded-md max-h-[200px] overflow-y-auto">
                  <p className="italic text-sm">{form.watch("story") || "No detailed story was generated."}</p>
                </div>
              </div>
              
              <p>Do these capture your experience with Luster Legacy?</p>
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Upload, X, CheckCircle, Image as ImageIcon } from "lucide-react";
import { METAL_TYPES, STONE_TYPES, PAYMENT_TERMS } from "@/lib/constants";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useDropzone } from "react-dropzone";
import { isImageFile, getFileExtension } from "@/lib/utils";
import type { SubmitHandler } from "react-hook-form";
import designProcessImage from "@/assets/amethyst-necklace-design.png";

const designFormSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Please enter a valid email address"),
  metalType: z.string().min(1, "Metal type is required"),
  primaryStone: z.string().min(1, "Primary stone is required"),
  notes: z.string().optional(),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms to continue"
  })
});

type DesignFormValues = z.infer<typeof designFormSchema>;

export default function CustomDesignSection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();
  
  const form = useForm<DesignFormValues>({
    resolver: zodResolver(designFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      metalType: "",
      primaryStone: "",
      notes: "",
      agreeToTerms: false
    }
  });
  
  const onSubmit: SubmitHandler<DesignFormValues> = async (data) => {
    if (!uploadedImage) {
      toast({
        title: "Image required",
        description: "Please upload a reference image for your design.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("designImage", uploadedImage);
      formData.append("data", JSON.stringify(data));
      
      // Send form data to server
      const response = await fetch("/api/custom-design", {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error("Failed to submit design request");
      }
      
      toast({
        title: "Design submitted successfully!",
        description: "We'll review your request and get back to you soon.",
      });
      
      // Reset form and uploaded image
      form.reset();
      setUploadedImage(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error("Design form error:", error);
      toast({
        title: "Error submitting design",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // File upload handling
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/pdf': ['.pdf']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setUploadedImage(file);
        
        // Create preview URL for images
        if (isImageFile(file)) {
          const previewUrl = URL.createObjectURL(file);
          setPreviewUrl(previewUrl);
        } else {
          // For PDFs, just show icon
          setPreviewUrl(null);
        }
      }
    },
    onDropRejected: (fileRejections) => {
      const error = fileRejections[0]?.errors[0];
      let message = "File upload failed";
      
      if (error?.code === "file-too-large") {
        message = "File is too large. Maximum size is 5MB.";
      } else if (error?.code === "file-invalid-type") {
        message = "Invalid file type. Please upload an image or PDF.";
      }
      
      toast({
        title: "Upload Error",
        description: message,
        variant: "destructive"
      });
    }
  });
  
  const removeUploadedFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setUploadedImage(null);
    setPreviewUrl(null);
  };
  
  const renderUploadArea = () => {
    if (uploadedImage) {
      return (
        <div className="mt-2 relative">
          <div className="flex items-center p-4 border border-foreground/20 rounded-lg bg-background/50">
            {previewUrl ? (
              <div className="relative w-20 h-20 mr-4">
                <img 
                  src={previewUrl} 
                  alt="Design preview" 
                  className="w-full h-full object-cover rounded-md"
                />
              </div>
            ) : (
              <div className="w-20 h-20 flex items-center justify-center bg-accent/10 rounded-md mr-4">
                <ImageIcon className="h-10 w-10 text-accent" />
              </div>
            )}
            
            <div className="flex-1">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                <p className="font-montserrat text-sm font-medium text-foreground">
                  {uploadedImage.name}
                </p>
              </div>
              <p className="font-montserrat text-xs text-foreground/60 mt-1">
                {(uploadedImage.size / 1024 / 1024).toFixed(2)} MB • {getFileExtension(uploadedImage.name).toUpperCase()}
              </p>
            </div>
            
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className="ml-2" 
              onClick={removeUploadedFile}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      );
    }
    
    return (
      <div
        {...getRootProps()}
        className={`border-2 border-dashed ${
          isDragActive ? 'border-primary' : 'border-foreground/30'
        } rounded-lg p-6 text-center cursor-pointer hover:border-primary transition duration-300 mt-2`}
      >
        <input {...getInputProps()} />
        <Upload className="h-10 w-10 text-foreground/50 mx-auto mb-3" />
        <p className="font-montserrat text-foreground/70">
          {isDragActive
            ? "Drop your image here..."
            : "Drag and drop your image here, or click to browse"
          }
        </p>
        <p className="font-montserrat text-xs text-foreground/50 mt-2">
          Accepts JPG, PNG, PDF (Max size: 5MB)
        </p>
      </div>
    );
  };
  
  return (
    <section id="customize" className="py-20 px-4 md:px-8 bg-charcoal">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-playfair text-3xl md:text-4xl font-bold text-pearl mb-4">
            Design Your Dream Jewelry
          </h2>
          <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
          <p className="font-montserrat text-lg text-pearl/80 max-w-2xl mx-auto">
            Upload your vision and our master artisans will bring it to life with exquisite craftsmanship.
            From sketch to stunning reality, we're with you at every step.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
          {/* Submit Your Design Section */}
          <div className="bg-background p-8 rounded-lg shadow-xl flex flex-col">
            <h4 className="font-playfair text-2xl font-semibold text-foreground mb-6">Submit Your Design</h4>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="mb-6">
                  <FormLabel className="block font-montserrat text-sm font-medium text-foreground mb-2">
                    Upload Reference Image*
                  </FormLabel>
                  {renderUploadArea()}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <FormField
                    control={form.control}
                    name="metalType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-montserrat text-sm font-medium text-foreground">
                          Metal Type*
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full p-3 border border-foreground/20 rounded font-montserrat text-sm">
                              <SelectValue placeholder="Select metal type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {METAL_TYPES.map((metal) => (
                              <SelectItem key={metal.id} value={metal.id}>
                                {metal.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="primaryStone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-montserrat text-sm font-medium text-foreground">
                          Primary Stones*
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full p-3 border border-foreground/20 rounded font-montserrat text-sm">
                              <SelectValue placeholder="Select stone type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {STONE_TYPES.map((stone) => (
                              <SelectItem key={stone.id} value={stone.id}>
                                {stone.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="mb-6">
                      <FormLabel className="font-montserrat text-sm font-medium text-foreground">
                        Additional Notes
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          rows={4}
                          placeholder="Share specific details about your vision, size requirements, or any other preferences..."
                          className="w-full p-3 border border-foreground/20 rounded font-montserrat text-sm" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="mb-6">
                  <FormLabel className="block font-montserrat text-sm font-medium text-foreground mb-2">
                    Contact Information*
                  </FormLabel>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Full Name" 
                              className="p-3 border border-foreground/20 rounded font-montserrat text-sm" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Email Address" 
                              className="p-3 border border-foreground/20 rounded font-montserrat text-sm" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <FormField
                  control={form.control}
                  name="agreeToTerms"
                  render={({ field }) => (
                    <FormItem className="mb-6 flex items-start space-x-2">
                      <FormControl>
                        <Checkbox 
                          checked={field.value} 
                          onCheckedChange={field.onChange} 
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="font-montserrat text-sm text-foreground/70">
                          I understand that if my design is accepted, a ${PAYMENT_TERMS.cadFee} {PAYMENT_TERMS.cadFeeDescription} will be required before work begins. This fee will be adjusted against my final order.
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                
                <div className="flex flex-col">
                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full font-montserrat font-medium bg-primary text-background hover:bg-accent transition duration-300"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Design Request"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
          
          {/* Our Design Process */}
          <div className="bg-background p-8 rounded-lg shadow-xl flex flex-col">
            <h4 className="font-playfair text-2xl font-semibold text-foreground mb-6 text-center">Our Design Consultation Process</h4>
            
            <div className="space-y-4 mb-auto">
              <div className="flex items-start p-4 rounded-lg bg-background/50 border border-foreground/10 hover:border-primary/30 hover:bg-primary/5 transition-colors">
                <div className="bg-primary text-pearl w-8 h-8 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">1</div>
                <div>
                  <h5 className="font-playfair text-lg font-semibold text-foreground mb-1">Initial Design Consultation</h5>
                  <p className="font-montserrat text-sm text-foreground/70">Share your vision with our expert designers who will guide you through the possibilities</p>
                </div>
              </div>
              
              <div className="flex items-start p-4 rounded-lg bg-background/50 border border-foreground/10 hover:border-primary/30 hover:bg-primary/5 transition-colors">
                <div className="bg-primary text-pearl w-8 h-8 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">2</div>
                <div>
                  <h5 className="font-playfair text-lg font-semibold text-foreground mb-1">CAD Design Development</h5>
                  <p className="font-montserrat text-sm text-foreground/70">Our designers create detailed 3D renderings of your custom piece for your review</p>
                </div>
              </div>
              
              <div className="flex items-start p-4 rounded-lg bg-background/50 border border-foreground/10 hover:border-primary/30 hover:bg-primary/5 transition-colors">
                <div className="bg-primary text-pearl w-8 h-8 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">3</div>
                <div>
                  <h5 className="font-playfair text-lg font-semibold text-foreground mb-1">Design Refinements</h5>
                  <p className="font-montserrat text-sm text-foreground/70">We'll incorporate your feedback to perfect every detail until you're completely satisfied</p>
                </div>
              </div>
              
              <div className="flex items-start p-4 rounded-lg bg-background/50 border border-foreground/10 hover:border-primary/30 hover:bg-primary/5 transition-colors">
                <div className="bg-primary text-pearl w-8 h-8 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">4</div>
                <div>
                  <h5 className="font-playfair text-lg font-semibold text-foreground mb-1">Final Design Approval</h5>
                  <p className="font-montserrat text-sm text-foreground/70">Approve your custom design to proceed to creation with a 50% advance payment</p>
                </div>
              </div>
            </div>
            
            <div className="mt-auto text-center">
              <img 
                src={designProcessImage} 
                alt="Custom jewelry design process" 
                className="rounded-lg shadow-md w-full h-60 object-cover hover:scale-[1.02] transition-transform duration-300"
              />
              <p className="font-montserrat text-xs text-foreground/70 mt-2 italic">
                From raw lavender quartz gemstones to exquisite handcrafted necklace
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

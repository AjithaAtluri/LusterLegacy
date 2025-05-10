import { Helmet } from "react-helmet";
import ContactSection from "@/components/home/contact-section";
import { Mail } from "lucide-react";
import { COMPANY } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const contactFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(2, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters")
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: ""
    }
  });
  
  const onSubmit = async (data: ContactFormValues) => {
    setIsSubmitting(true);
    
    try {
      await apiRequest("POST", "/api/contact", data);
      
      toast({
        title: "Message sent!",
        description: "We'll get back to you soon."
      });
      
      form.reset();
    } catch (error) {
      console.error("Contact form error:", error);
      toast({
        title: "Error sending message",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Contact Us | Luster Legacy</title>
        <meta name="description" content="Get in touch with our team for personalized assistance with your luxury jewelry needs. We're here to help with custom designs, inquiries and more." />
      </Helmet>
      
      <div className="bg-charcoal py-20">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <h1 className="font-playfair text-3xl md:text-5xl font-bold text-pearl mb-4">Contact Us</h1>
          <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
          <p className="font-cormorant text-lg md:text-xl text-pearl/80 max-w-2xl mx-auto">
            We'd love to hear from you. Reach out for consultations, inquiries, or to discuss your custom jewelry needs.
          </p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 md:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="font-playfair text-2xl font-bold text-foreground mb-6">Get In Touch</h2>
            <p className="font-montserrat text-foreground/80 mb-8">
              Our team of jewelry experts is ready to assist you with any questions about our collections, custom design process, or special requests. Whether you're looking for a bespoke creation or need guidance on selecting the perfect piece, we're here to help.
            </p>
            
            <div className="space-y-6">
              <div className="flex">
                <div className="flex-shrink-0 mr-4">
                  <div className="bg-primary w-10 h-10 rounded-full flex items-center justify-center">
                    <Mail className="h-5 w-5 text-background" />
                  </div>
                </div>
                <div>
                  <h4 className="font-playfair text-lg font-semibold text-foreground mb-1">Email Us</h4>
                  <p className="font-montserrat text-foreground/80">
                    <a href={`mailto:${COMPANY.email}`} className="hover:text-primary transition duration-300">
                      {COMPANY.email}
                    </a>
                  </p>
                  <p className="font-montserrat text-sm text-foreground/60 mt-1">
                    We usually respond within 24 hours
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-10">
              <h3 className="font-playfair text-xl font-semibold text-foreground mb-6">Follow Us</h3>
              <div className="flex space-x-6">
                <a 
                  href={COMPANY.social.instagram} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-primary text-background hover:bg-accent transition duration-300 h-12 w-12 rounded-full flex items-center justify-center"
                  aria-label="Instagram"
                >
                  <i className="fab fa-instagram text-xl"></i>
                </a>
                <a 
                  href={COMPANY.social.facebook} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-primary text-background hover:bg-accent transition duration-300 h-12 w-12 rounded-full flex items-center justify-center"
                  aria-label="Facebook"
                >
                  <i className="fab fa-facebook-f text-xl"></i>
                </a>
                <a 
                  href={COMPANY.social.pinterest} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-primary text-background hover:bg-accent transition duration-300 h-12 w-12 rounded-full flex items-center justify-center"
                  aria-label="Pinterest"
                >
                  <i className="fab fa-pinterest-p text-xl"></i>
                </a>
              </div>
            </div>
          </div>
          
          <div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="bg-card rounded-lg shadow-lg p-8">
                <h3 className="font-playfair text-2xl font-semibold text-foreground mb-6">Send Us a Message</h3>
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="mb-6">
                      <FormLabel className="font-montserrat text-sm font-medium text-foreground">
                        Your Name*
                      </FormLabel>
                      <FormControl>
                        <Input {...field} className="w-full p-3 border border-foreground/20 rounded font-montserrat text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="mb-6">
                      <FormLabel className="font-montserrat text-sm font-medium text-foreground">
                        Email Address*
                      </FormLabel>
                      <FormControl>
                        <Input {...field} className="w-full p-3 border border-foreground/20 rounded font-montserrat text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem className="mb-6">
                      <FormLabel className="font-montserrat text-sm font-medium text-foreground">
                        Subject*
                      </FormLabel>
                      <FormControl>
                        <Input {...field} className="w-full p-3 border border-foreground/20 rounded font-montserrat text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem className="mb-6">
                      <FormLabel className="font-montserrat text-sm font-medium text-foreground">
                        Message*
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          rows={5}
                          className="w-full p-3 border border-foreground/20 rounded resize-none font-montserrat text-sm" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-md transition duration-300"
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </>
  );
}

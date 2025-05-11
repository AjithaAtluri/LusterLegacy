import { Helmet } from "react-helmet";
import ContactSection from "@/components/home/contact-section";
import { Mail, Check, UserPlus, Gift, Clock, History, HeartHandshake } from "lucide-react";
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
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

const contactFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(2, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters")
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
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
      
      if (!user) {
        setIsSubmitted(true);
      }
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
      
      {/* FAQ Reference */}
      <div className="container mx-auto px-4 md:px-8 py-10 bg-muted/30">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-playfair text-2xl font-bold text-foreground mb-4">Have Questions About Our Services?</h2>
          <p className="font-montserrat text-foreground/80 mb-6">
            We offer three distinct services to meet your jewelry needs: Custom Design, Final Quote, and Personalization.
            Learn about pricing, timelines, materials, and the differences between each service.
          </p>
          <Button asChild variant="default" size="lg" className="min-w-[200px]">
            <Link href="/faq" className="flex items-center gap-2">
              <span>Visit Our FAQ Page</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right">
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </svg>
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="container mx-auto px-4 md:px-8 py-16">
        {isSubmitted && !user ? (
          <div className="max-w-3xl mx-auto mb-16">
            <div className="bg-card rounded-lg shadow-lg p-8">
              <div className="text-center mb-8">
                <div className="mb-4 w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <Check className="w-10 h-10" />
                </div>
                <h2 className="font-playfair text-2xl font-bold text-foreground mb-2">Message Sent Successfully!</h2>
                <p className="font-montserrat text-foreground/80">
                  Thank you for reaching out. Our team will get back to you within 24 hours.
                </p>
              </div>
              
              <hr className="my-6 border-border" />
              
              <div className="mb-8">
                <h3 className="font-playfair text-xl font-bold text-foreground mb-4 text-center">Create an Account for a Better Experience</h3>
                <p className="font-montserrat text-center text-foreground/80 mb-6">
                  Join Luster Legacy today and enjoy these exclusive benefits:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <History className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h4 className="font-playfair text-md font-semibold text-foreground">Message History</h4>
                      <p className="font-montserrat text-sm text-foreground/70">
                        Keep track of all your previous inquiries and our responses in one place.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Clock className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h4 className="font-playfair text-md font-semibold text-foreground">Faster Responses</h4>
                      <p className="font-montserrat text-sm text-foreground/70">
                        Get priority support and faster responses to all your questions.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <HeartHandshake className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h4 className="font-playfair text-md font-semibold text-foreground">Personalized Experience</h4>
                      <p className="font-montserrat text-sm text-foreground/70">
                        Receive jewelry recommendations based on your preferences and browsing history.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Gift className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h4 className="font-playfair text-md font-semibold text-foreground">Exclusive Updates</h4>
                      <p className="font-montserrat text-sm text-foreground/70">
                        Be the first to know about new collections, special offers, and limited editions.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild variant="default" className="flex-1 py-6">
                  <Link href="/auth?signup=true">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create an Account
                  </Link>
                </Button>
                <Button asChild variant="outline" className="flex-1 py-6">
                  <Link href="/auth">
                    Sign In
                  </Link>
                </Button>
              </div>
              
              <p className="text-center text-sm text-foreground/60 mt-6">
                Don't worry, you can still browse our collections without an account
              </p>
              <div className="flex justify-center mt-4">
                <Button asChild variant="link" className="text-primary">
                  <Link href="/">
                    Return to Homepage
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        ) : (
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
        )}
      </div>
    </>
  );
}

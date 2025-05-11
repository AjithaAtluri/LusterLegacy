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
      
      {/* FAQ Section */}
      <div className="container mx-auto px-4 md:px-8 py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-playfair text-3xl font-bold text-foreground mb-6 text-center">Frequently Asked Questions</h2>
          <p className="font-montserrat text-foreground/80 mb-10 text-center">
            Here's everything you need to know about our services and how we can bring your jewelry visions to life.
          </p>
          
          <div className="space-y-8">
            {/* Custom Design Service */}
            <Card>
              <CardHeader>
                <CardTitle className="font-playfair text-xl text-primary">Custom Design Service</CardTitle>
                <CardDescription>Create a completely new, unique piece of jewelry from your imagination</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">What is the Custom Design service?</h4>
                  <p className="text-foreground/80 text-sm">
                    Our Custom Design service is for clients who want to create a completely new piece of jewelry from scratch. 
                    This service is ideal for unique designs that aren't in our existing collection.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground mb-2">What is the process?</h4>
                  <ol className="text-foreground/80 text-sm list-decimal pl-5 space-y-1">
                    <li>Submit your design idea and pay a $150 consultation fee</li>
                    <li>Our designers create initial concept sketches/mockups</li>
                    <li>You receive up to 4 iterations to refine the design</li>
                    <li>Once approved, we provide a final quote for production</li>
                    <li>Upon payment, production begins with regular updates</li>
                    <li>The finished piece is delivered to you</li>
                  </ol>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground mb-2">What does the $150 consultation fee cover?</h4>
                  <p className="text-foreground/80 text-sm">
                    The fee covers professional design consultation, up to 4 design iterations, detailed material 
                    recommendations, and a final production quote. This fee is credited toward your final purchase if you proceed with production.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground mb-2">How long does the custom design process take?</h4>
                  <p className="text-foreground/80 text-sm">
                    Design phase: 2-3 weeks depending on complexity and iterations<br />
                    Production: 4-8 weeks after design approval
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Final Quote Service */}
            <Card>
              <CardHeader>
                <CardTitle className="font-playfair text-xl text-primary">Final Quote Service</CardTitle>
                <CardDescription>Get an exact price for a piece from our collection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">What is the Final Quote service?</h4>
                  <p className="text-foreground/80 text-sm">
                    Our Final Quote service allows you to request an official price confirmation for any piece from our 
                    existing catalog in its original form without modifications.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground mb-2">When should I use this service?</h4>
                  <p className="text-foreground/80 text-sm">
                    Use this service when you're ready to purchase a catalog item and need a final price confirmation 
                    that accounts for current material costs and any additional services like engraving or gift wrapping.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Is there a fee for getting a final quote?</h4>
                  <p className="text-foreground/80 text-sm">
                    No, final quotes for catalog items are provided complimentary with no obligation to purchase.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground mb-2">How long is my quote valid?</h4>
                  <p className="text-foreground/80 text-sm">
                    Final quotes are valid for 14 days from issuance. After this period, price adjustments may 
                    be necessary due to fluctuations in precious metal and gemstone markets.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Personalization Service */}
            <Card>
              <CardHeader>
                <CardTitle className="font-playfair text-xl text-primary">Personalization Service</CardTitle>
                <CardDescription>Modify an existing piece from our collection to suit your preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">What is the Personalization service?</h4>
                  <p className="text-foreground/80 text-sm">
                    Our Personalization service allows you to request modifications to our existing catalog pieces, 
                    such as changing the metal type, gemstones, or size.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground mb-2">What types of personalizations can I request?</h4>
                  <p className="text-foreground/80 text-sm">
                    Common personalizations include:
                  </p>
                  <ul className="text-foreground/80 text-sm list-disc pl-5 space-y-1">
                    <li>Changing metal type (e.g., from yellow gold to white gold)</li>
                    <li>Substituting gemstones (e.g., ruby instead of sapphire)</li>
                    <li>Size adjustments and length modifications</li>
                    <li>Adding engraving or personal inscriptions</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Is there a fee for personalization requests?</h4>
                  <p className="text-foreground/80 text-sm">
                    There is no fee for submitting a personalization request. After reviewing your request, 
                    we will provide a price quote for the modified piece.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground mb-2">What materials do you offer?</h4>
                  <p className="text-foreground/80 text-sm">
                    <strong>Metals:</strong> 18K yellow gold, 18K white gold, 18K rose gold, platinum<br />
                    <strong>Gemstones:</strong> Diamonds (natural and lab-grown), rubies, sapphires, emeralds, tanzanite, 
                    as well as semi-precious stones like amethyst, topaz, and aquamarine
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground mb-2">How long does a personalization take?</h4>
                  <p className="text-foreground/80 text-sm">
                    Personalized pieces typically take 3-6 weeks to produce after your order confirmation, 
                    depending on the complexity of the modifications.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* General FAQs */}
            <Card>
              <CardHeader>
                <CardTitle className="font-playfair text-xl text-primary">General Information</CardTitle>
                <CardDescription>Pricing, shipping, and other important details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">How are prices determined?</h4>
                  <p className="text-foreground/80 text-sm">
                    Our prices are based on material costs (metal weight, gemstone type and quality), craftsmanship complexity, 
                    and design exclusivity. All prices include our designer's expertise and premium craftsmanship.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground mb-2">What payment methods do you accept?</h4>
                  <p className="text-foreground/80 text-sm">
                    We accept bank transfers, major credit cards, and select cryptocurrency payments. For custom pieces, 
                    we typically require a 50% deposit to begin production with the balance due prior to shipping.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Do you offer international shipping?</h4>
                  <p className="text-foreground/80 text-sm">
                    Yes, we ship worldwide with fully insured delivery. International shipments may incur customs duties 
                    or import taxes, which are the responsibility of the recipient.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground mb-2">What is your quality guarantee?</h4>
                  <p className="text-foreground/80 text-sm">
                    All Luster Legacy pieces come with a certificate of authenticity and a 1-year warranty against 
                    manufacturing defects. We also offer complimentary cleaning and inspection services.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
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

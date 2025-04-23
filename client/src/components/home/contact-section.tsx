import { Mail, Phone, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { COMPANY } from "@/lib/constants";

const contactFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters")
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function ContactSection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
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
  
  const handleWhatsApp = () => {
    window.open(`https://wa.me/${COMPANY.whatsapp}`, "_blank");
  };
  
  return (
    <section id="contact" className="py-20 px-4 md:px-8 bg-charcoal">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="font-playfair text-3xl md:text-4xl font-bold text-pearl mb-4">Contact Us</h2>
            <div className="w-24 h-1 bg-primary mb-8"></div>
            
            <p className="font-montserrat text-pearl/80 mb-8">
              Have questions about our pieces or the custom design process? Reach out to our team for personalized assistance.
            </p>
            
            <div className="space-y-6">
              {/* Email */}
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-4">
                  <div className="bg-primary w-10 h-10 rounded-full flex items-center justify-center">
                    <Mail className="h-5 w-5 text-background" />
                  </div>
                </div>
                <div>
                  <h4 className="font-playfair text-lg font-semibold text-pearl mb-1">Email Us</h4>
                  <p className="font-montserrat text-pearl/80">
                    <a href={`mailto:${COMPANY.email}`} className="hover:text-primary transition duration-300">
                      {COMPANY.email}
                    </a>
                  </p>
                </div>
              </div>
              
              {/* Phone */}
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-4">
                  <div className="bg-primary w-10 h-10 rounded-full flex items-center justify-center">
                    <Phone className="h-5 w-5 text-background" />
                  </div>
                </div>
                <div>
                  <h4 className="font-playfair text-lg font-semibold text-pearl mb-1">Call Us</h4>
                  <p className="font-montserrat text-pearl/80">
                    <a href={`tel:${COMPANY.phone}`} className="hover:text-primary transition duration-300">
                      {COMPANY.phone}
                    </a>
                  </p>
                </div>
              </div>
              
              {/* WhatsApp */}
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-4">
                  <div className="bg-primary w-10 h-10 rounded-full flex items-center justify-center">
                    <i className="fab fa-whatsapp text-background text-xl"></i>
                  </div>
                </div>
                <div>
                  <h4 className="font-playfair text-lg font-semibold text-pearl mb-1">WhatsApp Consultation</h4>
                  <p className="font-montserrat text-pearl/80">
                    <Button 
                      onClick={handleWhatsApp}
                      className="text-background bg-[#25D366] hover:bg-[#128C7E] px-4 py-2 rounded inline-flex items-center mt-2 transition duration-300 h-auto"
                    >
                      <i className="fab fa-whatsapp mr-2"></i> Start Chat
                    </Button>
                  </p>
                </div>
              </div>
              
              {/* Address */}
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-4">
                  <div className="bg-primary w-10 h-10 rounded-full flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-background" />
                  </div>
                </div>
                <div>
                  <h4 className="font-playfair text-lg font-semibold text-pearl mb-1">Visit By Appointment</h4>
                  <p className="font-montserrat text-pearl/80">
                    {COMPANY.address.line1}<br />
                    {COMPANY.address.line2}<br />
                    {COMPANY.address.city}, {COMPANY.address.state} {COMPANY.address.postalCode}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="bg-background rounded-lg shadow-lg p-8">
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
                  name="phone"
                  render={({ field }) => (
                    <FormItem className="mb-6">
                      <FormLabel className="font-montserrat text-sm font-medium text-foreground">
                        Phone Number
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
                        Your Message*
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          rows={4}
                          className="w-full p-3 border border-foreground/20 rounded font-montserrat text-sm" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full font-montserrat font-medium bg-primary text-background px-6 py-3 rounded hover:bg-accent transition duration-300 h-auto"
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </section>
  );
}

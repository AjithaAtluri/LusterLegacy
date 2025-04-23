import { Helmet } from "react-helmet";
import ContactSection from "@/components/home/contact-section";
import { MapPin, Mail, Phone, Clock } from "lucide-react";
import { COMPANY } from "@/lib/constants";

export default function Contact() {
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
            We'd love to hear from you. Reach out for consultations, inquiries, or to schedule a visit to our design studio.
          </p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 md:px-8 py-12">
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
              
              <div className="flex">
                <div className="flex-shrink-0 mr-4">
                  <div className="bg-primary w-10 h-10 rounded-full flex items-center justify-center">
                    <Phone className="h-5 w-5 text-background" />
                  </div>
                </div>
                <div>
                  <h4 className="font-playfair text-lg font-semibold text-foreground mb-1">Call Us</h4>
                  <p className="font-montserrat text-foreground/80">
                    <a href={`tel:${COMPANY.phone}`} className="hover:text-primary transition duration-300">
                      {COMPANY.phone}
                    </a>
                  </p>
                  <p className="font-montserrat text-sm text-foreground/60 mt-1">
                    Mon-Sat, 10:00 AM - 7:00 PM IST
                  </p>
                </div>
              </div>
              
              <div className="flex">
                <div className="flex-shrink-0 mr-4">
                  <div className="bg-primary w-10 h-10 rounded-full flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-background" />
                  </div>
                </div>
                <div>
                  <h4 className="font-playfair text-lg font-semibold text-foreground mb-1">Visit Our Design Studio</h4>
                  <p className="font-montserrat text-foreground/80">
                    {COMPANY.address.line1}<br />
                    {COMPANY.address.line2}<br />
                    {COMPANY.address.city}, {COMPANY.address.state} {COMPANY.address.postalCode}
                  </p>
                </div>
              </div>
              
              <div className="flex">
                <div className="flex-shrink-0 mr-4">
                  <div className="bg-primary w-10 h-10 rounded-full flex items-center justify-center">
                    <Clock className="h-5 w-5 text-background" />
                  </div>
                </div>
                <div>
                  <h4 className="font-playfair text-lg font-semibold text-foreground mb-1">Studio Hours</h4>
                  <p className="font-montserrat text-foreground/80">
                    Monday to Saturday: 10:00 AM - 7:00 PM<br />
                    Sunday: By appointment only
                  </p>
                  <p className="font-montserrat text-sm text-foreground/60 mt-1">
                    We recommend scheduling an appointment for personalized attention
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative h-[400px] md:h-full min-h-[400px]">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3771.1079692629703!2d72.8147823744364!3d19.07576228259785!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c9c676018b43%3A0x7334fe67c447207b!2sBandra%20West%2C%20Mumbai%2C%20Maharashtra%20400050!5e0!3m2!1sen!2sin!4v1689329546547!5m2!1sen!2sin" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen={true} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              className="rounded-lg shadow-lg"
              title="Luster Legacy Location"
            ></iframe>
          </div>
        </div>
        
        <ContactSection />
        
        <div className="mt-16 text-center">
          <h2 className="font-playfair text-2xl font-bold text-foreground mb-4">Follow Us</h2>
          <p className="font-montserrat text-foreground/80 mb-6">
            Stay updated with our latest collections, design inspirations, and events
          </p>
          <div className="flex justify-center space-x-6">
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
    </>
  );
}

import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { COMPANY } from "@/lib/constants";
import { Instagram, Facebook, Linkedin, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Footer() {
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }
    
    // TODO: Implement newsletter subscription
    toast({
      title: "Thank you for subscribing!",
      description: "You'll receive our latest updates soon.",
    });
    
    setEmail("");
  };
  
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-charcoal text-pearl">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand & Social */}
          <div>
            <Link href="/" className="font-playfair text-3xl font-bold text-pearl mb-6 block">
              Luster<span className="text-primary">Legacy</span>
            </Link>
            <p className="font-montserrat text-pearl/70 mb-6">
              Custom luxury jewelry crafted with precision and passion. Each piece tells a unique story.
            </p>
            <div className="flex space-x-4">
              <a 
                href={COMPANY.social.instagram} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-pearl hover:text-primary transition duration-300"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href={COMPANY.social.facebook} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-pearl hover:text-primary transition duration-300"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href={COMPANY.social.pinterest} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-pearl hover:text-primary transition duration-300"
                aria-label="Linkedin"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="font-playfair text-xl font-semibold text-pearl mb-6">Quick Links</h3>
            <ul className="font-montserrat space-y-3">
              <li>
                <Link href="/collections" className="text-pearl/70 hover:text-primary transition duration-300">
                  Collections
                </Link>
              </li>
              <li>
                <Link href="/custom-design" className="text-pearl/70 hover:text-primary transition duration-300">
                  Custom Design
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-pearl/70 hover:text-primary transition duration-300">
                  Our Story
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-pearl/70 hover:text-primary transition duration-300">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Customer Care */}
          <div>
            <h3 className="font-playfair text-xl font-semibold text-pearl mb-6">Customer Care</h3>
            <ul className="font-montserrat space-y-3">
              <li>
                <Link href="/shipping" className="text-pearl/70 hover:text-primary transition duration-300">
                  Shipping & Delivery
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-pearl/70 hover:text-primary transition duration-300">
                  Returns & Exchanges
                </Link>
              </li>
              <li>
                <Link href="/repairs" className="text-pearl/70 hover:text-primary transition duration-300">
                  Repair Services
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-pearl/70 hover:text-primary transition duration-300">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Newsletter */}
          <div>
            <h3 className="font-playfair text-xl font-semibold text-pearl mb-6">Newsletter</h3>
            <p className="font-montserrat text-pearl/70 mb-4">
              Subscribe to receive updates, access to exclusive deals, and more.
            </p>
            <form className="flex" onSubmit={handleSubmit}>
              <Input
                type="email"
                placeholder="Your email address"
                className="flex-grow bg-charcoal border-pearl/30 rounded-l text-pearl focus:border-primary"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button type="submit" className="bg-primary rounded-r hover:bg-accent transition duration-300 px-3">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
        
        {/* Bottom Footer */}
        <div className="py-6 border-t border-pearl/20 flex flex-col md:flex-row justify-between items-center">
          <p className="font-montserrat text-sm text-pearl/50 mb-4 md:mb-0">
            &copy; {currentYear} Luster Legacy. All rights reserved.
          </p>
          <div className="flex space-x-4 font-montserrat text-sm text-pearl/50">
            <Link href="/privacy" className="hover:text-primary transition duration-300">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-primary transition duration-300">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

import { Link } from "wouter";
import { COMPANY } from "@/lib/constants";
import { Instagram, Facebook } from "lucide-react";
import { BsPinterest } from "react-icons/bs";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-charcoal text-pearl">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                aria-label="Pinterest"
              >
                <BsPinterest className="h-5 w-5" />
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
                <Link href="/faq" className="text-pearl/70 hover:text-primary transition duration-300">
                  FAQ
                </Link>
              </li>
            </ul>
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

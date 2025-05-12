import { Helmet } from "react-helmet";
import DesignForm from "@/components/custom-design/design-form";
import { CheckCircle, Clock, HelpCircle, FileImage, ArrowRight, PenLine } from "lucide-react";
import { PAYMENT_TERMS } from "@/lib/constants";

export default function CustomDesign() {
  return (
    <>
      <Helmet>
        <title>Custom Design | Luster Legacy</title>
        <meta name="description" content="Create your dream jewelry. Upload your design and our master artisans will bring your vision to life with exceptional craftsmanship." />
      </Helmet>
      
      {/* Hero section */}
      <div className="bg-charcoal py-20">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <h1 className="font-playfair text-3xl md:text-5xl font-bold text-pearl mb-4">Custom Design</h1>
          <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
          <p className="font-cormorant text-lg md:text-xl text-pearl/80 max-w-2xl mx-auto">
            Transform your vision into exquisite reality. Our master artisans will craft your dream jewelry with unparalleled attention to detail.
          </p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 md:px-8 py-12">
        {/* Form first - displays prominently on both mobile and desktop */}
        <div className="mx-auto max-w-2xl mb-16">
          <div className="bg-card rounded-lg shadow-lg">
            <DesignForm />
          </div>
        </div>
        
        {/* Process steps - full width, visually appealing timeline */}
        <div className="mb-16">
          <h2 className="font-playfair text-2xl font-bold text-foreground mb-8 text-center">
            How Our Custom Design Process Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-card/50 rounded-lg p-6 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary w-12 h-12 rounded-full flex items-center justify-center">
                <FileImage className="h-6 w-6 text-background" />
              </div>
              <div className="mt-6 text-center">
                <h3 className="font-playfair text-lg font-semibold text-foreground mb-3">1. Share Your Vision</h3>
                <p className="font-montserrat text-foreground/70">
                  Upload a sketch, reference photo, or inspiration for your dream jewelry piece. Include as many details as possible.
                </p>
              </div>
            </div>
            
            <div className="bg-card/50 rounded-lg p-6 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary w-12 h-12 rounded-full flex items-center justify-center">
                <PenLine className="h-6 w-6 text-background" />
              </div>
              <div className="mt-6 text-center">
                <h3 className="font-playfair text-lg font-semibold text-foreground mb-3">2. CAD Model & Quote</h3>
                <p className="font-montserrat text-foreground/70">
                  Our design team will create a detailed CAD model and provide a quote. A ${PAYMENT_TERMS.cadFee} {PAYMENT_TERMS.cadFeeDescription} applies.
                </p>
              </div>
            </div>
            
            <div className="bg-card/50 rounded-lg p-6 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary w-12 h-12 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-background" />
              </div>
              <div className="mt-6 text-center">
                <h3 className="font-playfair text-lg font-semibold text-foreground mb-3">3. Approval & Payment</h3>
                <p className="font-montserrat text-foreground/70">
                  Once you approve the design, a 50% advance payment begins the crafting process. Remaining balance due before shipping.
                </p>
              </div>
            </div>
            
            <div className="bg-card/50 rounded-lg p-6 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary w-12 h-12 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-background" />
              </div>
              <div className="mt-6 text-center">
                <h3 className="font-playfair text-lg font-semibold text-foreground mb-3">4. Creation & Delivery</h3>
                <p className="font-montserrat text-foreground/70">
                  Our master artisans handcraft your jewelry with meticulous attention to detail. Typical creation time: 3-4 weeks.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* FAQ Section - at the bottom */}
        <div className="bg-muted/30 p-8 rounded-lg max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-6 md:mb-0 md:mr-8">
              <h2 className="font-playfair text-2xl font-bold text-foreground mb-3">Have Questions?</h2>
              <p className="font-montserrat text-foreground/70 max-w-md">
                Visit our FAQ page for answers to common questions about our custom design process, 
                materials, timelines, pricing, and more.
              </p>
            </div>
            <a 
              href="/faq" 
              className="inline-flex items-center px-8 py-4 rounded-md bg-primary text-background hover:bg-primary/90 font-medium transition-colors"
            >
              View FAQ <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

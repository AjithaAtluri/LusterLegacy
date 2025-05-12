import { Helmet } from "react-helmet";
import DesignForm from "@/components/custom-design/design-form";
import { CheckCircle, Clock, HelpCircle, FileImage } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PAYMENT_TERMS } from "@/lib/constants";

export default function CustomDesign() {
  return (
    <>
      <Helmet>
        <title>Custom Design | Luster Legacy</title>
        <meta name="description" content="Create your dream jewelry. Upload your design and our master artisans will bring your vision to life with exceptional craftsmanship." />
      </Helmet>
      
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="font-playfair text-2xl font-bold text-foreground mb-6">How Our Custom Design Process Works</h2>
            
            <div className="space-y-8">
              <div className="flex">
                <div className="flex-shrink-0 mr-4">
                  <div className="bg-primary w-10 h-10 rounded-full flex items-center justify-center">
                    <FileImage className="h-5 w-5 text-background" />
                  </div>
                </div>
                <div>
                  <h3 className="font-playfair text-lg font-semibold text-foreground mb-2">Share Your Vision</h3>
                  <p className="font-montserrat text-foreground/70">
                    Upload a sketch, reference photo, or inspiration for your dream jewelry piece. Include as many details as possible to help us understand your vision.
                  </p>
                </div>
              </div>
              
              <div className="flex">
                <div className="flex-shrink-0 mr-4">
                  <div className="bg-primary w-10 h-10 rounded-full flex items-center justify-center">
                    <HelpCircle className="h-5 w-5 text-background" />
                  </div>
                </div>
                <div>
                  <h3 className="font-playfair text-lg font-semibold text-foreground mb-2">CAD Model & Quote</h3>
                  <p className="font-montserrat text-foreground/70">
                    Our design team will create a detailed CAD model for your approval and provide a comprehensive quote. If your design is accepted, a ${PAYMENT_TERMS.cadFee} {PAYMENT_TERMS.cadFeeDescription} will be required before design work begins, which is fully adjustable against your final order.
                  </p>
                </div>
              </div>
              
              <div className="flex">
                <div className="flex-shrink-0 mr-4">
                  <div className="bg-primary w-10 h-10 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-background" />
                  </div>
                </div>
                <div>
                  <h3 className="font-playfair text-lg font-semibold text-foreground mb-2">Approval & Payment</h3>
                  <p className="font-montserrat text-foreground/70">
                    Once you approve the design, a 50% advance payment is required to begin crafting your piece. The remaining balance is due upon completion, before shipping.
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
                  <h3 className="font-playfair text-lg font-semibold text-foreground mb-2">Creation & Delivery</h3>
                  <p className="font-montserrat text-foreground/70">
                    Our master artisans will carefully handcraft your jewelry with meticulous attention to detail. The typical creation time is 3-4 weeks, depending on complexity.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-12 bg-muted/30 p-6 rounded-lg">
              <h2 className="font-playfair text-2xl font-bold text-foreground mb-3">Have Questions?</h2>
              <p className="font-montserrat text-foreground/70 mb-4">
                Visit our FAQ page for answers to common questions about custom design process, 
                materials, timelines, and more.
              </p>
              <a 
                href="/faq" 
                className="inline-flex items-center px-6 py-3 rounded-md bg-primary text-background hover:bg-primary/90 font-medium transition-colors"
              >
                View FAQ
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </a>
            </div>
          </div>
          
          <div className="bg-card rounded-lg shadow-lg">
            <DesignForm />
          </div>
        </div>
      </div>
    </>
  );
}

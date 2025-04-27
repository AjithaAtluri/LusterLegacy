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
                    Our design team will create a detailed CAD model for your approval and provide a comprehensive quote. If your design is accepted, a ${PAYMENT_TERMS.cadFee} {PAYMENT_TERMS.cadFeeDescription} will be required before work begins, which is fully adjustable against your final order.
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
            
            <div className="mt-12">
              <h2 className="font-playfair text-2xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="font-playfair text-lg font-medium">
                    What types of custom jewelry can you create?
                  </AccordionTrigger>
                  <AccordionContent className="font-montserrat text-foreground/70">
                    We can create virtually any type of fine jewelry, including necklaces, earrings, rings, bracelets, and pendants. Our expertise spans traditional designs with modern touches to completely contemporary pieces.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-2">
                  <AccordionTrigger className="font-playfair text-lg font-medium">
                    How long does the custom design process take?
                  </AccordionTrigger>
                  <AccordionContent className="font-montserrat text-foreground/70">
                    The timeline varies by complexity, but typically includes: 3-5 days for initial CAD design, 1-2 days for revisions, and 3-4 weeks for crafting after approval. Complex pieces may take longer.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-3">
                  <AccordionTrigger className="font-playfair text-lg font-medium">
                    Can you recreate a piece from a photograph?
                  </AccordionTrigger>
                  <AccordionContent className="font-montserrat text-foreground/70">
                    Yes, we can recreate pieces from clear photographs or sketches. We can also incorporate modifications to make the piece uniquely yours while honoring the original design's essence.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-4">
                  <AccordionTrigger className="font-playfair text-lg font-medium">
                    What if I'm not satisfied with the final piece?
                  </AccordionTrigger>
                  <AccordionContent className="font-montserrat text-foreground/70">
                    Customer satisfaction is our priority. If there are manufacturing defects, we offer free repairs. We work closely with clients at the CAD approval stage to ensure the final piece meets expectations, as custom pieces cannot be returned once approved and created.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-5">
                  <AccordionTrigger className="font-playfair text-lg font-medium">
                    Do you provide certificates for gemstones?
                  </AccordionTrigger>
                  <AccordionContent className="font-montserrat text-foreground/70">
                    Yes, we provide certification for all precious gemstones from internationally recognized laboratories. For custom pieces with client-provided stones, we can arrange certification services at an additional cost.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
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

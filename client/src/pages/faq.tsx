import { Helmet } from "react-helmet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PAYMENT_TERMS } from "@/lib/constants";

export default function FAQ() {
  return (
    <>
      <Helmet>
        <title>Frequently Asked Questions | Luster Legacy</title>
        <meta name="description" content="Find answers to commonly asked questions about our custom jewelry design process, shipping, payments, and more." />
      </Helmet>
      
      <div className="bg-charcoal py-20">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <h1 className="font-playfair text-3xl md:text-5xl font-bold text-pearl mb-4">Frequently Asked Questions</h1>
          <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
          <p className="font-cormorant text-lg md:text-xl text-pearl/80 max-w-2xl mx-auto">
            Find answers to common questions about our services, custom designs, shipping, and more.
          </p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 md:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          <section className="mb-12">
            <h2 className="font-playfair text-2xl font-bold text-foreground mb-6">Custom Design Process</h2>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="custom-1">
                <AccordionTrigger className="font-playfair text-lg font-medium">
                  What types of custom jewelry can you create?
                </AccordionTrigger>
                <AccordionContent className="font-montserrat text-foreground/70">
                  We can create virtually any type of fine jewelry, including necklaces, earrings, rings, bracelets, and pendants. Our expertise spans traditional designs with modern touches to completely contemporary pieces.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="custom-2">
                <AccordionTrigger className="font-playfair text-lg font-medium">
                  How long does the custom design process take?
                </AccordionTrigger>
                <AccordionContent className="font-montserrat text-foreground/70">
                  The timeline varies by complexity, but typically includes: 3-5 days for initial CAD design, 1-2 days for revisions, and 3-4 weeks for crafting after approval. Complex pieces may take longer.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="custom-3">
                <AccordionTrigger className="font-playfair text-lg font-medium">
                  Can you recreate a piece from a photograph?
                </AccordionTrigger>
                <AccordionContent className="font-montserrat text-foreground/70">
                  Yes, we can recreate pieces from clear photographs or sketches. We can also incorporate modifications to make the piece uniquely yours while honoring the original design's essence.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="custom-4">
                <AccordionTrigger className="font-playfair text-lg font-medium">
                  What if I'm not satisfied with the final piece?
                </AccordionTrigger>
                <AccordionContent className="font-montserrat text-foreground/70">
                  Customer satisfaction is our priority. If there are manufacturing defects, we offer free repairs. We work closely with clients at the CAD approval stage to ensure the final piece meets expectations, as custom pieces cannot be returned once approved and created.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="custom-5">
                <AccordionTrigger className="font-playfair text-lg font-medium">
                  Do you provide certificates for gemstones?
                </AccordionTrigger>
                <AccordionContent className="font-montserrat text-foreground/70">
                  Yes, we provide certification for all precious gemstones from internationally recognized laboratories. For custom pieces with client-provided stones, we can arrange certification services at an additional cost.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="custom-6">
                <AccordionTrigger className="font-playfair text-lg font-medium">
                  What is the cost for custom design services?
                </AccordionTrigger>
                <AccordionContent className="font-montserrat text-foreground/70">
                  A ${PAYMENT_TERMS.cadFee} {PAYMENT_TERMS.cadFeeDescription} is required before design work begins. This fee is fully adjustable against your final order. The overall cost depends on materials, complexity, and gemstones selected. We provide a detailed quote after reviewing your design requirements.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>
          
          <section className="mb-12">
            <h2 className="font-playfair text-2xl font-bold text-foreground mb-6">Orders & Payments</h2>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="payment-1">
                <AccordionTrigger className="font-playfair text-lg font-medium">
                  What payment methods do you accept?
                </AccordionTrigger>
                <AccordionContent className="font-montserrat text-foreground/70">
                  We accept bank transfers, PayPal, and major credit cards. For custom orders and higher-value purchases, we recommend bank transfers to avoid processing fees.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="payment-2">
                <AccordionTrigger className="font-playfair text-lg font-medium">
                  What is your payment policy for custom pieces?
                </AccordionTrigger>
                <AccordionContent className="font-montserrat text-foreground/70">
                  For custom designs, we require a ${PAYMENT_TERMS.cadFee} design fee before work begins, a 50% deposit upon design approval to start production, and the remaining balance before shipping. The initial design fee is adjustable against your final purchase.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="payment-3">
                <AccordionTrigger className="font-playfair text-lg font-medium">
                  Can I make changes to my order after placing it?
                </AccordionTrigger>
                <AccordionContent className="font-montserrat text-foreground/70">
                  For custom pieces, changes can be made during the design phase before final approval. Once production begins, significant changes may incur additional costs or may not be possible depending on the stage of creation. For catalog items, please contact us immediately, as changes may be limited.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>
          
          <section className="mb-12">
            <h2 className="font-playfair text-2xl font-bold text-foreground mb-6">Shipping & Delivery</h2>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="shipping-1">
                <AccordionTrigger className="font-playfair text-lg font-medium">
                  How long does shipping take?
                </AccordionTrigger>
                <AccordionContent className="font-montserrat text-foreground/70">
                  Domestic shipping within India typically takes 2-3 business days. International shipping varies by destination, usually 5-10 business days. All shipments are insured and require signature upon delivery.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="shipping-2">
                <AccordionTrigger className="font-playfair text-lg font-medium">
                  Do you ship internationally?
                </AccordionTrigger>
                <AccordionContent className="font-montserrat text-foreground/70">
                  Yes, we ship worldwide. International customers are responsible for any import duties, taxes, and customs fees that may apply in their country. These are not included in our prices.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="shipping-3">
                <AccordionTrigger className="font-playfair text-lg font-medium">
                  How do you package your jewelry?
                </AccordionTrigger>
                <AccordionContent className="font-montserrat text-foreground/70">
                  All jewelry arrives in our signature luxury packaging, including a premium jewelry box, authenticity certificate, care instructions, and a gift bag. For gifts, we offer complimentary gift wrapping and personalized message cards upon request.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>
          
          <section className="mb-12">
            <h2 className="font-playfair text-2xl font-bold text-foreground mb-6">Product Care & Warranty</h2>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="care-1">
                <AccordionTrigger className="font-playfair text-lg font-medium">
                  How should I care for my fine jewelry?
                </AccordionTrigger>
                <AccordionContent className="font-montserrat text-foreground/70">
                  Store pieces separately to prevent scratches, remove before swimming or bathing, avoid exposure to chemicals, clean gently with a soft cloth and mild soap solution, and have professional cleaning done annually. Specific care instructions are included with each purchase.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="care-2">
                <AccordionTrigger className="font-playfair text-lg font-medium">
                  What warranty do you offer?
                </AccordionTrigger>
                <AccordionContent className="font-montserrat text-foreground/70">
                  We offer a one-year warranty against manufacturing defects. This covers repairs for issues related to craftsmanship under normal wearing conditions. It does not cover damage from accidents, improper care, or normal wear and tear.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="care-3">
                <AccordionTrigger className="font-playfair text-lg font-medium">
                  Do you offer repair services?
                </AccordionTrigger>
                <AccordionContent className="font-montserrat text-foreground/70">
                  Yes, we offer repair and maintenance services for life. Repairs for manufacturing defects are free within the warranty period. After warranty or for damage not covered, repairs are charged based on the service required. We can also refurbish and update older pieces.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>
          
          <section>
            <h2 className="font-playfair text-2xl font-bold text-foreground mb-6">Still Have Questions?</h2>
            <p className="font-montserrat text-foreground/70 mb-4">
              If you can't find the answer to your question, please don't hesitate to contact our customer service team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href="/contact" 
                className="inline-flex justify-center items-center px-6 py-3 rounded-md bg-primary text-background hover:bg-primary/90 font-medium transition-colors"
              >
                Contact Us
              </a>
              <a 
                href="/custom-design" 
                className="inline-flex justify-center items-center px-6 py-3 rounded-md border border-primary text-primary hover:bg-primary/10 font-medium transition-colors"
              >
                Start a Custom Design
              </a>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
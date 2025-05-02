import { Helmet } from "react-helmet";
import { COMPANY } from "@/lib/constants";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "wouter";
import { MessageCircle, Pencil, Gem, Hammer, PackageCheck } from "lucide-react";

export default function FAQ() {
  return (
    <div className="container mx-auto py-12 px-4">
      <Helmet>
        <title>Frequently Asked Questions | {COMPANY.name}</title>
        <meta name="description" content="Common questions about Luster Legacy custom jewelry, ordering, and policies" />
      </Helmet>
      
      <div className="max-w-4xl mx-auto">
        <h1 className="font-playfair text-4xl md:text-5xl font-bold mb-8 text-center">Frequently Asked Questions</h1>
        
        <p className="text-lg text-center mb-12 max-w-3xl mx-auto">
          Find answers to common questions about our jewelry, custom design process, ordering, and policies.
          If you can't find the information you're looking for, please <Link href="/contact" className="text-primary hover:underline">contact us</Link>.
        </p>
        
        <div className="space-y-6 mb-12">
          <h2 className="font-playfair text-2xl font-semibold">Ordering & Payment</h2>
          <Accordion type="single" collapsible className="bg-card rounded-lg">
            <AccordionItem value="item-1">
              <AccordionTrigger className="font-medium px-4">
                What is your 50% advance payment policy?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p>
                  Our 50% advance payment model is designed to balance commitment while making luxury jewelry more 
                  accessible. For all orders (both ready-made and custom designs), we require 50% of the total price 
                  as an advance payment to begin production or secure the piece. The remaining 50% is due before 
                  shipping the final product. This policy helps us maintain our high-quality standards while 
                  providing flexibility for our customers.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2">
              <AccordionTrigger className="font-medium px-4">
                What payment methods do you accept?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p>
                  We accept major credit cards (Visa, Mastercard, American Express), debit cards, bank transfers, 
                  and UPI payments for Indian customers. We also offer EMI options on select banks for orders above 
                  ₹30,000. All payments are processed through secure payment gateways to ensure your transaction 
                  information remains safe.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3">
              <AccordionTrigger className="font-medium px-4">
                How do I track my order?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p>
                  Once your order ships, you will receive a tracking number via email that allows you to monitor 
                  your shipment's progress. For custom orders, we also provide regular updates throughout the 
                  production process, including CAD design approval and manufacturing milestones.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4">
              <AccordionTrigger className="font-medium px-4">
                What happens if I need to cancel my order?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p>
                  For ready-made pieces, orders can be cancelled within 24 hours of placement for a full refund. 
                  For custom designs, cancellation is possible before production begins, though a design fee may 
                  be deducted from your refund. Once production has started, cancellation may not be possible, or 
                  significant fees may apply. Please contact our customer service team as soon as possible if you 
                  need to cancel an order.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        
        <div className="space-y-6 mb-12">
          <h2 className="font-playfair text-2xl font-semibold">Custom Design Process</h2>
          <Accordion type="single" collapsible className="bg-card rounded-lg">
            <AccordionItem value="item-5">
              <AccordionTrigger className="font-medium px-4">
                How does your custom design process work?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3">
                  <div className="flex items-start">
                    <span className="inline-block bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                      <MessageCircle className="h-3.5 w-3.5" />
                    </span>
                    <span><strong>Initial Consultation:</strong> Submit your design request with references, inspiration, and preferences.</span>
                  </div>
                  <div className="flex items-start">
                    <span className="inline-block bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                      <Pencil className="h-3.5 w-3.5" />
                    </span>
                    <span><strong>Design & Pricing:</strong> Our designers create a concept and provide a detailed quote.</span>
                  </div>
                  <div className="flex items-start">
                    <span className="inline-block bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                      <Gem className="h-3.5 w-3.5" />
                    </span>
                    <span><strong>CAD Approval:</strong> View 3D renders of your design and request any adjustments.</span>
                  </div>
                  <div className="flex items-start">
                    <span className="inline-block bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                      <Hammer className="h-3.5 w-3.5" />
                    </span>
                    <span><strong>Production:</strong> Upon 50% advance payment, we begin crafting your piece.</span>
                  </div>
                  <div className="flex items-start">
                    <span className="inline-block bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                      <PackageCheck className="h-3.5 w-3.5" />
                    </span>
                    <span><strong>Delivery:</strong> After final payment, your completed jewelry is carefully packaged and shipped.</span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-6">
              <AccordionTrigger className="font-medium px-4">
                How long does the custom design process take?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p>
                  The timeline varies depending on the complexity of the design, but typically:
                </p>
                <ul className="list-disc ml-5 space-y-1 mt-2">
                  <li>Initial design concept: 3-5 business days</li>
                  <li>CAD design iterations: 5-7 business days</li>
                  <li>Production after approval: 4-6 weeks</li>
                  <li>Total time from concept to delivery: Approximately 6-8 weeks</li>
                </ul>
                <p className="mt-2">
                  For rush orders or special occasions, please let us know in advance, and we'll do our best to accommodate your timeline.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-7">
              <AccordionTrigger className="font-medium px-4">
                Can I use my own materials or stones?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p>
                  Yes, we can work with heirloom stones or materials that you provide. We'll evaluate your materials 
                  to ensure they meet our quality standards and are suitable for your design. If you're providing stones, 
                  we recommend having them professionally appraised before sending them to us. Additional fees may apply 
                  for setting client-provided stones.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-8">
              <AccordionTrigger className="font-medium px-4">
                What if I don't like the final design?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p>
                  Our thorough approval process ensures you'll love your final piece. We don't proceed to production 
                  until you've approved the CAD design. If you have concerns about the final product, we'll work with 
                  you to address them. While custom designs cannot be returned, we stand behind our craftsmanship and 
                  will make reasonable adjustments to ensure your satisfaction.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        
        <div className="space-y-6 mb-12">
          <h2 className="font-playfair text-2xl font-semibold">Product Information</h2>
          <Accordion type="single" collapsible className="bg-card rounded-lg">
            <AccordionItem value="item-9">
              <AccordionTrigger className="font-medium px-4">
                What materials do you use in your jewelry?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p>
                  We primarily work with 18kt gold, though we also offer options in 14kt and 22kt gold. For silver 
                  pieces, we use high-quality sterling silver, often with gold accents. Our gemstones include natural 
                  and lab-grown diamonds, polki diamonds, precious gemstones (ruby, sapphire, emerald), and semi-precious 
                  stones. All materials are ethically sourced and meet international quality standards.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-10">
              <AccordionTrigger className="font-medium px-4">
                How do I care for my jewelry?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p>To keep your jewelry looking its best:</p>
                <ul className="list-disc ml-5 space-y-1 mt-2">
                  <li>Store pieces separately in soft pouches or the original box</li>
                  <li>Remove jewelry before swimming, showering, or using household chemicals</li>
                  <li>Clean regularly with a soft, lint-free cloth</li>
                  <li>Avoid exposure to perfumes, lotions, and hairsprays</li>
                  <li>Have your jewelry professionally inspected and cleaned annually</li>
                </ul>
                <p className="mt-2">
                  We offer complimentary cleaning and inspection services for all our pieces. See our <Link href="/repairs" className="text-primary hover:underline">Repair Services</Link> page for more information.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-11">
              <AccordionTrigger className="font-medium px-4">
                Are your diamonds and gemstones certified?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p>
                  Yes, all our natural diamonds above 0.3 carats come with internationally recognized certification from 
                  GIA, IGI, or SGL. Lab-grown diamonds are certified by IGI or GCAL. For other gemstones, we provide 
                  authenticity certificates indicating origin, treatments (if any), and quality grading. All jewelry 
                  pieces come with a detailed certificate of authenticity from {COMPANY.name}.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-12">
              <AccordionTrigger className="font-medium px-4">
                What is the difference between natural and lab-grown diamonds?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p>
                  Natural diamonds form over billions of years deep within the Earth, while lab-grown diamonds are created 
                  in controlled laboratory environments that replicate natural conditions. Chemically, physically, and 
                  optically, they are identical—both are real diamonds. The main differences are origin and price, with 
                  lab-grown diamonds typically costing 30-40% less than natural diamonds of equivalent quality. We offer 
                  both options to suit different preferences and budgets.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        
        <div className="space-y-6 mb-12">
          <h2 className="font-playfair text-2xl font-semibold">Shipping & Returns</h2>
          <Accordion type="single" collapsible className="bg-card rounded-lg">
            <AccordionItem value="item-13">
              <AccordionTrigger className="font-medium px-4">
                Do you ship internationally?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p>
                  Yes, we ship worldwide to most countries. International shipping typically takes 7-14 business days, 
                  depending on the destination. All international shipments are fully insured and sent with tracking. 
                  Please note that customers are responsible for any import duties, taxes, or customs fees levied by 
                  their country of residence. These charges are not included in our prices.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-14">
              <AccordionTrigger className="font-medium px-4">
                What is your return policy?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p>
                  Ready-made jewelry can be returned within 7 days of delivery for exchange or store credit, provided items 
                  are in original, unworn condition with all tags and packaging intact. Custom-designed pieces cannot be 
                  returned unless there is a manufacturing defect. Please see our <Link href="/returns" className="text-primary hover:underline">Returns & Exchanges</Link> page for complete details.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-15">
              <AccordionTrigger className="font-medium px-4">
                How do I get my jewelry appraised for insurance?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p>
                  All purchases from {COMPANY.name} include a detailed appraisal document suitable for insurance purposes. 
                  This document contains all necessary information about your piece, including materials, stone qualities, 
                  retail replacement value, and detailed photographs. If your insurance company requires additional 
                  documentation, please contact our customer service team, and we'll provide the necessary assistance.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-16">
              <AccordionTrigger className="font-medium px-4">
                What is your warranty policy?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p>
                  All jewelry comes with a 1-year warranty against manufacturing defects. Additionally, we offer lifetime 
                  cleaning and inspection services. For more information about our warranty coverage and repair services, 
                  please visit our <Link href="/repairs" className="text-primary hover:underline">Repair Services</Link> page.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        
        <div className="text-center mt-12">
          <h2 className="font-playfair text-2xl font-semibold mb-4">Still Have Questions?</h2>
          <p className="mb-6">
            If you couldn't find the answer you were looking for, please don't hesitate to reach out.
          </p>
          <Link href="/contact" className="bg-primary text-background hover:bg-accent py-3 px-6 rounded font-medium transition duration-300 inline-block">
            Contact Our Team
          </Link>
        </div>
      </div>
    </div>
  );
}
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
            <h2 className="font-playfair text-2xl font-bold text-foreground mb-6">Our Services</h2>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="service-1">
                <AccordionTrigger className="font-playfair text-lg font-medium">
                  What services does Luster Legacy offer?
                </AccordionTrigger>
                <AccordionContent className="font-montserrat text-foreground/70">
                  <p className="mb-2">Luster Legacy offers three distinct service options to meet your jewelry needs:</p>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li><strong>Custom Design Requests:</strong> For completely new designs created from your vision. This service includes a $150 consultation fee for up to 4 design iterations.</li>
                    <li><strong>Final Quote Requests:</strong> For unmodified catalog products where you'd like to confirm pricing and availability before purchase.</li>
                    <li><strong>Product Personalization Requests:</strong> For modifications to existing catalog items, such as changing metal types, gemstones, or engraving. This service has no consultation fee.</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="service-2">
                <AccordionTrigger className="font-playfair text-lg font-medium">
                  How does the Custom Design service work?
                </AccordionTrigger>
                <AccordionContent className="font-montserrat text-foreground/70">
                  <p className="mb-2">Our Custom Design service follows these steps:</p>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Submit your design idea through our online form, including reference images and detailed notes.</li>
                    <li>Pay the $150 design consultation fee, which covers up to 4 design iterations.</li>
                    <li>Work with our AI design assistant and expert artisans to refine your concept.</li>
                    <li>Receive a detailed CAD model and quote for your approval.</li>
                    <li>Upon approval, pay 50% of the total cost to begin production.</li>
                    <li>When your piece is ready (typically 3-4 weeks later), pay the remaining balance before shipping.</li>
                  </ol>
                  <p className="mt-2">The initial $150 consultation fee is applied toward your final purchase.</p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="service-3">
                <AccordionTrigger className="font-playfair text-lg font-medium">
                  What is the Product Personalization service?
                </AccordionTrigger>
                <AccordionContent className="font-montserrat text-foreground/70">
                  <p className="mb-2">Our Product Personalization service allows you to customize existing catalog items with:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Changes to metal type (yellow gold, white gold, rose gold, platinum)</li>
                    <li>Gemstone substitutions or additions</li>
                    <li>Size modifications</li>
                    <li>Engraving services</li>
                    <li>Minor design adjustments</li>
                  </ul>
                  <p className="mt-2">There is no consultation fee for this service. Simply select "Customize Request" on any product page and specify your desired modifications. We'll provide a quote within 1-2 business days.</p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="service-4">
                <AccordionTrigger className="font-playfair text-lg font-medium">
                  How does the Final Quote Request work?
                </AccordionTrigger>
                <AccordionContent className="font-montserrat text-foreground/70">
                  <p className="mb-2">The Final Quote Request service is designed for customers who:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Are interested in an unmodified catalog item</li>
                    <li>Want to confirm current pricing (which may fluctuate due to precious metal and gemstone market values)</li>
                    <li>Need to verify product availability before committing to purchase</li>
                    <li>Have questions about specific details of the product</li>
                  </ul>
                  <p className="mt-2">Select "Request Final Quote" on any product page, and we'll respond within 24 hours with current pricing and availability information.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>
          
          <section className="mb-12">
            <h2 className="font-playfair text-2xl font-bold text-foreground mb-6">Custom Design Process</h2>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="custom-1">
                <AccordionTrigger className="font-playfair text-lg font-medium">
                  What types of custom jewelry can you create?
                </AccordionTrigger>
                <AccordionContent className="font-montserrat text-foreground/70">
                  We can create virtually any type of fine jewelry, including necklaces, earrings, rings, bracelets, and pendants. Our expertise spans traditional designs with modern touches to completely contemporary pieces. We specialize in wedding and engagement rings, anniversary bands, family heirlooms, and statement pieces.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="custom-2">
                <AccordionTrigger className="font-playfair text-lg font-medium">
                  How long does the custom design process take?
                </AccordionTrigger>
                <AccordionContent className="font-montserrat text-foreground/70">
                  <p className="mb-2">The timeline varies by complexity, but typically follows this schedule:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Design consultation:</strong> 1-2 days after form submission</li>
                    <li><strong>Initial CAD design:</strong> 3-5 days</li>
                    <li><strong>Design revisions:</strong> 1-2 days per revision (up to 4 iterations included)</li>
                    <li><strong>Production time:</strong> 3-4 weeks after final approval and deposit</li>
                    <li><strong>Shipping:</strong> 2-10 days depending on destination</li>
                  </ul>
                  <p className="mt-2">Complex pieces or designs requiring rare materials may take longer. We'll provide a specific timeline estimate during your consultation.</p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="custom-3">
                <AccordionTrigger className="font-playfair text-lg font-medium">
                  Can you recreate a piece from a photograph?
                </AccordionTrigger>
                <AccordionContent className="font-montserrat text-foreground/70">
                  Yes, we can recreate pieces from clear photographs or sketches. We can also incorporate modifications to make the piece uniquely yours while honoring the original design's essence. Our AI design assistant can help visualize different variations based on your reference images. For best results, provide multiple angles of the piece you'd like to recreate.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="custom-4">
                <AccordionTrigger className="font-playfair text-lg font-medium">
                  What if I'm not satisfied with the final piece?
                </AccordionTrigger>
                <AccordionContent className="font-montserrat text-foreground/70">
                  Customer satisfaction is our priority. If there are manufacturing defects, we offer free repairs. We work closely with clients at the CAD approval stage to ensure the final piece meets expectations, as custom pieces cannot be returned once approved and created. This is why we include up to 4 design iterations in our process, ensuring you're completely satisfied with the design before production begins.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="custom-5">
                <AccordionTrigger className="font-playfair text-lg font-medium">
                  Do you provide certificates for gemstones?
                </AccordionTrigger>
                <AccordionContent className="font-montserrat text-foreground/70">
                  Yes, we provide certification for all precious gemstones from internationally recognized laboratories such as GIA, IGI, and AGS. For custom pieces with client-provided stones, we can arrange certification services at an additional cost. These certificates verify authenticity, quality, and characteristics of your gemstones.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="custom-6">
                <AccordionTrigger className="font-playfair text-lg font-medium">
                  What is the cost for custom design services?
                </AccordionTrigger>
                <AccordionContent className="font-montserrat text-foreground/70">
                  A ${PAYMENT_TERMS.cadFee} {PAYMENT_TERMS.cadFeeDescription} is required before design work begins. This fee covers consultation with our design team, up to 4 design iterations, and detailed CAD modeling. The fee is fully adjustable against your final order. The overall cost depends on materials, complexity, and gemstones selected. We provide a detailed quote after reviewing your design requirements.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="custom-7">
                <AccordionTrigger className="font-playfair text-lg font-medium">
                  How does the AI design consultation work?
                </AccordionTrigger>
                <AccordionContent className="font-montserrat text-foreground/70">
                  <p className="mb-2">Our AI design consultation is a unique feature that helps visualize and refine your custom jewelry concepts:</p>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>Submit your design ideas, reference images, and preferences through our form</li>
                    <li>Our AI analyzes your inputs and generates detailed design suggestions</li>
                    <li>You can chat with the AI in real-time to explore variations and possibilities</li>
                    <li>The AI provides insights on materials, gemstones, and design elements</li>
                    <li>Our human artisans review the AI suggestions and incorporate them into the final design</li>
                  </ol>
                  <p className="mt-2">This technology-enhanced approach allows for more efficient design exploration while maintaining the quality and craftsmanship of traditional jewelry making.</p>
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
                  <p className="mb-2">We accept multiple payment methods to accommodate your preferences:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Bank transfers (preferred for custom orders)</li>
                    <li>Credit cards (Visa, MasterCard, American Express, Discover)</li>
                    <li>PayPal</li>
                    <li>Digital wallets (Apple Pay, Google Pay)</li>
                  </ul>
                  <p className="mt-2">For custom orders and higher-value purchases, we recommend bank transfers to avoid processing fees. All payment information is securely handled through encrypted channels.</p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="payment-2">
                <AccordionTrigger className="font-playfair text-lg font-medium">
                  What is your payment structure for different services?
                </AccordionTrigger>
                <AccordionContent className="font-montserrat text-foreground/70">
                  <p className="mb-1">Our payment structure varies by service type:</p>
                  
                  <p className="font-medium mt-3 mb-1">For Custom Design Requests:</p>
                  <ol className="list-decimal pl-5 space-y-1 mb-2">
                    <li>${PAYMENT_TERMS.cadFee} consultation fee (covers up to 4 design iterations)</li>
                    <li>50% deposit upon design approval to begin production</li>
                    <li>Remaining balance before shipping</li>
                  </ol>
                  <p className="mb-3 text-sm italic">The consultation fee is applied toward your final purchase.</p>
                  
                  <p className="font-medium mt-3 mb-1">For Product Personalization:</p>
                  <ol className="list-decimal pl-5 space-y-1 mb-2">
                    <li>No upfront consultation fee</li>
                    <li>50% deposit after quote approval to begin customization</li>
                    <li>Remaining balance before shipping</li>
                  </ol>
                  
                  <p className="font-medium mt-3 mb-1">For Catalog Items:</p>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>Full payment at checkout for in-stock items</li>
                    <li>For made-to-order catalog items, 50% deposit at checkout and remaining balance before shipping</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="payment-3">
                <AccordionTrigger className="font-playfair text-lg font-medium">
                  How are prices determined for custom pieces?
                </AccordionTrigger>
                <AccordionContent className="font-montserrat text-foreground/70">
                  <p className="mb-2">Custom jewelry pricing is calculated based on several factors:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Materials:</strong> Current market prices of precious metals (gold, platinum, silver)</li>
                    <li><strong>Gemstones:</strong> Type, quality, size, and rarity of selected gemstones</li>
                    <li><strong>Complexity:</strong> Design intricacy, technical challenges, and specialized techniques</li>
                    <li><strong>Labor:</strong> Craftsmanship hours required for creation</li>
                    <li><strong>Finishing:</strong> Special finishes, engraving, or surface treatments</li>
                  </ul>
                  <p className="mt-2">We provide detailed quotes that break down these components so you understand exactly what you're paying for. Due to fluctuations in precious metal and gemstone markets, quotes are typically valid for 7-14 days.</p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="payment-4">
                <AccordionTrigger className="font-playfair text-lg font-medium">
                  Can I make changes to my order after placing it?
                </AccordionTrigger>
                <AccordionContent className="font-montserrat text-foreground/70">
                  <p className="mb-2">Our policy on order changes varies by service type and stage:</p>
                  
                  <p className="font-medium mt-2 mb-1">For Custom Design Requests:</p>
                  <ul className="list-disc pl-5 space-y-1 mb-2">
                    <li><strong>During design phase:</strong> Changes can be made freely within your 4 included iterations</li>
                    <li><strong>After design approval:</strong> Minor adjustments may be possible with additional charges</li>
                    <li><strong>During production:</strong> Major changes often require restarting the process and may incur significant costs</li>
                  </ul>
                  
                  <p className="font-medium mt-2 mb-1">For Product Personalization:</p>
                  <ul className="list-disc pl-5 space-y-1 mb-2">
                    <li><strong>Before production:</strong> Changes can usually be accommodated with updated quotes</li>
                    <li><strong>During production:</strong> Limited changes may be possible depending on the stage</li>
                  </ul>
                  
                  <p className="font-medium mt-2 mb-1">For Catalog Items:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Before shipping:</strong> Order modifications may be possible if the item hasn't shipped</li>
                    <li><strong>After shipping:</strong> Standard return policy applies (see Returns & Exchanges section)</li>
                  </ul>
                  
                  <p className="mt-2">Contact our customer service team as soon as possible if you need to make changes.</p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="payment-5">
                <AccordionTrigger className="font-playfair text-lg font-medium">
                  Do you offer financing options?
                </AccordionTrigger>
                <AccordionContent className="font-montserrat text-foreground/70">
                  <p>Yes, we offer flexible payment plans for purchases over $2,000. Options include:</p>
                  <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li>3-month installment plan with no interest</li>
                    <li>6-month installment plan with minimal interest</li>
                    <li>Custom payment schedules for larger purchases</li>
                  </ul>
                  <p className="mt-2">A credit check and approval is required for financing options. Contact our customer service team for details and to discuss which option best suits your needs.</p>
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
                  <p className="mb-2">Shipping times vary by location and item availability:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Domestic shipping (India):</strong> 2-3 business days</li>
                    <li><strong>International shipping:</strong> 5-10 business days for most destinations</li>
                    <li><strong>Remote international locations:</strong> Up to 14 business days</li>
                    <li><strong>Custom pieces:</strong> Ship within 1-2 business days after final production and payment</li>
                  </ul>
                  <p className="mt-2">All shipments are fully insured and require signature upon delivery for security. Expedited shipping options are available at an additional cost.</p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="shipping-2">
                <AccordionTrigger className="font-playfair text-lg font-medium">
                  Do you ship internationally?
                </AccordionTrigger>
                <AccordionContent className="font-montserrat text-foreground/70">
                  <p>Yes, we ship worldwide to over 100 countries. International customers should be aware of the following:</p>
                  <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li>Import duties, taxes, and customs fees are the responsibility of the recipient and are not included in our prices</li>
                    <li>All packages are shipped with declared value for customs purposes</li>
                    <li>Customs processing times vary by country and may extend delivery timeframes</li>
                    <li>Orders over $5,000 USD are shipped via premium courier services with enhanced tracking and insurance</li>
                    <li>We comply with all international shipping regulations for precious items</li>
                  </ul>
                  <p className="mt-2">For specific information about shipping to your country, please contact our customer service team.</p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="shipping-3">
                <AccordionTrigger className="font-playfair text-lg font-medium">
                  How do you package your jewelry?
                </AccordionTrigger>
                <AccordionContent className="font-montserrat text-foreground/70">
                  <p className="mb-2">All Luster Legacy jewelry arrives in our signature luxury packaging, which includes:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Handcrafted wooden or velvet jewelry box with silk lining</li>
                    <li>Certificate of authenticity detailing materials and craftsmanship</li>
                    <li>Care guide with cleaning and storage instructions</li>
                    <li>Polishing cloth for maintenance</li>
                    <li>Elegant gift bag with ribbon closure</li>
                  </ul>
                  <p className="mt-2">For gifts, we offer complimentary premium gift wrapping and personalized message cards upon request. Our packaging is designed to be both protective during shipping and presentable as a gift.</p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="shipping-4">
                <AccordionTrigger className="font-playfair text-lg font-medium">
                  How can I track my order?
                </AccordionTrigger>
                <AccordionContent className="font-montserrat text-foreground/70">
                  <p className="mb-2">We provide comprehensive tracking for all shipments:</p>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>When your order ships, you'll receive an email with tracking information</li>
                    <li>Track your package in real-time through our website's order history section</li>
                    <li>Receive SMS notifications at key shipping milestones (if you've opted in)</li>
                    <li>For high-value shipments, our customer service team provides personalized updates</li>
                  </ol>
                  <p className="mt-2">If you experience any issues with tracking, our dedicated shipping team is available to assist you.</p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="shipping-5">
                <AccordionTrigger className="font-playfair text-lg font-medium">
                  What is your return and exchange policy?
                </AccordionTrigger>
                <AccordionContent className="font-montserrat text-foreground/70">
                  <p className="mb-2">Our return and exchange policy varies by product type:</p>
                  
                  <p className="font-medium mt-3 mb-1">For Ready-to-Ship Catalog Items:</p>
                  <ul className="list-disc pl-5 space-y-1 mb-2">
                    <li>30-day return period for unworn items in original packaging</li>
                    <li>Exchange option available for size adjustments or different styles</li>
                    <li>Return shipping is at customer's expense unless item is defective</li>
                  </ul>
                  
                  <p className="font-medium mt-3 mb-1">For Custom Design Items:</p>
                  <ul className="list-disc pl-5 space-y-1 mb-2">
                    <li>Returns not accepted due to the personalized nature</li>
                    <li>Free repairs for manufacturing defects within the warranty period</li>
                    <li>Size adjustments available for rings at a nominal fee</li>
                  </ul>
                  
                  <p className="font-medium mt-3 mb-1">For Personalized Catalog Items:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Returns not accepted for items with engraving or personalization</li>
                    <li>Other modifications may be eligible for exchange on a case-by-case basis</li>
                  </ul>
                  
                  <p className="mt-3 italic">All returns must be authorized by our customer service team before shipping. Please contact us for a return authorization and detailed instructions.</p>
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
                  <p className="mb-2">To maintain the beauty and integrity of your Luster Legacy jewelry:</p>
                  
                  <p className="font-medium mt-3 mb-1">Daily Care:</p>
                  <ul className="list-disc pl-5 space-y-1 mb-2">
                    <li>Store pieces individually in fabric-lined compartments or pouches</li>
                    <li>Remove jewelry before swimming, bathing, exercising, or household cleaning</li>
                    <li>Apply perfumes, lotions, and hairsprays before wearing jewelry</li>
                    <li>Avoid exposure to chlorine, saltwater, and harsh chemicals</li>
                    <li>Wipe pieces with a soft polishing cloth after each wear</li>
                  </ul>
                  
                  <p className="font-medium mt-3 mb-1">Material-Specific Care:</p>
                  <ul className="list-disc pl-5 space-y-1 mb-2">
                    <li><strong>Gold:</strong> Clean with mild soap solution and soft brush; rinse thoroughly</li>
                    <li><strong>Platinum:</strong> Professional cleaning recommended to maintain luster</li>
                    <li><strong>Gemstones:</strong> Different stones require specific care; refer to included guide</li>
                    <li><strong>Pearls:</strong> Wipe with damp cloth only; store flat to prevent stretching</li>
                  </ul>
                  
                  <p className="font-medium mt-3 mb-1">Recommended Maintenance:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Professional cleaning every 6-12 months</li>
                    <li>Annual inspection of settings and clasps</li>
                    <li>Restringing of pearl necklaces every 2-3 years depending on wear</li>
                  </ul>
                  
                  <p className="mt-3">Detailed care instructions specific to your jewelry piece are included with each purchase. Following these guidelines will preserve your jewelry's beauty for generations.</p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="care-2">
                <AccordionTrigger className="font-playfair text-lg font-medium">
                  What warranty do you offer?
                </AccordionTrigger>
                <AccordionContent className="font-montserrat text-foreground/70">
                  <p className="mb-2">All Luster Legacy jewelry comes with our comprehensive warranty:</p>
                  
                  <p className="font-medium mt-3 mb-1">Standard Warranty Coverage:</p>
                  <ul className="list-disc pl-5 space-y-1 mb-2">
                    <li>One-year warranty against manufacturing defects from date of purchase</li>
                    <li>Coverage for issues related to craftsmanship under normal wearing conditions</li>
                    <li>Free repairs of defective components</li>
                    <li>Replacement if repair is not possible</li>
                  </ul>
                  
                  <p className="font-medium mt-3 mb-1">Extended Warranty Options:</p>
                  <ul className="list-disc pl-5 space-y-1 mb-2">
                    <li>Custom pieces eligible for extended 3-year warranty for 10% of purchase price</li>
                    <li>Platinum Collection pieces include automatic 5-year warranty</li>
                    <li>Heritage Collection pieces include lifetime warranty on craftsmanship</li>
                  </ul>
                  
                  <p className="font-medium mt-3 mb-1">Warranty Exclusions:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Damage from accidents, impacts, or drops</li>
                    <li>Issues resulting from improper care or storage</li>
                    <li>Normal wear and tear (surface scratches, patina development)</li>
                    <li>Unauthorized repairs or modifications</li>
                    <li>Lost or stolen items</li>
                  </ul>
                  
                  <p className="mt-3">To make a warranty claim, contact our customer service team with your original purchase information and photos of the issue. We'll guide you through the repair process.</p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="care-3">
                <AccordionTrigger className="font-playfair text-lg font-medium">
                  Do you offer repair services?
                </AccordionTrigger>
                <AccordionContent className="font-montserrat text-foreground/70">
                  <p className="mb-2">Yes, we offer comprehensive repair and maintenance services for the lifetime of your jewelry:</p>
                  
                  <p className="font-medium mt-3 mb-1">Warranty Repairs:</p>
                  <ul className="list-disc pl-5 space-y-1 mb-2">
                    <li>Free repairs for manufacturing defects within warranty period</li>
                    <li>Complimentary shipping both ways for warranty work</li>
                    <li>Expedited service for urgent warranty repairs</li>
                  </ul>
                  
                  <p className="font-medium mt-3 mb-1">Non-Warranty Services:</p>
                  <ul className="list-disc pl-5 space-y-1 mb-2">
                    <li>Stone replacement and resetting</li>
                    <li>Prong retipping and rebuilding</li>
                    <li>Chain soldering and clasp replacement</li>
                    <li>Ring sizing (up or down)</li>
                    <li>Rhodium plating refreshing for white gold</li>
                    <li>Deep cleaning and polishing</li>
                    <li>Engraving touch-ups or additions</li>
                  </ul>
                  
                  <p className="font-medium mt-3 mb-1">Redesign & Restoration:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Repurposing of stones from heirloom pieces</li>
                    <li>Style updates for dated designs</li>
                    <li>Complete restoration of antique and vintage jewelry</li>
                    <li>Conversion of pendants to rings or earrings to pendants</li>
                  </ul>
                  
                  <p className="mt-3">All repair work is performed by our master craftspeople, ensuring the same quality as our original pieces. A detailed quote is provided before any non-warranty work begins, with typical turnaround times of 7-14 days depending on the complexity.</p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="care-4">
                <AccordionTrigger className="font-playfair text-lg font-medium">
                  Do you offer insurance for jewelry purchases?
                </AccordionTrigger>
                <AccordionContent className="font-montserrat text-foreground/70">
                  <p className="mb-2">While we don't directly provide insurance, we offer several services to help you protect your investment:</p>
                  
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Detailed appraisals for insurance purposes at a nominal fee</li>
                    <li>Documentation of gemstone characteristics and specifications</li>
                    <li>High-resolution photography of your pieces for insurance records</li>
                    <li>Partnerships with specialized jewelry insurers for preferential rates</li>
                    <li>Regular valuation updates to ensure appropriate coverage as precious metal and gemstone prices fluctuate</li>
                  </ul>
                  
                  <p className="mt-3">We recommend insuring all fine jewelry pieces, especially custom designs and high-value items. Our customer service team can provide guidance on selecting an appropriate insurance provider specialized in jewelry coverage.</p>
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
import { Helmet } from "react-helmet";
import { COMPANY } from "@/lib/constants";
import { RotateCcw, Badge, Clock, ShieldCheck } from "lucide-react";

export default function ReturnsExchanges() {
  return (
    <div className="container mx-auto py-12 px-4">
      <Helmet>
        <title>Returns & Exchanges | {COMPANY.name}</title>
        <meta name="description" content="Returns and exchanges policy for Luster Legacy custom jewelry" />
      </Helmet>
      
      <div className="max-w-4xl mx-auto">
        <h1 className="font-playfair text-4xl md:text-5xl font-bold mb-8 text-center">Returns & Exchanges</h1>
        
        <p className="text-lg text-center mb-12 max-w-3xl mx-auto">
          At {COMPANY.name}, we want you to be completely satisfied with your purchase.
          Our return and exchange policy is designed to provide you with peace of mind when shopping with us.
        </p>
        
        <div className="bg-secondary/30 rounded-lg p-8 mb-16">
          <h2 className="font-playfair text-2xl font-semibold mb-8 text-center">Policy Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-background rounded-lg p-6 text-center shadow-sm">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Badge className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-playfair text-xl font-medium mb-2">Ready-Made Items</h3>
              <p className="text-sm">
                7-day return period<br />
                Exchange or store credit only
              </p>
            </div>
            <div className="bg-background rounded-lg p-6 text-center shadow-sm">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <RotateCcw className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-playfair text-xl font-medium mb-2">Custom Designs</h3>
              <p className="text-sm">
                Non-returnable<br />
                Lifetime repair warranty
              </p>
            </div>
            <div className="bg-background rounded-lg p-6 text-center shadow-sm">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-playfair text-xl font-medium mb-2">Manufacturing Defects</h3>
              <p className="text-sm">
                Full repair or replacement<br />
                1-year warranty on all pieces
              </p>
            </div>
          </div>
        </div>
        
        <div className="prose prose-lg max-w-none">
          <h2>Ready-Made Collection Returns</h2>
          <p>
            Items from our ready-made collections may be returned within 7 days of delivery for exchange or store credit,
            provided they are in original, unworn condition with all tags attached and original packaging intact.
          </p>
          
          <p>
            To initiate a return:
          </p>
          <ol>
            <li>Contact our customer service team at {COMPANY.email} within 7 days of receiving your order</li>
            <li>Receive a return authorization number and shipping instructions</li>
            <li>Package the item securely in its original packaging</li>
            <li>Ship the item back to us using a tracked and insured service</li>
          </ol>
          
          <p>
            Return shipping costs are the responsibility of the customer unless the return is due to a manufacturing defect
            or incorrect item being shipped.
          </p>

          <div className="bg-muted p-6 rounded-lg my-8">
            <h3 className="text-xl font-medium mb-4">Please Note</h3>
            <ul>
              <li>We do not offer cash refunds</li>
              <li>Store credits are valid for one year from the date of issue</li>
              <li>Items purchased on sale or with discounts may only be exchanged for items of equal or greater value (with payment of the difference)</li>
              <li>Earrings cannot be returned due to hygiene reasons unless there is a manufacturing defect</li>
            </ul>
          </div>
          
          <h2>Custom Design Policy</h2>
          <p>
            Due to the personalized nature of custom designs, these items cannot be returned or exchanged.
            We follow a thorough design approval process to ensure your complete satisfaction before production begins.
          </p>
          
          <p>Our custom design process includes:</p>
          <ol>
            <li>Initial design consultation and concept approval</li>
            <li>CAD design approval</li>
            <li>Material selection confirmation</li>
            <li>Production only after your final approval</li>
          </ol>
          
          <p>
            While custom designs cannot be returned, they are covered by our manufacturing warranty
            and lifetime repair service.
          </p>
          
          <h2>Manufacturing Defects</h2>
          <p>
            All jewelry is thoroughly inspected before shipping. However, if you discover a manufacturing defect
            within one year of purchase, we will repair or replace the item at no cost to you.
          </p>
          
          <p>
            Manufacturing defects include:
          </p>
          <ul>
            <li>Loose stones or settings</li>
            <li>Broken clasps or closures</li>
            <li>Tarnishing (beyond normal wear)</li>
            <li>Other structural issues</li>
          </ul>
          
          <p>
            Please contact our customer service team with photos of the defect to initiate the warranty process.
          </p>
          
          <h2>Size Adjustments</h2>
          <p>
            If your ring or bracelet requires sizing:
          </p>
          <ul>
            <li>First size adjustment within 30 days of purchase is complimentary</li>
            <li>Additional size adjustments are available for a nominal fee</li>
            <li>Some intricate designs may have limitations on resizing</li>
          </ul>
          
          <h2>Contact Us</h2>
          <p>
            If you have any questions about our return and exchange policy, please contact our customer service team at:{" "}
            <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
          </p>
        </div>
      </div>
    </div>
  );
}
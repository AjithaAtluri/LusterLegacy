import { Link } from "wouter";
import DesignForm from "@/components/custom-design/design-form";

export default function CustomDesignSection() {
  return (
    <section id="customize" className="py-20 px-4 md:px-8 bg-charcoal">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-playfair text-3xl md:text-4xl font-bold text-pearl mb-4">
            Design Your Dream Jewelry
          </h2>
          <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
          <p className="font-montserrat text-lg text-pearl/80 max-w-2xl mx-auto">
            Upload your vision and our master artisans will bring it to life with exquisite craftsmanship.
            From sketch to stunning reality, we're with you at every step.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Design Form (right on mobile, left on desktop) */}
          <div className="order-2 lg:order-1">
            <DesignForm />
          </div>
          
          {/* Process Image and Steps (left on mobile, right on desktop) */}
          <div className="order-1 lg:order-2">
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1600701707248-20e17cdf1e2c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                alt="Custom jewelry design process" 
                className="rounded-lg shadow-xl w-full"
              />
                
              <div className="absolute -bottom-8 -right-8 bg-background p-6 rounded-lg shadow-lg max-w-xs">
                <h4 className="font-playfair text-lg font-semibold text-foreground mb-2">Our Design Process</h4>
                <ul className="font-montserrat text-sm text-foreground/80 space-y-2">
                  <li className="flex items-start">
                    <span className="inline-block bg-primary text-pearl w-5 h-5 rounded-full flex items-center justify-center mr-2 mt-0.5">1</span>
                    <span>Submit your design & preferences</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block bg-primary text-pearl w-5 h-5 rounded-full flex items-center justify-center mr-2 mt-0.5">2</span>
                    <span>Receive CAD model & detailed quote</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block bg-primary text-pearl w-5 h-5 rounded-full flex items-center justify-center mr-2 mt-0.5">3</span>
                    <span>Approve design & pay 50% advance</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block bg-primary text-pearl w-5 h-5 rounded-full flex items-center justify-center mr-2 mt-0.5">4</span>
                    <span>Receive your finished masterpiece</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

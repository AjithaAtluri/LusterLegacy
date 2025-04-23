import { Helmet } from "react-helmet";
import { COMPANY } from "@/lib/constants";
import { Sparkles, Clock, Wrench, Gem } from "lucide-react";

export default function RepairServices() {
  return (
    <div className="container mx-auto py-12 px-4">
      <Helmet>
        <title>Repair Services | {COMPANY.name}</title>
        <meta name="description" content="Jewelry repair and maintenance services for Luster Legacy custom jewelry" />
      </Helmet>
      
      <div className="max-w-4xl mx-auto">
        <h1 className="font-playfair text-4xl md:text-5xl font-bold mb-8 text-center">Repair & Maintenance Services</h1>
        
        <p className="text-lg text-center mb-12 max-w-3xl mx-auto">
          Your {COMPANY.name} jewelry is crafted to last a lifetime. We offer comprehensive repair and maintenance
          services to ensure your treasured pieces remain as beautiful as the day you received them.
        </p>
        
        <div className="bg-secondary/30 rounded-lg p-8 mb-16">
          <h2 className="font-playfair text-2xl font-semibold mb-8 text-center">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-background rounded-lg p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mr-4">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-playfair text-xl font-medium">Cleaning & Polishing</h3>
              </div>
              <p className="text-sm mb-3">
                Professional cleaning and polishing to restore your jewelry's original shine and luster.
              </p>
              <ul className="text-sm space-y-1">
                <li>• Deep ultrasonic cleaning</li>
                <li>• Professional polishing</li>
                <li>• Plating touch-ups</li>
                <li>• Complimentary for life on all purchased items</li>
              </ul>
            </div>

            <div className="bg-background rounded-lg p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mr-4">
                  <Gem className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-playfair text-xl font-medium">Stone Services</h3>
              </div>
              <p className="text-sm mb-3">
                Expert gemstone care, replacement, and tightening services.
              </p>
              <ul className="text-sm space-y-1">
                <li>• Stone tightening</li>
                <li>• Stone replacement</li>
                <li>• Setting repair</li>
                <li>• Prong retipping and rebuilding</li>
              </ul>
            </div>

            <div className="bg-background rounded-lg p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mr-4">
                  <Wrench className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-playfair text-xl font-medium">Structural Repairs</h3>
              </div>
              <p className="text-sm mb-3">
                Comprehensive repairs for damaged or worn jewelry.
              </p>
              <ul className="text-sm space-y-1">
                <li>• Chain and clasp repair</li>
                <li>• Shank rebuilding</li>
                <li>• Solder repairs</li>
                <li>• Refinishing and restoration</li>
              </ul>
            </div>

            <div className="bg-background rounded-lg p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mr-4">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-playfair text-xl font-medium">Size & Customization</h3>
              </div>
              <p className="text-sm mb-3">
                Adjustments and modifications to ensure the perfect fit.
              </p>
              <ul className="text-sm space-y-1">
                <li>• Ring resizing</li>
                <li>• Bracelet adjustment</li>
                <li>• Chain shortening</li>
                <li>• Earring conversion</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="prose prose-lg max-w-none">
          <h2>Lifetime Warranty Program</h2>
          <p>
            Every piece of jewelry purchased from {COMPANY.name} comes with our Lifetime Warranty against manufacturing defects.
            This warranty covers:
          </p>
          <ul>
            <li>Free repair of manufacturing defects for life</li>
            <li>Complimentary inspections and cleaning</li>
            <li>Stone tightening and rhodium touch-ups</li>
          </ul>
          
          <p>
            The Lifetime Warranty does not cover damage resulting from normal wear and tear, accidents, improper use,
            or repairs attempted by anyone other than {COMPANY.name} authorized technicians.
          </p>
          
          <h2>Repair Process</h2>
          <ol>
            <li>
              <strong>Contact Us</strong> - Reach out to our customer service team at {COMPANY.email} with details and photos of the repair needed
            </li>
            <li>
              <strong>Evaluation</strong> - Our expert technicians will assess the repair requirements and provide a quote if applicable
            </li>
            <li>
              <strong>Authorization</strong> - Once approved, we'll provide shipping instructions or schedule an appointment
            </li>
            <li>
              <strong>Repair</strong> - Our master craftspeople will carefully repair your piece
            </li>
            <li>
              <strong>Quality Check</strong> - All repairs undergo rigorous inspection before return
            </li>
            <li>
              <strong>Return</strong> - Your jewelry is returned to you via insured shipping
            </li>
          </ol>
          
          <h2>Maintenance Tips</h2>
          <p>
            To keep your {COMPANY.name} jewelry looking its best between professional services:
          </p>
          <ul>
            <li>Store pieces separately in soft pouches or the original box to prevent scratches</li>
            <li>Remove jewelry before showering, swimming, or using household chemicals</li>
            <li>Clean regularly with a soft, lint-free cloth</li>
            <li>Avoid exposing your jewelry to perfumes, lotions, and hairsprays</li>
            <li>Have your jewelry professionally inspected at least once a year</li>
          </ul>
          
          <h2>Service Pricing</h2>
          <p>
            Service costs vary depending on the specific repair needed and the complexity of your piece. Many services 
            are complimentary under our warranty program.
          </p>
          <p>
            For non-warranty services, we provide detailed quotes before proceeding with any work. All repairs come with a 
            90-day guarantee.
          </p>
          
          <h2>Contact Us</h2>
          <p>
            To schedule a repair service or inquiry about our maintenance programs, please contact our customer service team at:{" "}
            <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
          </p>
        </div>
      </div>
    </div>
  );
}
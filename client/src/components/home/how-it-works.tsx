import { Drill, RotateCcw } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      number: 1,
      title: "Choose Your Path",
      description: "Select from our curated collection or submit your custom design. Either way, luxury awaits."
    },
    {
      number: 2,
      title: "Customize & Refine",
      description: "Select your preferred metal, stones, and finishes. For custom designs, receive a detailed CAD rendering."
    },
    {
      number: 3,
      title: "50% Advance Payment",
      description: "Once your design is approved, we collect 50% of the total cost to begin crafting your piece."
    },
    {
      number: 4,
      title: "Delivery & Final Payment",
      description: "Your masterpiece is delivered after quality checks. The remaining 50% is due upon delivery."
    }
  ];
  
  return (
    <section className="py-20 px-4 md:px-8 bg-background">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-playfair text-3xl md:text-4xl font-bold text-foreground mb-4">How It Works</h2>
          <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
          <p className="font-montserrat text-lg text-foreground/80 max-w-2xl mx-auto">
            Our bespoke process ensures that every piece is as unique as the person who wears it.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step) => (
            <div 
              key={step.number}
              className="bg-card rounded-lg shadow-md p-6 hover:shadow-lg transition duration-300"
            >
              <div className="bg-primary w-12 h-12 rounded-full flex items-center justify-center text-background font-playfair text-xl font-bold mb-6">
                {step.number}
              </div>
              <h3 className="font-playfair text-xl font-semibold text-foreground mb-3">{step.title}</h3>
              <p className="font-montserrat text-foreground/70">{step.description}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-16 bg-card rounded-lg shadow-md p-8">
          <h3 className="font-playfair text-2xl font-semibold text-foreground mb-4 text-center">
            Our Customer Assurance
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
            <div className="flex">
              <div className="flex-shrink-0 mr-4">
                <div className="bg-primary w-10 h-10 rounded-full flex items-center justify-center">
                  <Drill className="h-5 w-5 text-background" />
                </div>
              </div>
              <div>
                <h4 className="font-playfair text-lg font-semibold text-foreground mb-2">Free Repairs</h4>
                <p className="font-montserrat text-foreground/70">
                  We offer complimentary repairs for any manufacturing defects throughout the lifetime of your jewelry.
                </p>
              </div>
            </div>
            
            <div className="flex">
              <div className="flex-shrink-0 mr-4">
                <div className="bg-primary w-10 h-10 rounded-full flex items-center justify-center">
                  <RotateCcw className="h-5 w-5 text-background" />
                </div>
              </div>
              <div>
                <h4 className="font-playfair text-lg font-semibold text-foreground mb-2">100% Exchange Value</h4>
                <p className="font-montserrat text-foreground/70">
                  Full current value of metal and stones can be credited toward future purchases or upgrades.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import { CrownIcon, Gem, Hammer, PackageCheck, RotateCcw, Settings, ShoppingBag, Sparkles, MessageSquare, Clock } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      icon: <ShoppingBag className="h-6 w-6 text-background" />,
      title: "Explore Options",
      description: "Browse our luxury collection, request a quote for catalog items, or start a custom design journey."
    },
    {
      icon: <MessageSquare className="h-6 w-6 text-background" />,
      title: "Consultation & Approval",
      description: "Discuss your vision with our experts through our secure messaging platform and review design proposals."
    },
    {
      icon: <Hammer className="h-6 w-6 text-background" />,
      title: "Expert Craftsmanship",
      description: "Each piece is meticulously handcrafted by our master artisans using premium materials."
    },
    {
      icon: <PackageCheck className="h-6 w-6 text-background" />,
      title: "Safe Delivery",
      description: "Your luxury jewelry arrives in elegant packaging with signature confirmation and full insurance."
    }
  ];
  
  return (
    <section className="py-20 px-4 md:px-8 bg-background">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-playfair text-3xl md:text-4xl font-bold text-foreground mb-4">How It Works</h2>
          <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
          <p className="font-montserrat text-lg text-foreground/80 max-w-3xl mx-auto dark:text-slate-300">
            Whether you're seeking a catalog piece, a custom design, or a personalized variation, 
            our dedicated process ensures that each journey results in a truly special treasure.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div 
              key={index}
              className="bg-card rounded-lg shadow-md p-6 hover:shadow-lg transition duration-300"
            >
              <div className="bg-primary w-12 h-12 rounded-full flex items-center justify-center mb-6">
                {step.icon}
              </div>
              <h3 className="font-playfair text-xl font-semibold text-foreground mb-3">{step.title}</h3>
              <p className="font-montserrat text-foreground/70 dark:text-slate-300">{step.description}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-16 bg-white rounded-lg shadow-md p-8 dark:bg-gray-800">
          <h3 className="font-playfair text-2xl font-semibold text-primary mb-8 text-center dark:text-white">
            Our Service Options
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
            <div className="flex flex-col items-center bg-card rounded-lg p-6 shadow-sm">
              <div className="bg-accent w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-playfair text-lg font-semibold text-primary mb-2 dark:text-white text-center">Custom Design</h4>
              <p className="font-montserrat text-foreground/70 dark:text-slate-300 text-center">
                Create a one-of-a-kind piece with our design team. $150 consultation fee covers up to 
                four design iterations.
              </p>
            </div>
            
            <div className="flex flex-col items-center bg-card rounded-lg p-6 shadow-sm">
              <div className="bg-accent w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-playfair text-lg font-semibold text-primary mb-2 dark:text-white text-center">Product Quote</h4>
              <p className="font-montserrat text-foreground/70 dark:text-slate-300 text-center">
                Request a detailed quote for any catalog item with no obligation. Receive pricing, 
                material options, and timing.
              </p>
            </div>
            
            <div className="flex flex-col items-center bg-card rounded-lg p-6 shadow-sm">
              <div className="bg-accent w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-playfair text-lg font-semibold text-primary mb-2 dark:text-white text-center">Customization</h4>
              <p className="font-montserrat text-foreground/70 dark:text-slate-300 text-center">
                Personalize existing designs with your choice of metals, gems, and finishes. 
                No fee for customization consultations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

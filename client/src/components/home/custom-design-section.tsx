import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Upload } from "lucide-react";
import { METAL_TYPES, STONE_TYPES } from "@/lib/constants";

export default function CustomDesignSection() {
  const [isExpanded, setIsExpanded] = useState(false);
  
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
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Submit Your Design Section */}
          <div className="bg-background p-8 rounded-lg shadow-xl">
            <h4 className="font-playfair text-2xl font-semibold text-foreground mb-6">Submit Your Design</h4>
            
            <div className="border-2 border-dashed border-foreground/30 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition duration-300 mb-6">
              <Upload className="h-10 w-10 text-foreground/50 mx-auto mb-3" />
              <p className="font-montserrat text-foreground/70">
                Drag and drop your image here, or click to browse
              </p>
              <p className="font-montserrat text-xs text-foreground/50 mt-2">
                Accepts JPG, PNG, PDF (Max 5MB)
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block font-montserrat text-sm font-medium text-foreground mb-2">
                  Metal Type*
                </label>
                <Select>
                  <SelectTrigger className="w-full p-3 border border-foreground/20 rounded font-montserrat text-sm">
                    <SelectValue placeholder="Select metal type" />
                  </SelectTrigger>
                  <SelectContent>
                    {METAL_TYPES.map((metal) => (
                      <SelectItem key={metal.id} value={metal.id}>
                        {metal.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block font-montserrat text-sm font-medium text-foreground mb-2">
                  Primary Stones*
                </label>
                <Select>
                  <SelectTrigger className="w-full p-3 border border-foreground/20 rounded font-montserrat text-sm">
                    <SelectValue placeholder="Select stone type" />
                  </SelectTrigger>
                  <SelectContent>
                    {STONE_TYPES.map((stone) => (
                      <SelectItem key={stone.id} value={stone.id}>
                        {stone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {isExpanded && (
              <>
                <div className="mb-6">
                  <label className="block font-montserrat text-sm font-medium text-foreground mb-2">
                    Additional Notes
                  </label>
                  <Textarea 
                    rows={3}
                    placeholder="Share specific details about your vision..."
                    className="w-full p-3 border border-foreground/20 rounded font-montserrat text-sm" 
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block font-montserrat text-sm font-medium text-foreground mb-2">
                      Full Name*
                    </label>
                    <Input 
                      placeholder="Your Name"
                      className="p-3 border border-foreground/20 rounded font-montserrat text-sm" 
                    />
                  </div>
                  
                  <div>
                    <label className="block font-montserrat text-sm font-medium text-foreground mb-2">
                      Email Address*
                    </label>
                    <Input 
                      type="email"
                      placeholder="Your Email"
                      className="p-3 border border-foreground/20 rounded font-montserrat text-sm" 
                    />
                  </div>
                </div>
              </>
            )}
            
            <div className="flex flex-col space-y-3">
              <Button 
                onClick={() => setIsExpanded(!isExpanded)} 
                variant="outline" 
                className="w-full font-montserrat"
              >
                {isExpanded ? "Show Less" : "Show More Fields"}
              </Button>
              
              <Button 
                asChild
                className="w-full font-montserrat font-medium bg-primary text-background hover:bg-accent transition duration-300"
              >
                <Link href="/custom-design">Continue to Full Form</Link>
              </Button>
            </div>
          </div>
          
          {/* Our Design Process */}
          <div className="bg-background p-8 rounded-lg shadow-xl">
            <h4 className="font-playfair text-2xl font-semibold text-foreground mb-6 text-center">Our Design Process</h4>
            
            <div className="space-y-4">
              <div className="flex items-start p-4 rounded-lg bg-background/50 border border-foreground/10 hover:border-primary/30 hover:bg-primary/5 transition-colors">
                <div className="bg-primary text-pearl w-8 h-8 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">1</div>
                <div>
                  <h5 className="font-playfair text-lg font-semibold text-foreground mb-1">Submit your design</h5>
                  <p className="font-montserrat text-sm text-foreground/70">Share your inspiration and preferences with our design team</p>
                </div>
              </div>
              
              <div className="flex items-start p-4 rounded-lg bg-background/50 border border-foreground/10 hover:border-primary/30 hover:bg-primary/5 transition-colors">
                <div className="bg-primary text-pearl w-8 h-8 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">2</div>
                <div>
                  <h5 className="font-playfair text-lg font-semibold text-foreground mb-1">Receive CAD model</h5>
                  <p className="font-montserrat text-sm text-foreground/70">Get a detailed 3D visualization and quote for your custom piece</p>
                </div>
              </div>
              
              <div className="flex items-start p-4 rounded-lg bg-background/50 border border-foreground/10 hover:border-primary/30 hover:bg-primary/5 transition-colors">
                <div className="bg-primary text-pearl w-8 h-8 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">3</div>
                <div>
                  <h5 className="font-playfair text-lg font-semibold text-foreground mb-1">Approve & pay 50%</h5>
                  <p className="font-montserrat text-sm text-foreground/70">Confirm your design and pay the advance to begin production</p>
                </div>
              </div>
              
              <div className="flex items-start p-4 rounded-lg bg-background/50 border border-foreground/10 hover:border-primary/30 hover:bg-primary/5 transition-colors">
                <div className="bg-primary text-pearl w-8 h-8 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">4</div>
                <div>
                  <h5 className="font-playfair text-lg font-semibold text-foreground mb-1">Receive your masterpiece</h5>
                  <p className="font-montserrat text-sm text-foreground/70">Your perfectly crafted jewelry is delivered to your doorstep</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <img 
                src="https://images.unsplash.com/photo-1600701707248-20e17cdf1e2c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                alt="Custom jewelry design process" 
                className="rounded-lg shadow-md w-full h-40 object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

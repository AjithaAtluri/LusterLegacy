import { Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Testimonial {
  id: number;
  name: string;
  productType: string;
  rating: number;
  text: string;
  initials: string;
}

export default function Testimonials() {
  // Fetch testimonials
  const { data: testimonials, isLoading } = useQuery<Testimonial[]>({
    queryKey: ['/api/testimonials'],
  });
  
  // Default testimonials if API fails
  const defaultTestimonials: Testimonial[] = [
    {
      id: 1,
      name: "Priya Sharma",
      productType: "Custom Necklace",
      rating: 5,
      text: "The custom necklace I received exceeded all my expectations. The artisanship is extraordinary, and the stones catch light beautifully. A true heirloom piece.",
      initials: "PS"
    },
    {
      id: 2,
      name: "Arjun & Meera Kapoor",
      productType: "Wedding Collection",
      rating: 5,
      text: "Working with Luster Legacy for our wedding rings was a dream. They perfectly captured our vision and made the entire process stress-free. The rings are stunning.",
      initials: "AK"
    },
    {
      id: 3,
      name: "Nisha Patel",
      productType: "Heritage Bracelet",
      rating: 5,
      text: "I inherited a design from my grandmother and wanted to recreate it with modern elements. The team at Luster Legacy honored the original while making it uniquely mine.",
      initials: "NP"
    }
  ];
  
  const displayTestimonials = testimonials || defaultTestimonials;
  
  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, index) => (
      <Star 
        key={index}
        className={`h-4 w-4 ${index < rating ? 'fill-primary text-primary' : 'text-gray-300'}`}
      />
    ));
  };
  
  return (
    <section className="py-20 px-4 md:px-8 bg-background">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-playfair text-3xl md:text-4xl font-bold text-foreground mb-4">
            Our Clients' Stories
          </h2>
          <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {isLoading ? (
            // Loading skeletons
            Array(3).fill(0).map((_, index) => (
              <div key={index} className="bg-card rounded-lg shadow-md p-8 hover:shadow-lg transition duration-300">
                <div className="mb-4">
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-24 w-full mb-6" />
                <div className="flex items-center">
                  <Skeleton className="h-12 w-12 rounded-full mr-4" />
                  <div>
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            // Actual testimonials
            displayTestimonials.map((testimonial) => (
              <div key={testimonial.id} className="bg-card rounded-lg shadow-md p-8 hover:shadow-lg transition duration-300">
                <div className="flex items-center mb-4">
                  <div className="flex">
                    {renderStars(testimonial.rating)}
                  </div>
                </div>
                <p className="font-cormorant text-xl italic text-foreground/80 mb-6">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center">
                  <Avatar className="h-12 w-12 bg-accent text-background mr-4">
                    <AvatarFallback>{testimonial.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-playfair text-lg font-semibold text-foreground">
                      {testimonial.name}
                    </h4>
                    <p className="font-montserrat text-sm text-foreground/70">
                      {testimonial.productType}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

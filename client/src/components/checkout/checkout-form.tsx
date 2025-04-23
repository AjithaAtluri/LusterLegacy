import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { CreditCard, ShoppingBag, MapPin, Check } from "lucide-react";

interface CheckoutFormProps {
  cart: {
    items: Array<{
      id: number;
      product: {
        id: number;
        name: string;
        imageUrl: string;
      };
      metalType: {
        id: string;
        name: string;
      };
      stoneType: {
        id: string;
        name: string;
      };
      price: number;
    }>;
    total: number;
  };
}

const checkoutFormSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Valid phone number is required"),
  address: z.object({
    line1: z.string().min(5, "Address line 1 is required"),
    line2: z.string().optional(),
    city: z.string().min(2, "City is required"),
    state: z.string().min(2, "State is required"),
    postalCode: z.string().min(5, "Postal code is required"),
    country: z.string().min(2, "Country is required")
  }),
  specialInstructions: z.string().optional(),
  agreeToTerms: z.literal(true, {
    errorMap: () => ({ message: "You must agree to terms and conditions" })
  })
});

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

export default function CheckoutForm({ cart }: CheckoutFormProps) {
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      address: {
        line1: "",
        line2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "India"
      },
      specialInstructions: "",
      agreeToTerms: false
    }
  });
  
  const onSubmit = async (data: CheckoutFormValues) => {
    if (cart.items.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart before checking out.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // In a real app, this would connect to a payment gateway
      // For now, we'll just simulate the process
      await apiRequest("POST", "/api/orders", {
        customer: {
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          address: data.address
        },
        cart: cart.items,
        specialInstructions: data.specialInstructions
      });
      
      toast({
        title: "Order placed successfully!",
        description: "You'll receive a confirmation email shortly.",
      });
      
      // Redirect to success page
      setLocation("/checkout/success");
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Error processing order",
        description: "Please try again later or contact customer support.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Calculate advance payment (50%)
  const advancePayment = Math.round(cart.total * 0.5);
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Checkout Form */}
      <div className="lg:col-span-7">
        <Card>
          <CardHeader>
            <CardTitle className="font-playfair text-2xl">Checkout</CardTitle>
            <CardDescription>
              Complete your order by providing your shipping and payment details
            </CardDescription>
          </CardHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                {/* Contact Information */}
                <div>
                  <h3 className="font-playfair text-lg font-semibold mb-4 flex items-center">
                    <CreditCard className="mr-2 h-5 w-5 text-primary" />
                    Contact Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                {/* Shipping Address */}
                <div>
                  <h3 className="font-playfair text-lg font-semibold mb-4 flex items-center">
                    <MapPin className="mr-2 h-5 w-5 text-primary" />
                    Shipping Address
                  </h3>
                  
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="address.line1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Line 1</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="address.line2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Line 2 (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="address.city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="address.state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="address.postalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postal Code</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="address.country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Special Instructions */}
                <FormField
                  control={form.control}
                  name="specialInstructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Special Instructions (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Any special requests or delivery instructions"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Terms and Conditions */}
                <FormField
                  control={form.control}
                  name="agreeToTerms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox 
                          checked={field.value} 
                          onCheckedChange={field.onChange} 
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm">
                          I agree to the terms and conditions, including the 50% advance payment policy and the exchange/repair guarantees.
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
              
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full font-montserrat bg-primary text-background hover:bg-accent"
                  disabled={isSubmitting || cart.items.length === 0}
                >
                  {isSubmitting 
                    ? "Processing..." 
                    : `Pay ${formatCurrency(advancePayment)} Advance`
                  }
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
      
      {/* Order Summary */}
      <div className="lg:col-span-5">
        <Card>
          <CardHeader>
            <CardTitle className="font-playfair text-2xl flex items-center">
              <ShoppingBag className="mr-2 h-5 w-5" />
              Order Summary
            </CardTitle>
            <CardDescription>
              {cart.items.length} item{cart.items.length !== 1 ? 's' : ''} in your cart
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {cart.items.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-foreground/70 mb-4">Your cart is empty</p>
                <Button 
                  asChild
                  variant="outline"
                >
                  <a href="/collections">Browse Collections</a>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Cart Items */}
                <div className="space-y-4">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="h-16 w-16 rounded-md overflow-hidden flex-shrink-0">
                        <img 
                          src={item.product.imageUrl} 
                          alt={item.product.name} 
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-playfair font-medium">{item.product.name}</h4>
                        <div className="text-sm text-foreground/70">
                          <p>{item.metalType.name} | {item.stoneType.name}</p>
                        </div>
                      </div>
                      <div className="font-playfair font-medium">
                        {formatCurrency(item.price)}
                      </div>
                    </div>
                  ))}
                </div>
                
                <Separator />
                
                {/* Price Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-montserrat">Subtotal</span>
                    <span className="font-medium">{formatCurrency(cart.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-montserrat">Shipping</span>
                    <span className="font-medium">Free</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span className="font-montserrat">Total</span>
                    <span>{formatCurrency(cart.total)}</span>
                  </div>
                </div>
                
                <div className="bg-accent/10 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-accent">
                    <span className="font-montserrat font-medium">Advance Payment (50%)</span>
                    <span className="font-semibold">{formatCurrency(advancePayment)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-montserrat">Balance on Delivery</span>
                    <span>{formatCurrency(cart.total - advancePayment)}</span>
                  </div>
                </div>
                
                {/* Customer Assurance */}
                <div className="bg-secondary/30 p-4 rounded-lg space-y-2">
                  <h4 className="font-playfair font-medium flex items-center">
                    <Check className="h-4 w-4 text-green-600 mr-2" />
                    Customer Assurance
                  </h4>
                  <ul className="text-sm space-y-1">
                    <li className="flex items-start">
                      <Check className="h-3 w-3 text-green-600 mr-2 mt-1" />
                      <span>Free repairs for any manufacturing defects</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-3 w-3 text-green-600 mr-2 mt-1" />
                      <span>100% exchange value on metal and stones</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-3 w-3 text-green-600 mr-2 mt-1" />
                      <span>Secure, insured shipping included</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

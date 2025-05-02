import { useQuery } from "@tanstack/react-query";
import { useLocation, Link as WouterLink } from "wouter";
import { Helmet } from "react-helmet";
import PayPalCheckoutForm from "@/components/checkout/paypal-checkout-form";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingBag, AlertTriangle, CheckCircle2, Hammer, Mail, CreditCard, PackageCheck } from "lucide-react";

export default function Checkout() {
  const [location] = useLocation();
  
  // Check if this is the success page
  const isSuccessPage = location === '/checkout/success';
  
  // Fetch cart items
  const { data: cart, isLoading, error } = useQuery({
    queryKey: ['/api/cart'],
    enabled: !isSuccessPage
  });
  
  // If this is the success page, render order confirmation
  if (isSuccessPage) {
    return (
      <>
        <Helmet>
          <title>Order Confirmed | Luster Legacy</title>
          <meta name="description" content="Your order has been successfully placed. Thank you for choosing Luster Legacy." />
        </Helmet>
        
        <div className="container mx-auto px-4 md:px-8 py-16">
          <div className="max-w-lg mx-auto text-center">
            <div className="bg-green-100 rounded-full h-24 w-24 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="font-playfair text-3xl font-bold text-foreground mb-4">Order Confirmed!</h1>
            <p className="font-montserrat text-foreground/80 mb-8">
              Thank you for your order. We've received your 50% advance payment and your exquisite piece is now being crafted by our master artisans. You'll receive updates on your order status via email.
            </p>
            <div className="bg-secondary/30 p-6 rounded-lg mb-8">
              <h2 className="font-playfair text-xl font-semibold mb-3">What Happens Next?</h2>
              <ol className="font-montserrat text-left space-y-2">
                <li className="flex items-start">
                  <span className="inline-block bg-primary text-background w-6 h-6 rounded-full flex items-center justify-center mr-2 mt-0.5">
                    <Hammer className="h-3.5 w-3.5 text-background" />
                  </span>
                  <span className="dark:text-slate-300">Our artisans will begin crafting your jewelry with meticulous care.</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block bg-primary text-background w-6 h-6 rounded-full flex items-center justify-center mr-2 mt-0.5">
                    <Mail className="h-3.5 w-3.5 text-background" />
                  </span>
                  <span className="dark:text-slate-300">You'll receive progress updates via email.</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block bg-primary text-background w-6 h-6 rounded-full flex items-center justify-center mr-2 mt-0.5">
                    <CreditCard className="h-3.5 w-3.5 text-background" />
                  </span>
                  <span className="dark:text-slate-300">Once complete, we'll notify you for the balance payment.</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block bg-primary text-background w-6 h-6 rounded-full flex items-center justify-center mr-2 mt-0.5">
                    <PackageCheck className="h-3.5 w-3.5 text-background" />
                  </span>
                  <span className="dark:text-slate-300">Your masterpiece will be securely delivered to your doorstep.</span>
                </li>
              </ol>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="font-montserrat bg-primary text-background hover:bg-accent">
                <WouterLink href="/">
                  Return to Home
                </WouterLink>
              </Button>
              <Button asChild variant="outline" className="font-montserrat">
                <WouterLink href="/collections">
                  Continue Shopping
                </WouterLink>
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }
  
  // Loading state
  if (isLoading) {
    return (
      <>
        <Helmet>
          <title>Checkout | Luster Legacy</title>
          <meta name="description" content="Complete your purchase of luxury custom jewelry from Luster Legacy." />
        </Helmet>
        
        <div className="bg-charcoal py-20">
          <div className="container mx-auto px-4 md:px-8 text-center">
            <h1 className="font-playfair text-3xl md:text-5xl font-bold text-pearl mb-4">Checkout</h1>
            <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
            <p className="font-cormorant text-lg md:text-xl text-pearl/80 max-w-2xl mx-auto">
              Complete your order details and secure your exquisite piece with a 50% advance payment.
            </p>
          </div>
        </div>
        
        <div className="container mx-auto px-4 md:px-8 py-12 flex justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      </>
    );
  }
  
  // Error state
  if (error) {
    return (
      <>
        <Helmet>
          <title>Checkout Error | Luster Legacy</title>
          <meta name="description" content="There was an error loading your checkout information." />
        </Helmet>
        
        <div className="container mx-auto px-4 md:px-8 py-16 text-center">
          <div className="bg-red-100 rounded-full h-24 w-24 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-12 w-12 text-red-600" />
          </div>
          <h1 className="font-playfair text-2xl font-bold text-foreground mb-4">Unable to Load Cart</h1>
          <p className="font-montserrat text-foreground/70 mb-8">
            We encountered an error while loading your cart information. Please try again later or contact customer support.
          </p>
          <Button 
            asChild
            className="font-montserrat"
          >
            <WouterLink href="/collections">
              Return to Collections
            </WouterLink>
          </Button>
        </div>
      </>
    );
  }
  
  // Empty cart state
  if (cart && cart.items.length === 0) {
    return (
      <>
        <Helmet>
          <title>Your Cart | Luster Legacy</title>
          <meta name="description" content="View your cart and complete your purchase of luxury custom jewelry from Luster Legacy." />
        </Helmet>
        
        <div className="bg-charcoal py-20">
          <div className="container mx-auto px-4 md:px-8 text-center">
            <h1 className="font-playfair text-3xl md:text-5xl font-bold text-pearl mb-4">Your Cart</h1>
            <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
            <p className="font-cormorant text-lg md:text-xl text-pearl/80 max-w-2xl mx-auto">
              Your cart is currently empty.
            </p>
          </div>
        </div>
        
        <div className="container mx-auto px-4 md:px-8 py-16 text-center">
          <div className="bg-secondary/30 p-8 rounded-lg max-w-md mx-auto">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-playfair text-xl font-semibold text-foreground mb-2">Your Cart is Empty</h2>
            <p className="font-montserrat text-foreground/70 mb-6">
              Browse our collections to discover exquisite pieces or create a custom design that tells your unique story.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="font-montserrat bg-primary text-background hover:bg-accent">
                <WouterLink href="/collections">
                  Browse Collections
                </WouterLink>
              </Button>
              <Button asChild variant="outline" className="font-montserrat">
                <WouterLink href="/custom-design">
                  Custom Design
                </WouterLink>
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }
  
  // Render checkout form with cart data
  return (
    <>
      <Helmet>
        <title>Checkout | Luster Legacy</title>
        <meta name="description" content="Complete your purchase of luxury custom jewelry from Luster Legacy." />
      </Helmet>
      
      <div className="bg-charcoal py-20">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <h1 className="font-playfair text-3xl md:text-5xl font-bold text-pearl mb-4">Checkout</h1>
          <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
          <p className="font-cormorant text-lg md:text-xl text-pearl/80 max-w-2xl mx-auto">
            Complete your order details and secure your exquisite piece with a 50% advance payment.
          </p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 md:px-8 py-12">
        <PayPalCheckoutForm cart={cart} />
      </div>
    </>
  );
}

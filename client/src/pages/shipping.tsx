import { Helmet } from "react-helmet";
import { COMPANY } from "@/lib/constants";
import { Truck, Package, Shield, Clock } from "lucide-react";

export default function ShippingDelivery() {
  return (
    <div className="container mx-auto py-12 px-4">
      <Helmet>
        <title>Shipping & Delivery | {COMPANY.name}</title>
        <meta name="description" content="Shipping and delivery information for Luster Legacy custom jewelry" />
      </Helmet>
      
      <div className="max-w-4xl mx-auto">
        <h1 className="font-playfair text-4xl md:text-5xl font-bold mb-8 text-center">Shipping & Delivery</h1>
        
        <p className="text-lg text-center mb-12 max-w-3xl mx-auto">
          At {COMPANY.name}, we ensure that your precious jewelry reaches you safely and securely.
          All our shipments are fully insured and tracked for your peace of mind.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16">
          <div className="bg-card rounded-lg p-8 shadow-md">
            <div className="flex items-center mb-6">
              <div className="p-3 rounded-full bg-primary/10 mr-4">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h2 className="font-playfair text-2xl font-semibold">Processing Times</h2>
            </div>
            <ul className="space-y-4">
              <li className="flex">
                <span className="font-medium mr-2">Ready-Made Products:</span> 
                <span>1-3 business days before shipping</span>
              </li>
              <li className="flex">
                <span className="font-medium mr-2">Custom Designs:</span> 
                <span>4-6 weeks for production after design approval</span>
              </li>
              <li className="flex">
                <span className="font-medium mr-2">Special Orders:</span> 
                <span>Timeframe provided during consultation</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-card rounded-lg p-8 shadow-md">
            <div className="flex items-center mb-6">
              <div className="p-3 rounded-full bg-primary/10 mr-4">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <h2 className="font-playfair text-2xl font-semibold">Shipping Methods</h2>
            </div>
            <ul className="space-y-4">
              <li className="flex">
                <span className="font-medium mr-2">Standard Shipping:</span> 
                <span>3-7 business days (Domestic)</span>
              </li>
              <li className="flex">
                <span className="font-medium mr-2">International Shipping:</span> 
                <span>7-14 business days (varies by location)</span>
              </li>
              <li className="flex">
                <span className="font-medium mr-2">Express Shipping:</span> 
                <span>1-3 business days (available at additional cost)</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="bg-secondary/30 rounded-lg p-8 mb-16">
          <h2 className="font-playfair text-2xl font-semibold mb-6 text-center">Our Shipping Promise</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-background rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-playfair text-lg font-medium mb-2">Premium Packaging</h3>
              <p className="text-sm">All jewelry is packaged in elegant boxes with authenticity certificates</p>
            </div>
            <div className="text-center">
              <div className="bg-background rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-playfair text-lg font-medium mb-2">Fully Insured</h3>
              <p className="text-sm">Every shipment is insured for its full value during transit</p>
            </div>
            <div className="text-center">
              <div className="bg-background rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Truck className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-playfair text-lg font-medium mb-2">Reliable Tracking</h3>
              <p className="text-sm">Track your order from our workshop to your doorstep</p>
            </div>
          </div>
        </div>
        
        <div className="prose prose-lg max-w-none">
          <h2>International Shipping</h2>
          <p>
            We ship worldwide to most countries. International customers may be responsible for import duties, 
            taxes, and customs clearance fees. These charges vary by country and are not included in our prices.
          </p>
          
          <h2>Order Tracking</h2>
          <p>
            Once your order ships, you will receive a tracking number via email. You can use this number 
            to monitor the progress of your shipment through our shipping partners' websites.
          </p>
          
          <h2>Delivery Confirmation</h2>
          <p>
            Most shipments require a signature upon delivery to ensure security. If you wish to authorize 
            delivery without a signature, please contact our customer service team.
          </p>
          
          <h2>Shipping Delays</h2>
          <p>
            While we strive to meet all estimated delivery dates, occasional delays may occur due to customs 
            processing, weather conditions, or other factors beyond our control. We will keep you informed 
            of any significant delays affecting your order.
          </p>
          
          <h2>Contact Us</h2>
          <p>
            If you have questions about shipping or delivery, please contact our customer service team at:{" "}
            <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
          </p>
        </div>
      </div>
    </div>
  );
}
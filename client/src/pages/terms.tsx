import { Helmet } from "react-helmet";
import { COMPANY } from "@/lib/constants";

export default function TermsOfService() {
  return (
    <div className="container mx-auto py-12 px-4">
      <Helmet>
        <title>Terms of Service | {COMPANY.name}</title>
        <meta name="description" content="Terms of Service for Luster Legacy custom jewelry" />
      </Helmet>
      
      <div className="max-w-4xl mx-auto">
        <h1 className="font-playfair text-4xl md:text-5xl font-bold mb-8 text-center">Terms of Service</h1>
        
        <div className="prose prose-lg max-w-none mt-8">
          <p className="lead mb-6">
            Welcome to {COMPANY.name}. These Terms of Service govern your use of our website and services.
            By accessing or using our website, you agree to be bound by these terms.
          </p>
          
          <h2>Products and Services</h2>
          <p>
            {COMPANY.name} offers custom-designed luxury jewelry and related services. We strive to provide accurate
            descriptions and visuals of our products, but variations in color, material, and design may occur 
            due to the handcrafted nature of our pieces.
          </p>
          
          <h2>Payment Terms</h2>
          <p>
            We operate on a 50% advance payment model for all orders. The remaining balance is due before shipping 
            the final product. All prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes 
            unless otherwise stated.
          </p>
          
          <h2>Custom Design Process</h2>
          <p>
            For custom design services:
          </p>
          <ol>
            <li>Initial consultation and design request submission</li>
            <li>Design review and price estimation</li>
            <li>CAD design approval</li>
            <li>50% advance payment to begin production</li>
            <li>Production and quality control</li>
            <li>Final payment before shipping</li>
          </ol>
          
          <h2>Order Cancellation</h2>
          <p>
            Orders may be cancelled within 24 hours of placement for ready-made products. For custom designs, 
            cancellation is possible before production begins, subject to a design fee deduction. Once production 
            has started, cancellation fees may apply.
          </p>
          
          <h2>Shipping and Delivery</h2>
          <p>
            All products are shipped fully insured. Delivery timeframes are estimates and may vary based on destination 
            and customs processing. Standard production time for custom pieces is 4-6 weeks, with an additional 
            3-7 business days for shipping.
          </p>
          
          <h2>Returns and Exchanges</h2>
          <p>
            For ready-made products, returns are accepted within 7 days of delivery for exchange or store credit. 
            Custom-designed pieces cannot be returned unless there is a manufacturing defect. All returned items 
            must be in original condition and packaging.
          </p>
          
          <h2>Warranty and Repairs</h2>
          <p>
            All products come with a 1-year warranty against manufacturing defects. We offer complimentary cleaning 
            and inspection services. Repair services for damages due to normal wear and tear are available at 
            a nominal charge after the warranty period.
          </p>
          
          <h2>Intellectual Property</h2>
          <p>
            All content on our website, including designs, images, text, and logos, is the property of {COMPANY.name} 
            and is protected by intellectual property laws. Custom designs created for clients remain the intellectual 
            property of {COMPANY.name}, though we will not reproduce exact custom pieces without permission.
          </p>
          
          <h2>Limitation of Liability</h2>
          <p>
            {COMPANY.name} shall not be liable for any indirect, incidental, special, consequential, or punitive damages 
            resulting from your use of our products or services, regardless of the cause of action.
          </p>
          
          <h2>Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting 
            to the website. Your continued use of our services after such changes constitutes acceptance of the new terms.
          </p>
          
          <h2>Contact Us</h2>
          <p>
            If you have any questions or concerns about our Terms of Service, please contact us at:{" "}
            <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
          </p>
          
          <p className="text-sm text-muted-foreground mt-8">
            Last updated: April 2023
          </p>
        </div>
      </div>
    </div>
  );
}
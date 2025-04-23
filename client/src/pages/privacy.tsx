import { Helmet } from "react-helmet";
import { COMPANY } from "@/lib/constants";

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto py-12 px-4">
      <Helmet>
        <title>Privacy Policy | {COMPANY.name}</title>
        <meta name="description" content="Privacy Policy for Luster Legacy custom jewelry" />
      </Helmet>
      
      <div className="max-w-4xl mx-auto">
        <h1 className="font-playfair text-4xl md:text-5xl font-bold mb-8 text-center">Privacy Policy</h1>
        
        <div className="prose prose-lg max-w-none mt-8">
          <p className="lead mb-6">
            At {COMPANY.name}, we are committed to protecting your privacy and ensuring the security of your personal information.
            This Privacy Policy outlines how we collect, use, and safeguard your data when you use our website or services.
          </p>
          
          <h2>Information We Collect</h2>
          <p>
            We collect information that you provide directly to us, such as when you:
          </p>
          <ul>
            <li>Create an account or profile</li>
            <li>Place an order for products</li>
            <li>Submit a custom design request</li>
            <li>Sign up for our newsletter</li>
            <li>Contact us with inquiries</li>
            <li>Participate in surveys or promotions</li>
          </ul>
          
          <p>
            This information may include your name, email address, phone number, shipping and billing addresses,
            payment information, and preferences related to our products and services.
          </p>
          
          <h2>How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Process and fulfill your orders</li>
            <li>Communicate with you about your orders, accounts, or requests</li>
            <li>Personalize your shopping experience</li>
            <li>Improve our products and services</li>
            <li>Send marketing communications (if you've opted in)</li>
            <li>Comply with legal obligations</li>
          </ul>
          
          <h2>Information Sharing</h2>
          <p>
            We do not sell or rent your personal information to third parties. We may share your information with:
          </p>
          <ul>
            <li>Service providers who help us operate our business (payment processors, shipping companies, etc.)</li>
            <li>Professional advisors (lawyers, accountants, etc.)</li>
            <li>Government authorities when required by law</li>
          </ul>
          
          <h2>Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal information
            against unauthorized access, alteration, disclosure, or destruction.
          </p>
          
          <h2>Your Rights</h2>
          <p>Depending on your location, you may have certain rights regarding your personal information, including:</p>
          <ul>
            <li>Access to your personal information</li>
            <li>Correction of inaccurate or incomplete information</li>
            <li>Deletion of your personal information</li>
            <li>Objection to certain processing activities</li>
            <li>Data portability</li>
          </ul>
          
          <h2>Cookies and Similar Technologies</h2>
          <p>
            We use cookies and similar technologies to enhance your browsing experience, analyze website traffic,
            and personalize content. You can control cookies through your browser settings.
          </p>
          
          <h2>Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements.
            We will notify you of any significant changes.
          </p>
          
          <h2>Contact Us</h2>
          <p>
            If you have any questions or concerns about our Privacy Policy or data practices, please contact us at:{" "}
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
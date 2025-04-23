import HeroSection from "@/components/home/hero-section";
import FeaturedProducts from "@/components/home/featured-products";
import CustomDesignSection from "@/components/home/custom-design-section";
import HowItWorks from "@/components/home/how-it-works";
import StorySection from "@/components/home/story-section";
import Testimonials from "@/components/home/testimonials";
import ContactSection from "@/components/home/contact-section";
import CTASection from "@/components/home/cta-section";
import { Helmet } from "react-helmet";

export default function Home() {
  return (
    <>
      <Helmet>
        <title>Luster Legacy | Luxury Custom Jewelry</title>
        <meta name="description" content="Luxury custom jewelry handcrafted by master artisans. Design your own bespoke pieces or choose from our curated collection." />
      </Helmet>
      
      <HeroSection />
      <FeaturedProducts />
      <CustomDesignSection />
      <HowItWorks />
      <StorySection />
      <Testimonials />
      <ContactSection />
      <CTASection />
    </>
  );
}

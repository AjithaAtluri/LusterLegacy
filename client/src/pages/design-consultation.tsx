import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Sparkles, MessageCircle, Calendar, Users } from "lucide-react";
import { Link } from "wouter";

export default function DesignConsultation() {
  return (
    <>
      <Helmet>
        <title>Design Consultation - Luster Legacy</title>
        <meta name="description" content="Get expert design consultation for your custom jewelry. Our master craftsmen will help bring your vision to life with personalized guidance and recommendations." />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="font-playfair text-4xl md:text-5xl font-bold mb-6">
            Design Consultation
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Transform your jewelry dreams into reality with expert guidance from our master craftsmen. 
            Get personalized consultations tailored to your style, budget, and vision.
          </p>
        </div>

        {/* Consultation Options */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {/* AI Design Consultation */}
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-primary" />
                AI Design Assistant
              </CardTitle>
              <CardDescription>
                Get instant design ideas and material recommendations with our AI-powered design consultant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm">
                  <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                  Instant design suggestions
                </div>
                <div className="flex items-center text-sm">
                  <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                  Material and stone recommendations
                </div>
                <div className="flex items-center text-sm">
                  <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                  Price estimates
                </div>
              </div>
              <Link href="/custom-design">
                <Button className="w-full">
                  Start AI Consultation
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Personal Consultation */}
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="h-5 w-5 mr-2 text-primary" />
                Personal Consultation
              </CardTitle>
              <CardDescription>
                One-on-one consultation with our expert jewelry designers and craftsmen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm">
                  <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                  Expert design guidance
                </div>
                <div className="flex items-center text-sm">
                  <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                  Technical feasibility review
                </div>
                <div className="flex items-center text-sm">
                  <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                  Detailed cost breakdown
                </div>
              </div>
              <Link href="/contact">
                <Button variant="outline" className="w-full">
                  Schedule Consultation
                  <Calendar className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Custom Design Request */}
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-primary" />
                Submit Design Request
              </CardTitle>
              <CardDescription>
                Submit your custom design requirements and get a detailed quote and timeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm">
                  <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                  Detailed design brief
                </div>
                <div className="flex items-center text-sm">
                  <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                  Professional quote
                </div>
                <div className="flex items-center text-sm">
                  <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                  Project timeline
                </div>
              </div>
              <Link href="/custom-design">
                <Button variant="outline" className="w-full">
                  Submit Request
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <div className="bg-muted/50 rounded-lg p-8 mb-12">
          <h2 className="font-playfair text-3xl font-bold text-center mb-8">How Our Consultation Process Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="font-semibold mb-2">Share Your Vision</h3>
              <p className="text-sm text-muted-foreground">
                Tell us about your dream piece, inspiration, or specific requirements
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="font-semibold mb-2">Expert Review</h3>
              <p className="text-sm text-muted-foreground">
                Our master craftsmen review your requirements and provide professional insights
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="font-semibold mb-2">Design & Quote</h3>
              <p className="text-sm text-muted-foreground">
                Receive detailed design concepts, material recommendations, and pricing
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                4
              </div>
              <h3 className="font-semibold mb-2">Bring to Life</h3>
              <p className="text-sm text-muted-foreground">
                Once approved, our artisans begin crafting your unique piece
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="font-playfair text-3xl font-bold mb-4">Ready to Start Your Custom Journey?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Whether you have a clear vision or need inspiration, our design consultation will help you create the perfect piece of jewelry.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/custom-design">
              <Button size="lg" className="rounded-full px-8">
                Start AI Consultation
                <Sparkles className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="rounded-full px-8">
                Schedule Personal Meeting
                <Calendar className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
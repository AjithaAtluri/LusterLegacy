import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Sparkles, MessageCircle, Calendar, Users, DollarSign, Clock, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function DesignConsultation() {
  const { user } = useAuth();

  return (
    <>
      <Helmet>
        <title>Design Consultation - Luster Legacy</title>
        <meta name="description" content="Professional jewelry design consultation with AI assistance, expert guidance, and custom CAD modeling. $150 consultation fee includes up to 4 design iterations." />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="font-playfair text-4xl md:text-5xl font-bold mb-6">
            Professional Design Consultation
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Get expert guidance from master craftsmen and AI-powered design assistance. 
            Transform your vision into detailed CAD models and bring your custom jewelry to life.
          </p>
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 max-w-2xl mx-auto">
            <div className="flex items-center justify-center mb-2">
              <DollarSign className="h-5 w-5 text-primary mr-2" />
              <span className="font-semibold text-primary">$150 Consultation Fee</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Includes up to 4 design iterations, CAD modeling, and expert consultation
            </p>
          </div>
        </div>

        {/* Main CTA - Start Full Consultation Process */}
        <div className="text-center mb-12">
          <Card className="max-w-4xl mx-auto border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl flex items-center justify-center">
                <Sparkles className="h-6 w-6 mr-3 text-primary" />
                Complete Design Consultation Process
              </CardTitle>
              <CardDescription className="text-lg">
                Professional design consultation with AI assistance, expert review, and CAD modeling
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <div className="bg-primary/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">AI Design Assistant</h3>
                  <p className="text-sm text-muted-foreground">Get instant design ideas with GPT-4 vision analysis</p>
                </div>
                <div className="text-center">
                  <div className="bg-primary/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Expert Review</h3>
                  <p className="text-sm text-muted-foreground">Master craftsmen review and refine your design</p>
                </div>
                <div className="text-center">
                  <div className="bg-primary/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">CAD Modeling</h3>
                  <p className="text-sm text-muted-foreground">Detailed 3D models with up to 4 iterations</p>
                </div>
              </div>
              
              {user ? (
                <Link href="/custom-design">
                  <Button size="lg" className="w-full md:w-auto px-8">
                    Start Design Consultation <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <div className="text-center">
                  <Link href="/auth">
                    <Button size="lg" className="w-full md:w-auto px-8 mb-3">
                      Login to Start Consultation <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <p className="text-sm text-muted-foreground">Login required to save your design progress</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Service Details */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* What's Included */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                What's Included ($150)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-green-100 rounded-full p-1 mr-3 mt-0.5">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">AI-Powered Design Analysis</h4>
                    <p className="text-sm text-muted-foreground">GPT-4 vision model analyzes your inspiration images and provides detailed recommendations</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-green-100 rounded-full p-1 mr-3 mt-0.5">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Expert Craftsman Review</h4>
                    <p className="text-sm text-muted-foreground">Master jewelry designers review feasibility and provide professional guidance</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-green-100 rounded-full p-1 mr-3 mt-0.5">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Up to 4 Design Iterations</h4>
                    <p className="text-sm text-muted-foreground">Refine your design with multiple rounds of revisions included</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-green-100 rounded-full p-1 mr-3 mt-0.5">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">3D CAD Modeling</h4>
                    <p className="text-sm text-muted-foreground">Professional CAD models showing your design from all angles</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Process Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-primary" />
                Process Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium">Submit Design Form</h4>
                    <p className="text-sm text-muted-foreground">Upload inspiration, specify preferences</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium">AI Analysis & Chat</h4>
                    <p className="text-sm text-muted-foreground">Instant AI consultation with design recommendations</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium">Pay Consultation Fee</h4>
                    <p className="text-sm text-muted-foreground">$150 fee to begin professional design work</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                    4
                  </div>
                  <div>
                    <h4 className="font-medium">Expert Design & CAD</h4>
                    <p className="text-sm text-muted-foreground">Professional modeling and refinement (3-5 days)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer Dashboard Link for Existing Requests */}
        {user && (
          <div className="text-center mb-12">
            <Card className="max-w-2xl mx-auto border border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 mr-2 text-primary" />
                  Existing Design Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  View your current design consultations, payment status, and communicate with our design team
                </p>
                <Link href="/customer-dashboard">
                  <Button variant="outline" className="w-full">
                    View My Design Requests <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="font-playfair text-3xl font-bold mb-4">Ready to Start Your Professional Design Consultation?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Experience our complete design consultation process with AI assistance, expert craftsmanship, and professional CAD modeling.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link href="/custom-design">
                <Button size="lg" className="rounded-full px-8">
                  Begin Full Consultation Process
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link href="/auth">
                <Button size="lg" className="rounded-full px-8">
                  Login to Start Consultation
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
            <Link href="/contact">
              <Button variant="outline" size="lg" className="rounded-full px-8">
                Contact for Questions
                <MessageCircle className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
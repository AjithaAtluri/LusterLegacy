import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PenLine, Star, Heart, User, Edit, Shield } from "lucide-react";
import { ClientStoryGrid } from "@/components/client-stories/client-story-grid";
import { ClientStoryForm } from "@/components/client-stories/client-story-form";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

export default function ClientStories() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("view");
  
  // Check URL parameters for initial tab setting
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (tabParam === "share" && user) {
      setActiveTab("share");
    }
  }, [user]);
  
  // Fetch approved testimonials
  const { data: testimonials, isLoading } = useQuery({
    queryKey: ["/api/testimonials"],
    queryFn: async () => {
      const res = await fetch("/api/testimonials");
      if (!res.ok) {
        throw new Error("Failed to fetch client stories");
      }
      return res.json();
    },
  });
  
  return (
    <>
      <Helmet>
        <title>Client Stories | Luster Legacy</title>
        <meta name="description" content="Read stories from satisfied Luster Legacy clients and share your own experience with our luxury jewelry." />
      </Helmet>
      
      <div className="container py-12 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Client Stories</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover the experiences of our valued clients who have found their perfect pieces
            with Luster Legacy, and share your own journey with our jewelry.
          </p>
          
          {/* Admin Edit/Approve Button */}
          {user && user.role === 'admin' && (
            <div className="flex justify-center mt-4">
              <Button asChild variant="default" className="bg-primary hover:bg-primary/90 text-white">
                <Link href="/admin/testimonials">
                  <Shield className="mr-2 h-4 w-4" />
                  Edit/Approve Client Stories
                </Link>
              </Button>
            </div>
          )}
        </div>
        
        <Tabs
          defaultValue="view"
          value={activeTab}
          onValueChange={setActiveTab}
          className="max-w-5xl mx-auto"
        >
          <div className="flex justify-center mb-8">
            <TabsList className={`grid w-full max-w-md ${user ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <TabsTrigger value="view" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                <span>View Stories</span>
              </TabsTrigger>
              {user && (
                <TabsTrigger value="share" className="flex items-center gap-2">
                  <PenLine className="h-4 w-4" />
                  <span>Share Your Story</span>
                </TabsTrigger>
              )}
            </TabsList>
          </div>
          
          <TabsContent value="view" className="max-w-6xl mx-auto">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-semibold mb-4">Our Clients' Experiences</h2>
              <p className="text-muted-foreground">
                Read about the experiences of our clients and their journeys with Luster Legacy jewelry.
              </p>
            </div>
            
            <ClientStoryGrid 
              stories={testimonials} 
              isLoading={isLoading}
              emptyMessage="No client stories available yet. Be the first to share your experience!"
              showEmpty={true}
            />
            
            {!user && (
              <div className="mt-12 text-center">
                <p className="text-muted-foreground mb-4">
                  Have a Luster Legacy piece you'd like to share about?
                </p>
                <Button 
                  onClick={() => window.location.href = "/auth?returnTo=/client-stories&shareStory=true"}
                  className="flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  <span>Login to Share Your Story</span>
                </Button>
              </div>
            )}
            {user && (
              <div className="mt-12 text-center">
                <Button 
                  onClick={() => setActiveTab("share")}
                  className="flex items-center gap-2"
                >
                  <Star className="h-4 w-4" />
                  <span>Share Your Story</span>
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="share">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-semibold mb-4">Share Your Luster Legacy Story</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                We'd love to hear about your experience with your Luster Legacy jewelry. 
                Your story helps other clients discover the perfect piece for their collection.
              </p>
            </div>
            
            <ClientStoryForm />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
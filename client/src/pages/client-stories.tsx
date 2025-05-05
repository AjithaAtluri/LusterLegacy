import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Testimonial } from "@shared/schema";
import { ClientStoryGrid } from "@/components/client-stories/client-story-grid";
import { ClientStoryForm } from "@/components/client-stories/client-story-form";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ClientStoriesPage() {
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  
  const { data: testimonials, isLoading, error } = useQuery<Testimonial[]>({
    queryKey: ["/api/testimonials"],
    queryFn: async () => {
      const response = await fetch("/api/testimonials");
      if (!response.ok) {
        throw new Error("Failed to fetch client stories");
      }
      return response.json();
    },
  });
  
  // Separate testimonials by type
  const necklaces = testimonials?.filter(t => t.productType === "Necklace") || [];
  const earrings = testimonials?.filter(t => t.productType === "Earrings") || [];
  const rings = testimonials?.filter(t => t.productType === "Ring") || [];
  const bracelets = testimonials?.filter(t => t.productType === "Bracelet") || [];
  const custom = testimonials?.filter(t => t.productType === "Custom") || [];
  
  return (
    <>
      <Helmet>
        <title>Client Stories | Luster Legacy</title>
        <meta name="description" content="Read inspiring stories from our clients and share your own Luster Legacy experience." />
      </Helmet>
      
      <div className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold">Client Stories</h1>
          <p className="text-lg text-gray-600 mt-4 max-w-3xl mx-auto">
            Discover the personal journeys and experiences of our valued clients. Be inspired by their 
            stories and the significance behind each unique piece of jewelry.
          </p>
          
          {!showSubmissionForm && (
            <Button 
              className="mt-6"
              onClick={() => setShowSubmissionForm(true)}
            >
              Share Your Story
            </Button>
          )}
        </div>
        
        {/* Submission Form */}
        {showSubmissionForm && (
          <div className="mb-16">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Share Your Experience</h2>
              <Button 
                variant="outline" 
                onClick={() => setShowSubmissionForm(false)}
              >
                Hide Form
              </Button>
            </div>
            <ClientStoryForm />
          </div>
        )}
        
        {/* Testimonials Section */}
        <div className="mt-12">
          {error ? (
            <div className="text-center py-10">
              <p className="text-red-500">
                Failed to load client stories. Please try again later.
              </p>
            </div>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="mx-auto flex justify-center mb-8">
                <TabsTrigger value="all">All Stories</TabsTrigger>
                <TabsTrigger value="necklaces">Necklaces</TabsTrigger>
                <TabsTrigger value="earrings">Earrings</TabsTrigger>
                <TabsTrigger value="rings">Rings</TabsTrigger>
                <TabsTrigger value="bracelets">Bracelets</TabsTrigger>
                <TabsTrigger value="custom">Custom Pieces</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                <ClientStoryGrid
                  showEmpty={!isLoading}
                  emptyMessage="No client stories yet. Be the first to share your experience!"
                  className="mt-6"
                />
              </TabsContent>
              
              <TabsContent value="necklaces">
                <ClientStoryGrid
                  showEmpty={!isLoading}
                  emptyMessage="No necklace stories yet. Be the first to share your experience!"
                  className="mt-6"
                />
              </TabsContent>
              
              <TabsContent value="earrings">
                <ClientStoryGrid
                  showEmpty={!isLoading}
                  emptyMessage="No earring stories yet. Be the first to share your experience!"
                  className="mt-6"
                />
              </TabsContent>
              
              <TabsContent value="rings">
                <ClientStoryGrid
                  showEmpty={!isLoading}
                  emptyMessage="No ring stories yet. Be the first to share your experience!"
                  className="mt-6"
                />
              </TabsContent>
              
              <TabsContent value="bracelets">
                <ClientStoryGrid
                  showEmpty={!isLoading}
                  emptyMessage="No bracelet stories yet. Be the first to share your experience!"
                  className="mt-6"
                />
              </TabsContent>
              
              <TabsContent value="custom">
                <ClientStoryGrid
                  showEmpty={!isLoading}
                  emptyMessage="No custom piece stories yet. Be the first to share your experience!"
                  className="mt-6"
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </>
  );
}
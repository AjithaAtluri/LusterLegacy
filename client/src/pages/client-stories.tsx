import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Testimonial } from "@shared/schema";
import { ClientStoryGrid } from "@/components/client-stories/client-story-grid";
import { ClientStoryForm } from "@/components/client-stories/client-story-form";
import { useAuth } from "@/hooks/use-auth";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PencilLine, Star, Users } from "lucide-react";

export default function ClientStories() {
  const [activeTab, setActiveTab] = useState("view");
  const { user } = useAuth();
  
  // Fetch approved testimonials
  const { data: testimonials, isLoading } = useQuery<Testimonial[]>({
    queryKey: ["/api/testimonials/approved"],
    queryFn: async () => {
      const response = await fetch("/api/testimonials/approved");
      if (!response.ok) {
        throw new Error("Failed to fetch client stories");
      }
      return response.json();
    },
  });
  
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Client Stories</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Discover the experiences of our valued clients and their journey with Luster Legacy. 
          From custom designs to heirloom pieces, each story reflects our commitment to excellence 
          and personalized service.
        </p>
      </div>
      
      <Tabs 
        defaultValue="view" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="mx-auto max-w-5xl"
      >
        <div className="flex justify-center mb-8">
          <TabsList className="grid w-full md:w-auto grid-cols-2">
            <TabsTrigger value="view" className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Client Experiences
            </TabsTrigger>
            <TabsTrigger value="share" className="flex items-center">
              <PencilLine className="h-4 w-4 mr-2" />
              Share Your Story
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="view" className="pt-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-semibold">
              Stories from Our Valued Clients
            </h2>
            
            <Button 
              variant="outline" 
              onClick={() => setActiveTab("share")}
              className="flex items-center"
            >
              <Star className="h-4 w-4 mr-2 fill-yellow-500 text-yellow-500" />
              Share Your Experience
            </Button>
          </div>
          
          <ClientStoryGrid 
            stories={testimonials} 
            showEmpty={true}
            emptyMessage="No client stories yet. Be the first to share your experience!"
          />
        </TabsContent>
        
        <TabsContent value="share" className="pt-4">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              Share Your Luster Legacy Experience
            </h2>
            <p className="text-gray-600">
              We'd love to hear about your experience with Luster Legacy! Whether it's a custom piece or 
              a selection from our collections, your story helps other clients on their jewelry journey.
              {!user && (
                <span className="block mt-2 text-primary">
                  <a href="/auth" className="underline">Sign in</a> to track your submission, or continue as a guest.
                </span>
              )}
            </p>
          </div>
          
          <ClientStoryForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
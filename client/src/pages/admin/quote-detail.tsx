import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/admin-layout";
import QuoteDetail from "@/components/admin/quote-detail";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [notFound, setNotFound] = useState(false);
  
  // Fetch quote request details
  const { data: quote, isLoading, isError } = useQuery({
    queryKey: [`/api/quote-requests/${id}`],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/quote-requests/${id}`);
        
        if (res.status === 404) {
          setNotFound(true);
          return null;
        }
        
        if (!res.ok) {
          throw new Error(`Failed to fetch quote request: ${res.statusText}`);
        }
        
        return await res.json();
      } catch (error) {
        console.error("Error fetching quote request:", error);
        throw error;
      }
    },
    enabled: !!id
  });
  
  // Go back to quote requests list
  const handleBack = () => {
    setLocation("/admin/quotes");
  };
  
  // If the quote request is not found
  if (notFound) {
    return (
      <AdminLayout title="Quote Request Not Found">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <h2 className="text-xl font-medium">Quote Request Not Found</h2>
          <p className="text-muted-foreground">
            The quote request you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={handleBack} variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Quote Requests
          </Button>
        </div>
      </AdminLayout>
    );
  }
  
  // Loading state
  if (isLoading) {
    return (
      <AdminLayout title="Loading Quote Request...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }
  
  // Error state
  if (isError || !quote) {
    return (
      <AdminLayout title="Error Loading Quote Request">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <h2 className="text-xl font-medium text-destructive">Error Loading Quote Request</h2>
          <p className="text-muted-foreground">
            There was a problem loading the quote request details.
          </p>
          <Button onClick={handleBack} variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Quote Requests
          </Button>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout title={`Quote Request #${id}`}>
      <div className="mb-6">
        <Button onClick={handleBack} variant="outline" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Quote Requests
        </Button>
      </div>
      
      <QuoteDetail quote={quote} />
    </AdminLayout>
  );
}
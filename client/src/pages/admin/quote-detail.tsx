import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import AdminLayout from "@/components/admin/admin-layout";
import QuoteDetail from "@/components/admin/quote-detail";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function AdminQuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [_, navigate] = useLocation();

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && !user?.role?.includes("admin")) {
      toast({
        title: "Access Denied",
        description: "You must be an admin to view this page",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [user, authLoading, navigate, toast]);

  // Fetch quote request
  const { data: quote, isLoading, error } = useQuery({
    queryKey: [`/api/quote-requests/${id}`],
    enabled: !!id && !!user?.role?.includes("admin"),
  });

  if (authLoading || isLoading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="mt-4 text-lg">Loading quote request...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-destructive">Error Loading Request</h2>
            <p className="text-muted-foreground">
              {error instanceof Error ? error.message : "Failed to load quote request"}
            </p>
            <Button onClick={() => navigate("/admin/quotes")}>
              Back to Quote Requests
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!quote) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Quote Request Not Found</h2>
            <p className="text-muted-foreground">
              The requested quote request could not be found
            </p>
            <Button onClick={() => navigate("/admin/quotes")}>
              Back to Quote Requests
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-8">
        <Button
          onClick={() => navigate("/admin/quotes")}
          variant="outline"
          className="mb-6"
        >
          ← Back to Quote Requests
        </Button>
        
        <QuoteDetail quote={quote} />
      </div>
    </AdminLayout>
  );
}
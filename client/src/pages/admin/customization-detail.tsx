import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import AdminLayout from "@/components/admin/admin-layout";
import PersonalizationDetail from "@/components/admin/customization-detail";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function AdminPersonalizationDetailPage() {
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

  // Fetch personalization request
  const { data: customization, isLoading, error } = useQuery({
    queryKey: [`/api/customization-requests/${id}`],
    enabled: !!id && !!user?.role?.includes("admin"),
  });

  if (authLoading || isLoading) {
    return (
      <AdminLayout title="Personalization Request Details">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="mt-4 text-lg">Loading personalization request...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Personalization Request Details">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-destructive">Error Loading Request</h2>
            <p className="text-muted-foreground">
              {error instanceof Error ? error.message : "Failed to load personalization request"}
            </p>
            <Button onClick={() => navigate("/admin/customizations")}>
              Back to Personalization Requests
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!customization) {
    return (
      <AdminLayout title="Personalization Request Details">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Personalization Request Not Found</h2>
            <p className="text-muted-foreground">
              The requested personalization request could not be found
            </p>
            <Button onClick={() => navigate("/admin/customizations")}>
              Back to Personalization Requests
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Personalization Request Details">
      <div className="container mx-auto py-8">
        <Button
          onClick={() => navigate("/admin/customizations")}
          variant="outline"
          className="mb-6"
        >
          ← Back to Personalization Requests
        </Button>
        
        <PersonalizationDetail customization={customization} />
      </div>
    </AdminLayout>
  );
}
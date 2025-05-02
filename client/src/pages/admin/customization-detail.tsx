import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import AdminLayout from "@/components/admin/admin-layout";
import CustomizationDetail from "@/components/admin/customization-detail";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function AdminCustomizationDetailPage() {
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

  // Fetch customization request
  const { data: customization, isLoading, error } = useQuery({
    queryKey: [`/api/customization-requests/${id}`],
    enabled: !!id && !!user?.role?.includes("admin"),
  });

  if (authLoading || isLoading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="mt-4 text-lg">Loading customization request...</p>
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
              {error instanceof Error ? error.message : "Failed to load customization request"}
            </p>
            <Button onClick={() => navigate("/admin/customizations")}>
              Back to Customization Requests
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!customization) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Customization Request Not Found</h2>
            <p className="text-muted-foreground">
              The requested customization request could not be found
            </p>
            <Button onClick={() => navigate("/admin/customizations")}>
              Back to Customization Requests
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
          onClick={() => navigate("/admin/customizations")}
          variant="outline"
          className="mb-6"
        >
          ← Back to Customization Requests
        </Button>
        
        <CustomizationDetail customization={customization} />
      </div>
    </AdminLayout>
  );
}
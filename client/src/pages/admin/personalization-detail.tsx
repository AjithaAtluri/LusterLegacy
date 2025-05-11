import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import AdminLayout from "@/components/admin/admin-layout";
import PersonalizationDetail from "@/components/admin/personalization-detail";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminPersonalizationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [isError, setIsError] = useState(false);
  
  // Fetch personalization request data - keep using original API for backward compatibility
  const { data: personalization, isLoading, error, refetch } = useQuery({
    queryKey: [`/api/customization-requests/${id}`],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/customization-requests/${id}`);
        if (!res.ok) throw new Error("Failed to fetch personalization request");
        return res.json();
      } catch (err) {
        setIsError(true);
        throw err;
      }
    }
  });
  
  // Loading state
  if (isLoading) {
    return (
      <AdminLayout title="Personalization Request Detail">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }
  
  // Error state
  if (isError || !personalization) {
    return (
      <AdminLayout title="Personalization Request Detail">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-destructive">Error loading personalization request details</p>
          <Button onClick={() => refetch()} variant="outline">Try Again</Button>
          <Button onClick={() => window.history.back()} variant="ghost">Go Back</Button>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout title={`Personalization Request #${id}`}>
      <PersonalizationDetail personalization={personalization} />
    </AdminLayout>
  );
}
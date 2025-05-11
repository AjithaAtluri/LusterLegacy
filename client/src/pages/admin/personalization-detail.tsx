import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/admin-layout";
import PersonalizationDetail from "@/components/admin/personalization-detail";
import { Loader2 } from "lucide-react";

export default function PersonalizationDetailPage() {
  const [, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();
  
  // Fetch personalization request details
  const { data, isLoading, isError } = useQuery({
    queryKey: [`/api/personalization-requests/${id}`],
    queryFn: async () => {
      const res = await fetch(`/api/personalization-requests/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Personalization request not found");
        }
        throw new Error("Failed to fetch personalization request details");
      }
      return res.json();
    }
  });
  
  // Redirect to list page if there's an error
  useEffect(() => {
    if (isError) {
      setLocation("/admin/personalizations");
    }
  }, [isError, setLocation]);
  
  return (
    <AdminLayout title={`Personalization Request #${id}`}>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : data ? (
        <PersonalizationDetail customization={data} />
      ) : null}
    </AdminLayout>
  );
}
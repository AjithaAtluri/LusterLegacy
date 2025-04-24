import { useLocation } from "wouter";
import AdminLayout from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function AddProduct() {
  console.log("AddProduct component rendering");
  
  const [, setLocation] = useLocation();
  
  return (
    <AdminLayout title="Add Product">
      <div className="container p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => setLocation('/admin/products')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
            <h1 className="text-2xl font-semibold">Add New Product</h1>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Add Product Form</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Product form is under maintenance. Please check back later.</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
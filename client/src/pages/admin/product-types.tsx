import { AdminLayout } from "@/components/admin/admin-layout";
import { ProductTypeList } from "@/components/admin/product-types/product-type-list";
import { Helmet } from "react-helmet";

export default function AdminProductTypesPage() {
  return (
    <>
      <Helmet>
        <title>Product Types Management | Luster Legacy Admin</title>
      </Helmet>
      <AdminLayout>
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Product Types Management</h1>
            <p className="text-muted-foreground">
              Manage product types to categorize your jewelry products.
            </p>
          </div>

          <ProductTypeList />
        </div>
      </AdminLayout>
    </>
  );
}
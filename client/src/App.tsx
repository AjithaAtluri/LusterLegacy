import { Switch, Route } from "wouter";
import { lazy, Suspense } from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import WhatsAppButton from "@/components/ui/whatsapp-button";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

// Lazy-loaded pages
const Home = lazy(() => import("@/pages/home"));
const Collections = lazy(() => import("@/pages/collections"));
const CustomDesign = lazy(() => import("@/pages/custom-design"));
const About = lazy(() => import("@/pages/about"));
const Contact = lazy(() => import("@/pages/contact"));
const Product = lazy(() => import("@/pages/product"));
const ProductDetail = lazy(() => import("@/pages/product-detail"));
const Checkout = lazy(() => import("@/pages/checkout"));
const InspirationGallery = lazy(() => import("@/pages/inspiration"));

// Tools and utilities
const ImageTest = lazy(() => import("@/pages/tools/image-test"));
const PriceCalculator = lazy(() => import("@/pages/tools/price-calculator"));

// Info pages
const Privacy = lazy(() => import("@/pages/privacy"));
const Terms = lazy(() => import("@/pages/terms"));
const Shipping = lazy(() => import("@/pages/shipping"));
const Returns = lazy(() => import("@/pages/returns"));
const Repairs = lazy(() => import("@/pages/repairs"));
const FAQ = lazy(() => import("@/pages/faq"));

// Admin pages
const AdminLogin = lazy(() => import("@/pages/admin/login"));
const AdminDashboard = lazy(() => import("@/pages/admin/dashboard"));
const AdminProducts = lazy(() => import("@/pages/admin/products"));
// New unified product page
const UnifiedProductPage = lazy(() => import("@/pages/admin/unified-product-page"));
// Legacy product pages (maintained for reference)
const AdminAddProductUnified = lazy(() => import("@/pages/admin/add-product-with-unified-generator"));
const AdminEditProduct = lazy(() => import("@/pages/admin/edit-product"));
const AdminEditProductNew = lazy(() => import("@/pages/admin/edit-product-new"));
const AdminMetalTypes = lazy(() => import("@/pages/admin/metal-types"));
const AdminStoneTypes = lazy(() => import("@/pages/admin/stone-types"));
const AdminProductTypes = lazy(() => import("@/pages/admin/product-types"));
const AdminOrders = lazy(() => import("@/pages/admin/orders"));
const AdminDesigns = lazy(() => import("@/pages/admin/designs"));
// AI Content Generator
const AIContentGenerator = lazy(() => import("@/pages/admin/ai-content-generator-page"));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[70vh]">
    <Loader2 className="h-8 w-8 text-primary animate-spin" />
  </div>
);

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Suspense fallback={<PageLoader />}>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/collections" component={Collections} />
            <Route path="/custom-design" component={CustomDesign} />
            <Route path="/about" component={About} />
            <Route path="/contact" component={Contact} />
            <Route path="/product/:id" component={Product} />
            <Route path="/product-detail/:id" component={ProductDetail} />
            <Route path="/checkout" component={Checkout} />
            <Route path="/inspiration" component={InspirationGallery} />
            
            {/* Tools */}
            <Route path="/tools/image-test" component={ImageTest} />
            <Route path="/tools/price-calculator" component={PriceCalculator} />
            
            {/* Information pages */}
            <Route path="/privacy" component={Privacy} />
            <Route path="/terms" component={Terms} />
            <Route path="/shipping" component={Shipping} />
            <Route path="/returns" component={Returns} />
            <Route path="/repairs" component={Repairs} />
            <Route path="/faq" component={FAQ} />
            
            {/* Admin routes */}
            <Route path="/admin" component={AdminLogin} />
            <Route path="/admin/dashboard" component={AdminDashboard} />
            <Route path="/admin/products" component={AdminProducts} />
            {/* Unified product page for both adding and editing */}
            <Route path="/admin/product" component={UnifiedProductPage} />
            <Route path="/admin/product/:id" component={UnifiedProductPage} />
            
            {/* Redirect old add-product URL to the new unified page */}
            <Route path="/admin/add-product">
              {() => {
                window.location.replace("/admin/product");
                return null;
              }}
            </Route>
            
            {/* Redirect old edit-product URL to the new unified page */}
            <Route path="/admin/edit-product/:id">
              {(params) => {
                window.location.replace(`/admin/product/${params.id}`);
                return null;
              }}
            </Route>
            
            {/* Legacy routes kept for reference */}
            <Route path="/admin/add-product-with-unified-generator" component={AdminAddProductUnified} />
            <Route path="/admin/edit-product-legacy/:id" component={AdminEditProductNew} />
            <Route path="/admin/metal-types" component={AdminMetalTypes} />
            <Route path="/admin/stone-types" component={AdminStoneTypes} />
            <Route path="/admin/product-types" component={AdminProductTypes} />
            <Route path="/admin/orders" component={AdminOrders} />
            <Route path="/admin/designs" component={AdminDesigns} />
            <Route path="/admin/ai-generator" component={AIContentGenerator} />
            
            {/* Fallback to 404 */}
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}

export default App;

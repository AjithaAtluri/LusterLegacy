import { Switch, Route } from "wouter";
import { lazy, Suspense } from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import WhatsAppButton from "@/components/ui/whatsapp-button";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

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
const CustomerDashboard = lazy(() => import("@/pages/customer-dashboard"));
const AuthPage = lazy(() => import("@/pages/auth-page"));
const PlaceOrder = lazy(() => import("@/pages/place-order"));
const CustomizeRequest = lazy(() => import("@/pages/customize-request"));

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
const DirectAdminDashboard = lazy(() => import("@/pages/admin/direct-dashboard"));
const AdminProducts = lazy(() => import("@/pages/admin/products"));
// Unified product page with AI generator
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
    <AuthProvider>
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
            <ProtectedRoute path="/customer-dashboard" component={CustomerDashboard} />
            <ProtectedRoute path="/place-order/:id" component={PlaceOrder} />
            <ProtectedRoute path="/customize-request/:id" component={CustomizeRequest} />
            <Route path="/auth" component={AuthPage} />
            
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
            <Route path="/admin/login" component={AdminLogin} />
            {/* Direct access admin dashboard for troubleshooting */}
            <Route path="/admin/direct-dashboard" component={DirectAdminDashboard} />
            
            {/* AI Generator - both protected and direct access */}
            <Route path="/admin/ai-generator" component={AIContentGenerator} />
            
            <ProtectedRoute path="/admin" component={AdminDashboard} adminOnly />
            <ProtectedRoute path="/admin/dashboard" component={AdminDashboard} adminOnly />
            <ProtectedRoute path="/admin/products" component={AdminProducts} adminOnly />
            {/* Redirect old add-product URL to the AI generator */}
            <Route path="/admin/add-product">
              {() => {
                window.location.replace("/admin/ai-generator");
                return null;
              }}
            </Route>
            <ProtectedRoute path="/admin/add-product-with-unified-generator" component={AdminAddProductUnified} adminOnly />
            <ProtectedRoute path="/admin/edit-product/:id" component={AdminEditProductNew} adminOnly />
            <ProtectedRoute path="/admin/metal-types" component={AdminMetalTypes} adminOnly />
            <ProtectedRoute path="/admin/stone-types" component={AdminStoneTypes} adminOnly />
            <ProtectedRoute path="/admin/product-types" component={AdminProductTypes} adminOnly />
            <ProtectedRoute path="/admin/orders" component={AdminOrders} adminOnly />
            <ProtectedRoute path="/admin/designs" component={AdminDesigns} adminOnly />
            
            {/* Fallback to 404 */}
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
    </AuthProvider>
  );
}

export default App;

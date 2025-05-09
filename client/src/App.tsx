import { Switch, Route } from "wouter";
import { lazy, Suspense, useEffect } from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import WhatsAppButton from "@/components/ui/whatsapp-button";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { ThemeProvider } from "@/components/theme-provider";
import { useToast } from "@/hooks/use-toast";

// Lazy-loaded pages
const Home = lazy(() => import("@/pages/home"));
const Collections = lazy(() => import("@/pages/collections"));
const CustomDesign = lazy(() => import("@/pages/custom-design"));
const About = lazy(() => import("@/pages/about"));
const Contact = lazy(() => import("@/pages/contact"));
const ClientStories = lazy(() => import("@/pages/client-stories"));
const Product = lazy(() => import("@/pages/product"));
const ProductDetail = lazy(() => import("@/pages/product-detail"));
const Checkout = lazy(() => import("@/pages/checkout"));
const GemMetalGuide = lazy(() => import("@/pages/gem-metal-guide"));
const InspirationGallery = lazy(() => import("@/pages/inspiration"));
const CustomerDashboard = lazy(() => import("@/pages/customer-dashboard"));
const AuthPage = lazy(() => import("@/pages/auth-page"));
const FinalizeOrder = lazy(() => import("@/pages/finalize-order"));
const CustomizeRequest = lazy(() => import("@/pages/customize-request"));

// Tools and utilities
const ImageTest = lazy(() => import("@/pages/tools/image-test"));
const PriceCalculator = lazy(() => import("@/pages/tools/price-calculator"));

// Info pages
const Privacy = lazy(() => import("@/pages/privacy"));
const Terms = lazy(() => import("@/pages/terms"));
const Shipping = lazy(() => import("@/pages/shipping"));
const Returns = lazy(() => import("@/pages/returns"));
const FAQ = lazy(() => import("@/pages/faq"));

// Admin pages
const AdminLogin = lazy(() => import("@/pages/admin/login"));
const AdminDashboard = lazy(() => import("@/pages/admin/dashboard"));
// DirectAdminDashboard is being replaced by the regular dashboard
// const DirectAdminDashboard = lazy(() => import("@/pages/admin/direct-dashboard"));
const AdminProducts = lazy(() => import("@/pages/admin/products"));
// Unified product page with AI generator
const AdminAddProductUnified = lazy(() => import("@/pages/admin/add-product-with-unified-generator"));
const AdminEditProduct = lazy(() => import("@/pages/admin/edit-product"));
const AdminEditProductNew = lazy(() => import("@/pages/admin/edit-product-new"));
const AdminMetalTypes = lazy(() => import("@/pages/admin/metal-types"));
const AdminStoneTypes = lazy(() => import("@/pages/admin/stone-types"));
const AdminProductTypes = lazy(() => import("@/pages/admin/product-types"));
// New AI Admin Dashboard
const AIAdminDashboard = lazy(() => import("@/pages/admin/ai-admin-dashboard"));
const AdminDesigns = lazy(() => import("@/pages/admin/designs"));
// New request type pages
const AdminCustomizations = lazy(() => import("@/pages/admin/customizations"));
const AdminCustomizationDetail = lazy(() => import("@/pages/admin/customization-detail"));
const AdminQuotes = lazy(() => import("@/pages/admin/quotes"));
const AdminQuoteDetail = lazy(() => import("@/pages/admin/quote-detail"));
const AdminContactMessages = lazy(() => import("@/pages/admin/contact-messages"));
// Client Stories/Testimonials management
const AdminTestimonials = lazy(() => import("@/pages/admin/testimonials-fix"));
// AI Content Generator
const AIContentGenerator = lazy(() => import("@/pages/admin/ai-content-generator-page"));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[70vh]">
    <Loader2 className="h-8 w-8 text-primary animate-spin" />
  </div>
);

function App() {
  const { toast } = useToast();
  
  // Add global event listeners to prevent image saving
  useEffect(() => {
    // Prevent keyboard shortcuts (Ctrl+S, Ctrl+P, etc.)
    const preventImageSaving = (e: KeyboardEvent) => {
      // Prevent Ctrl+S, Ctrl+P and other common save/print shortcuts
      if ((e.ctrlKey || e.metaKey) && 
          (e.key === 's' || e.key === 'S' || e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        toast({
          title: "Action Restricted",
          description: "Saving or printing images is restricted due to copyright protection.",
          variant: "default",
        });
        return false;
      }
    };

    // Prevent context menu on right-click for images
    const preventContextMenu = (e: MouseEvent) => {
      // Check if the target is an image
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'IMG' || target.closest('img'))) {
        e.preventDefault();
        toast({
          title: "Copyright Protected",
          description: "These images are protected by copyright law. Please contact us to inquire about custom jewelry designs.",
          variant: "default"
        });
        return false;
      }
    };

    // Add event listeners
    document.addEventListener('keydown', preventImageSaving);
    document.addEventListener('contextmenu', preventContextMenu);
    
    // Add CSS to prevent image dragging
    const style = document.createElement('style');
    style.innerHTML = `
      img {
        -webkit-user-drag: none;
        -khtml-user-drag: none;
        -moz-user-drag: none;
        -o-user-drag: none;
        user-drag: none;
      }
    `;
    document.head.appendChild(style);
    
    // Cleanup function
    return () => {
      document.removeEventListener('keydown', preventImageSaving);
      document.removeEventListener('contextmenu', preventContextMenu);
      document.head.removeChild(style);
    };
  }, [toast]);
  
  return (
    <ThemeProvider defaultTheme="dark">
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
                <Route path="/client-stories" component={ClientStories} />
                <Route path="/product/:id" component={Product} />
                <Route path="/product-detail/:id" component={ProductDetail} />
                <Route path="/checkout" component={Checkout} />
                <Route path="/gem-metal-guide" component={GemMetalGuide} />
                <Route path="/inspiration" component={InspirationGallery} />
                <ProtectedRoute path="/customer-dashboard" component={CustomerDashboard} />
                <ProtectedRoute path="/finalize-order/:id" component={FinalizeOrder} />
                <ProtectedRoute path="/customize-request/:id" component={CustomizeRequest} />
                <ProtectedRoute path="/custom-designs/:id" component={lazy(() => import("@/pages/custom-designs/[id]"))} />
                <ProtectedRoute path="/customization-requests/:id" component={lazy(() => import("@/pages/customization-requests/[id]"))} />
                <ProtectedRoute path="/quote-requests/:id" component={lazy(() => import("@/pages/quote-requests/[id]"))} />
                <ProtectedRoute path="/payment/design-consultation/:id" component={lazy(() => import("@/pages/payment/design-consultation/[id]"))} />
                <Route path="/auth" component={AuthPage} />
                
                {/* Tools */}
                <Route path="/tools/image-test" component={ImageTest} />
                <Route path="/tools/price-calculator" component={PriceCalculator} />
                
                {/* Information pages */}
                <Route path="/privacy" component={Privacy} />
                <Route path="/terms" component={Terms} />
                <Route path="/shipping" component={Shipping} />
                <Route path="/returns" component={Returns} />
                <Route path="/faq" component={FAQ} />
                
                {/* Admin routes - All routes have both regular protected access and direct access */}
                <Route path="/admin/login" component={AdminLogin} />
                
                {/* Direct Access Dashboard - Now using protected routes */}
                <ProtectedRoute path="/admin/direct-dashboard" component={AdminDashboard} adminOnly />
                
                {/* Admin pages - using protected routes */}
                <ProtectedRoute path="/admin/ai-generator" component={AIContentGenerator} adminOnly />
                <ProtectedRoute path="/admin/products" component={AdminProducts} adminOnly />
                <ProtectedRoute path="/admin/add-product-with-unified-generator" component={AdminAddProductUnified} adminOnly />
                <ProtectedRoute path="/admin/edit-product/:id" component={AdminEditProductNew} adminOnly />
                
                {/* Full admin only pages */}
                <ProtectedRoute path="/admin/metal-types" component={AdminMetalTypes} adminOnly />
                <ProtectedRoute path="/admin/stone-types" component={AdminStoneTypes} adminOnly />
                <ProtectedRoute path="/admin/product-types" component={AdminProductTypes} adminOnly />
                
                {/* Pages accessible to both admin types */}
                <ProtectedRoute path="/admin/designs" component={AdminDesigns} adminOnly />
                <ProtectedRoute path="/admin/designs/:id" component={lazy(() => import("@/pages/admin/design-detail/[id]"))} adminOnly />
                <ProtectedRoute path="/admin/customizations" component={AdminCustomizations} adminOnly />
                <ProtectedRoute path="/admin/customizations/:id" component={AdminCustomizationDetail} adminOnly />
                <ProtectedRoute path="/admin/quotes" component={AdminQuotes} adminOnly />
                <ProtectedRoute path="/admin/quotes/:id" component={AdminQuoteDetail} adminOnly />
                <ProtectedRoute path="/admin/contact-messages" component={AdminContactMessages} adminOnly />
                <ProtectedRoute path="/admin/users" component={lazy(() => import("@/pages/admin/users"))} adminOnly />
                <ProtectedRoute path="/admin/testimonials" component={AdminTestimonials} adminOnly />
                
                {/* Redirect old add-product URL to the AI generator */}
                <Route path="/admin/add-product">
                  {() => {
                    window.location.replace("/admin/ai-generator");
                    return null;
                  }}
                </Route>
                
                {/* Protected Routes for regular admin access */}
                <ProtectedRoute path="/admin" component={AdminDashboard} adminOnly />
                <ProtectedRoute path="/admin/dashboard" component={AdminDashboard} adminOnly />
                
                {/* Fallback to 404 */}
                <Route component={NotFound} />
              </Switch>
            </Suspense>
          </main>
          <Footer />
          {/* WhatsApp button hidden for now */}
          {/* <WhatsAppButton /> */}
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

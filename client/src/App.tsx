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
const Checkout = lazy(() => import("@/pages/checkout"));

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
const AdminOrders = lazy(() => import("@/pages/admin/orders"));
const AdminDesigns = lazy(() => import("@/pages/admin/designs"));

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
            <Route path="/checkout" component={Checkout} />
            
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
            <Route path="/admin/orders" component={AdminOrders} />
            <Route path="/admin/designs" component={AdminDesigns} />
            
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

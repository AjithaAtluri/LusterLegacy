import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, RouteProps } from "wouter";

interface ProtectedRouteProps extends Omit<RouteProps, "component"> {
  component: React.ComponentType;
  adminOnly?: boolean;
}

export function ProtectedRoute({
  path,
  component: Component,
  adminOnly = false,
  ...rest
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  return (
    <Route
      path={path}
      {...rest}
      component={() => {
        // Show loading spinner while authentication status is being determined
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }

        // Redirect to login if not authenticated
        if (!user) {
          // Add returnTo parameter for easier navigation back to the intended page
          const returnPath = path.startsWith('/admin') ? '/admin' : path;
          return <Redirect to={`/auth?returnTo=${encodeURIComponent(returnPath)}`} />;
        }

        // Check for admin role if specified
        if (adminOnly && user.role !== "admin") {
          return <Redirect to="/" />;
        }

        // Render the protected component
        return <Component />;
      }}
    />
  );
}
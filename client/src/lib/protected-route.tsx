import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, RouteProps } from "wouter";
import { useEffect } from "react";
import { queryClient } from "@/lib/queryClient";

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
  const { user, isLoading, stableLoading } = useAuth();
  
  // Get the path as string for return URL
  const pathString = path !== undefined ? 
    (typeof path === 'string' ? path : path.toString()) : 
    '/';
  
  // For debugging
  const isAdminUser = user?.role === "admin" || user?.role === "limited-admin";
  console.log(`Protected Route: ${pathString}`, { 
    isLoading,
    stableLoading, 
    user, 
    adminOnly,
    isAdmin: isAdminUser
  });
  
  // When accessing admin routes, verify auth state more aggressively
  useEffect(() => {
    if (pathString.startsWith('/admin') && !stableLoading) {
      // Force a refetch of the user data to ensure we have the latest state
      // Only do this after stable loading is complete to prevent query loops
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    }
  }, [pathString, stableLoading]);
  
  return (
    <Route
      path={path}
      {...rest}
      component={() => {
        // Show loading spinner while authentication status is being determined
        // Use stableLoading for smoother UI transitions
        if (stableLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }

        // Redirect to login if not authenticated
        if (!user) {
          console.log("User not authenticated, redirecting to auth page");
          // Add returnTo parameter for easier navigation back to the intended page
          const returnPath = pathString.startsWith('/admin') ? '/admin/dashboard' : pathString;
          
          // Special handling for admin routes - redirect to admin login
          if (pathString.startsWith('/admin')) {
            console.log("Admin route requires authentication, redirecting to admin login");
            return <Redirect to="/admin/login" />;
          }
          
          // Regular routes redirect to the main auth page
          return <Redirect to={`/auth?returnTo=${encodeURIComponent(returnPath)}`} />;
        }

        // Check for admin role if specified
        if (adminOnly && user.role !== "admin" && user.role !== "limited-admin") {
          console.log("Admin access required but user is not admin or limited-admin, redirecting to home");
          return <Redirect to="/" />;
        }

        // Special case for admin dashboard direct access
        if (adminOnly && (user.role === "admin" || user.role === "limited-admin") && 
            (pathString === "/admin" || pathString === "/admin/dashboard" || pathString === "/admin/direct-dashboard")) {
          console.log("Admin user accessing dashboard");
          
          // Run additional auth check for admin dashboard
          setTimeout(async () => {
            try {
              // Make a direct fetch call to the admin endpoint
              const adminAuthResponse = await fetch("/api/auth/me", { 
                credentials: "include",
                headers: {
                  "Cache-Control": "no-cache, no-store, must-revalidate",
                  "Pragma": "no-cache",
                  "Expires": "0"
                }
              });
              
              if (!adminAuthResponse.ok) {
                console.warn("Admin auth verification failed in protected route - attempting to fix");
                // Attempt recovery - refresh the page
                window.location.reload();
              } else {
                console.log("Admin auth verification successful in protected route");
              }
            } catch (error) {
              console.error("Error during admin auth check in protected route:", error);
            }
          }, 300);
        }

        // Render the protected component
        return <Component />;
      }}
    />
  );
}
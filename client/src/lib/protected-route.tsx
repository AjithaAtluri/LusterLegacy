import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, RouteProps } from "wouter";
import { useEffect, useState } from "react";
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
  
  // For admin routes, perform direct authentication verification
  const [adminVerified, setAdminVerified] = useState(false);
  const [verificationAttempted, setVerificationAttempted] = useState(false);
  
  useEffect(() => {
    if (pathString.startsWith('/admin') && !stableLoading) {
      // For admin routes, directly verify the admin authentication cookie
      const verifyAdminAuth = async () => {
        try {
          console.log("Protected route - direct admin auth verification");
          setVerificationAttempted(true);
          
          // Make a direct fetch call to the admin endpoint
          const adminAuthResponse = await fetch("/api/auth/me", { 
            credentials: "include",
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              "Pragma": "no-cache",
              "Expires": "0"
            }
          });
          
          if (adminAuthResponse.ok) {
            console.log("Protected route - admin auth directly verified");
            const adminData = await adminAuthResponse.json();
            
            // Update the React Query cache with this data for consistent state
            queryClient.setQueryData(["/api/user"], adminData);
            setAdminVerified(true);
          } else {
            // If verification failed, check if special recovery is supported
            const responseData = await adminAuthResponse.json();
            const specialRecoveryAllowed = responseData.allowHeaderAuth === true;
            
            console.warn("Protected route - direct admin auth verification failed, recovery allowed:", specialRecoveryAllowed);
            setAdminVerified(false);
            
            // If special recovery is allowed, try with a header-based admin authentication
            if (specialRecoveryAllowed && user) {
              console.log("Protected route - attempting special header-based recovery with user ID:", user.id);
              
              // Attempt recovery with an admin-specific header-based auth request
              try {
                const recoveryResponse = await fetch("/api/auth/me", {
                  credentials: "include",
                  headers: {
                    "Cache-Control": "no-cache, no-store, must-revalidate",
                    "Pragma": "no-cache",
                    "Expires": "0",
                    "X-Admin-ReAuth-Request": "true",
                    "X-Admin-ID": user.id.toString()
                  }
                });
                
                if (recoveryResponse.ok) {
                  const recoveredData = await recoveryResponse.json();
                  console.log("Protected route - special recovery successful:", recoveredData);
                  
                  // Update the React Query cache with this recovered data
                  queryClient.setQueryData(["/api/user"], recoveredData);
                  setAdminVerified(true);
                  return;
                } else {
                  console.warn("Protected route - special recovery failed");
                }
              } catch (recoveryError) {
                console.error("Protected route - error during special recovery:", recoveryError);
              }
            }
            
            // Since all recovery attempts failed, invalidate the cache to trigger a fresh fetch
            queryClient.invalidateQueries({ queryKey: ['/api/user'] });
          }
        } catch (error) {
          console.error("Protected route - error during direct admin auth verification:", error);
          setAdminVerified(false);
          
          // Also invalidate queries on error
          queryClient.invalidateQueries({ queryKey: ['/api/user'] });
        }
      };
      
      // Run verification immediately
      verifyAdminAuth();
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

        // For admin routes, first ensure direct admin auth verification has completed
        if (adminOnly) {
          // If verification is still in progress, show extended loading
          if (pathString.startsWith('/admin') && !verificationAttempted) {
            console.log("Admin route - waiting for direct verification");
            return (
              <div className="flex flex-col items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Verifying admin access...</p>
              </div>
            );
          }
          
          // Check for admin role
          const isAdminUser = user?.role === "admin" || user?.role === "limited-admin";
          
          // Admin role check
          if (!isAdminUser) {
            console.log("Admin access required but user is not admin or limited-admin, redirecting to home");
            return <Redirect to="/" />;
          }
          
          // If direct admin verification failed, attempt one last refresh
          if (pathString.startsWith('/admin') && !adminVerified && verificationAttempted) {
            console.warn("Admin verification explicitly failed - attempting recovery");
            
            // Only allow one recovery attempt
            const hasAttemptedRecovery = sessionStorage.getItem('admin_recovery_attempt');
            if (!hasAttemptedRecovery) {
              sessionStorage.setItem('admin_recovery_attempt', 'true');
              
              // Force admin cookie auth via direct reload
              window.location.href = window.location.href;
              return (
                <div className="flex flex-col items-center justify-center min-h-screen">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">Reestablishing admin session...</p>
                </div>
              );
            } else {
              // We've already tried recovery once, suggest login again
              console.error("Admin verification failed despite recovery attempt");
              sessionStorage.removeItem('admin_recovery_attempt');
              return <Redirect to="/admin/login" />;
            }
          }
        }

        // Render the protected component
        return <Component />;
      }}
    />
  );
}
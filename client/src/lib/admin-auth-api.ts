/**
 * Admin Auth API Utilities
 * Provides functions for direct authentication API calls
 */

import { apiRequest } from "./queryClient";
import { AdminAuthData, getAdminAuth, saveAdminAuth, clearAdminAuth } from "./admin-auth-storage";

// Interface for verification options
interface VerifyOptions {
  /**
   * If true, will force a direct fetch from server ignoring any cached data
   */
  forceRefresh?: boolean;
  
  /**
   * If true, will store the result in session storage
   */
  storeResult?: boolean;
  
  /**
   * If true, will throw an error instead of returning null for auth failures
   */
  throwOnFailure?: boolean;
}

/**
 * Verifies admin authentication via direct API call
 * @param options Options for the verification
 * @returns Promise with admin user data if authenticated
 */
export async function verifyAdminAuth(
  options: VerifyOptions = {}
): Promise<AdminAuthData | null> {
  try {
    // Check cached data first unless force refresh is required
    if (!options.forceRefresh) {
      const cachedAuth = getAdminAuth();
      if (cachedAuth) {
        console.log("Using cached admin auth data:", cachedAuth.loginID || cachedAuth.username);
        return cachedAuth;
      }
    }
    
    // Make direct API call to verify admin auth
    console.log("Making direct admin auth verification API call");
    const response = await apiRequest("GET", "/api/auth/me");
    
    if (!response.ok) {
      if (response.status === 401) {
        console.log("Admin auth verification failed - unauthorized");
        if (options.throwOnFailure) {
          throw new Error("Admin authentication required");
        }
        return null;
      }
      
      const errorText = await response.text();
      throw new Error(`Admin auth verification failed: ${response.status} - ${errorText}`);
    }
    
    const authData: AdminAuthData = await response.json();
    
    // Store result if requested
    if (options.storeResult && authData) {
      console.log("Storing admin auth data in session storage");
      saveAdminAuth(authData);
    }
    
    return authData;
  } catch (error) {
    console.error("Error verifying admin auth:", error);
    if (options.throwOnFailure) {
      throw error;
    }
    return null;
  }
}

/**
 * Sync admin cookie via direct API call
 * @param adminId Optional admin ID to sync
 * @returns Promise with success status
 */
export async function syncAdminCookie(adminId?: number): Promise<boolean> {
  try {
    console.log("Syncing admin cookie", adminId ? `for ID ${adminId}` : "");
    
    const body = adminId ? { adminId } : undefined;
    const response = await apiRequest("POST", "/api/auth/sync-admin-cookie", body);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to sync admin cookie: ${response.status} - ${errorText}`);
      return false;
    }
    
    // Refresh admin auth data after cookie sync
    try {
      await verifyAdminAuth({ forceRefresh: true, storeResult: true });
    } catch (refreshError) {
      console.warn("Non-critical error refreshing admin auth after cookie sync:", refreshError);
    }
    
    return true;
  } catch (error) {
    console.error("Error syncing admin cookie:", error);
    return false;
  }
}

/**
 * Emergency admin authentication via direct API
 * 
 * This is a last resort method when other authentication methods fail.
 * It makes a direct API call with emergency flags and attempts to
 * establish authentication through multiple paths.
 */
export async function emergencyAdminAuth(adminId?: number): Promise<AdminAuthData | null> {
  try {
    console.log("Attempting emergency admin authentication");
    
    // First, try a cookie sync
    const syncResult = await syncAdminCookie(adminId);
    if (syncResult) {
      console.log("Emergency auth: Cookie sync successful");
      
      // Verify admin auth after sync
      const authAfterSync = await verifyAdminAuth({ 
        forceRefresh: true,
        storeResult: true
      });
      
      if (authAfterSync) {
        console.log("Emergency auth: Successfully authenticated via cookie sync");
        return authAfterSync;
      }
    }
    
    // If we get here, the cookie sync didn't work or verification failed
    console.log("Emergency auth: Cookie sync unsuccessful or verification failed");
    
    // Clear any stale data
    clearAdminAuth();
    
    return null;
  } catch (error) {
    console.error("Emergency admin authentication failed:", error);
    return null;
  }
}
/**
 * Admin Auth API Utilities
 * Provides functions for direct authentication API calls
 */
import { AdminAuthData, saveAdminAuth } from './admin-auth-storage';

// Base URL for API requests
const API_BASE_URL = '';

/**
 * Verifies admin authentication via direct API call
 * @param options Options for the verification
 * @returns Promise with admin user data if authenticated
 */
export async function verifyAdminAuth(
  options: {
    emergency?: boolean;
    syncCookie?: boolean;
    useCache?: boolean;
    adminId?: number;
  } = {}
): Promise<AdminAuthData | null> {
  try {
    // Prepare headers for the request
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add emergency header if needed
    if (options.emergency) {
      headers['x-admin-emergency'] = 'true';
    }
    
    // Add sync cookie header if needed
    if (options.syncCookie) {
      headers['x-admin-sync-cookie'] = 'true';
    }
    
    // Make the API call to check admin authentication
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers,
      credentials: 'include', // Important: include cookies in the request
    });
    
    // If request was successful
    if (response.ok) {
      const data = await response.json();
      
      // Enhance data with authentication time and source
      const authData: AdminAuthData = {
        ...data,
        authTime: Date.now(),
        authSource: 'admin_cookie'
      };
      
      // Save to session storage if needed
      if (options.useCache !== false) {
        saveAdminAuth(authData);
      }
      
      return authData;
    }
    
    return null;
  } catch (error) {
    console.error('Error during admin auth check:', error);
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
    // Make the API call to sync the admin cookie
    const response = await fetch(`${API_BASE_URL}/api/auth/sync-admin-cookie`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important: include cookies in the request
      body: JSON.stringify(adminId ? { adminId } : {}),
    });
    
    if (response.ok) {
      console.log('Admin cookie sync successful');
      return true;
    } else {
      console.warn('Admin cookie sync failed:', await response.text());
      return false;
    }
  } catch (error) {
    console.error('Error during admin cookie sync:', error);
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
  console.log('Attempting emergency admin authentication');
  
  try {
    // First try to sync the admin cookie with the provided ID
    const syncSuccess = await syncAdminCookie(adminId);
    
    if (syncSuccess) {
      // If sync was successful, verify admin auth with emergency flag
      return await verifyAdminAuth({ 
        emergency: true,
        syncCookie: true,
        useCache: true
      });
    }
    
    // If sync failed, try direct verification with emergency flag
    return await verifyAdminAuth({ emergency: true });
  } catch (error) {
    console.error('Emergency admin auth failed:', error);
    return null;
  }
}
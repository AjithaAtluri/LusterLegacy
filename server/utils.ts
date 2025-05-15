import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

// Admin authentication check
// This function can be called in two ways:
// 1. As middleware with (req, res, next)
// 2. As a function to check admin status with (req)
export const validateAdmin = async (
  req: Request, 
  res?: Response, 
  next?: NextFunction
): Promise<boolean> => {
  try {
    const endpoint = req.originalUrl || req.url;
    console.log(`ADMIN AUTH CHECK - /api/auth/me endpoint called`);
    
    // Check if this is an emergency admin check from the frontend
    const isEmergencyCheck = req.headers['x-admin-emergency'] === 'true';
    if (isEmergencyCheck) {
      console.log(`ADMIN ACCESS - EMERGENCY CHECK MODE for ${endpoint}`);
    }
    
    // Special header that indicates we should sync the session cookie after this check
    const shouldSyncCookie = req.headers['x-admin-sync-cookie'] === 'true';
    
    // Check for admin headers first (for client-side API requests that include headers)
    const hasAdminDebugHeader = req.headers['x-admin-debug-auth'] === 'true';
    const hasAdminApiKey = req.headers['x-admin-api-key'] === 'dev_admin_key_12345';
    const adminUsername = req.headers['x-admin-username'];
    
    if (hasAdminDebugHeader && hasAdminApiKey) {
      console.log(`ADMIN ACCESS - API KEY AUTHENTICATED for ${endpoint} via headers`);
      
      // Try to set the admin user from the header
      if (adminUsername && typeof adminUsername === 'string') {
        try {
          // First try using username as loginID since we've migrated to loginID
          let adminUser = await storage.getUserByLoginID(adminUsername);
          
          // Fallback to username lookup if not found (for backward compatibility)
          if (!adminUser) {
            adminUser = await storage.getUserByUsername(adminUsername);
          }
          
          if (adminUser) {
            req.user = adminUser;
            console.log("Admin auth via headers - set admin user:", adminUser.loginID || adminUser.username);
            
            // Also set admin cookie for future requests if this is a production environment
            if (process.env.NODE_ENV === 'production' || isEmergencyCheck) {
              if (res) {
                const ONE_HOUR = 60 * 60 * 1000;
                const ADMIN_COOKIE_MAX_AGE = 4 * ONE_HOUR; // 4 hours
                
                res.cookie('admin_id', adminUser.id.toString(), {
                  httpOnly: true,
                  maxAge: ADMIN_COOKIE_MAX_AGE,
                  sameSite: 'lax',
                  secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
                });
                
                res.cookie('admin_auth_time', Date.now().toString(), {
                  httpOnly: true,
                  maxAge: ADMIN_COOKIE_MAX_AGE,
                  sameSite: 'lax',
                  secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
                });
                
                console.log(`Admin cookie set for user ${adminUser.id} (${adminUser.loginID || adminUser.username})`);
              }
            }
          }
        } catch (error) {
          console.log("Admin auth via headers - error finding specified admin user:", error);
        }
      }
      
      // Even if we couldn't set the user, proceed with access
      if (next) next();
      return true;
    }
    
    // Check if the user is already authenticated and is an admin via session
    if (req.isAuthenticated() && req.user && (req.user.role === 'admin' || req.user.role === 'limited-admin')) {
      console.log(`ADMIN ACCESS - USER AUTHENTICATED for ${endpoint} - ${req.user.loginID || req.user.username}`);
      
      // Also set the admin cookie to ensure both auth systems stay in sync
      if (shouldSyncCookie || isEmergencyCheck || process.env.NODE_ENV === 'production') {
        if (res) {
          const ONE_HOUR = 60 * 60 * 1000;
          const ADMIN_COOKIE_MAX_AGE = 4 * ONE_HOUR; // 4 hours
          
          res.cookie('admin_id', req.user.id.toString(), {
            httpOnly: true,
            maxAge: ADMIN_COOKIE_MAX_AGE,
            sameSite: 'lax',
            secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
          });
          
          res.cookie('admin_auth_time', Date.now().toString(), {
            httpOnly: true,
            maxAge: ADMIN_COOKIE_MAX_AGE,
            sameSite: 'lax',
            secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
          });
          
          console.log(`Admin cookie synced for user ${req.user.id} (${req.user.loginID || req.user.username})`);
        }
      }
      
      if (next) next();
      return true;
    }
    
    // Check for admin authentication via cookies (admin_id)
    if (req.cookies && req.cookies.admin_id) {
      const adminId = parseInt(req.cookies.admin_id);
      if (!isNaN(adminId)) {
        console.log(`ADMIN ACCESS - CHECKING ADMIN COOKIE for ${endpoint} - ID: ${adminId}`);
        
        // Check if cookie is expired by checking the auth_time cookie
        let cookieIsExpired = false;
        if (req.cookies.admin_auth_time) {
          const authTime = parseInt(req.cookies.admin_auth_time);
          const now = Date.now();
          const FOUR_HOURS = 4 * 60 * 60 * 1000;
          
          // Cookie is considered expired if it's older than 4 hours
          if (!isNaN(authTime) && now - authTime > FOUR_HOURS) {
            cookieIsExpired = true;
            console.log(`ADMIN ACCESS - ADMIN COOKIE EXPIRED for ${endpoint} - Auth time: ${new Date(authTime).toISOString()}`);
          }
        }
        
        // Only proceed if cookie is not expired
        if (!cookieIsExpired) {
          try {
            const adminUser = await storage.getUser(adminId);
            if (adminUser && (adminUser.role === 'admin' || adminUser.role === 'limited-admin')) {
              // Set the user on the request for downstream use
              req.user = adminUser;
              console.log(`ADMIN ACCESS - COOKIE AUTHENTICATED for ${endpoint} - ${adminUser.loginID || adminUser.username}`);
              
              // In emergency check mode or production, refresh the cookie
              if (isEmergencyCheck || process.env.NODE_ENV === 'production') {
                if (res) {
                  const ONE_HOUR = 60 * 60 * 1000;
                  const ADMIN_COOKIE_MAX_AGE = 4 * ONE_HOUR; // 4 hours
                  
                  res.cookie('admin_id', adminUser.id.toString(), {
                    httpOnly: true,
                    maxAge: ADMIN_COOKIE_MAX_AGE,
                    sameSite: 'lax',
                    secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
                  });
                  
                  res.cookie('admin_auth_time', Date.now().toString(), {
                    httpOnly: true,
                    maxAge: ADMIN_COOKIE_MAX_AGE,
                    sameSite: 'lax',
                    secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
                  });
                  
                  console.log(`Admin cookie refreshed for user ${adminUser.id} (${adminUser.loginID || adminUser.username})`);
                }
              }
              
              if (next) next();
              return true;
            } else {
              console.log(`ADMIN ACCESS - INVALID ADMIN COOKIE for ${endpoint} - User not admin or not found`);
            }
          } catch (error) {
            console.error(`ADMIN ACCESS - ERROR CHECKING ADMIN COOKIE for ${endpoint}:`, error);
          }
        }
      }
    }
    
    // If this is an emergency check, provide more detailed information
    if (isEmergencyCheck) {
      console.log(`ADMIN ACCESS - EMERGENCY CHECK DETAILS:`, {
        isAuthenticated: req.isAuthenticated?.() || false,
        hasUser: !!req.user,
        userRole: req.user?.role || 'none',
        hasCookies: !!req.cookies,
        adminIdCookie: req.cookies?.admin_id || 'none',
        adminAuthTimeCookie: req.cookies?.admin_auth_time || 'none',
        headers: {
          adminDebug: req.headers['x-admin-debug-auth'] || 'none',
          adminApiKey: req.headers['x-admin-api-key'] ? 'present' : 'none',
          adminUsername: req.headers['x-admin-username'] || 'none',
          adminEmergency: req.headers['x-admin-emergency'] || 'none'
        }
      });
    }
    
    // If no valid admin authentication, deny access
    console.log(`ADMIN ACCESS - DENIED for ${endpoint}`);
    if (res) {
      res.status(401).json({
        message: "Not authenticated as admin or limited-admin"
      });
      return false;
    }
    
    return false;
  } catch (error) {
    console.error('Error in admin auth:', error);
    if (res) {
      // Send response but don't return the response object
      res.status(500).json({
        message: "Server error during admin authentication"
      });
    }
    // Always return boolean for type safety
    return false;
  }
};

// Calculate price based on options
export const calculatePrice = (
  basePrice: number, 
  metalTypeId: string, 
  stoneTypeId: string
): number => {
  const metalMultipliers: Record<string, number> = {
    '22kt-gold': 1.2,
    '18kt-gold': 1.0,
    '14kt-gold': 0.8,
    'silver-gold': 0.5
  };

  const stoneMultipliers: Record<string, number> = {
    'natural-polki': 1.5,
    'lab-polki': 1.2,
    'moissanite': 0.9,
    'natural-diamond': 2.0,
    'lab-diamond': 1.3,
    'swarovski': 0.7,
    'cz': 0.5,
    'pota': 0.4,
    'ruby': 1.3,
    'emerald': 1.4,
    'sapphire': 1.3
  };

  const metalMultiplier = metalMultipliers[metalTypeId] || 1.0;
  const stoneMultiplier = stoneMultipliers[stoneTypeId] || 1.0;

  return Math.round(basePrice * metalMultiplier * stoneMultiplier);
};

// Format currency (INR)
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

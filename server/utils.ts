import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

// DEVELOPMENT ONLY: Simple bypass for admin authentication
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
          }
        } catch (error) {
          console.log("Admin auth via headers - error finding specified admin user:", error);
        }
      }
      
      // Even if we couldn't set the user, proceed with access
      if (next) next();
      return true;
    }
    
    // Regular bypass for direct API calls without headers
    console.log(`ADMIN ACCESS - AUTHENTICATION BYPASSED for ${endpoint}`);
    
    // Try to set a default admin user
    try {
      // First try by loginID (new system)
      let adminUser = await storage.getUserByLoginID('admin');
      
      // Fallback to username (old system)
      if (!adminUser) {
        adminUser = await storage.getUserByUsername('admin');
      }
      
      if (adminUser) {
        req.user = adminUser;
        console.log("Admin auth bypassed - set default admin user:", adminUser.loginID || adminUser.username);
      } else {
        console.log("Admin auth bypassed - could not find admin user, but still allowing access");
      }
    } catch (error) {
      console.log("Admin auth bypassed - error finding admin user, but still allowing access:", error);
    }
    
    // Always proceed without authentication checks
    if (next) next();
    return true;
  } catch (error) {
    console.error('Error in admin auth bypass:', error);
    // Even if error occurs, still proceed
    if (next) next();
    return true;
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

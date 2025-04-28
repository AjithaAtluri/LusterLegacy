import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

// Enhanced admin validation middleware
export const validateAdmin = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    console.log("ADMIN ACCESS - Validating admin request");
    
    // Try both auth systems, with priority on cookie-based auth for reliability
    let adminUser = null;
    
    // 1. First check cookie auth
    const userId = req.cookies?.userId;
    if (userId) {
      try {
        const parsedUserId = parseInt(userId);
        if (!isNaN(parsedUserId)) {
          console.log("Auth check - found userId cookie:", parsedUserId);
          
          const cookieUser = await storage.getUser(parsedUserId);
          if (cookieUser && cookieUser.role === 'admin') {
            console.log("Auth check - verified admin via cookie auth");
            adminUser = cookieUser;
            
            // Set user on request for downstream handlers
            req.user = cookieUser;
            
            // Ensure passport session is synced
            if (!req.isAuthenticated || !req.isAuthenticated()) {
              try {
                req.login(cookieUser, (loginErr) => {
                  if (loginErr) {
                    console.warn("Could not sync passport session:", loginErr);
                    // Continue anyway since we have valid cookie auth
                  }
                });
              } catch (sessionError) {
                console.warn("Error syncing sessions:", sessionError);
                // Continue with cookie auth
              }
            }
            
            // Allow the request to proceed
            return next();
          } else if (cookieUser) {
            console.log("Auth check - cookie user found but not admin, role:", cookieUser.role);
          } else {
            console.log("Auth check - no user found for cookie ID:", parsedUserId);
          }
        }
      } catch (cookieError) {
        console.error("Error checking cookie auth:", cookieError);
      }
    } else {
      console.log("Auth check - no userId cookie found");
    }
    
    // 2. If no admin via cookie, check passport auth
    if (req.isAuthenticated && req.isAuthenticated()) {
      if (req.user && req.user.role === 'admin') {
        console.log("Auth check - verified admin via passport auth");
        
        // Set admin cookie for future requests (making both auth systems consistent)
        res.cookie('userId', req.user.id, { 
          httpOnly: true, 
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        
        return next();
      } else {
        console.log("Auth check - passport user found but not admin");
        return res.status(403).json({ message: 'Admin access required' });
      }
    }
    
    // If we get here, no valid admin auth was found in either system
    console.log("Auth check - no admin authentication found");
    return res.status(401).json({ message: 'Authentication required' });
  } catch (error) {
    console.error('Error validating admin:', error);
    res.status(500).json({ 
      message: 'Server error during authentication', 
      error: error.message 
    });
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

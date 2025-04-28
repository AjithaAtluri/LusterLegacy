import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

// DEVELOPMENT ONLY: Simple bypass for admin authentication
export const validateAdmin = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const endpoint = req.originalUrl || req.url;
    console.log(`ADMIN ACCESS - AUTHENTICATION BYPASSED for ${endpoint}`);
    
    // Try to set a default admin user
    try {
      const adminUser = await storage.getUserByUsername('admin');
      if (adminUser) {
        req.user = adminUser;
        console.log("Admin auth bypassed - set default admin user:", adminUser.username);
      } else {
        console.log("Admin auth bypassed - could not find admin user, but still allowing access");
      }
    } catch (error) {
      console.log("Admin auth bypassed - error finding admin user, but still allowing access:", error);
    }
    
    // Always proceed without authentication checks
    return next();
  } catch (error) {
    console.error('Error in admin auth bypass:', error);
    // Even if error occurs, still proceed
    return next();
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

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { METAL_TYPES, STONE_TYPES } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency (INR)
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
}

// Get metal type by ID
export function getMetalType(id: string) {
  return METAL_TYPES.find(metal => metal.id === id) || METAL_TYPES[0];
}

// Get stone type by ID
export function getStoneType(id: string) {
  return STONE_TYPES.find(stone => stone.id === id) || STONE_TYPES[0];
}

/**
 * Universal function to handle image URLs across the application
 * This resolves the inconsistency between how images are stored in the database
 * and how they need to be served from the filesystem
 */
export function getImageUrl(url: string | undefined): string {
  if (!url) {
    return "/api/image-fallback/placeholder";
  }
  
  // If it's an absolute URL (starts with http/https or //)
  if (url.match(/^(https?:)?\/\//)) {
    return url;
  }
  
  // If it's a URL path starting with /uploads/
  if (url.startsWith('/uploads/')) {
    // This is the expected database format, return as is
    return url;
  }
  
  // If it's a UUID filename without path
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpe?g|png|gif|webp)$/i;
  if (uuidPattern.test(url)) {
    return `/uploads/${url}`;
  }
  
  // For any other file path, ensure it has a leading slash
  if (!url.startsWith('/')) {
    return `/${url}`;
  }
  
  return url;
}

// Calculate price based on base price and selected options
export function calculatePrice(
  basePrice: number, 
  metalTypeId: string, 
  stoneTypeId: string
): number {
  const metal = getMetalType(metalTypeId);
  const stone = getStoneType(stoneTypeId);
  
  // Calculate final price with multipliers
  const price = basePrice * metal.priceMultiplier * stone.priceMultiplier;
  
  return Math.round(price);
}

// Calculate advance payment (50%)
export function calculateAdvancePayment(totalPrice: number): number {
  return Math.round(totalPrice * 0.5);
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Validate phone number format (simple validation)
export function isValidPhone(phone: string): boolean {
  const regex = /^[0-9]{10,12}$/;
  return regex.test(phone);
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// Get file extension
export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
}

// Check if file is image
export function isImageFile(file: File): boolean {
  const acceptedImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
  return file && acceptedImageTypes.includes(file.type);
}

// Format date
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

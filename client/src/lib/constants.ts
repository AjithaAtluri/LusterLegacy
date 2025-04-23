// This file contains application-wide constants

// Customization options
export const METAL_TYPES = [
  { id: "22kt-gold", name: "22kt Gold", priceMultiplier: 1.2 },
  { id: "18kt-gold", name: "18kt Gold", priceMultiplier: 1.0 },
  { id: "14kt-gold", name: "14kt Gold", priceMultiplier: 0.8 },
  { id: "silver-gold", name: "Silver with Gold Accents", priceMultiplier: 0.5 }
];

export const STONE_TYPES = [
  { id: "natural-polki", name: "Natural Polki Diamonds", priceMultiplier: 1.5 },
  { id: "lab-polki", name: "Lab Polki Diamonds", priceMultiplier: 1.2 },
  { id: "moissanite", name: "Moissanite", priceMultiplier: 0.9 },
  { id: "natural-diamond", name: "Natural Diamond", priceMultiplier: 2.0 },
  { id: "lab-diamond", name: "Lab-Created Diamond", priceMultiplier: 1.3 },
  { id: "swarovski", name: "Swarovski", priceMultiplier: 0.7 },
  { id: "cz", name: "CZ", priceMultiplier: 0.5 },
  { id: "pota", name: "Pota Stones", priceMultiplier: 0.4 },
  { id: "ruby", name: "Ruby", priceMultiplier: 1.3 },
  { id: "emerald", name: "Emerald", priceMultiplier: 1.4 },
  { id: "sapphire", name: "Sapphire", priceMultiplier: 1.3 }
];

// Company details
export const COMPANY = {
  name: "Luster Legacy",
  email: "design@lusterlegacy.com",
  phone: "+919876543210",
  whatsapp: "919876543210",
  address: {
    line1: "Luster Legacy Design Studio",
    line2: "42 Luxury Lane, Diamond District",
    city: "Mumbai",
    state: "Maharashtra",
    postalCode: "400001",
    country: "India"
  },
  social: {
    instagram: "https://instagram.com/lusterlegacy",
    facebook: "https://facebook.com/lusterlegacy",
    pinterest: "https://pinterest.com/lusterlegacy"
  }
};

// Color scheme
export const COLORS = {
  gold: "hsl(46, 65%, 52%)",
  ivory: "hsl(60, 54%, 91%)",
  charcoal: "hsl(0, 0%, 13%)",
  plum: "hsl(292, 63%, 18%)",
  pearl: "hsl(36, 33%, 97%)",
  success: "#2E7D32",
  error: "#C62828"
};

// Payment terms
export const PAYMENT_TERMS = {
  advance: 0.5, // 50% advance payment
  cadFee: 5000  // CAD fee in INR
};

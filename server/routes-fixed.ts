import type { Express, Request, Response } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { pool } from "./db"; // Add pool for direct SQL queries
import * as z from "zod";
import { setupAuth } from "./auth";
import passport from "passport";
// Import the comparePasswords function for admin auth
import { comparePasswords } from "./auth";
import { 
  insertProductSchema, 
  insertDesignRequestSchema, 
  insertCartItemSchema,
  insertOrderSchema,
  insertOrderItemSchema,
  insertContactMessageSchema,
  insertUserSchema,
  insertMetalTypeSchema,
  insertStoneTypeSchema,
  insertInspirationGallerySchema,
  insertProductTypeSchema
} from "@shared/schema";
import multer from "multer";
import path from "path";
import { calculateJewelryPrice } from "./utils/price-calculator";
import fs from "fs";
import { validateAdmin } from "./utils";
import { v4 as uuidv4 } from "uuid";
import { paypalClientId, createOrder, captureOrder, cancelOrder } from "./paypal";
import { fetchGoldPriceUSD, fetchGoldPriceINR } from "./services/gold-price-service";
import { OpenAI } from "openai";
import { Readable } from "stream";

// Define the USD to INR conversion rate - this is just a fallback
const USD_TO_INR_RATE = 83.5;

// Configure storage for uploaded files
const storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "./uploads";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({ storage: storage_config });

// Configure OpenAI client if API key is available
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Set up authentication
  setupAuth(app);

  // Serve uploaded files statically
  app.use("/uploads", express.static("uploads"));

  // Get product by ID with simplified error handling
  app.get('/api/products/:id', async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ message: 'Invalid product ID' });
      }

      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // Try to calculate accurate price based on product information
      try {
        // Extract AI inputs if available
        let aiInputs = null;
        if (product.aiInputs) {
          aiInputs = typeof product.aiInputs === 'string' 
            ? JSON.parse(product.aiInputs) 
            : product.aiInputs;
        } else if (product.details) {
          // Try to extract from nested details
          const parsedDetails = typeof product.details === 'string' 
            ? JSON.parse(product.details) 
            : product.details;
          
          if (parsedDetails.additionalData && parsedDetails.additionalData.aiInputs) {
            aiInputs = parsedDetails.additionalData.aiInputs;
          }
        }

        if (aiInputs) {
          // Create parameters for price calculator
          const params = {
            productType: aiInputs.productType || "",
            metalType: aiInputs.metalType || "",
            metalWeight: parseFloat(aiInputs.metalWeight) || 0,
            primaryGems: [],
            otherStone: aiInputs.otherStoneType ? {
              stoneTypeId: aiInputs.otherStoneType,
              caratWeight: parseFloat(aiInputs.otherStoneWeight) || 0
            } : undefined
          };
          
          // Add main stone if available
          if (aiInputs.mainStoneType && aiInputs.mainStoneWeight) {
            params.primaryGems.push({
              name: aiInputs.mainStoneType,
              carats: parseFloat(aiInputs.mainStoneWeight) || 0
            });
          }
          
          // Add secondary stone if available
          if (aiInputs.secondaryStoneType && aiInputs.secondaryStoneWeight) {
            params.primaryGems.push({
              name: aiInputs.secondaryStoneType,
              carats: parseFloat(aiInputs.secondaryStoneWeight) || 0
            });
          }
          
          // Calculate price
          const result = await calculateJewelryPrice(params);
          
          // Add calculated prices to product
          product.calculatedPriceUSD = result.priceUSD;
          product.calculatedPriceINR = result.priceINR;
        } else {
          // Fallback to base price conversion
          product.calculatedPriceUSD = Math.round(product.basePrice / USD_TO_INR_RATE);
          product.calculatedPriceINR = product.basePrice;
        }
      } catch (calcError) {
        console.error(`Error calculating price for product ${product.id}:`, calcError);
        // Fallback to base price conversion
        product.calculatedPriceUSD = Math.round(product.basePrice / USD_TO_INR_RATE);
        product.calculatedPriceINR = product.basePrice;
      }

      res.json(product);
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({ message: 'Error fetching product' });
    }
  });
  
  // Get related products by product ID
  app.get('/api/products/:id/related', async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ message: 'Invalid product ID' });
      }
      
      // Get limit from query parameter, default to 4
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 4;
      
      // Get related products
      const relatedProducts = await storage.getRelatedProducts(productId, limit);
      
      res.json(relatedProducts);
    } catch (error) {
      console.error('Error fetching related products:', error);
      res.status(500).json({ message: 'Failed to fetch related products' });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
#!/bin/bash
# Create a backup if it doesn't exist
if [ ! -f server/routes.ts.orig ]; then
  cp server/routes.ts server/routes.ts.orig
fi

# Find start of the problematic endpoint
start_line=$(grep -n "app.get('/api/products/:id'" server/routes.ts | cut -d':' -f1)
echo "Found product endpoint at line $start_line"

# Find next endpoint (Create a new product)
end_marker="app.post('/api/products'"
end_line=$(grep -n "$end_marker" server/routes.ts | cut -d':' -f1)
echo "Found next endpoint at line $end_line"

# Extract beginning of file
head -n $((start_line-1)) server/routes.ts > server/routes.ts.new

# Add our fixed version of the endpoints
cat << 'EOF' >> server/routes.ts.new
  // Get product by ID
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

      // Log the structure and image URLs for debugging
      console.log(`Product ${productId} found:`, {
        id: product.id,
        name: product.name,
        imageUrl: product.imageUrl,
        keys: Object.keys(product)
      });

      try {
        // Try to get AI inputs from product.aiInputs first
        let aiInputs = product.aiInputs ? JSON.parse(product.aiInputs as unknown as string) : null;
        
        // If aiInputs is null, try to extract from the nested details JSON
        if (!aiInputs && product.details) {
          try {
            const parsedDetails = JSON.parse(product.details as string);
            if (parsedDetails.additionalData && parsedDetails.additionalData.aiInputs) {
              aiInputs = parsedDetails.additionalData.aiInputs;
              console.log(`Found AI inputs in details for product ${product.id}`);
            }
          } catch (err) {
            console.error(`Failed to parse details JSON for product ${product.id}:`, err);
          }
        }
        
        // Debug logging for product data
        console.log(`Detail Product ${product.id} - ${product.name} - AI Inputs:`, 
          aiInputs ? JSON.stringify(aiInputs).substring(0, 150) + '...' : 'No AI inputs');
        
        if (aiInputs) {
          // Extract parameters for the price calculator
          const params = {
            productType: aiInputs.productType || "",
            metalType: aiInputs.metalType || "",
            metalWeight: parseFloat(aiInputs.metalWeight) || 0,
            primaryGems: [], // We'll manually add all gems below
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
          
          console.log(`Detail Product ${product.id} - Price calculation parameters:`, JSON.stringify(params));
          
          const result = await calculateJewelryPrice(params);
          console.log(`Detail Product ${product.id} - Calculated prices: USD: ${result.priceUSD}, INR: ${result.priceINR}`);
          
          // Add the accurate prices to the product
          product.calculatedPriceUSD = result.priceUSD;
          product.calculatedPriceINR = result.priceINR;
        } else {
          // If AI inputs are not available, use the base price
          console.log(`Detail Product ${product.id} - No AI inputs, using base price: ${product.basePrice}`);
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
  
  // Get related products by product ID - uses keyword and image matching algorithm
  app.get('/api/products/:id/related', async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ message: 'Invalid product ID' });
      }
      
      // Get limit from query parameter, default to 4
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 4;
      
      // Get related products using the algorithm in storage
      const relatedProducts = await storage.getRelatedProducts(productId, limit);
      
      // Calculate accurate prices for each product using the price calculator
      const productsWithAccuratePrices = await Promise.all(relatedProducts.map(async product => {
        try {
          // Try to get AI inputs from product.aiInputs first
          let aiInputs = product.aiInputs ? JSON.parse(product.aiInputs as unknown as string) : null;
          
          // If aiInputs is null, try to extract from the nested details JSON
          if (!aiInputs && product.details) {
            try {
              const parsedDetails = JSON.parse(product.details as string);
              if (parsedDetails.additionalData && parsedDetails.additionalData.aiInputs) {
                aiInputs = parsedDetails.additionalData.aiInputs;
                console.log(`Found AI inputs in details for product ${product.id}`);
              }
            } catch (err) {
              console.error(`Failed to parse details JSON for product ${product.id}:`, err);
            }
          }
          
          if (aiInputs) {
            // Extract parameters for the price calculator
            const params = {
              productType: aiInputs.productType || "",
              metalType: aiInputs.metalType || "",
              metalWeight: parseFloat(aiInputs.metalWeight) || 0,
              primaryGems: [],
              otherStone: { stoneTypeId: "none", caratWeight: 0 }
            };
            
            // Add main stone if available
            if (aiInputs.mainStoneType && aiInputs.mainStoneWeight) {
              params.primaryGems.push({
                name: aiInputs.mainStoneType,
                carats: parseFloat(aiInputs.mainStoneWeight)
              });
            }
            
            // Add secondary stone if available
            if (aiInputs.secondaryStoneType && aiInputs.secondaryStoneType !== "none_selected" && aiInputs.secondaryStoneWeight) {
              params.primaryGems.push({
                name: aiInputs.secondaryStoneType,
                carats: parseFloat(aiInputs.secondaryStoneWeight)
              });
            }
            
            // Add other stone if available
            if (aiInputs.otherStoneType && aiInputs.otherStoneType !== "none_selected" && aiInputs.otherStoneWeight) {
              params.otherStone = {
                stoneTypeId: aiInputs.otherStoneType,
                caratWeight: parseFloat(aiInputs.otherStoneWeight)
              };
            }
            
            // Call the price calculator to get accurate prices
            console.log(`Related Product ${product.id} - Price calculation parameters:`, JSON.stringify(params));
            
            try {
              const { calculateJewelryPriceUSD, calculateJewelryPriceINR } = await import("./utils/price-calculator");
              const priceUSD = await calculateJewelryPriceUSD(params);
              const priceINR = await calculateJewelryPriceINR(params);
              
              return {
                ...product,
                calculatedPriceUSD: priceUSD,
                calculatedPriceINR: priceINR
              };
            } catch (error) {
              console.error(`Error calculating price for product ${product.id}:`, error);
              return product;
            }
          } else {
            return product;
          }
        } catch (error) {
          console.error(`Error processing product ${product.id} for accurate pricing:`, error);
          return product;
        }
      }));
      
      res.json(productsWithAccuratePrices);
    } catch (error) {
      console.error('Error fetching related products:', error);
      res.status(500).json({ message: 'Failed to fetch related products' });
    }
  });
EOF

# Add the rest of the file
tail -n +$end_line server/routes.ts >> server/routes.ts.new

# Replace the original file
mv server/routes.ts.new server/routes.ts
chmod +x fix_routes.sh
./fix_routes.sh

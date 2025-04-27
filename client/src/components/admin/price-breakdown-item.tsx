import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useGoldPrice } from "@/hooks/use-gold-price";

interface PriceBreakdownItemProps {
  label: string;
  metalType?: string;
  metalWeight?: string;
  stoneType?: string;
  stoneWeight?: string;
}

/**
 * A component to display an individual price breakdown item with estimated cost
 */
export function PriceBreakdownItem({
  label,
  metalType,
  metalWeight,
  stoneType,
  stoneWeight
}: PriceBreakdownItemProps) {
  const { goldPrice } = useGoldPrice();
  const [cost, setCost] = useState<number>(0);
  const [description, setDescription] = useState<string>("");

  // Calculate individual cost elements
  useEffect(() => {
    const calculateCost = async () => {
      try {
        // For Metal Cost
        if (label === "Metal Cost" && metalType && metalWeight) {
          const weightNum = parseFloat(metalWeight) || 0;
          
          if (weightNum <= 0 || metalType === "none_selected") {
            setCost(0);
            setDescription("No metal selected");
            return;
          }
          
          // Estimate metal cost based on gold price and type
          let purityFactor = 0.75; // Default to 18K (75% purity)
          
          if (metalType.includes("24K")) purityFactor = 1.0;
          else if (metalType.includes("22K")) purityFactor = 0.916;
          else if (metalType.includes("18K")) purityFactor = 0.75;
          else if (metalType.includes("14K")) purityFactor = 0.585;
          
          // Add markup for white gold, rose gold, platinum
          let typeMultiplier = 1.0;
          if (metalType.includes("White")) typeMultiplier = 1.1;
          else if (metalType.includes("Rose")) typeMultiplier = 1.05;
          else if (metalType.includes("Platinum")) {
            // Platinum is priced differently
            purityFactor = 0.95; // Typical platinum purity
            // Platinum is typically 1.2-1.5x the price of gold
            typeMultiplier = 1.4;
          }
          
          // Use a default gold price if it's not available
          const currentGoldPrice = typeof goldPrice === 'number' ? goldPrice : 2200; // Default fallback price
          const estimatedCost = currentGoldPrice * weightNum * purityFactor * typeMultiplier;
          setCost(Math.round(estimatedCost));
          setDescription(`${weightNum}g of ${metalType}`);
        }
        
        // For Stone Cost
        else if (stoneType && stoneWeight) {
          const weightNum = parseFloat(stoneWeight) || 0;
          
          if (weightNum <= 0 || stoneType === "none_selected") {
            setCost(0);
            setDescription("No stone selected");
            return;
          }
          
          // Use stone type name to estimate price directly
          // Bypass API call which is causing errors
          let pricePerCarat = 100; // Default price
          let stoneName = stoneType;
          
          // Rough estimates for common stones based on name
          if (stoneType.includes("Diamond") || stoneType.includes("diamond")) pricePerCarat = 5000;
          else if (stoneType.includes("Ruby") || stoneType.includes("ruby")) pricePerCarat = 1500;
          else if (stoneType.includes("Sapphire") || stoneType.includes("sapphire")) pricePerCarat = 1200;
          else if (stoneType.includes("Emerald") || stoneType.includes("emerald")) pricePerCarat = 1300;
          else if (stoneType.includes("Pearl") || stoneType.includes("pearl")) pricePerCarat = 800;
          else if (stoneType.includes("Topaz") || stoneType.includes("topaz")) pricePerCarat = 300;
          else if (stoneType.includes("Amethyst") || stoneType.includes("amethyst")) pricePerCarat = 200;
          else if (stoneType.includes("Tourmaline") || stoneType.includes("tourmaline")) pricePerCarat = 400;
          else if (stoneType.includes("Opal") || stoneType.includes("opal")) pricePerCarat = 600;
          else if (stoneType.includes("Polki") || stoneType.includes("polki")) pricePerCarat = 2000;
          else if (stoneType.includes("Morganite") || stoneType.includes("morganite")) pricePerCarat = 300;
          else if (stoneType.includes("Aquamarine") || stoneType.includes("aquamarine")) pricePerCarat = 400;
          
          // Extract stone name for display
          // Split by space and capitalize first letter of each word
          const parts = stoneType.split(' ');
          if (parts.length >= 2) {
            // If it's a numeric ID, use a generic name based on the estimated price
            if (!isNaN(parseInt(stoneType))) {
              if (pricePerCarat >= 4000) stoneName = "Premium Diamond";
              else if (pricePerCarat >= 1000) stoneName = "Precious Gemstone";
              else stoneName = "Semi-precious Stone";
            } else {
              // Use the input value directly
              stoneName = stoneType;
            }
          }
          
          const estimatedCost = weightNum * pricePerCarat;
          setCost(Math.round(estimatedCost));
          setDescription(`${weightNum} carat of ${stoneName}`);
        }
      } catch (error) {
        console.error("Error in price breakdown calculation:", error);
        setCost(0);
        setDescription("Error calculating cost");
      }
    };

    calculateCost();
  }, [label, metalType, metalWeight, stoneType, stoneWeight, goldPrice]);

  // Don't render anything if no valid data
  if ((label === "Metal Cost" && (!metalType || metalType === "none_selected")) ||
      (label !== "Metal Cost" && (!stoneType || stoneType === "none_selected"))) {
    return null;
  }

  return (
    <div className="flex justify-between items-center text-sm py-1">
      <div>
        <span className="font-medium">{label}:</span>
        <span className="ml-1 text-muted-foreground">{description}</span>
      </div>
      <span>{cost > 0 ? `~$${cost.toLocaleString()}` : "N/A"}</span>
    </div>
  );
}
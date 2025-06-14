import { useState, useEffect } from "react";
import { useGoldPrice } from "@/hooks/use-gold-price";
import { apiRequest } from "@/lib/queryClient";

interface PriceBreakdownItemProps {
  label: string;
  metalType?: string;
  metalWeight?: string;
  stoneType?: string;
  stoneWeight?: string;
}

/**
 * A component to display an individual price breakdown item with estimated cost
 * Uses the same calculation method as the main price calculator
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
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Calculate individual cost elements using the same method as the main price calculator
  useEffect(() => {
    // Function to calculate costs synchronously for immediate feedback initially
    // then update with API values when they come back
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
          
          // Set initial description
          setDescription(`${weightNum}g of ${metalType}`);
          setIsLoading(true);

          // First provide a quick estimate (same formula as main calculator)
          // Current gold price * weight * purity factor * type modifier
          let purityFactor = 0.75; // Default to 18K (75% purity)
          let typeMultiplier = 1.0;
          
          if (metalType.includes("24K")) purityFactor = 1.0;
          else if (metalType.includes("22K")) purityFactor = 0.916;
          else if (metalType.includes("18K")) purityFactor = 0.75;
          else if (metalType.includes("14K")) purityFactor = 0.585;
          
          if (metalType.includes("White")) typeMultiplier = 1.1;
          else if (metalType.includes("Rose")) typeMultiplier = 1.05;
          else if (metalType.includes("Platinum")) {
            purityFactor = 0.95;
            typeMultiplier = 1.4;
          }
          
          // Use current gold price or fallback
          const currentGoldPrice = typeof goldPrice === 'number' ? goldPrice : 7500;
          const estimatedCost = currentGoldPrice * weightNum * purityFactor * typeMultiplier;
          setCost(Math.round(estimatedCost));
          
          // Now try to get the accurate metal cost from the API, same as main calculator
          try {
            const response = await apiRequest("POST", "/api/calculate-price", {
              metalTypeId: metalType,
              metalWeight: weightNum,
              primaryStone: null, // Only calculate metal cost
              secondaryStones: [],
              otherStone: null
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.inr && data.inr.breakdown) {
                const metalCostINR = data.inr.breakdown.metalCost;
                setCost(Math.round(metalCostINR));
              }
            }
          } catch (apiError) {
            console.log("Using estimate for metal cost:", estimatedCost);
            // Keep using the estimate if the API call fails
          }
        }
        
        // For Stone Cost
        else if (stoneType && stoneWeight) {
          const weightNum = parseFloat(stoneWeight) || 0;
          
          if (weightNum <= 0 || stoneType === "none_selected") {
            setCost(0);
            setDescription("No stone selected");
            return;
          }
          
          // Set initial description and values
          setDescription(`${weightNum} carat of ${stoneType}`);
          setCost(0);
          setIsLoading(true);
          
          // Don't use stone name based estimation - only use admin entered values via API
          // We'll fetch from the API which uses the proper database values entered by the admin
          
          // Now try to get the accurate stone cost from the API, same as main calculator
          // Only do this if we have a specific stone type
          if (weightNum > 0 && stoneType !== "none_selected") {
            try {
              // Determine if this is the primary, secondary, or other stone by label
              let primaryStone = null;
              let secondaryStones = null;
              let otherStone = null;
              
              // Configure the stone data based on the label
              if (label.toLowerCase().includes("main") || label === "Stone Cost") {
                primaryStone = {
                  stoneTypeId: stoneType, 
                  caratWeight: weightNum
                };
              } else if (label.toLowerCase().includes("secondary")) {
                secondaryStones = [{
                  stoneTypeId: stoneType, 
                  caratWeight: weightNum
                }];
              } else if (label.toLowerCase().includes("other")) {
                otherStone = {
                  stoneTypeId: stoneType, 
                  caratWeight: weightNum
                };
              } else {
                // Default to primary stone if no specific label match
                primaryStone = {
                  stoneTypeId: stoneType, 
                  caratWeight: weightNum
                };
              }
              
              // Construct the payload with the appropriate stone data
              const requestPayload = {
                metalTypeId: "18K Yellow Gold", // Default metal just to make API work
                metalWeight: 1, // Minimal metal weight
                primaryStone,
                secondaryStones,
                otherStone
              };
              
              const response = await apiRequest("POST", "/api/calculate-price", requestPayload);
              
              if (response.ok) {
                const data = await response.json();
                if (data.success && data.inr && data.inr.breakdown) {
                  // Extract the stone cost based on the stone type
                  let stoneCostINR = 0;
                  let verifiedName = stoneType;
                  
                  if (label.toLowerCase().includes("main") || label === "Stone Cost") {
                    stoneCostINR = data.inr.breakdown.primaryStoneCost;
                    if (data.inputs?.primaryStone) {
                      verifiedName = data.inputs.primaryStone.name || stoneType;
                    }
                  } else if (label.toLowerCase().includes("secondary")) {
                    stoneCostINR = data.inr.breakdown.secondaryStoneCost;
                    if (data.inputs?.secondaryStones?.[0]) {
                      verifiedName = data.inputs.secondaryStones[0].name || stoneType;
                    }
                  } else if (label.toLowerCase().includes("other")) {
                    stoneCostINR = data.inr.breakdown.otherStoneCost;
                    if (data.inputs?.otherStone) {
                      verifiedName = data.inputs.otherStone.name || stoneType;
                    }
                  } else {
                    // Default to primary stone cost if no specific label match
                    stoneCostINR = data.inr.breakdown.primaryStoneCost;
                  }
                  
                  if (stoneCostINR > 0) {
                    setCost(Math.round(stoneCostINR));
                    setDescription(`${weightNum} carat of ${verifiedName}`);
                  }
                }
              }
            } catch (apiError) {
              console.log("Error fetching stone cost from API, unable to display price");
              // Display error state if API call fails
            }
          }
        }
      } catch (error) {
        console.error("Error in price breakdown calculation:", error);
        setCost(0);
        setDescription("Error calculating cost");
      } finally {
        setIsLoading(false);
      }
    };

    // Call calculation immediately
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
      <span>{isLoading ? "Calculating..." : (cost > 0 ? `~₹${cost.toLocaleString()}` : (description === "No stone selected" ? "N/A" : "₹0"))}</span>
    </div>
  );
}
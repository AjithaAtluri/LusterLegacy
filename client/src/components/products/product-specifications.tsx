import React from 'react';

interface ProductSpecificationsProps {
  productMetalType?: string;
  productMetalWeight?: number;
  mainStoneType?: string;
  mainStoneWeight?: number;
  secondaryStoneType?: string;
  secondaryStoneWeight?: number;
  otherStoneType?: string;
  otherStoneWeight?: number;
  currentPrice?: number;
  formatCurrency: (value: number) => string;
  className?: string;
}

export function ProductSpecifications({
  productMetalType,
  productMetalWeight = 0,
  mainStoneType,
  mainStoneWeight = 0,
  secondaryStoneType,
  secondaryStoneWeight = 0,
  otherStoneType,
  otherStoneWeight = 0,
  currentPrice = 0,
  formatCurrency,
  className = "",
}: ProductSpecificationsProps) {
  return (
    <div className={`p-4 bg-card rounded-xl border border-border ${className}`}>
      <h3 className="font-playfair text-lg font-semibold mb-4 text-center">Product Specifications</h3>
      
      {/* Metal Type and Weight */}
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-border">
        <span className="font-montserrat text-sm text-foreground/80">Metal Type:</span>
        <span className="font-cormorant text-base font-medium">{productMetalType || "Not specified"}</span>
      </div>
      
      {/* Metal Weight */}
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-border">
        <span className="font-montserrat text-sm text-foreground/80">Metal Weight:</span>
        <span className="font-cormorant text-base font-medium">{productMetalWeight > 0 ? `${productMetalWeight}g` : "Not specified"}</span>
      </div>
      
      {/* Primary Stone - only show if stone is not "none" or "none_selected" */}
      {(mainStoneType && mainStoneType !== "none" && mainStoneType !== "none_selected") && (
        <>
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-border">
            <span className="font-montserrat text-sm text-foreground/80">Primary Stone:</span>
            <span className="font-cormorant text-base font-medium">{mainStoneType}</span>
          </div>
          
          {/* Primary Stone Weight */}
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-border">
            <span className="font-montserrat text-sm text-foreground/80">Primary Stone Weight:</span>
            <span className="font-cormorant text-base font-medium">{mainStoneWeight > 0 ? `${mainStoneWeight} carats` : "Not specified"}</span>
          </div>
        </>
      )}

      {/* Secondary Stone - only show if stone is not "none" or "none_selected" */}
      {(secondaryStoneType && secondaryStoneType !== "none" && secondaryStoneType !== "none_selected") && (
        <div className="flex justify-between items-center mb-3 pb-2 border-b border-border">
          <span className="font-montserrat text-sm text-foreground/80">Secondary Stone:</span>
          <span className="font-cormorant text-base font-medium">
            {secondaryStoneType} {secondaryStoneWeight > 0 ? `(${secondaryStoneWeight} carats)` : ""}
          </span>
        </div>
      )}
      
      {/* Other Stone - only show if stone is not "none" or "none_selected" or empty */}
      {(otherStoneType && otherStoneType !== "none" && otherStoneType !== "none_selected" && otherStoneType !== "") && (
        <div className="flex justify-between items-center mb-3 pb-2 border-b border-border">
          <span className="font-montserrat text-sm text-foreground/80">Other Stone:</span>
          <span className="font-cormorant text-base font-medium">
            {otherStoneType} {otherStoneWeight > 0 ? `(${otherStoneWeight} carats)` : ""}
          </span>
        </div>
      )}
      
      {/* Estimated Price */}
      {currentPrice > 0 && (
        <div className="flex justify-between items-center">
          <span className="font-montserrat text-sm font-semibold text-foreground/80">Estimated Price:</span>
          <span className="font-cormorant text-lg font-semibold text-primary">{formatCurrency(currentPrice)}</span>
        </div>
      )}
    </div>
  );
}
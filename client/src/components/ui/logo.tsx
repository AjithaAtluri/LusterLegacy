import React from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  withText?: boolean;
}

export function Logo({ 
  className, 
  size = "md", 
  withText = true 
}: LogoProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10"
  };

  const textSizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl"
  };

  return (
    <Link href="/" className={cn("flex items-center gap-2", className)}>
      <div className={cn(sizeClasses[size])}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path 
            d="M50 15 L75 40 L50 65 L25 40 Z" 
            stroke="currentColor" 
            strokeWidth="3" 
            fill="none" 
            className="text-primary"
          />
          <path 
            d="M50 40 L62.5 52.5 L50 65 L37.5 52.5 Z" 
            stroke="currentColor" 
            strokeWidth="3" 
            fill="none" 
            className="text-primary"
          />
          <path 
            d="M50 15 L62.5 27.5 L50 40 L37.5 27.5 Z" 
            stroke="currentColor" 
            strokeWidth="3" 
            fill="none" 
            className="text-primary"
          />
        </svg>
      </div>
      
      {withText && (
        <span className={cn("font-playfair font-bold text-charcoal", textSizeClasses[size])}>
          Luster<span className="text-primary">Legacy</span>
        </span>
      )}
    </Link>
  );
}
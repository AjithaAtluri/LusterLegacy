import React from 'react';
import { cn } from '@/lib/utils';

interface SparkleProps {
  color?: string;
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}

const Sparkle: React.FC<SparkleProps> = ({ 
  color = '#FFF', 
  size = 20,
  style,
  className
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 160 160" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={style}
      className={className}
    >
      <path 
        d="M80 0L88.6 71.4L160 80L88.6 88.6L80 160L71.4 88.6L0 80L71.4 71.4L80 0Z" 
        fill={color} 
      />
    </svg>
  );
};

interface GemSparkleProps {
  className?: string;
}

export const GemSparkle: React.FC<GemSparkleProps> = ({ className }) => {
  return (
    <div 
      className={cn(
        "absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 z-10 transition-opacity duration-300",
        className
      )}
    >
      {/* Main large central sparkle */}
      <Sparkle 
        color="rgba(255, 215, 0, 0.9)" 
        size={40} 
        className="absolute animate-sparkle animate-gem-glow"
        style={{ 
          top: '30%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          animationDelay: '0s'
        }} 
      />
      
      {/* Diamond sparkle */}
      <Sparkle 
        color="rgba(255, 255, 255, 0.9)" 
        size={25} 
        className="absolute animate-sparkle"
        style={{ 
          top: '20%', 
          left: '30%', 
          transform: 'translate(-50%, -50%)',
          animationDelay: '0.2s'
        }} 
      />
      
      {/* Ruby sparkle */}
      <Sparkle 
        color="rgba(205, 92, 92, 0.8)" 
        size={20} 
        className="absolute animate-sparkle"
        style={{ 
          top: '60%', 
          left: '20%', 
          transform: 'translate(-50%, -50%)',
          animationDelay: '0.5s'
        }} 
      />
      
      {/* Sapphire sparkle */}
      <Sparkle 
        color="rgba(65, 105, 225, 0.8)" 
        size={18} 
        className="absolute animate-sparkle"
        style={{ 
          top: '75%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          animationDelay: '0.3s'
        }} 
      />
      
      {/* Emerald sparkle */}
      <Sparkle 
        color="rgba(80, 200, 120, 0.8)" 
        size={22} 
        className="absolute animate-sparkle"
        style={{ 
          top: '40%', 
          left: '80%', 
          transform: 'translate(-50%, -50%)',
          animationDelay: '0.1s'
        }} 
      />
      
      {/* Small diamond sparkles */}
      <Sparkle 
        color="rgba(255, 255, 255, 0.7)" 
        size={12} 
        className="absolute animate-sparkle"
        style={{ 
          top: '15%', 
          left: '85%', 
          transform: 'translate(-50%, -50%)',
          animationDelay: '0.6s'
        }} 
      />
      
      <Sparkle 
        color="rgba(255, 255, 255, 0.7)" 
        size={10} 
        className="absolute animate-sparkle"
        style={{ 
          top: '70%', 
          left: '80%', 
          transform: 'translate(-50%, -50%)',
          animationDelay: '0.4s'
        }} 
      />
      
      <Sparkle 
        color="rgba(255, 215, 0, 0.7)" 
        size={15} 
        className="absolute animate-sparkle"
        style={{ 
          top: '85%', 
          left: '25%', 
          transform: 'translate(-50%, -50%)',
          animationDelay: '0.7s'
        }} 
      />
    </div>
  );
};

export default GemSparkle;
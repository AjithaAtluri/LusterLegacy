import { useGoldPrice } from "@/hooks/use-gold-price";
import { Loader2, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export function GoldPriceDisplay() {
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const queryClient = useQueryClient();
  
  const { 
    goldPrice, 
    location, 
    timestamp, 
    isLoading, 
    error 
  } = useGoldPrice();
  
  const handleRefresh = async () => {
    setIsManualRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['/api/gold-price'] });
    setTimeout(() => setIsManualRefreshing(false), 1000);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Loading gold price...</span>
      </div>
    );
  }
  
  if (error || !goldPrice) {
    return (
      <div className="text-sm text-amber-600">
        Unable to fetch real-time gold price.
      </div>
    );
  }
  
  return (
    <div className="bg-amber-50 border border-amber-200 p-3 rounded-md">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse" />
          <h3 className="font-semibold text-amber-900">Current Gold Price</h3>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 text-amber-700 hover:text-amber-900 hover:bg-amber-100"
          onClick={handleRefresh}
          disabled={isManualRefreshing}
        >
          <RefreshCw className={`h-3 w-3 ${isManualRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      
      <div className="mt-2 flex flex-col">
        <div className="flex justify-between">
          <span className="text-amber-800">24K Gold:</span>
          <span className="font-semibold text-amber-900">₹{goldPrice.toLocaleString('en-IN')}/gram</span>
        </div>
        
        <div className="flex justify-between text-xs text-amber-700 mt-1">
          <span>{location}</span>
          <span>Updated {formatDistanceToNow(timestamp)} ago</span>
        </div>
      </div>
    </div>
  );
}
import { useGoldPrice } from "@/hooks/use-gold-price";
import { Loader2, RefreshCw, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function GoldPriceDisplay() {
  // Important: Keep hook order consistent
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  
  const { 
    goldPrice, 
    location, 
    timestamp, 
    isLoading, 
    isForceRefreshing,
    error,
    refresh,
    forceRefresh
  } = useGoldPrice();
  
  // Standard refresh - uses cache policy
  const handleRefresh = async () => {
    try {
      setIsUpdating(true);
      await refresh();
      toast({
        title: "Gold Price Updated",
        description: "Successfully refreshed gold price data.",
        variant: "default"
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to refresh gold price.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Force refresh - bypasses cache and tries all sources
  const handleForceRefresh = async () => {
    try {
      setIsUpdating(true);
      const result = await forceRefresh();
      toast({
        title: "Gold Price Force Updated",
        description: `Successfully updated from ${result.location || 'multiple sources'}.`,
        variant: "default"
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to force refresh gold price.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  if (isLoading || isForceRefreshing) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Loading gold price...</span>
      </div>
    );
  }
  
  if (error || !goldPrice) {
    return (
      <div className="text-sm text-amber-600 flex items-center gap-2">
        <span>Unable to fetch real-time gold price.</span>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-6 text-xs border-amber-400 text-amber-700"
          onClick={handleForceRefresh}
        >
          Try Again
        </Button>
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
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-amber-700 hover:text-amber-900 hover:bg-amber-100"
            onClick={handleRefresh}
            disabled={isUpdating}
            title="Refresh"
          >
            <RefreshCw className={`h-3 w-3 ${isUpdating ? 'animate-spin' : ''}`} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-amber-700 hover:text-amber-900 hover:bg-amber-100"
            onClick={handleForceRefresh}
            disabled={isUpdating}
            title="Force Refresh From All Sources"
          >
            <Zap className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      <div className="mt-2 flex flex-col">
        <div className="flex justify-between">
          <span className="text-amber-800">24K Gold:</span>
          <span className="font-semibold text-amber-900">₹{goldPrice.toLocaleString('en-IN')}/gram</span>
        </div>
        
        <div className="flex justify-between text-xs text-amber-700 mt-1">
          <span>{location}</span>
          <span>Updated {timestamp ? formatDistanceToNow(new Date(timestamp)) : 'recently'} ago</span>
        </div>
      </div>
    </div>
  );
}
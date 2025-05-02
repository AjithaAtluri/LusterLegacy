import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StoneType } from "@shared/schema";

interface StoneTypeFilterProps {
  stoneTypes: StoneType[];
  isLoading: boolean;
  onFilter: (filteredStoneTypes: StoneType[]) => void;
}

export function StoneTypeFilter({ stoneTypes, isLoading, onFilter }: StoneTypeFilterProps) {
  const [category, setCategory] = useState<string>("");
  const [stoneForm, setStoneForm] = useState<string>("");
  const [quality, setQuality] = useState<string>("");
  const [size, setSize] = useState<string>("");

  // Extract unique categories, forms, qualities, and sizes from the stone types
  const uniqueCategories: string[] = Array.from(new Set(
    stoneTypes?.map(stone => stone.category ?? "").filter(val => val !== "") || []
  ));
  const uniqueStoneForms: string[] = Array.from(new Set(
    stoneTypes?.map(stone => stone.stoneForm ?? "").filter(val => val !== "") || []
  ));
  const uniqueQualities: string[] = Array.from(new Set(
    stoneTypes?.map(stone => stone.quality ?? "").filter(val => val !== "") || []
  ));
  const uniqueSizes: string[] = Array.from(new Set(
    stoneTypes?.map(stone => stone.size ?? "").filter(val => val !== "") || []
  ));

  // Apply filters when any filter value changes
  useEffect(() => {
    // Apply filters based on selected values
    let filtered = [...stoneTypes];
    
    // Only filter if value is not empty and not an "all_X" value
    if (category && category !== "all_categories") {
      filtered = filtered.filter((stone) => stone.category === category);
    }
    
    if (stoneForm && stoneForm !== "all_forms") {
      filtered = filtered.filter((stone) => stone.stoneForm === stoneForm);
    }
    
    if (quality && quality !== "all_qualities") {
      filtered = filtered.filter((stone) => stone.quality === quality);
    }
    
    if (size && size !== "all_sizes") {
      filtered = filtered.filter((stone) => stone.size === size);
    }
    
    // Pass the filtered stone types to the parent component
    onFilter(filtered);
  }, [category, stoneForm, quality, size, stoneTypes, onFilter]);

  // Reset all filters
  const resetFilters = () => {
    setCategory("");
    setStoneForm("");
    setQuality("");
    setSize("");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-base">Filter Stone Types</h3>
        <button 
          type="button"
          onClick={resetFilters}
          className="text-xs text-primary hover:underline"
        >
          Reset Filters
        </button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Stone Category Filter */}
        <div className="space-y-1">
          <Label htmlFor="stoneCategory" className="text-xs">Stone Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="stoneCategory" className="h-9">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_categories">All Categories</SelectItem>
              {uniqueCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Stone Form Filter */}
        <div className="space-y-1">
          <Label htmlFor="stoneForm" className="text-xs">Stone Form</Label>
          <Select value={stoneForm} onValueChange={setStoneForm}>
            <SelectTrigger id="stoneForm" className="h-9">
              <SelectValue placeholder="All Forms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_forms">All Forms</SelectItem>
              {uniqueStoneForms.map((form) => (
                <SelectItem key={form} value={form}>
                  {form}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Stone Quality Filter */}
        <div className="space-y-1">
          <Label htmlFor="quality" className="text-xs">Quality</Label>
          <Select value={quality} onValueChange={setQuality}>
            <SelectTrigger id="quality" className="h-9">
              <SelectValue placeholder="All Qualities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_qualities">All Qualities</SelectItem>
              {uniqueQualities.map((q) => (
                <SelectItem key={q} value={q}>
                  {q}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Stone Size Filter */}
        <div className="space-y-1">
          <Label htmlFor="size" className="text-xs">Size</Label>
          <Select value={size} onValueChange={setSize}>
            <SelectTrigger id="size" className="h-9">
              <SelectValue placeholder="All Sizes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_sizes">All Sizes</SelectItem>
              {uniqueSizes.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

export default StoneTypeFilter;
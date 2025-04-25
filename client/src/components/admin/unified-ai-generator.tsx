import { useState } from "react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AIGeneratedContent } from "@/lib/ai-content-generator";
import AIContentGenerator from "@/components/admin/ai-content-generator";
import { X, Upload } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { ProductType, StoneType } from "@shared/schema";

interface UnifiedAIGeneratorProps {
  form: UseFormReturn<any>;
  productTypes?: ProductType[];
  stoneTypes?: StoneType[];
  isLoadingProductTypes: boolean;
  isLoadingStoneTypes: boolean;
  mainImageFile: File | null;
  setMainImageFile: (file: File | null) => void;
  mainImagePreview: string | null;
  setMainImagePreview: (preview: string | null) => void;
  additionalImageFiles: File[];
  setAdditionalImageFiles: (files: File[]) => void;
  additionalImagePreviews: string[];
  setAdditionalImagePreviews: (previews: string[]) => void;
  mainStoneType: string;
  setMainStoneType: (type: string) => void;
  mainStoneWeight: string;
  setMainStoneWeight: (weight: string) => void;
  selectedStoneTypes: string[];
  setSelectedStoneTypes: (types: string[]) => void;
  secondaryStoneWeight: string;
  setSecondaryStoneWeight: (weight: string) => void;
  handleContentGenerated: (content: AIGeneratedContent) => void;
  getMainImageRootProps: () => any;
  getMainImageInputProps: () => any;
  getAdditionalImagesRootProps: () => any;
  getAdditionalImagesInputProps: () => any;
  removeAdditionalImage: (index: number) => void;
  isEditMode?: boolean;
  hideInputSection?: boolean; // New prop to hide the input section
}

export default function UnifiedAIGenerator({
  form,
  productTypes,
  stoneTypes,
  isLoadingProductTypes,
  isLoadingStoneTypes,
  mainImageFile,
  setMainImageFile,
  mainImagePreview,
  setMainImagePreview,
  additionalImageFiles,
  setAdditionalImageFiles,
  additionalImagePreviews,
  setAdditionalImagePreviews,
  mainStoneType,
  setMainStoneType,
  mainStoneWeight,
  setMainStoneWeight,
  selectedStoneTypes,
  setSelectedStoneTypes,
  secondaryStoneWeight,
  setSecondaryStoneWeight,
  handleContentGenerated,
  getMainImageRootProps,
  getMainImageInputProps,
  getAdditionalImagesRootProps,
  getAdditionalImagesInputProps,
  removeAdditionalImage,
  isEditMode = false,
  hideInputSection = false
}: UnifiedAIGeneratorProps) {
  // Get values for AI content generator
  const productTypeId = form.watch("productTypeId");
  const selectedProductType = productTypes?.find(type => type.id.toString() === productTypeId);
  const productType = selectedProductType?.name || form.watch("category");
  const metalType = form.watch("metalType");
  const metalWeight = form.watch("metalWeight") ? parseFloat(form.watch("metalWeight")) : undefined;
  
  // Define type-safe versions of state setters to fix TypeScript issues
  const handleSetSelectedStoneTypes = (updater: (prev: string[]) => string[]) => {
    // Create a direct copy, apply the updater function, then set the state
    const currentStoneTypes = [...selectedStoneTypes];
    const updatedStoneTypes = updater(currentStoneTypes);
    setSelectedStoneTypes(updatedStoneTypes);
  };

  return (
    <>
      {/* Section Heading for Product Description */}
      <div className="border-b pb-2 pt-6">
        <h2 className="text-xl font-semibold">Product Description</h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Product Description</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of the product (3-5 lines)"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This will appear in product listings and cards
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="detailedDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detailed Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Detailed description with materials, craftsmanship and usage information"
                      className="min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This will appear on the product detail page
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      </div>
      
      {/* Section Heading for AI Content Generator */}
      <div className="border-b pb-2 pt-6">
        <h2 className="text-xl font-semibold">AI Content Generator</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {hideInputSection 
            ? "AI content has been loaded from previously generated content" 
            : `Upload images and fill in details to ${isEditMode ? "regenerate" : "generate"} product content using AI`
          }
        </p>
      </div>
      
      {!hideInputSection && (
      <div className="space-y-6 mb-6">
        {/* Image Upload Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Image Upload */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">1. Main Product Image</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                {...getMainImageRootProps()}
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-primary/5 transition-colors flex flex-col items-center justify-center h-[180px] ${mainImagePreview ? 'border-green-500/50 bg-green-50/20' : 'border-primary/20'}`}
              >
                <input {...getMainImageInputProps()} />
                {mainImagePreview ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img
                      src={mainImagePreview}
                      alt="Product preview"
                      className="max-h-full max-w-full object-contain rounded-md"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-0 right-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (mainImagePreview && mainImagePreview.startsWith('blob:')) {
                          URL.revokeObjectURL(mainImagePreview);
                        }
                        setMainImageFile(null);
                        setMainImagePreview(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground text-center">
                      Click to upload main product image
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      PNG, JPG or JPEG (max 5MB)
                    </p>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                This will be used as the primary image for AI analysis
              </p>
            </CardContent>
          </Card>
          
          {/* Additional Images */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">2. Additional Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                {...getAdditionalImagesRootProps()}
                className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-primary/5 transition-colors h-[100px] flex flex-col items-center justify-center mb-2"
              >
                <input {...getAdditionalImagesInputProps()} />
                <Upload className="h-6 w-6 mb-1 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Add more images (up to 3)</p>
              </div>
              
              {additionalImagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {additionalImagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img 
                        src={preview} 
                        alt={`Additional image ${index + 1}`} 
                        className="h-20 w-full object-cover rounded-md"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-5 w-5"
                        onClick={() => removeAdditionalImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              <p className="text-xs text-muted-foreground mt-2 flex items-center justify-between">
                <span>Additional images for the product gallery</span>
                <span className={`${additionalImagePreviews.length > 0 ? 'text-green-600' : 'text-amber-600'} font-medium`}>
                  {additionalImagePreviews.length}/3
                </span>
              </p>
            </CardContent>
          </Card>
          
          {/* AI Description */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">3. Description for AI</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="userDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea 
                        placeholder="Provide any additional details for the AI to consider (not shown to customers)"
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      For AI content generation only
                    </FormDescription>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>
        
        {/* Product Details for AI */}
        <Card>
          <CardHeader>
            <CardTitle>Product Details for AI</CardTitle>
            <p className="text-sm text-muted-foreground">
              These details will be used to generate AI content
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                {/* 4. Product Type */}
                <FormField
                  control={form.control}
                  name="productTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>4. Product Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select product type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingProductTypes ? (
                            <div className="flex items-center justify-center p-2">
                              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                            </div>
                          ) : productTypes?.length ? (
                            productTypes.map(type => (
                              <SelectItem key={type.id} value={type.id.toString()}>
                                {type.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-product-types">No product types found</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* 5. Metal Type */}
                <FormField
                  control={form.control}
                  name="metalType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>5. Metal Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select metal type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="18k Gold">18k Gold</SelectItem>
                          <SelectItem value="14k Gold">14k Gold</SelectItem>
                          <SelectItem value="22k Gold">22k Gold</SelectItem>
                          <SelectItem value="24k Gold">24k Gold</SelectItem>
                          <SelectItem value="Platinum">Platinum</SelectItem>
                          <SelectItem value="Sterling Silver">Sterling Silver</SelectItem>
                          <SelectItem value="Rose Gold 18k">Rose Gold 18k</SelectItem>
                          <SelectItem value="White Gold 18k">White Gold 18k</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* 6. Metal Weight */}
                <FormField
                  control={form.control}
                  name="metalWeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>6. Metal Weight (grams)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.1" placeholder="e.g. 5.2" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-4">
                {/* 7. Main Stone Type */}
                <div className="space-y-2">
                  <FormLabel htmlFor="mainStoneType">7. Main Stone Type</FormLabel>
                  <Select
                    value={mainStoneType}
                    onValueChange={setMainStoneType}
                  >
                    <SelectTrigger id="mainStoneType">
                      <SelectValue placeholder="Select main stone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-main-stone">No Main Stone</SelectItem>
                      {isLoadingStoneTypes ? (
                        <div className="flex items-center justify-center p-2">
                          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                        </div>
                      ) : stoneTypes?.length ? (
                        stoneTypes.map(stone => (
                          <SelectItem key={stone.id} value={stone.name}>
                            {stone.name}
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="Diamond">Diamond</SelectItem>
                          <SelectItem value="Ruby">Ruby</SelectItem>
                          <SelectItem value="Sapphire">Sapphire</SelectItem>
                          <SelectItem value="Emerald">Emerald</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* 8. Main Stone Weight */}
                <div className="space-y-2">
                  <FormLabel htmlFor="mainStoneWeight">8. Main Stone Weight (carats)</FormLabel>
                  <Input
                    id="mainStoneWeight"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 1.2"
                    value={mainStoneWeight}
                    onChange={(e) => setMainStoneWeight(e.target.value)}
                    disabled={!mainStoneType}
                  />
                </div>
                
                {/* 10. Secondary Stone Weight */}
                <div className="space-y-2">
                  <FormLabel htmlFor="secondaryStoneWeight">
                    10. Secondary Stones Total Weight (carats)
                  </FormLabel>
                  <Input
                    id="secondaryStoneWeight"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 0.5"
                    value={secondaryStoneWeight}
                    onChange={(e) => setSecondaryStoneWeight(e.target.value)}
                    disabled={selectedStoneTypes.length === 0}
                  />
                  <p className="text-xs text-muted-foreground">
                    Combined total weight of all secondary stones
                  </p>
                </div>
              </div>
              
              {/* 9. Secondary Stones */}
              <div className="space-y-2">
                <FormLabel>9. Secondary Stones</FormLabel>
                <div className="border rounded-md p-3 h-[220px] overflow-y-auto">
                  <div className="grid grid-cols-1 gap-2">
                    {isLoadingStoneTypes ? (
                      <div className="flex items-center justify-center p-4 h-full">
                        <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                      </div>
                    ) : stoneTypes?.length ? (
                      stoneTypes.map(stone => (
                        stone.name !== mainStoneType && (
                          <div key={stone.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`stone-${stone.id}`}
                              checked={selectedStoneTypes.includes(stone.name)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  handleSetSelectedStoneTypes((prev) => [...prev, stone.name]);
                                } else {
                                  handleSetSelectedStoneTypes((prev) => prev.filter((s) => s !== stone.name));
                                }
                              }}
                            />
                            <label
                              htmlFor={`stone-${stone.id}`}
                              className="text-sm cursor-pointer"
                            >
                              {stone.name}
                            </label>
                          </div>
                        )
                      ))
                    ) : (
                      ["Diamond", "Ruby", "Sapphire", "Emerald", "Amethyst", "Aquamarine"].map(stone => (
                        stone !== mainStoneType && (
                          <div key={stone} className="flex items-center space-x-2">
                            <Checkbox
                              id={`stone-${stone}`}
                              checked={selectedStoneTypes.includes(stone)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  handleSetSelectedStoneTypes((prev) => [...prev, stone]);
                                } else {
                                  handleSetSelectedStoneTypes((prev) => prev.filter((s) => s !== stone));
                                }
                              }}
                            />
                            <label
                              htmlFor={`stone-${stone}`}
                              className="text-sm cursor-pointer"
                            >
                              {stone}
                            </label>
                          </div>
                        )
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Image and Content Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${mainImagePreview ? 'bg-green-500' : 'bg-amber-500'}`}>
                    {mainImagePreview ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="16"></line>
                        <line x1="8" y1="12" x2="16" y2="12"></line>
                      </svg>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Main Product Image</h4>
                    <p className="text-sm text-muted-foreground">
                      {mainImagePreview ? 'Uploaded' : 'Not yet uploaded'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${productType ? 'bg-green-500' : 'bg-amber-500'}`}>
                    {productType ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="16"></line>
                        <line x1="8" y1="12" x2="16" y2="12"></line>
                      </svg>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Product Type</h4>
                    <p className="text-sm text-muted-foreground">
                      {productType || 'Not selected'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${metalType ? 'bg-green-500' : 'bg-amber-500'}`}>
                    {metalType ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="16"></line>
                        <line x1="8" y1="12" x2="16" y2="12"></line>
                      </svg>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Metal Type</h4>
                    <p className="text-sm text-muted-foreground">
                      {metalType ? `${metalType}${metalWeight ? ` (${metalWeight}g)` : ''}` : 'Not selected'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${mainStoneType ? 'bg-green-500' : 'bg-amber-500'}`}>
                    {mainStoneType ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="16"></line>
                        <line x1="8" y1="12" x2="16" y2="12"></line>
                      </svg>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Main Stone</h4>
                    <p className="text-sm text-muted-foreground">
                      {mainStoneType ? `${mainStoneType}${mainStoneWeight ? ` (${mainStoneWeight} ct)` : ''}` : 'None selected'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${selectedStoneTypes.length > 0 ? 'bg-green-500' : 'bg-amber-500'}`}>
                    {selectedStoneTypes.length > 0 ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="16"></line>
                        <line x1="8" y1="12" x2="16" y2="12"></line>
                      </svg>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Secondary Stones</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedStoneTypes.length > 0 
                        ? `${selectedStoneTypes.length} stones selected${secondaryStoneWeight ? ` (${secondaryStoneWeight} ct total)` : ''}` 
                        : 'None selected'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${additionalImagePreviews.length > 0 ? 'bg-green-500' : 'bg-amber-500'}`}>
                    {additionalImagePreviews.length > 0 ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="16"></line>
                        <line x1="8" y1="12" x2="16" y2="12"></line>
                      </svg>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Additional Images</h4>
                    <p className="text-sm text-muted-foreground">
                      {additionalImagePreviews.length > 0 
                        ? `${additionalImagePreviews.length} images uploaded` 
                        : 'No additional images'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* AI Content Generator */}
        <AIContentGenerator
          productType={productType}
          metalType={metalType}
          metalWeight={metalWeight}
          primaryGems={[
            ...(mainStoneType ? [{
              name: mainStoneType,
              carats: mainStoneWeight ? parseFloat(mainStoneWeight) : undefined
            }] : []),
            ...selectedStoneTypes.map(stone => ({
              name: stone,
              carats: secondaryStoneWeight ? parseFloat(secondaryStoneWeight) / selectedStoneTypes.length : undefined
            }))
          ]}
          userDescription={form.watch("userDescription")}
          imageUrls={[
            ...(mainImagePreview ? [mainImagePreview] : []),
            ...additionalImagePreviews
          ]}
          onContentGenerated={handleContentGenerated}
        />
      </div>
    </>
  );
}
import { useState, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Upload, X, PiggyBank } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import UnifiedAIGenerator from "@/components/admin/unified-ai-generator";
import { PriceCalculatorDisplay } from "@/components/admin/price-calculator-display";
import { useToast } from "@/hooks/use-toast";
import { useDropzone } from "react-dropzone";
import { AIGeneratedContent, ProductType, StoneType } from "@/types/store-types";

interface FormValues {
  title: string;
  tagline: string;
  category: string; // Legacy field being phased out (use productTypeId instead)
  productTypeId: string; // Main field referencing product_types table
  basePrice: string;
  basePriceINR: string;
  description: string;
  detailedDescription: string;
  metalType: string;
  metalWeight: string;
  userDescription: string;
  dimensions: string; // Add dimensions field for product measurements
  isNew: boolean;
  isBestseller: boolean;
  isFeatured: boolean;
}

export default function AddProduct() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedStoneTypes, setSelectedStoneTypes] = useState<Array<{id: number, name: string}>>([]);
  const [secondaryStoneType, setSecondaryStoneType] = useState<string>("none_selected");
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [additionalImageFiles, setAdditionalImageFiles] = useState<File[]>([]);
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState<string[]>([]);
  const [mainStoneType, setMainStoneType] = useState<string>("");
  const [mainStoneWeight, setMainStoneWeight] = useState<string>("");
  const [secondaryStoneWeight, setSecondaryStoneWeight] = useState<string>("");
  const [otherStoneType, setOtherStoneType] = useState<string>("none_selected");
  const [otherStoneWeight, setOtherStoneWeight] = useState<string>("");
  const [productType, setProductType] = useState<string>("");
  const [metalType, setMetalType] = useState<string>("");
  const [metalWeight, setMetalWeight] = useState<string>("");
  
  // Fetch product types from database
  const { data: productTypes, isLoading: isLoadingProductTypes } = useQuery<ProductType[]>({
    queryKey: ['/api/admin/product-types'],
    refetchOnWindowFocus: false,
  });
  
  // Fetch stone types from database
  const { data: stoneTypes, isLoading: isLoadingStoneTypes } = useQuery<StoneType[]>({
    queryKey: ['/api/admin/stone-types'],
    refetchOnWindowFocus: false,
  });
  
  // Initialize form with default values
  const form = useForm<FormValues>({
    defaultValues: {
      title: "",
      tagline: "",
      category: "",
      productTypeId: "",
      basePrice: "",
      basePriceINR: "",
      description: "",
      detailedDescription: "",
      metalType: "",
      metalWeight: "",
      userDescription: "",
      dimensions: "", // Add default value for dimensions
      isNew: false,
      isBestseller: false,
      isFeatured: false,
    },
  });
  
  // First effect to load AI generated content - runs only once
  useEffect(() => {
    // Create a session-specific flag in memory to prevent duplicate loading messages
    // This is more reliable than localStorage for the current session
    const sessionFlagId = 'content-loaded-' + Date.now();
    
    // Check if we already have the special session flag in this component instance
    if ((window as any)[sessionFlagId]) {
      console.log('AI content already loaded in this session - skipping');
      return;
    }
    
    const savedContentJson = localStorage.getItem('aiGeneratedContent');
    
    if (savedContentJson) {
      try {
        const parsedContent = JSON.parse(savedContentJson) as AIGeneratedContent;
        console.log('Found saved AI content:', parsedContent.title);
        
        // Apply the content to form values
        form.setValue('title', parsedContent.title);
        form.setValue('tagline', parsedContent.tagline);
        form.setValue('description', parsedContent.shortDescription);
        form.setValue('detailedDescription', parsedContent.detailedDescription);
        form.setValue('basePrice', parsedContent.priceUSD.toString());
        form.setValue('basePriceINR', parsedContent.priceINR.toString());
        
        // Load the saved image preview
        const savedImagePreview = localStorage.getItem('aiGeneratedImagePreview');
        if (savedImagePreview) {
          setMainImagePreview(savedImagePreview);
          console.log('Loaded saved image preview');
        }
        
        // Load the saved image data and convert it back to a File object
        const savedImageData = localStorage.getItem('aiGeneratedImageData');
        if (savedImageData) {
          fetch(savedImageData)
            .then(res => res.blob())
            .then(blob => {
              const file = new File([blob], "product-image.jpg", { type: "image/jpeg" });
              setMainImageFile(file);
              console.log('Converted saved image data to File object');
            })
            .catch(err => {
              console.error('Error converting saved image data to File:', err);
            });
        }

        // Load additional images
        const savedAdditionalImagesJson = localStorage.getItem('aiGeneratedAdditionalImages');
        if (savedAdditionalImagesJson) {
          const parsedImages = JSON.parse(savedAdditionalImagesJson);
          setAdditionalImagePreviews(parsedImages);
          console.log('Loaded saved additional images');
        }

        // Set the in-memory flag to prevent duplicate loading in this session
        (window as any)[sessionFlagId] = true;
        
        // Set a flag in localStorage to help with persistence
        // This is more for page refreshes than component remounts
        localStorage.setItem('aiContentLoadedAt', new Date().toISOString());

        // Only show toast if this is the first load
        toast({
          title: "AI Content Loaded",
          description: "AI-generated content has been loaded into the form.",
        });
        
        console.log('AI content successfully loaded');
      } catch (error) {
        console.error('Error parsing saved content from localStorage:', error);
      }
    } else {
      console.log('No saved AI content found in localStorage');
    }
    
    // Cleanup function is much simpler - we don't want to remove any flags
    // that would affect persistence across component mounts
    return () => {
      // Nothing to clean up - we want the flag to persist
    };
  }, [form, toast]);
  
  // Second effect to load input values (except product type which requires productTypes to be loaded)
  // This runs only once to prevent repeated loading of the same values
  useEffect(() => {
    const savedInputsJson = localStorage.getItem('aiGeneratorInputs');
    const inputsLoadedFlag = localStorage.getItem('aiInputsLoadedFlag');
    
    // Skip if already loaded
    if (inputsLoadedFlag === 'true') {
      return;
    }
    
    // Also load any additionalData from the content
    const savedContentJson = localStorage.getItem('aiGeneratedContent');
    let additionalData: any = {};
    
    if (savedContentJson) {
      try {
        const parsedContent = JSON.parse(savedContentJson) as AIGeneratedContent;
        additionalData = parsedContent.additionalData || {};
      } catch (error) {
        console.error('Error parsing saved content from localStorage:', error);
      }
    }
    
    // Load saved input values
    if (savedInputsJson) {
      try {
        const parsedInputs = JSON.parse(savedInputsJson);
        
        // Set input values if they exist (except product type which is handled in a separate effect)
        if (parsedInputs.metalType) {
          form.setValue('metalType', parsedInputs.metalType);
          setMetalType(parsedInputs.metalType);
          console.log("Setting metal type from localStorage:", parsedInputs.metalType);
        } else if (additionalData.metalType) {
          form.setValue('metalType', additionalData.metalType);
          setMetalType(additionalData.metalType);
          console.log("Setting metal type from additionalData:", additionalData.metalType);
        }
        
        if (parsedInputs.metalWeight) {
          form.setValue('metalWeight', parsedInputs.metalWeight.toString());
          setMetalWeight(parsedInputs.metalWeight.toString());
          console.log("Setting metal weight from localStorage:", parsedInputs.metalWeight);
        } else if (additionalData.metalWeight) {
          form.setValue('metalWeight', additionalData.metalWeight.toString());
          setMetalWeight(additionalData.metalWeight.toString());
          console.log("Setting metal weight from additionalData:", additionalData.metalWeight);
        }
        
        if (parsedInputs.mainStoneType) {
          setMainStoneType(parsedInputs.mainStoneType);
          console.log("Setting main stone type from localStorage:", parsedInputs.mainStoneType);
        } else if (additionalData.mainStoneType) {
          setMainStoneType(additionalData.mainStoneType);
          console.log("Setting main stone type from additionalData:", additionalData.mainStoneType);
        }
        
        if (parsedInputs.mainStoneWeight) {
          setMainStoneWeight(parsedInputs.mainStoneWeight.toString());
          console.log("Setting main stone weight from localStorage:", parsedInputs.mainStoneWeight);
        } else if (additionalData.mainStoneWeight) {
          setMainStoneWeight(additionalData.mainStoneWeight.toString());
          console.log("Setting main stone weight from additionalData:", additionalData.mainStoneWeight);
        }
        
        // Mark that inputs have been loaded to prevent duplicate loading
        localStorage.setItem('aiInputsLoadedFlag', 'true');
      } catch (error) {
        console.error('Error parsing saved inputs from localStorage:', error);
      }
    }
    
    // Cleanup to ensure we don't leave flags in localStorage if component unmounts
    return () => {
      localStorage.removeItem('aiInputsLoadedFlag');
    };
  }, [form]);
  
  // Third effect to handle secondary and other stone types
  useEffect(() => {
    const savedInputsJson = localStorage.getItem('aiGeneratorInputs');
    const inputsLoadedFlag = localStorage.getItem('secondaryStonesLoadedFlag');
    
    // Skip if already loaded
    if (inputsLoadedFlag === 'true') {
      return;
    }
    
    // Load saved input values
    if (savedInputsJson) {
      try {
        const parsedInputs = JSON.parse(savedInputsJson);
        const savedContentJson = localStorage.getItem('aiGeneratedContent');
        let additionalData: any = {};
        
        if (savedContentJson) {
          try {
            const parsedContent = JSON.parse(savedContentJson) as AIGeneratedContent;
            additionalData = parsedContent.additionalData || {};
          } catch (error) {
            console.error('Error parsing saved content from localStorage:', error);
          }
        }
        
        // We no longer support the array format for secondary stones
        // Everything uses the single stone type approach
        if (parsedInputs.secondaryStoneType) {
          setSecondaryStoneType(parsedInputs.secondaryStoneType);
          console.log("Setting secondary stone type from localStorage:", parsedInputs.secondaryStoneType);
        } else if (additionalData.secondaryStoneType) {
          setSecondaryStoneType(additionalData.secondaryStoneType);
          console.log("Setting secondary stone type from additionalData:", additionalData.secondaryStoneType);
        }
        
        if (parsedInputs.secondaryStoneWeight) {
          setSecondaryStoneWeight(parsedInputs.secondaryStoneWeight.toString());
          console.log("Setting secondary stone weight from localStorage:", parsedInputs.secondaryStoneWeight);
        } else if (additionalData.secondaryStoneWeight) {
          setSecondaryStoneWeight(additionalData.secondaryStoneWeight.toString());
          console.log("Setting secondary stone weight from additionalData:", additionalData.secondaryStoneWeight);
        }
        
        // Other stone type (newer format)
        if (parsedInputs.otherStoneType) {
          setOtherStoneType(parsedInputs.otherStoneType);
          console.log("Setting other stone type from localStorage:", parsedInputs.otherStoneType);
        } else if (additionalData.otherStoneType) {
          setOtherStoneType(additionalData.otherStoneType);
          console.log("Setting other stone type from additionalData:", additionalData.otherStoneType);
        }
        
        if (parsedInputs.otherStoneWeight) {
          setOtherStoneWeight(parsedInputs.otherStoneWeight.toString());
          console.log("Setting other stone weight from localStorage:", parsedInputs.otherStoneWeight);
        } else if (additionalData.otherStoneWeight) {
          setOtherStoneWeight(additionalData.otherStoneWeight.toString());
          console.log("Setting other stone weight from additionalData:", additionalData.otherStoneWeight);
        }
        
        // Mark that secondary stones have been loaded to prevent duplicate loading
        localStorage.setItem('secondaryStonesLoadedFlag', 'true');
      } catch (error) {
        console.error('Error parsing saved inputs for secondary stones:', error);
      }
    }
    
    // Cleanup to ensure we don't leave flags in localStorage if component unmounts
    return () => {
      localStorage.removeItem('secondaryStonesLoadedFlag');
    };
  }, []);
  
  // Third effect to handle secondary stone type (depends on stoneTypes being loaded)
  useEffect(() => {
    if (!stoneTypes || stoneTypes.length === 0) return;
    
    const savedInputsJson = localStorage.getItem('aiGeneratorInputs');
    if (!savedInputsJson) return;
    
    try {
      const parsedInputs = JSON.parse(savedInputsJson);
      
      // New format - single secondary stone type
      if (parsedInputs.secondaryStoneType) {
        setSecondaryStoneType(parsedInputs.secondaryStoneType);
        
        const matchedStone = stoneTypes.find(stone => 
          stone.name.toLowerCase() === parsedInputs.secondaryStoneType.toLowerCase()
        );
        
        if (matchedStone) {
          setSelectedStoneTypes([{ id: matchedStone.id, name: matchedStone.name }]);
        }
      }
      
      if (parsedInputs.secondaryStoneWeight) {
        setSecondaryStoneWeight(parsedInputs.secondaryStoneWeight.toString());
      }
    } catch (error) {
      console.error('Error parsing saved inputs for stone types:', error);
    }
  }, [stoneTypes]);
  
  // Fourth effect specific for productTypeId (depends on productTypes being loaded)
  useEffect(() => {
    if (!productTypes || productTypes.length === 0) return;
    
    const savedInputsJson = localStorage.getItem('aiGeneratorInputs');
    if (!savedInputsJson) return;
    
    try {
      const parsedInputs = JSON.parse(savedInputsJson);
      
      if (parsedInputs.productType) {
        console.log("Looking for product type match for:", parsedInputs.productType);
        console.log("Available product types:", productTypes.map(t => t.name));
        
        const foundType = productTypes.find(type => 
          type.name.toLowerCase() === parsedInputs.productType.toLowerCase()
        );
        
        if (foundType) {
          console.log("Found matching product type:", foundType.name, "with ID:", foundType.id);
          form.setValue('productTypeId', foundType.id.toString());
        } else {
          console.log("No matching product type found for:", parsedInputs.productType);
        }
      }
    } catch (error) {
      console.error('Error parsing saved inputs for product type:', error);
    }
  }, [productTypes, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      // Show loading toast
      toast({
        title: "Saving Product",
        description: "Please wait while your product is being saved...",
      });
      
      console.log("Form submission started", data);
      
      // Convert images to base64 for API submission
      const formData = new FormData();
      
      // Map form fields to what the server expects
      // The server expects 'name' but our form uses 'title'
      formData.append('name', data.title.toString());
      formData.append('description', data.description.toString());
      formData.append('basePrice', data.basePrice.toString());
      formData.append('basePriceINR', data.basePriceINR.toString());
      // Format details as a JSON structure with detailedDescription and additionalData
      const detailsObject = {
        detailedDescription: data.detailedDescription,
        additionalData: {
          tagline: data.tagline || '',
          basePriceINR: parseInt(data.basePriceINR) || 0,
          metalType: data.metalType || '',
          metalWeight: parseFloat(data.metalWeight) || 0,
          stoneTypes: selectedStoneTypes.map(stone => stone.name),
          mainStoneType: mainStoneType || '',
          mainStoneWeight: parseFloat(mainStoneWeight) || 0,
          secondaryStoneType: secondaryStoneType === 'none_selected' ? '' : secondaryStoneType,
          secondaryStoneWeight: parseFloat(secondaryStoneWeight) || 0,
          otherStoneType: otherStoneType === 'none_selected' ? '' : otherStoneType,
          otherStoneWeight: parseFloat(otherStoneWeight) || 0,
          productTypeId: data.productTypeId || '',
          userDescription: data.userDescription || '',
          // Save all AI generator inputs explicitly
          aiInputs: {
            productType: productType || '',  // Add productType to aiInputs
            metalType: data.metalType || '',
            metalWeight: parseFloat(data.metalWeight) || 0,
            mainStoneType: mainStoneType || '',
            mainStoneWeight: parseFloat(mainStoneWeight) || 0,
            secondaryStoneType: secondaryStoneType === 'none_selected' ? '' : secondaryStoneType,
            secondaryStoneWeight: parseFloat(secondaryStoneWeight) || 0,
            otherStoneType: otherStoneType === 'none_selected' ? '' : otherStoneType,
            otherStoneWeight: parseFloat(otherStoneWeight) || 0,
            userDescription: data.userDescription || '',
          },
          dimensions: data.dimensions || ''
        }
      };
      formData.append('details', JSON.stringify(detailsObject));
      formData.append('productTypeId', data.productTypeId.toString());
      formData.append('isNew', data.isNew.toString());
      formData.append('isBestseller', data.isBestseller.toString());
      formData.append('isFeatured', data.isFeatured.toString());
      formData.append('metalType', data.metalType.toString());
      formData.append('metalWeight', data.metalWeight.toString());
      
      // These fields may not be required but add them anyway
      if (data.tagline) formData.append('tagline', data.tagline.toString());
      if (data.category) formData.append('category', data.category.toString());
      if (data.dimensions) formData.append('dimensions', data.dimensions.toString());
      if (data.userDescription) formData.append('userDescription', data.userDescription.toString());
      
      // Add stone types as a JSON string - extract just the IDs since the server expects an array of integers
      const stoneIds = selectedStoneTypes.map(stone => stone.id);
      formData.append('selectedStones', JSON.stringify(stoneIds));
      
      // Add main image if available
      if (mainImageFile) {
        formData.append('mainImage', mainImageFile);
      }
      
      // Add additional images if available
      if (additionalImageFiles.length > 0) {
        additionalImageFiles.forEach((file, index) => {
          if (index < 3) { // Only add up to 3 additional images
            formData.append(`additionalImage${index + 1}`, file);
          }
        });
      }
      
      // Debug form data
      console.log('Form data entries:');
      // Use Array.from to convert FormData entries to array to avoid TypeScript iterator issues
      Array.from(formData.entries()).forEach(pair => {
        if (pair[0] !== 'mainImage' && pair[0] !== 'additionalImage1' && pair[0] !== 'additionalImage2' && pair[0] !== 'additionalImage3') {
          console.log(pair[0] + ': ' + pair[1]);
        } else {
          console.log(pair[0] + ': [File object]');
        }
      });
      
      // Send the API request
      console.log('Sending API request to /api/admin/products');
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        body: formData,
        credentials: 'include', // Add credentials to include cookies
        // Don't set Content-Type, browser will set it with the correct boundary for FormData
      });
      
      console.log('API response status:', response.status);
      
      if (!response.ok) {
        // Try to get detailed error message
        const errorText = await response.text();
        console.error('Product save error:', {
          status: response.status,
          statusText: response.statusText,
          errorDetails: errorText
        });
        throw new Error(`Failed to save product: ${response.status} ${errorText || response.statusText}`);
      }
      
      const result = await response.json();
      
      // Show success toast
      toast({
        title: "Product Saved",
        description: "Your product has been saved successfully.",
      });
      
      // Clear the saved AI content and images from localStorage
      localStorage.removeItem('aiGeneratedContent');
      localStorage.removeItem('aiGeneratedImagePreview');
      localStorage.removeItem('aiGeneratedImageData');
      localStorage.removeItem('aiGeneratorInputs');
      localStorage.removeItem('aiGeneratedAdditionalImages');
      
      // Redirect to products list
      setLocation('/admin/products');
    } catch (error) {
      console.error('Error saving product:', error);
      
      // Show error toast
      toast({
        title: "Error Saving Product",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  // Handle AI generated content
  const handleContentGenerated = async (content: AIGeneratedContent) => {
    console.log("Content generated handler called with content:", content.title);
    
    // Apply the content to the form fields
    form.setValue("title", content.title);
    form.setValue("tagline", content.tagline);
    form.setValue("description", content.shortDescription);
    form.setValue("detailedDescription", content.detailedDescription);
    form.setValue("basePrice", content.priceUSD.toString());
    form.setValue("basePriceINR", content.priceINR.toString());
    
    // Get existing form values
    const formMetalType = form.getValues("metalType");
    const formMetalWeight = form.getValues("metalWeight");
    
    // Ensure we use the form values if they exist, otherwise use the state or content
    if (metalType) {
      form.setValue("metalType", metalType);
    } else if (content.additionalData?.metalType) {
      form.setValue("metalType", content.additionalData.metalType);
      setMetalType(content.additionalData.metalType);
    }
    
    if (metalWeight) {
      form.setValue("metalWeight", metalWeight);
    } else if (content.additionalData?.metalWeight) {
      const weightStr = content.additionalData.metalWeight.toString();
      form.setValue("metalWeight", weightStr);
      setMetalWeight(weightStr);
    }
    
    // Explicitly set stone details to form state variables
    if (content.additionalData?.mainStoneType) {
      setMainStoneType(content.additionalData.mainStoneType);
    }
    
    if (content.additionalData?.mainStoneWeight) {
      setMainStoneWeight(content.additionalData.mainStoneWeight.toString());
    }
    
    if (content.additionalData?.secondaryStoneType) {
      setSecondaryStoneType(content.additionalData.secondaryStoneType);
    }
    
    if (content.additionalData?.secondaryStoneWeight) {
      setSecondaryStoneWeight(content.additionalData.secondaryStoneWeight.toString());
    }
    
    if (content.additionalData?.otherStoneType) {
      setOtherStoneType(content.additionalData.otherStoneType);
    }
    
    if (content.additionalData?.otherStoneWeight) {
      setOtherStoneWeight(content.additionalData.otherStoneWeight.toString());
    }
    
    // Handle the imageInsights field if available
    if (content.imageInsights) {
      // Store image insights in the database - add a note to the description
      const enhancedDescription = form.getValues("detailedDescription") + 
        "\n\n-- Image Analysis Notes --\n" + content.imageInsights;
      form.setValue("detailedDescription", enhancedDescription);
    }
    
    // Save enhanced content to localStorage with timestamp
    try {
      // Create a timestamp to make saving more reliable
      const timestamp = new Date().toISOString();
      
      // Create enhanced additionalData object with merged values
      const enhancedAdditionalData = {
        ...content.additionalData,
        productType: productType || content.additionalData?.productType,
        metalType: metalType || form.getValues("metalType") || content.additionalData?.metalType,
        metalWeight: metalWeight ? parseFloat(metalWeight) : (form.getValues("metalWeight") ? parseFloat(form.getValues("metalWeight")) : content.additionalData?.metalWeight),
        mainStoneType: mainStoneType || content.additionalData?.mainStoneType,
        mainStoneWeight: mainStoneWeight ? parseFloat(mainStoneWeight) : content.additionalData?.mainStoneWeight,
        secondaryStoneType: secondaryStoneType || content.additionalData?.secondaryStoneType,
        secondaryStoneWeight: secondaryStoneWeight ? parseFloat(secondaryStoneWeight) : content.additionalData?.secondaryStoneWeight,
        otherStoneType: otherStoneType || content.additionalData?.otherStoneType,
        otherStoneWeight: otherStoneWeight ? parseFloat(otherStoneWeight) : content.additionalData?.otherStoneWeight
      };
      
      // Create enhanced content object with timestamp and merged data
      const enhancedContent = {
        ...content,
        additionalData: enhancedAdditionalData,
        generatedAt: timestamp
      };
      
      // Save enhanced content to localStorage
      localStorage.setItem('aiGeneratedContent', JSON.stringify(enhancedContent));
      console.log('Saved enhanced AI content to localStorage with timestamp:', timestamp);
      
      // Clear any existing flags to prevent duplicate messages when reloading
      localStorage.removeItem('aiContentLoadedFlag');
      
      // Save input values to localStorage as a separate object for the AI generator
      const aiGeneratorInputs = {
        productType: productType || content.additionalData?.productType,
        metalType: metalType || form.getValues("metalType") || content.additionalData?.metalType,
        metalWeight: metalWeight || form.getValues("metalWeight") || (content.additionalData?.metalWeight?.toString()),
        mainStoneType: mainStoneType || content.additionalData?.mainStoneType,
        mainStoneWeight: mainStoneWeight || (content.additionalData?.mainStoneWeight?.toString()),
        secondaryStoneType: secondaryStoneType || content.additionalData?.secondaryStoneType,
        secondaryStoneWeight: secondaryStoneWeight || (content.additionalData?.secondaryStoneWeight?.toString()),
        otherStoneType: otherStoneType || content.additionalData?.otherStoneType,
        otherStoneWeight: otherStoneWeight || (content.additionalData?.otherStoneWeight?.toString()),
        userDescription: form.getValues("userDescription")
      };
      
      // Save the consolidated input state and reset flags
      localStorage.setItem('aiGeneratorInputs', JSON.stringify(aiGeneratorInputs));
      localStorage.removeItem('aiInputsLoadedFlag');
      console.log('Saved AI generator inputs to localStorage');
    } catch (error) {
      console.error('Error saving AI content and inputs:', error);
    }
    
    // Save image preview to localStorage if available
    if (mainImagePreview) {
      localStorage.setItem('aiGeneratedImagePreview', mainImagePreview);
    } else if (content.imageUrl) {
      // If no preview but we have an image URL from the AI, use that
      localStorage.setItem('aiGeneratedImagePreview', content.imageUrl);
      setMainImagePreview(content.imageUrl);
    }
    
    // Save image data as a dataURL if available
    if (mainImageFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          localStorage.setItem('aiGeneratedImageData', e.target.result as string);
        }
      };
      reader.readAsDataURL(mainImageFile);
    }
    
    // Save additional images if available
    if (additionalImagePreviews.length > 0) {
      localStorage.setItem('aiGeneratedAdditionalImages', JSON.stringify(additionalImagePreviews));
    }
    
    toast({
      title: "Content Applied",
      description: "The AI generated content has been applied to the form",
    });
  };
  
  // Main image dropzone
  const onMainImageDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setMainImageFile(file);
      
      // Create preview for the image
      const objectUrl = URL.createObjectURL(file);
      setMainImagePreview(objectUrl);
      
      toast({
        title: "Main Image Uploaded",
        description: "The main product image has been uploaded successfully and will be used for AI content generation.",
      });
    }
  }, [toast]);
  
  const { getRootProps: getMainImageRootProps, getInputProps: getMainImageInputProps } = useDropzone({
    onDrop: onMainImageDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
    },
    maxFiles: 1,
  });
  
  // Additional images dropzone
  const onAdditionalImagesDrop = useCallback((acceptedFiles: File[]) => {
    setAdditionalImageFiles(prev => [...prev, ...acceptedFiles]);
    
    // Create previews for the images
    const objectUrls = acceptedFiles.map(file => URL.createObjectURL(file));
    setAdditionalImagePreviews(prev => [...prev, ...objectUrls]);
    
    toast({
      title: "Additional Images Uploaded",
      description: `${acceptedFiles.length} additional images have been uploaded successfully.`,
    });
  }, [toast]);
  
  const { getRootProps: getAdditionalImagesRootProps, getInputProps: getAdditionalImagesInputProps } = useDropzone({
    onDrop: onAdditionalImagesDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
    },
  });
  
  // Remove additional image
  const removeAdditionalImage = (index: number) => {
    setAdditionalImageFiles(prev => prev.filter((_, i) => i !== index));
    
    // Revoke object URL and remove preview
    if (additionalImagePreviews[index]) {
      URL.revokeObjectURL(additionalImagePreviews[index]);
    }
    setAdditionalImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <AdminLayout title="Add Product">
      <div className="container p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => setLocation('/admin/products')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
            <h1 className="text-2xl font-semibold">Add New Product</h1>
          </div>
          
          <Button type="submit" onClick={form.handleSubmit(onSubmit)}>
            <Save className="h-4 w-4 mr-2" />
            Save Product
          </Button>
        </div>
        
        <Form {...form}>
          <div className="w-full space-y-8">
            {/* Section Heading for Basic Details */}
            <div className="border-b pb-2">
              <h2 className="text-xl font-semibold">Basic Details</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Diamond Solitaire Ring" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="tagline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tagline</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Timeless elegance for every occasion" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="productTypeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Type</FormLabel>
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
                              <SelectItem value="no-types">No product types found</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select the product type
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Product Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="isNew"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>New Arrival</FormLabel>
                          <FormDescription>
                            Mark this product as a new arrival
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isBestseller"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Bestseller</FormLabel>
                          <FormDescription>
                            Mark this product as a bestseller
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isFeatured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Featured Product</FormLabel>
                          <FormDescription>
                            Show this product in featured sections
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
            
            {/* Pricing Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pricing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="basePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (USD)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="e.g. 199.99" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="basePriceINR"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (INR)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g. 14999" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
            
            {/* Unified AI Generator */}
            <UnifiedAIGenerator
              form={form}
              productTypes={productTypes}
              stoneTypes={stoneTypes}
              isLoadingProductTypes={isLoadingProductTypes}
              isLoadingStoneTypes={isLoadingStoneTypes}
              mainImageFile={mainImageFile}
              setMainImageFile={setMainImageFile}
              mainImagePreview={mainImagePreview}
              setMainImagePreview={setMainImagePreview}
              additionalImageFiles={additionalImageFiles}
              setAdditionalImageFiles={setAdditionalImageFiles}
              additionalImagePreviews={additionalImagePreviews}
              setAdditionalImagePreviews={setAdditionalImagePreviews}
              mainStoneType={mainStoneType}
              setMainStoneType={setMainStoneType}
              mainStoneWeight={mainStoneWeight}
              setMainStoneWeight={setMainStoneWeight}
              selectedStoneTypes={selectedStoneTypes}
              setSelectedStoneTypes={setSelectedStoneTypes}
              secondaryStoneType={secondaryStoneType}
              setSecondaryStoneType={setSecondaryStoneType}
              secondaryStoneWeight={secondaryStoneWeight}
              setSecondaryStoneWeight={setSecondaryStoneWeight}
              handleContentGenerated={handleContentGenerated}
              getMainImageRootProps={getMainImageRootProps}
              getMainImageInputProps={getMainImageInputProps}
              getAdditionalImagesRootProps={getAdditionalImagesRootProps}
              getAdditionalImagesInputProps={getAdditionalImagesInputProps}
              removeAdditionalImage={removeAdditionalImage}
              hideInputSection={true} /* Hide the input section since we're already using those fields at the top level */
            />
            
            {/* Section Heading for Product Images */}
            <div className="border-b pb-2 pt-6">
              <h2 className="text-xl font-semibold">Product Images</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {mainImagePreview && (
                <Card>
                  <CardHeader>
                    <CardTitle>Main Image Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-square w-full relative overflow-hidden rounded-lg border">
                      <img 
                        src={mainImagePreview}
                        alt="Main product"
                        className="object-cover w-full h-full"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* Additional Images Grid */}
            {additionalImagePreviews.length > 0 && (
              <div>
                <div className="border-b pb-2 pt-2">
                  <h3 className="text-lg font-medium">Additional Images</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  {additionalImagePreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-square">
                      <img
                        src={preview}
                        alt={`Product image ${index + 1}`}
                        className="object-cover w-full h-full rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => removeAdditionalImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Price Comparison Section */}
            <div className="mt-8 border-t pt-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PiggyBank className="mr-2 h-5 w-5 text-amber-600" />
                    Price Comparison
                  </CardTitle>
                  <CardDescription>
                    Compare AI-generated prices with real-time calculated prices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="border rounded-md p-3 bg-background">
                      <h3 className="text-sm font-medium mb-2 text-primary">AI-Generated Price</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">USD:</span>
                          <span className="font-medium">${form.watch("basePrice")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">INR:</span>
                          <span className="font-medium">₹{form.watch("basePriceINR")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="border rounded-md p-3 bg-background">
                      <h3 className="text-sm font-medium mb-2 text-amber-600">Calculated Price</h3>
                      <PriceCalculatorDisplay 
                        metalType={form.watch("metalType")}
                        metalWeight={form.watch("metalWeight")}
                        mainStoneType={mainStoneType}
                        mainStoneWeight={mainStoneWeight}
                        secondaryStoneType={secondaryStoneType}
                        secondaryStoneWeight={secondaryStoneWeight}
                        otherStoneType={otherStoneType}
                        otherStoneWeight={otherStoneWeight}
                        compact={true}
                      />
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    <p>The calculated price is based on current gold prices and selected materials.</p>
                    <p className="mt-1">You can manually adjust the prices in the fields above if needed.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Submit Button */}
            <div className="mt-8 flex justify-end">
              <Button type="submit" onClick={form.handleSubmit(onSubmit)} className="w-full sm:w-auto">
                <Save className="mr-2 h-4 w-4" /> Save Product
              </Button>
            </div>
          </div>
        </Form>
      </div>
    </AdminLayout>
  );
}
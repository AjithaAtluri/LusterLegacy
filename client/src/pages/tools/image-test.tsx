import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { fileToBase64 } from "@/lib/ai-content-generator";
import Helmet from 'react-helmet';

export default function ImageTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    productType: "Necklace",
    metalType: "14K Gold",
    metalWeight: 5,
    primaryGems: "Lavender Quartz, Lab-Grown Polki Diamonds",
    userDescription: "A two-row luxury necklace with lavender quartz and lab-grown polki diamonds."
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError(null);
      if (!e.target.files || e.target.files.length === 0) {
        return;
      }

      const file = e.target.files[0];
      console.log(`Selected file: ${file.name}, size: ${(file.size / 1024).toFixed(2)}KB, type: ${file.type}`);

      // Preview the image
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      // Convert to base64
      try {
        console.log("Converting file to base64...");
        const base64Data = await fileToBase64(file);
        console.log(`Base64 conversion successful. Data length: ${base64Data.length}`);
        setImageData(base64Data);
      } catch (conversionError) {
        console.error("Error converting image to base64:", conversionError);
        setError(`Error preparing image: ${conversionError instanceof Error ? conversionError.message : 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Error handling image upload:", err);
      setError(`Error uploading image: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      if (!imageData) {
        throw new Error("Please upload an image first");
      }

      console.log("Preparing to send image analysis request...");
      console.log("Image data length:", imageData.length);
      
      // Split primary gems into an array
      const gemNames = formData.primaryGems.split(',').map(gem => gem.trim());
      const primaryGems = gemNames.map(name => ({ name }));

      // Prepare the request
      const requestData = {
        imageData,
        productType: formData.productType,
        metalType: formData.metalType,
        metalWeight: formData.metalWeight ? Number(formData.metalWeight) : 5,
        primaryGems,
        userDescription: formData.userDescription
      };

      console.log("Sending direct jewelry analysis request:", {
        productType: requestData.productType,
        metalType: requestData.metalType,
        imageDataLength: requestData.imageData.length,
        gemCount: requestData.primaryGems.length
      });

      // Call the API
      const response = await fetch("/api/direct-jewelry-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.message || `API error (${response.status})`);
        } catch (e) {
          throw new Error(`API error (${response.status}): ${errorText || response.statusText}`);
        }
      }

      // Parse the response
      const responseData = await response.json();
      console.log("Received response:", responseData);
      setResult(responseData);
    } catch (err) {
      console.error("Error analyzing image:", err);
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setImagePreview(null);
    setImageData(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="container max-w-5xl py-10">
      <Helmet>
        <title>Image Analysis Test | Luster Legacy</title>
      </Helmet>
      
      <h1 className="text-3xl font-bold mb-6">Jewelry Image Analysis Test</h1>
      <p className="text-gray-600 mb-6">
        This tool tests the direct AI image analysis for jewelry. Upload an image and provide basic details to generate a product description.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Input Information</CardTitle>
            <CardDescription>Upload a jewelry image and provide details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image">Jewelry Image</Label>
                <Input 
                  id="image" 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                />
                {imagePreview && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-1">Preview:</p>
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="max-h-40 rounded border border-gray-200" 
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="productType">Product Type</Label>
                <Input 
                  id="productType" 
                  name="productType" 
                  value={formData.productType} 
                  onChange={handleChange} 
                  placeholder="e.g., Ring, Necklace, Earrings"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="metalType">Metal Type</Label>
                <Input 
                  id="metalType" 
                  name="metalType" 
                  value={formData.metalType} 
                  onChange={handleChange} 
                  placeholder="e.g., 18K Gold, Sterling Silver"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="metalWeight">Metal Weight (grams)</Label>
                <Input 
                  id="metalWeight" 
                  name="metalWeight" 
                  type="number" 
                  value={formData.metalWeight} 
                  onChange={handleChange} 
                  placeholder="e.g., 5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="primaryGems">Primary Gems (comma separated)</Label>
                <Input 
                  id="primaryGems" 
                  name="primaryGems" 
                  value={formData.primaryGems} 
                  onChange={handleChange} 
                  placeholder="e.g., Diamond, Ruby, Sapphire"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="userDescription">Additional Description</Label>
                <Textarea 
                  id="userDescription" 
                  name="userDescription" 
                  value={formData.userDescription} 
                  onChange={handleChange} 
                  placeholder="Additional details about the piece..."
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <Button type="submit" disabled={loading || !imageData}>
                  {loading ? "Processing..." : "Analyze Image"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Reset
                </Button>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                  {error}
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Generated Content</CardTitle>
            <CardDescription>AI-generated jewelry description from the image</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : result ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-primary">{result.title}</h3>
                  <p className="italic text-gray-600">{result.tagline}</p>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">Short Description:</h4>
                  <p className="text-gray-600 whitespace-pre-line">{result.shortDescription}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">Detailed Description:</h4>
                  <p className="text-gray-600 whitespace-pre-line">{result.detailedDescription}</p>
                </div>
                
                {result.designHighlights && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Design Highlights:</h4>
                    <p className="text-gray-600 whitespace-pre-line">{result.designHighlights}</p>
                  </div>
                )}
                
                {result.materials && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Materials:</h4>
                    <p className="text-gray-600 whitespace-pre-line">{result.materials}</p>
                  </div>
                )}
                
                {result.imageInsights && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Image Insights:</h4>
                    <p className="text-gray-600 whitespace-pre-line">{result.imageInsights}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <h4 className="font-medium text-gray-700">Price (USD):</h4>
                    <p className="text-xl font-bold text-primary">${result.priceUSD.toLocaleString()}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700">Price (INR):</h4>
                    <p className="text-xl font-bold text-primary">₹{result.priceINR.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                No content generated yet. Upload an image and submit the form.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
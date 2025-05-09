import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/admin-layout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sparkles, Loader2, Save, Edit, Plus, Image, MessageSquare, ArrowRight, Database } from "lucide-react";
import type { AIGeneratedContent } from "@/types/store-types";
import ImprovedAIContentGenerator from "@/components/admin/improved-ai-content-generator";

// History item interface for saved AI content
interface AIHistoryItem {
  id: string;
  timestamp: number;
  content: AIGeneratedContent;
  inputs: any;
}

export default function AIAdminDashboard() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<AIGeneratedContent | null>(null);
  const [history, setHistory] = useState<AIHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState("generator");
  
  // Load history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('aiContentHistory');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        setHistory(parsedHistory);
      } catch (error) {
        console.error('Error parsing AI content history:', error);
      }
    }
  }, []);
  
  // Handle saving generated content to history
  const handleSaveToHistory = () => {
    if (!generatedContent) return;
    
    // Create unique ID based on timestamp
    const id = Date.now().toString();
    const newHistoryItem: AIHistoryItem = {
      id,
      timestamp: Date.now(),
      content: generatedContent,
      inputs: generatedContent.additionalData?.aiInputs || {}
    };
    
    // Add to history
    const updatedHistory = [newHistoryItem, ...history];
    setHistory(updatedHistory);
    
    // Save to localStorage
    try {
      localStorage.setItem('aiContentHistory', JSON.stringify(updatedHistory));
      toast({
        title: "Content saved",
        description: "The generated content has been saved to history.",
        duration: 3000
      });
    } catch (error) {
      console.error('Error saving AI content history:', error);
      toast({
        title: "Error saving",
        description: "Could not save content to history.",
        variant: "destructive"
      });
    }
  };
  
  // Handle loading content from history
  const handleLoadFromHistory = (historyItem: AIHistoryItem) => {
    setGeneratedContent(historyItem.content);
    // Switch to generator tab to show the loaded content
    setActiveTab("generator");
    
    toast({
      title: "Content loaded",
      description: "The selected content has been loaded from history.",
      duration: 3000
    });
  };
  
  // Handle creating a new product from generated content
  const handleCreateProduct = () => {
    if (!generatedContent) return;
    
    // Store the generated content in localStorage for the product creation page
    localStorage.setItem('newProductFromAI', JSON.stringify(generatedContent));
    
    // Navigate to the product creation page
    navigate('/admin/products/new');
    
    toast({
      title: "Creating new product",
      description: "Navigating to product creation with AI generated content.",
      duration: 3000
    });
  };
  
  // Handle content generation
  const handleGeneratedContent = (content: AIGeneratedContent) => {
    setGeneratedContent(content);
    // Auto-switch to the generator tab
    setActiveTab("generator");
  };
  
  // Format timestamp for display
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  // Render history item title
  const renderHistoryItemTitle = (historyItem: AIHistoryItem) => {
    if (historyItem.content.title) return historyItem.content.title;
    
    const inputs = historyItem.inputs;
    if (inputs?.productType) {
      return `${inputs.productType} with ${inputs.metalType || 'metal'}`;
    }
    
    return `Generated content ${formatTimestamp(historyItem.timestamp)}`;
  };
  
  return (
    <AdminLayout title="AI Admin Dashboard">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            <TabsTrigger value="generator">AI Content Generator</TabsTrigger>
            <TabsTrigger value="history">History ({history.length})</TabsTrigger>
          </TabsList>
          
          {generatedContent && (
            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                onClick={handleSaveToHistory}
                disabled={!generatedContent}
              >
                <Save className="mr-2 h-4 w-4" />
                Save to History
              </Button>
              <Button 
                onClick={handleCreateProduct}
                disabled={!generatedContent}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Product
              </Button>
            </div>
          )}
        </div>
        
        <TabsContent value="generator" className="mt-0 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Content Generator
              </CardTitle>
              <CardDescription>
                Generate product descriptions and technical specifications using AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* AI Generator Component */}
                <div className="space-y-4">
                  <ImprovedAIContentGenerator onGeneratedContent={handleGeneratedContent} />
                </div>
                
                {/* Results Display */}
                <div className="space-y-4">
                  {generatedContent ? (
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4 space-y-2">
                        <h3 className="font-semibold text-lg">{generatedContent.title}</h3>
                        <p className="text-sm text-muted-foreground italic">{generatedContent.tagline}</p>
                        <div className="border-t pt-2 mt-2">
                          <p className="text-sm font-medium">Short Description:</p>
                          <p className="text-sm">{generatedContent.shortDescription}</p>
                        </div>
                        <div className="border-t pt-2 mt-2">
                          <p className="text-sm font-medium">Detailed Description:</p>
                          <p className="text-sm whitespace-pre-line">{generatedContent.detailedDescription}</p>
                        </div>
                        <div className="border-t pt-2 mt-2 flex gap-6">
                          <div>
                            <p className="text-sm font-medium">Price (USD):</p>
                            <p className="text-sm">${generatedContent.priceUSD?.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Price (INR):</p>
                            <p className="text-sm">₹{generatedContent.priceINR?.toLocaleString()}</p>
                          </div>
                        </div>
                        {generatedContent.imageInsights && (
                          <div className="border-t pt-2 mt-2">
                            <p className="text-sm font-medium">Image Analysis:</p>
                            <p className="text-sm whitespace-pre-line">{generatedContent.imageInsights}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full border rounded-lg p-12 text-center">
                      <MessageSquare className="h-12 w-12 text-muted-foreground opacity-20" />
                      <h3 className="mt-4 text-lg font-medium">No content generated yet</h3>
                      <p className="mt-2 text-sm text-muted-foreground max-w-md">
                        Fill in the form and click "Generate Content" to create AI-powered product descriptions and specifications.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Content History
              </CardTitle>
              <CardDescription>
                Previously generated content from the AI system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {history.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {history.map((item) => (
                    <Card key={item.id} className="overflow-hidden">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base">{renderHistoryItemTitle(item)}</CardTitle>
                        <CardDescription className="text-xs">
                          {formatTimestamp(item.timestamp)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-2">
                        <p className="text-sm line-clamp-3">{item.content.shortDescription}</p>
                        
                        <div className="mt-2 flex flex-wrap gap-2">
                          {item.inputs?.productType && (
                            <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full">
                              {item.inputs.productType}
                            </span>
                          )}
                          {item.inputs?.metalType && (
                            <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full">
                              {item.inputs.metalType}
                            </span>
                          )}
                          {item.inputs?.mainStoneType && (
                            <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full">
                              {item.inputs.mainStoneType}
                            </span>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="p-4 pt-2 flex justify-between">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleLoadFromHistory(item)}
                        >
                          <Edit className="mr-2 h-3 w-3" />
                          Load
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => {
                            setGeneratedContent(item.content);
                            handleCreateProduct();
                          }}
                        >
                          <Plus className="mr-2 h-3 w-3" />
                          Create Product
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Database className="h-12 w-12 text-muted-foreground opacity-20 mx-auto" />
                  <h3 className="mt-4 text-lg font-medium">No saved content</h3>
                  <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                    When you generate content with the AI system and save it, it will appear here for future reference.
                  </p>
                  <Button 
                    className="mt-4" 
                    variant="secondary" 
                    onClick={() => setActiveTab("generator")}
                  >
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Go to Generator
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
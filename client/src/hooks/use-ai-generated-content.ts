import { useState, useEffect } from 'react';
import { AIGeneratedContent } from '@/types/store-types';
import { useToast } from './use-toast';

export function useAIGeneratedContent() {
  const [content, setContent] = useState<AIGeneratedContent | null>(null);
  const [isContentLoaded, setIsContentLoaded] = useState(false);
  const [contentLoadAttempted, setContentLoadAttempted] = useState(false);
  const { toast } = useToast();

  // Load content from localStorage on component mount - only once
  useEffect(() => {
    if (contentLoadAttempted) return;
    
    try {
      const savedContentJson = localStorage.getItem('aiGeneratedContent');
      if (savedContentJson) {
        const parsedContent = JSON.parse(savedContentJson) as AIGeneratedContent;
        setContent(parsedContent);
        setIsContentLoaded(true);
        
        // Only show toast notification on initial load, not on subsequent rerenders
        toast({
          title: "AI Content Loaded",
          description: "Previously generated content has been loaded.",
        });
      }
    } catch (error) {
      console.error('Error loading AI generated content:', error);
    }
    
    // Mark that we've attempted to load content (even if it failed)
    setContentLoadAttempted(true);
  }, [contentLoadAttempted, toast]);

  // Save content to localStorage
  const saveContent = (newContent: AIGeneratedContent) => {
    try {
      localStorage.setItem('aiGeneratedContent', JSON.stringify(newContent));
      setContent(newContent);
      setIsContentLoaded(true);
    } catch (error) {
      console.error('Error saving AI generated content:', error);
      toast({
        title: "Error Saving Content",
        description: "There was a problem saving the generated content.",
        variant: "destructive",
      });
    }
  };

  // Clear content from localStorage
  const clearContent = () => {
    try {
      localStorage.removeItem('aiGeneratedContent');
      setContent(null);
      setIsContentLoaded(false);
      // Reset the load attempted flag so content can be loaded again if needed
      setContentLoadAttempted(false);
      
      toast({
        title: "Content Cleared",
        description: "AI generated content has been cleared.",
      });
    } catch (error) {
      console.error('Error clearing AI generated content:', error);
    }
  };

  return {
    content,
    isContentLoaded,
    saveContent,
    clearContent
  };
}
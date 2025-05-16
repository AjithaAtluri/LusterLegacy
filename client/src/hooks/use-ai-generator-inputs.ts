import { useState, useEffect } from 'react';
import { useToast } from './use-toast';

interface AIGeneratorInputs {
  productType?: string;
  metalType?: string;
  metalWeight?: string | number;
  mainStoneType?: string;
  mainStoneWeight?: string | number;
  secondaryStoneType?: string;
  secondaryStoneWeight?: string | number;
  otherStoneType?: string;
  otherStoneWeight?: string | number;
  userDescription?: string;
}

export function useAIGeneratorInputs() {
  const [inputs, setInputs] = useState<AIGeneratorInputs>({});
  const [isInputsLoaded, setIsInputsLoaded] = useState(false);
  const [inputsLoadAttempted, setInputsLoadAttempted] = useState(false);
  const { toast } = useToast();

  // Load inputs from localStorage on component mount - only once
  useEffect(() => {
    if (inputsLoadAttempted) return;
    
    try {
      const savedInputsJson = localStorage.getItem('aiGeneratorInputs');
      if (savedInputsJson) {
        const parsedInputs = JSON.parse(savedInputsJson) as AIGeneratorInputs;
        setInputs(parsedInputs);
        setIsInputsLoaded(true);
        
        // Only log successful load, no toast notification for inputs
        console.log('AI Generator inputs loaded from localStorage');
      }
    } catch (error) {
      console.error('Error loading AI generator inputs:', error);
    }
    
    // Mark that we've attempted to load inputs (even if it failed)
    setInputsLoadAttempted(true);
  }, [inputsLoadAttempted]);

  // Save individual input field
  const saveInputField = (field: keyof AIGeneratorInputs, value: string | number | boolean) => {
    try {
      const updatedInputs = { ...inputs, [field]: value };
      localStorage.setItem('aiGeneratorInputs', JSON.stringify(updatedInputs));
      setInputs(updatedInputs);
      setIsInputsLoaded(true);
      console.log(`AI Generator input field "${field}" saved with value:`, value);
    } catch (error) {
      console.error(`Error saving AI generator input field "${field}":`, error);
    }
  };

  // Save all inputs at once
  const saveAllInputs = (newInputs: AIGeneratorInputs) => {
    try {
      localStorage.setItem('aiGeneratorInputs', JSON.stringify(newInputs));
      setInputs(newInputs);
      setIsInputsLoaded(true);
      console.log('All AI Generator inputs saved');
    } catch (error) {
      console.error('Error saving all AI generator inputs:', error);
      toast({
        title: "Error Saving Inputs",
        description: "There was a problem saving your form inputs.",
        variant: "destructive",
      });
    }
  };

  // Clear inputs from localStorage
  const clearInputs = () => {
    try {
      localStorage.removeItem('aiGeneratorInputs');
      setInputs({});
      setIsInputsLoaded(false);
      // Reset the load attempted flag so inputs can be loaded again if needed
      setInputsLoadAttempted(false);
      console.log('AI Generator inputs cleared');
    } catch (error) {
      console.error('Error clearing AI generator inputs:', error);
    }
  };

  return {
    inputs,
    isInputsLoaded,
    saveInputField,
    saveAllInputs,
    clearInputs
  };
}
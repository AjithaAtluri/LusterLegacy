import { useState } from 'react';

/**
 * A custom hook for managing selections in a multi-select component
 * 
 * @param initialItems Initial array of selected items
 * @returns An object containing the selected items and setter functions
 */
export function useMultiSelect<T>(initialItems: T[] = []) {
  const [selectedItems, setSelectedItems] = useState<T[]>(initialItems);

  const addItem = (item: T) => {
    setSelectedItems((prev) => [...prev, item]);
  };

  const removeItem = (item: T) => {
    setSelectedItems((prev) => 
      prev.filter((i) => {
        // If items are objects, check if they're the same by comparing id or value
        if (typeof item === 'object' && item !== null && 'id' in item && 'id' in i) {
          return (i as any).id !== (item as any).id;
        }
        
        if (typeof item === 'object' && item !== null && 'value' in item && 'value' in i) {
          return (i as any).value !== (item as any).value;
        }
        
        // Otherwise, just do a direct comparison
        return i !== item;
      })
    );
  };

  const toggleItem = (item: T) => {
    // Check if item exists in the array
    const exists = selectedItems.some((i) => {
      if (typeof item === 'object' && item !== null && 'id' in item && 'id' in i) {
        return (i as any).id === (item as any).id;
      }
      
      if (typeof item === 'object' && item !== null && 'value' in item && 'value' in i) {
        return (i as any).value === (item as any).value;
      }
      
      return i === item;
    });

    if (exists) {
      removeItem(item);
    } else {
      addItem(item);
    }
  };

  const clearItems = () => {
    setSelectedItems([]);
  };

  return {
    selectedItems,
    setSelectedItems,
    addItem,
    removeItem,
    toggleItem,
    clearItems,
  };
}
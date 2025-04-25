import * as React from "react";
import { X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type Option = {
  label: string;
  value: string;
  data?: any;
  disabled?: boolean;
};

interface MultiSelectProps {
  options: Option[];
  selected: any[];
  onChange: (selected: any[]) => void;
  className?: string;
  placeholder?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  className,
  placeholder = "Select options...",
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleUnselect = (item: any) => {
    onChange(selected.filter((i) => {
      if ('id' in i && 'id' in item) {
        return i.id !== item.id;
      }
      if ('value' in i && 'value' in item) {
        return i.value !== item.value;
      }
      return i !== item;
    }));
  };

  const handleSelect = (option: Option) => {
    const item = option.data || option;
    const isSelected = selected.some((i) => {
      if ('id' in i && 'id' in item) {
        return i.id === item.id;
      }
      if ('value' in i && 'value' in item) {
        return i.value === item.value;
      }
      return i === item;
    });

    if (isSelected) {
      handleUnselect(item);
    } else {
      onChange([...selected, item]);
    }
  };

  // This helps with determining if an option is selected
  const isOptionSelected = (option: Option) => {
    const item = option.data || option;
    return selected.some((i) => {
      if ('id' in i && 'id' in item) {
        return i.id === item.id;
      }
      if ('value' in i && 'value' in item) {
        return i.value === item.value;
      }
      return i === item;
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between min-h-10 h-auto py-2 px-3",
            selected.length > 0 ? "text-foreground" : "text-muted-foreground",
            className
          )}
        >
          <div className="flex flex-wrap gap-1">
            {selected.length === 0 && <span>{placeholder}</span>}
            {selected.map((item) => (
              <Badge
                key={'id' in item ? item.id : ('value' in item ? item.value : item)}
                variant="secondary"
                className="mr-1 mb-1"
              >
                {'name' in item ? item.name : ('label' in item ? item.label : item.toString())}
                <button
                  className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleUnselect(item);
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={() => handleUnselect(item)}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex">
            {selected.length > 0 && (
              <X 
                className="opacity-60 hover:opacity-100 mr-2" 
                onClick={(e) => {
                  e.stopPropagation();
                  onChange([]);
                }}
              />
            )}
            <div className="w-4"></div>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-full min-w-[var(--radix-popover-trigger-width)]">
        <Command>
          <CommandInput placeholder="Search..." className="h-9" />
          <CommandEmpty>No options found.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {options.map((option) => (
              <CommandItem
                key={option.value}
                onSelect={() => handleSelect(option)}
                disabled={option.disabled}
                className={cn(
                  "flex items-center gap-2",
                  option.disabled && "cursor-not-allowed opacity-60"
                )}
              >
                <div className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                  isOptionSelected(option) ? "bg-primary text-primary-foreground" : "opacity-60"
                )}>
                  {isOptionSelected(option) && (
                    <Check className="h-3 w-3" />
                  )}
                </div>
                <span>{option.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
'use client'

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { CaretSortIcon, CheckIcon, LockClosedIcon } from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';
import { availableFonts, FREE_FONTS } from '@/constants/fonts';
import { loadGoogleFont, getFontFamily, isFontLoaded } from '@/lib/fontLoader';

interface FontFamilyPickerProps {
  attribute: string;
  currentFont: string;
  handleAttributeChange: (attribute: string, value: string) => void;
  userId: string;
}

const FontFamilyPicker: React.FC<FontFamilyPickerProps> = ({
  attribute,
  currentFont,
  handleAttributeChange,
  userId
}) => {
  const [isPaidUser, setIsPaidUser] = useState(true);
  const [loadingFonts, setLoadingFonts] = useState<Set<string>>(new Set());

  const handleFontSelect = async (fontName: string) => {
    if (!isPaidUser && !FREE_FONTS.includes(fontName)) {
      return;
    }

    // Load the font if not already loaded (fallback for any missed fonts)
    if (!isFontLoaded(fontName)) {
      setLoadingFonts(prev => new Set(prev).add(fontName));
      try {
        await loadGoogleFont(fontName);
      } catch (error) {
        console.warn(`Failed to load font ${fontName}`);
      } finally {
        setLoadingFonts(prev => {
          const newSet = new Set(prev);
          newSet.delete(fontName);
          return newSet;
        });
      }
    }

    handleAttributeChange(attribute, fontName);
  };

  const getPreviewStyle = (fontName: string) => {
    const isLoading = loadingFonts.has(fontName);
    return {
      fontFamily: getFontFamily(fontName),
      opacity: isLoading ? 0.6 : 1,
    };
  };

  return (
    <Popover>
      <div className='flex flex-col items-start justify-start my-8'>
        <Label>
          Font Family {!isPaidUser && <span className="text-xs text-muted-foreground ml-2">(6 free fonts available)</span>}
        </Label>
        <PopoverTrigger asChild>
          <Button
            role="combobox"
            className={cn(
              "w-[200px] justify-between mt-3 p-2",
              !currentFont && "text-muted-foreground"
            )}
            style={currentFont ? { fontFamily: getFontFamily(currentFont) } : {}}
          >
            {currentFont ? currentFont : "Select font family"}
            <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
      </div>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Search font family..."
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>No font family found.</CommandEmpty>
            {!isPaidUser && (
              <CommandGroup heading="Free Fonts">
                {availableFonts.filter(font => FREE_FONTS.includes(font.name)).map((font) => (
                  <CommandItem
                    value={font.name}
                    key={font.name}
                    onSelect={() => handleFontSelect(font.name)}
                    className='hover:cursor-pointer'
                    style={getPreviewStyle(font.name)}
                  >
                    {font.label}
                    {loadingFonts.has(font.name) && <span className="ml-2 text-xs text-muted-foreground">Loading...</span>}
                    <CheckIcon
                      className={cn(
                        "ml-auto h-4 w-4",
                        font.name === currentFont ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            <CommandGroup heading={isPaidUser ? "All Fonts" : "Premium Fonts (Upgrade to Access)"}>
              {(isPaidUser ? availableFonts : availableFonts.filter(f => !FREE_FONTS.includes(f.name))).map((font) => (
                <CommandItem
                  value={font.name}
                  key={font.name}
                  onSelect={() => handleFontSelect(font.name)}
                  className={cn(
                    'hover:cursor-pointer',
                    !isPaidUser && 'opacity-50 hover:cursor-not-allowed'
                  )}
                  style={getPreviewStyle(font.name)}
                >
                  {font.label}
                  {loadingFonts.has(font.name) && <span className="ml-2 text-xs text-muted-foreground">Loading...</span>}
                  {!isPaidUser && <LockClosedIcon className="ml-auto h-4 w-4" />}
                  {isPaidUser && (
                    <CheckIcon
                      className={cn(
                        "ml-auto h-4 w-4",
                        font.name === currentFont ? "opacity-100" : "opacity-0"
                      )}
                    />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default FontFamilyPicker;

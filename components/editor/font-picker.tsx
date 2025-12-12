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
  previewText?: string; // Text from current layer
}

const FontFamilyPicker: React.FC<FontFamilyPickerProps> = ({
  attribute,
  currentFont,
  handleAttributeChange,
  userId,
  previewText = 'Sample' // Default fallback text
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
                    className={cn(
                      'hover:cursor-pointer transition-all duration-200',
                      'hover:bg-gradient-to-r hover:from-blue-600/30 hover:to-purple-600/30 hover:translate-x-1',
                      font.name === currentFont && 'bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-lg shadow-blue-500/30'
                    )}
                  >
                    <div className="flex items-center justify-between w-full gap-3">
                      <span
                        className="text-sm flex-shrink-0"
                        style={{ maxWidth: '45%', fontFamily: getFontFamily(font.name) }}
                      >
                        {font.label}
                        {loadingFonts.has(font.name) && <span className="ml-2 text-xs opacity-70">Loading...</span>}
                      </span>
                      <span
                        className="text-base opacity-80 flex-1 text-right truncate"
                        style={getPreviewStyle(font.name)}
                      >
                        {previewText}
                      </span>
                    </div>
                    <CheckIcon
                      className={cn(
                        "ml-2 h-4 w-4 flex-shrink-0",
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
                    'hover:cursor-pointer transition-all duration-200',
                    !isPaidUser && 'opacity-50 hover:cursor-not-allowed',
                    isPaidUser && 'hover:bg-gradient-to-r hover:from-blue-600/30 hover:to-purple-600/30 hover:translate-x-1',
                    font.name === currentFont && 'bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-lg shadow-blue-500/30'
                  )}
                >
                  <div className="flex items-center justify-between w-full gap-3">
                    <span
                      className="text-sm flex-shrink-0"
                      style={{ maxWidth: '45%', fontFamily: getFontFamily(font.name) }}
                    >
                      {font.label}
                      {loadingFonts.has(font.name) && <span className="ml-2 text-xs opacity-70">Loading...</span>}
                    </span>
                    <span
                      className="text-base opacity-80 flex-1 text-right truncate"
                      style={getPreviewStyle(font.name)}
                    >
                      {previewText}
                    </span>
                  </div>
                  {!isPaidUser && <LockClosedIcon className="ml-2 h-4 w-4 flex-shrink-0" />}
                  {isPaidUser && (
                    <CheckIcon
                      className={cn(
                        "ml-2 h-4 w-4 flex-shrink-0",
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

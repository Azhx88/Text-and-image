'use client';

import React, { useEffect, useRef } from 'react';
import { filters, getFilterCSSStringWithIntensity } from '@/lib/filters';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Check } from 'lucide-react';

interface FilterEditorProps {
  image: HTMLImageElement | null;
  onFilterChange: (filterName: string) => void;
  selectedFilter: string;
  applyToFullImage: boolean;
  onApplyToFullImageChange: (checked: boolean) => void;
  filterIntensity: number;
  onFilterIntensityChange: (intensity: number) => void;
}

const FilterEditor: React.FC<FilterEditorProps> = ({
  image,
  onFilterChange,
  selectedFilter,
  applyToFullImage,
  onApplyToFullImageChange,
  filterIntensity,
  onFilterIntensityChange,
}) => {
  return (
    <div className="w-full px-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">Select a filter to apply.</p>
        <div className="flex items-center space-x-2">
          <Switch
            id="apply-full-image"
            checked={applyToFullImage}
            onCheckedChange={onApplyToFullImageChange}
          />
          <Label htmlFor="apply-full-image" className="text-sm">
            Apply to Full Image
          </Label>
        </div>
      </div>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm">Intensity</Label>
          <span className="text-sm text-gray-500">{filterIntensity}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={filterIntensity}
          onChange={(e) => onFilterIntensityChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
        />
      </div>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-4 pb-4">
          {filters.map((filter) => (
            <FilterPreview
              key={filter.name}
              image={image}
              filterName={filter.name}
              label={filter.label}
              isSelected={selectedFilter === filter.name}
              onClick={() => onFilterChange(filter.name)}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

interface FilterPreviewProps {
  image: HTMLImageElement | null;
  filterName: string;
  label: string;
  isSelected: boolean;
  onClick: () => void;
}

const FilterPreview: React.FC<FilterPreviewProps> = ({
  image,
  filterName,
  label,
  isSelected,
  onClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (image && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set preview size
      canvas.width = 96;
      canvas.height = 96;

      // Center-crop image to square
      const aspectRatio = image.width / image.height;
      let sx, sy, sw, sh;

      if (aspectRatio > 1) {
        // Landscape - crop sides
        sh = image.height;
        sw = image.height;
        sx = (image.width - sw) / 2;
        sy = 0;
      } else {
        // Portrait or square - crop top/bottom
        sw = image.width;
        sh = image.width;
        sx = 0;
        sy = (image.height - sh) / 2;
      }

      // Apply filter at 100% intensity for preview button
      if (filterName !== 'original') {
        const filterString = getFilterCSSStringWithIntensity(filterName, 100);
        ctx.filter = filterString;
      }

      // Draw cropped image
      ctx.drawImage(image, sx, sy, sw, sh, 0, 0, 96, 96);
      ctx.filter = 'none';
    }
  }, [image, filterName]);

  return (
    <div
      className={cn(
        'relative flex flex-col items-center space-y-2 cursor-pointer group transition-all',
        isSelected && 'scale-105'
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          'w-24 h-24 rounded-lg overflow-hidden border-2 transition-all relative',
          isSelected
            ? 'border-blue-500 shadow-lg shadow-blue-500/50 ring-2 ring-blue-500/20'
            : 'border-gray-200 dark:border-gray-700 group-hover:border-blue-300 dark:group-hover:border-blue-600'
        )}
      >
        <canvas ref={canvasRef} className="w-full h-full object-cover" />
        {isSelected && (
          <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          </div>
        )}
      </div>
      <span className={cn(
        "text-xs font-medium text-center",
        isSelected ? "text-blue-500 font-semibold" : "text-gray-600 dark:text-gray-400"
      )}>{label}</span>
    </div>
  );
};

export default FilterEditor;

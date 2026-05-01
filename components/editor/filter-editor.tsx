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
  applyFilterToText: boolean;
  onApplyFilterToTextChange: (apply: boolean) => void;
}

const FilterEditor: React.FC<FilterEditorProps> = ({
  image,
  onFilterChange,
  selectedFilter,
  applyToFullImage,
  onApplyToFullImageChange,
  filterIntensity,
  onFilterIntensityChange,
  applyFilterToText,
  onApplyFilterToTextChange,
}) => {
  return (
    <div className="w-full space-y-4">
      {/* Intensity + full-image toggle */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Intensity</span>
          <div className="flex items-center gap-2">
            <Switch
              id="apply-full-image"
              checked={applyToFullImage}
              onCheckedChange={onApplyToFullImageChange}
              className="data-[state=checked]:bg-violet-500"
            />
            <Label htmlFor="apply-full-image" className="text-[10px] text-white/35 cursor-pointer">Full image</Label>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range" min="0" max="100" value={filterIntensity}
            onChange={e => onFilterIntensityChange(Number(e.target.value))}
            className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
            style={{ background: `linear-gradient(to right, #a78bfa ${filterIntensity}%, rgba(255,255,255,0.08) ${filterIntensity}%)`, accentColor: '#a78bfa' }}
          />
          <span className="text-xs text-white/30 tabular-nums w-8 text-right">{filterIntensity}%</span>
        </div>
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

      {/* Apply Filter to Text Toggle */}
      <div className="pt-3 border-t border-white/[0.05]">
        <button
          onClick={() => onApplyFilterToTextChange(!applyFilterToText)}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 border",
            applyFilterToText
              ? "bg-violet-500/10 border-violet-500/25 text-violet-300"
              : "bg-white/[0.03] border-white/[0.07] text-white/35 hover:bg-white/[0.06]"
          )}
        >
          <Check className={cn("w-3 h-3 transition-all", applyFilterToText ? "opacity-100 text-violet-400" : "opacity-0")} />
          Apply filter to text
        </button>
      </div>
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
          'w-[72px] h-[72px] rounded-xl overflow-hidden border transition-all relative',
          isSelected
            ? 'border-violet-500/70 shadow-lg shadow-violet-500/25 scale-105'
            : 'border-white/10 group-hover:border-violet-400/40'
        )}
      >
        <canvas ref={canvasRef} className="w-full h-full object-cover" />
        {isSelected && (
          <div className="absolute top-1 right-1 w-4 h-4 bg-violet-500 rounded-full flex items-center justify-center shadow">
            <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
          </div>
        )}
      </div>
      <span className={cn(
        "text-[9px] font-semibold uppercase tracking-wide text-center",
        isSelected ? "text-violet-300" : "text-white/25"
      )}>{label}</span>
    </div>
  );
};

export default FilterEditor;

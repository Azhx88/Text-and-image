'use client'

import React, { useState } from 'react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from '@/components/ui/dropdown-menu';
import { ChromePicker } from 'react-color';
import { colors } from '@/constants/colors';
import { PipetteIcon } from 'lucide-react';

interface ColorPickerProps {
  attribute: string;
  label: string;
  currentColor: string;
  handleAttributeChange: (attribute: string, value: any) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ attribute, label, currentColor, handleAttributeChange }) => {

  const openEyeDropper = async () => {
    if ('EyeDropper' in window) {
      try {
        const { sRGBHex } = await (new (window as any).EyeDropper()).open();
        handleAttributeChange(attribute, sRGBHex);
      } catch { /* cancelled */ }
    }
  };

  return (
    <div className="space-y-3">
      {/* Label */}
      <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">{label}</span>

      {/* ── Swatch grid ── */}
      <div className="grid grid-cols-6 gap-2 mt-2">
        {colors.map(color => (
          <button
            key={color}
            onClick={() => handleAttributeChange(attribute, color)}
            title={color}
            className="relative w-9 h-9 rounded-xl transition-all duration-150 focus:outline-none"
            style={{ background: color }}
          >
            {currentColor.toLowerCase() === color.toLowerCase() && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full border-2 border-white shadow-md" />
              </span>
            )}
            <span
              className={[
                'absolute inset-0 rounded-xl border-2 transition-all',
                currentColor.toLowerCase() === color.toLowerCase()
                  ? 'border-violet-400 scale-110 shadow-[0_0_0_1px_rgba(167,139,250,0.4)]'
                  : 'border-transparent hover:border-white/30 hover:scale-105',
              ].join(' ')}
            />
          </button>
        ))}
      </div>

      {/* ── Current color row + custom / eyedropper ── */}
      <div className="flex items-center gap-3 pt-1">
        {/* Current color swatch */}
        <div
          className="w-8 h-8 rounded-xl border border-white/15 flex-shrink-0"
          style={{ background: currentColor }}
        />
        <span className="text-xs text-white/35 font-mono flex-1">{currentColor}</span>

        {/* Eyedropper */}
        {'EyeDropper' in (typeof window !== 'undefined' ? window : {})}
        <button
          onClick={openEyeDropper}
          className="h-7 w-7 flex items-center justify-center rounded-lg border border-white/10 text-white/30 hover:text-violet-300 hover:border-violet-500/40 transition-all"
          title="Eyedropper"
        >
          <PipetteIcon className="h-3.5 w-3.5" />
        </button>

        {/* Custom color picker */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-7 px-2.5 rounded-lg border border-white/10 text-[10px] font-semibold text-white/40 hover:text-violet-300 hover:border-violet-500/40 transition-all">
              Custom
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="left" sideOffset={8} className="p-0 border-0 bg-transparent shadow-2xl">
            <ChromePicker
              color={currentColor}
              onChange={c => handleAttributeChange(attribute, c.hex)}
              styles={{ default: { picker: { background: '#16161f', boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08)' } } }}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default ColorPicker;

'use client'

import React from 'react';
import { Slider } from '@/components/ui/slider';
import { LockClosedIcon } from '@radix-ui/react-icons';

interface SliderFieldProps {
  attribute: string;
  label: string;
  min: number;
  max: number;
  step: number;
  currentValue: number;
  hasTopPadding?: boolean;
  disabled?: boolean;
  premiumFeature?: boolean;
  handleAttributeChange: (attribute: string, value: number) => void;
}

const SliderField: React.FC<SliderFieldProps> = ({
  attribute, label, min, max, step, currentValue,
  hasTopPadding = true, disabled = false, premiumFeature = false,
  handleAttributeChange,
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    handleAttributeChange(attribute, parseFloat(e.target.value));
  };

  // Thumb position for the floating pill (0–100 %)
  const pct = Math.min(100, Math.max(0, ((currentValue - min) / (max - min)) * 100));
  // Offset to prevent pill clipping at edges
  const pillLeft = `clamp(18px, calc(${pct}% - 1px), calc(100% - 18px))`;

  const displayValue = Number.isInteger(step) ? Math.round(currentValue) : currentValue.toFixed(2);

  return (
    <div className={hasTopPadding ? 'mt-5' : ''}>
      {/* Row: label + optional lock */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">{label}</span>
          {premiumFeature && (
            <span className="flex items-center gap-0.5 text-[9px] text-violet-400/60">
              <LockClosedIcon className="h-2.5 w-2.5" /> Pro
            </span>
          )}
        </div>
        {/* Editable value box */}
        <input
          type="number"
          value={currentValue}
          onChange={handleInputChange}
          min={min} max={max} step={step}
          disabled={disabled}
          className={[
            'w-14 h-6 text-center text-xs rounded-lg border px-1 tabular-nums',
            'bg-white/5 border-white/10 text-white/60',
            'focus:outline-none focus:border-violet-500/60 focus:text-white/90',
            disabled ? 'opacity-40 cursor-not-allowed' : 'hover:border-white/20',
          ].join(' ')}
        />
      </div>

      {/* Slider + floating pill */}
      <div className="relative pt-5 pb-1 min-h-[44px]">
        {/* Floating value pill */}
        <div
          className="absolute top-0 transform -translate-x-1/2 pointer-events-none z-10 transition-all duration-150"
          style={{ left: pillLeft }}
        >
          <div className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold tabular-nums text-violet-200 border border-violet-500/30"
            style={{ background: 'rgba(167,139,250,0.15)', backdropFilter: 'blur(8px)' }}>
            {displayValue}
          </div>
        </div>

        <Slider
          id={attribute}
          min={min} max={max} step={step}
          value={[currentValue]}
          onValueChange={([v]) => !disabled && handleAttributeChange(attribute, v)}
          disabled={disabled}
          className={[
            'w-full [&_[role=slider]]:h-5 [&_[role=slider]]:w-5 [&_[role=slider]]:touch-none',
            disabled ? 'opacity-40 cursor-not-allowed' : '',
          ].join(' ')}
          aria-label={label}
        />
      </div>
    </div>
  );
};

export default SliderField;

'use client'

import React from 'react';

interface InputFieldProps {
  attribute: string;
  label: string;
  currentValue: string;
  handleAttributeChange: (attribute: string, value: string) => void;
}

const InputField: React.FC<InputFieldProps> = ({ attribute, label, currentValue, handleAttributeChange }) => (
  <input
    type="text"
    placeholder="Your text here…"
    value={currentValue}
    onChange={e => handleAttributeChange(attribute, e.target.value)}
    className="w-full h-10 px-3 rounded-xl text-sm text-white/85 placeholder:text-white/20 border border-white/10 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20 transition-all"
    style={{ background: 'rgba(255,255,255,0.05)' }}
  />
);

export default InputField;

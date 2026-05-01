'use client'

import React, { useState } from 'react';
import { LayerManagerColumn } from '@/components/LayerManagerColumn';
import { PreviewSection } from '@/components/PreviewSection';
import { SlidersHorizontal, X } from 'lucide-react';

export default function Page() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    /*
      Mobile: flex-col split — canvas top, editor bottom.
        Closed: canvas = 100vh, editor = 0 (off screen)
        Open:   canvas = 45vh, editor = 55vh  (real-time preview)
      Desktop (md+): flex-row — sidebar left, canvas right.
    */
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-[#0a0a0f]">

      {/* ── Canvas ── shrinks on mobile when editor opens ── */}
      <div
        className={`
          min-w-0 overflow-hidden flex-shrink-0
          transition-all duration-300 ease-in-out
          md:flex-1 md:h-full
          ${drawerOpen ? 'h-[45vh]' : 'h-screen'}
        `}
      >
        <PreviewSection />
      </div>

      {/*
        Single LayerManagerColumn.
        Mobile: slides up from bottom as a panel below the canvas.
        Desktop: static left sidebar.
      */}
      <aside
        className={`
          bg-[#0d0e14] border-white/[0.06]
          flex flex-col flex-shrink-0
          transition-all duration-300 ease-in-out
          overflow-hidden

          md:order-first md:static md:w-[280px] lg:md:w-[320px]
          md:h-full md:border-r md:border-t-0 md:rounded-none
          ${drawerOpen
            ? 'h-[55vh] border-t rounded-t-2xl'
            : 'h-0 md:h-full'
          }
        `}
      >
        {/* Mobile handle bar + close */}
        <div className={`
          md:hidden shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/[0.06]
          transition-opacity duration-200
          ${drawerOpen ? 'opacity-100' : 'opacity-0'}
        `}>
          <div className="w-8 h-1 rounded-full bg-white/20" />
          <span className="text-xs font-semibold uppercase tracking-widest text-white/40">Editor</span>
          <button
            onClick={() => setDrawerOpen(false)}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <LayerManagerColumn />
        </div>
      </aside>

      {/* FAB — mobile only, shown when drawer is closed */}
      <button
        onClick={() => setDrawerOpen(true)}
        className={`
          md:hidden fixed bottom-5 right-5 z-50
          w-14 h-14 rounded-2xl
          flex items-center justify-center
          shadow-lg shadow-black/50 border border-white/10
          transition-all duration-300
          ${drawerOpen ? 'opacity-0 pointer-events-none scale-90' : 'opacity-100 scale-100'}
          active:scale-95
        `}
        style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
        aria-label="Open editor"
      >
        <SlidersHorizontal className="w-5 h-5 text-white" />
      </button>

    </div>
  );
}

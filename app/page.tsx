'use client'

import React from 'react';
import { LayerManagerColumn } from '@/components/LayerManagerColumn';
import { PreviewSection } from '@/components/PreviewSection';

export default function Page() {
  return (
    /*
      Layout logic (single LayerManagerColumn mount — no double-render):

      Desktop (md+):
        flex-row  →  sidebar left (280/320px) | canvas right (flex-1)

      Mobile (<md):
        sidebar  →  fixed bottom-0, height 48vh, z-40
        canvas   →  full-width, pb-[48vh] so it's never hidden behind the panel
    */
    <div className="flex h-screen overflow-hidden bg-[#0a0a0f]">

      {/* ── Canvas / main area ── */}
      <div className="
        flex-1 min-w-0 overflow-hidden
        pb-[48vh] md:pb-0
      ">
        <PreviewSection />
      </div>

      {/* ── Sidebar: fixed bottom on mobile, left sidebar on desktop ── */}
      <aside className="
        bg-[#0d0e14] border-white/[0.06]
        fixed bottom-0 inset-x-0 h-[48vh] z-40 border-t overflow-y-auto
        md:static md:order-first md:w-[280px] lg:w-[320px] md:h-full md:flex-shrink-0
        md:border-t-0 md:border-r md:z-auto
      ">
        <LayerManagerColumn />
      </aside>

    </div>
  );
}

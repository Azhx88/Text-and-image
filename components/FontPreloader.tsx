'use client';

import { useEffect, useState } from 'react';
import { preloadAllFonts } from '@/lib/fontLoader';

const FontPreloader: React.FC = () => {
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState(0);

  useEffect(() => {
    const startFontPreloading = async () => {
      setIsPreloading(true);
      try {
        // Import font list to get total count
        const { ALL_FONTS } = await import('@/constants/fonts');
        const totalFonts = ALL_FONTS.length;

        // Track progress during preloading
        let loadedCount = 0;

        // Override the loadGoogleFont to track progress
        const originalLoadGoogleFont = (await import('@/lib/fontLoader')).loadGoogleFont;

        // Start preloading all fonts
        await preloadAllFonts();

        setPreloadProgress(100);
      } catch (error) {
        console.warn('Font preloading failed:', error);
      } finally {
        setIsPreloading(false);
      }
    };

    // Start preloading after a short delay to not block initial render
    const timer = setTimeout(startFontPreloading, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Don't render anything - this is just for preloading
  return null;
};

export default FontPreloader;

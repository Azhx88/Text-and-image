// Font loading utility for dynamic Google Fonts loading
const loadedFonts = new Set<string>();

export const loadGoogleFont = async (fontName: string): Promise<void> => {
  // Skip if already loaded
  if (loadedFonts.has(fontName)) {
    return;
  }

  try {
    // Create Google Fonts URL
    const fontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@100;200;300;400;500;600;700;800;900&display=swap`;

    // Create link element
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = fontUrl;
    link.crossOrigin = 'anonymous';

    // Add to document head
    document.head.appendChild(link);

    // Wait for font to load
    await new Promise<void>((resolve, reject) => {
      link.onload = () => {
        loadedFonts.add(fontName);
        resolve();
      };
      link.onerror = () => {
        reject(new Error(`Failed to load font: ${fontName}`));
      };

      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error(`Font loading timeout: ${fontName}`));
      }, 10000);
    });
  } catch (error) {
    console.warn(`Could not load font ${fontName}:`, error);
    // Don't rethrow - let it fall back to default font
  }
};

export const preloadCommonFonts = async (): Promise<void> => {
  const commonFonts = [
    'Inter',
    'Roboto',
    'Poppins',
    'Open Sans',
    'Lato',
    'Montserrat',
    'Nunito',
    'Playfair Display',
    'Dancing Script',
    'Oswald',
    'Merriweather',
    'Pacifico'
  ];

  // Load common fonts in parallel
  await Promise.allSettled(commonFonts.map(loadGoogleFont));
};

export const preloadAllFonts = async (): Promise<void> => {
  // Import the font list dynamically to avoid circular dependencies
  const { ALL_FONTS } = await import('@/constants/fonts');

  // Load fonts in batches to avoid overwhelming the browser
  const batchSize = 10;
  for (let i = 0; i < ALL_FONTS.length; i += batchSize) {
    const batch = ALL_FONTS.slice(i, i + batchSize);
    await Promise.allSettled(batch.map(loadGoogleFont));

    // Small delay between batches to prevent browser throttling
    if (i + batchSize < ALL_FONTS.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
};

export const getFontFamily = (fontName: string): string => {
  // Return font stack with fallbacks
  return `"${fontName}", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
};

export const isFontLoaded = (fontName: string): boolean => {
  return loadedFonts.has(fontName);
};

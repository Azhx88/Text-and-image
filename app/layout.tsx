import type { Metadata } from "next";
import { Inter } from 'next/font/google'
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LayerManagerProvider } from "@/context/useLayerManager";
import FontPreloader from "@/components/FontPreloader";

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: "TextFX",
  description: "Text and image layer editor",
  icons: { icon: '/img/logo.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>
        <FontPreloader />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <LayerManagerProvider>{children}</LayerManagerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

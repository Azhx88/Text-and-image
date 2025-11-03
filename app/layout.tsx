import type { Metadata } from "next";
import { Inter, Roboto, Poppins } from 'next/font/google'
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import FontPreloader from "@/components/FontPreloader";

const inter = Inter({ subsets: ['latin'], display: 'swap' })
const roboto = Roboto({ subsets: ['latin'], weight: ['400', '700'] })
const poppins = Poppins({ subsets: ['latin'], weight: ['400', '600'] })

export const metadata: Metadata = {
  title: "TextFX",
  description: "Text and image layer editor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.className}`}>
      <body>
        <FontPreloader />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

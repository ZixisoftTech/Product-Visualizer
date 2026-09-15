import './globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Rajgarhwala AI Furniture Visualizer',
  description: "Visualize showroom furniture inside your customer's actual room with photorealistic AI preservation",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#fcfaf7] text-stone-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}

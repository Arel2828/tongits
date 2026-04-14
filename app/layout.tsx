import type { Metadata } from "next";
import { Press_Start_2P, Pixelify_Sans } from "next/font/google";
import "./globals.css";

const pressStart = Press_Start_2P({ 
  weight: "400", 
  subsets: ["latin"], 
  variable: "--font-press-start" 
});

const pixelify = Pixelify_Sans({ 
  subsets: ["latin"], 
  variable: "--font-pixelify" 
});

export const metadata: Metadata = {
  title: "Tongits Online - Pink Pixel Edition",
  description: "A bold, vibrant, and pixel-perfect Tongits card game experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${pressStart.variable} ${pixelify.variable} font-sans antialiased bg-black text-white`}>
        {children}
      </body>
    </html>
  );
}


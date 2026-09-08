import type { Metadata } from "next";
import { Source_Serif_4, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from 'react-hot-toast';
import { BackToTop } from "@/components/site/BackToTop";

const sourceSerif = Source_Serif_4({
  variable: "--font-display",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NAMSN FUNAAB — National Association of Mathematics Students",
  description:
    "National Association of Mathematics Students of Nigeria (NAMSN), FUNAAB chapter — Department of Mathematics, Federal University of Agriculture, Abeokuta.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${sourceSerif.variable} ${inter.variable} font-sans antialiased`}
      >
        <AuthProvider>
          {children}
          <Toaster position="top-center" />
          <BackToTop />
        </AuthProvider>
      </body>
    </html>
  );
}

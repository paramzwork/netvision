import type { Metadata } from "next";
import { Lexend, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "../lib/utils";
import { Toaster } from "sonner";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NetVision",
  description: "Monitor. Analyze. Respond.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        lexend.variable,
        "font-sans",
        geist.variable,
      )}
    >
      <body className="min-h-full flex flex-col font-lexend">
        <main>{children}</main>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}

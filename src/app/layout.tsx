import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "My English Tutor",
  description: "AI-powered English writing assistant",
};

import { ToastProvider } from "@/lib/toast-context";
import { DebugPanel } from "@/components/DebugPanel";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ToastProvider>
          {children}
          <DebugPanel />
        </ToastProvider>
      </body>
    </html>
  );
}

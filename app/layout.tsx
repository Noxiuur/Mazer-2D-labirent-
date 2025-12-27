"use client";

import "@/app/globals.css";
import { ReactNode, useEffect } from "react";
import { AuthProvider } from "@/contexts/AuthContext";

export default function RootLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <html lang="tr">
      <body className="bg-surface-base text-white min-h-screen">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}




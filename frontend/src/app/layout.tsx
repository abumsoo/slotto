import type { Metadata } from "next";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { SideNav } from "@/components/SideNav";

export const metadata: Metadata = {
  title: "Eslo",
  description: "slow social media",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SideNav />
        {children}
        <BottomNav />
      </body>
    </html>
  );
}

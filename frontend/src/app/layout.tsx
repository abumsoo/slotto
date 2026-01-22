import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Slotto - Full Stack Web App",
  description: "A full-stack web application built with React/TypeScript, Next.js, Node.js, and PostgreSQL",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Odd Shoes | AI Marketing Agent",
  description:
    "Faith-centered AI marketing chatbot for Odd Shoes: product Q&A, lead capture, and guided conversion."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Returnly — QR tag lost & found",
  description: "Lost and found recovery for wallets, keys, laptops, and the QR tags attached to them.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
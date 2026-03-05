import type { Metadata } from "next";
import { Cinzel, Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import ActivityTracker from "@/components/ActivityTracker";
import Navbar from "@/components/Navbar";
import AdminSidebar from "@/components/AdminSidebar";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dreadkrew Clan Hub",
  description: "Dreadkrew Tactical & Logistics Interface",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${cinzel.variable} font-sans antialiased bg-[#0D1117] text-gray-300 min-h-screen`}
      >
        <Providers>
          <ActivityTracker />
          <Navbar />
          <AdminSidebar />
          {children}
        </Providers>
      </body>
    </html>
  );
}

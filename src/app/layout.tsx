import type { Metadata } from "next";
import { Cinzel, Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import ActivityTracker from "@/components/ActivityTracker";
import Navbar from "@/components/Navbar";
import AdminSidebar from "@/components/AdminSidebar";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  const isAdmin = session?.user?.role === 'Admin';

  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${cinzel.variable} font-sans antialiased bg-[#0D1117] text-gray-300 min-h-screen`}
      >
        <Providers>
          <ActivityTracker />
          <Navbar />
          <AdminSidebar />
          <div className={isAdmin ? 'pl-14 transition-all duration-300' : ''}>
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}

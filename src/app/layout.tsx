import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "HSHT Enrollment",
  description: "Student enrollment, activity, and billing management for HSHT.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${manrope.variable} h-full`}>
      <body className="h-full antialiased">
        <DashboardShell>{children}</DashboardShell>
      </body>
    </html>
  );
}

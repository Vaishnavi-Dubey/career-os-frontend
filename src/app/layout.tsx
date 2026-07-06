import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Autonomous Career OS",
  description: "100% Free, fully local AI career system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex bg-slate-900 text-slate-200">
        <Sidebar />
        <main className="flex-1 ml-60 p-8 overflow-y-auto min-h-screen">{children}</main>
      </body>
    </html>
  );
}

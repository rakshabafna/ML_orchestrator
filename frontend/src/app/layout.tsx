import type { Metadata } from "next";
import "./globals.css";
import { SideNavBar, Footer } from "@/components/layout";
import { BackgroundShader } from "@/components/BackgroundShader";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "NeuralFlow Orchestrator",
  description: "Autonomous ML Experiment Orchestrator — Define your objective. NeuralFlow handles the feature engineering, model selection, and deployment automatically.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen w-screen overflow-x-hidden overflow-y-auto antialiased text-[var(--color-on-background)] bg-transparent flex flex-col relative">
        <BackgroundShader />
        <Providers>
          <SideNavBar />
          <div className="flex flex-1 pt-8 pb-10 pl-24 pr-4 md:pr-8">
            <main className="flex-1 w-full flex flex-col min-h-0">
              {children}
            </main>
          </div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}

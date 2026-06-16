import type { Metadata } from "next";
import "./globals.css";
import { TopAppBar, Footer } from "@/components/layout";

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
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen w-screen overflow-x-hidden overflow-y-auto antialiased text-[var(--color-on-background)] bg-[var(--color-background)] flex flex-col">
        <TopAppBar />
        <div className="flex flex-1 pt-16 pb-10">
          <main className="flex-1 w-full p-3 md:p-6 max-w-[1440px] mx-auto flex flex-col min-h-screen">
            {children}
          </main>
        </div>
        <Footer />
      </body>
    </html>
  );
}

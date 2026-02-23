import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-serif", style: ['normal', 'italic'] });

export const metadata: Metadata = {
  title: "Lumeris | Think Like a Network",
  description: "An AI-powered learning workspace. Upload videos or PDFs and understand them better with contextual chat, flashcards, and quizzes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased min-h-screen selection:bg-primary/30 selection:text-primary-foreground`}>
        {children}
      </body>
    </html>
  );
}

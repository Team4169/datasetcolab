import React from 'react';
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dataset Colab",
  description: "Collaborate on datasets effortlessly.",
};

const Navbar: React.FC = () => {
  return (
    <nav className="bg-blue-50 shadow-lg">
      <div className="mx-auto max-w-7xl flex justify-between items-center h-16">
        <div className="flex items-center">
          <a href="/" className="mr-10">
            <span className="font-bold text-blue-900 text-lg">DatasetCo</span>
          </a>
          <div className="flex space-x-5">
            <a href="/repositories" className="text-blue-900 hover:text-blue-600">Repositories</a>
            <a href="/pricing" className="text-blue-900 hover:text-blue-600">Pricing</a>
            <a href="/about" className="text-blue-900 hover:text-blue-600">About</a>
          </div>
        </div>
        <div className="hidden md:flex items-center space-x-4">
          <input type="text" placeholder="Search Repositiories" className="py-2 px-3 bg-white text-blue-900 rounded" />
          <a href="/login" className="py-2 px-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-300">Login</a>
          <a href="/signup" className="py-2 px-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-300">Sign Up</a>
        </div>
      </div>
    </nav>
  );
};

const Footer: React.FC = () => {
  return (
    <footer className="bg-blue-900 text-white">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between">
          <div className="flex space-x-4">
            {/* Footer navigation */}
          </div>
          <div className="md:flex items-center space-x-4">
            {/* Social links or other relevant information */}
          </div>
        </div>
        <div className="border-t border-gray-700 text-center py-4">
          <p>© {new Date().getFullYear()} Dataset Colab. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
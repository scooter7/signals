import type { Metadata } from "next";
// Import the Poppins font directly here
import { Inter, Poppins } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
// Configure the Poppins font for the logo
const poppins = Poppins({ 
  subsets: ['latin'], 
  weight: ['600'], 
  variable: '--font-poppins' 
});

export const metadata: Metadata = {
  title: "Signals",
  description: "Your path to academic and professional success.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Add the font variables to the body */}
      <body className={`${inter.variable} ${poppins.variable} font-sans bg-gray-50 text-gray-900`}>
        {children}
      </body>
    </html>
  );
}
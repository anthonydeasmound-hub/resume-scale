import type { Metadata } from "next";
import { Geist, Geist_Mono, Lora, Poppins, DM_Serif_Display, DM_Sans, Chivo, Open_Sans } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Resume template fonts
const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-dm-serif-display",
  subsets: ["latin"],
  weight: ["400"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const chivo = Chivo({
  variable: "--font-chivo",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "ResumeGenie - AI-Powered Job Applications",
  description: "Scale your job applications with AI-optimized resumes and cover letters",
  metadataBase: new URL("https://resumegenie.careers"),
  openGraph: {
    title: "ResumeGenie - AI-Powered Job Applications",
    description:
      "Scale your job applications with AI-optimized resumes and cover letters. Tailor your resume to every job in seconds.",
    url: "https://resumegenie.careers",
    siteName: "ResumeGenie",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 600,
        alt: "ResumeGenie",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ResumeGenie - AI-Powered Job Applications",
    description:
      "Scale your job applications with AI-optimized resumes and cover letters. Tailor your resume to every job in seconds.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} ${poppins.variable} ${dmSerifDisplay.variable} ${dmSans.variable} ${chivo.variable} ${openSans.variable} antialiased`}
      >
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}

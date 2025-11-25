import type { Metadata } from "next";
import { Nunito, Comic_Neue } from "next/font/google";
import "./globals.css";
import ToastProvider from "./components/ToastProvider";

// 圆润可爱的字体
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

// 漫画风格字体
const comicNeue = Comic_Neue({
  variable: "--font-comic-neue",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Mood Diary 🐱 ｜ Kawaii Edition",
  description: "超可爱的心情日记本 ♡",
  icons: {
    icon: "/heart.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${nunito.variable} ${comicNeue.variable} antialiased`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

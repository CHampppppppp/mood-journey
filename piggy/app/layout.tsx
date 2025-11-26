import type { Metadata } from "next";
import "./globals.css";
import ToastProvider from "./components/ToastProvider";

export const metadata: Metadata = {
  title: "Kawaii Mood Diary 🐱",
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
      <body className="antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

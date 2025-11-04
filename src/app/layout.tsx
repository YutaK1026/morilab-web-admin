import type { Metadata } from "next";
import "./globals.scss";

export const metadata: Metadata = {
  title: "Morilab Admin",
  description: "Morilab管理画面",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}

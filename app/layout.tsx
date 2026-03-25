import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LuckyPick – Vòng Quay May Mắn",
  description:
    "Ứng dụng quay số ngẫu nhiên chọn người may mắn với hiệu ứng 3D đẹp mắt và mã phiên riêng biệt.",
  keywords: ["lucky spin", "quay số may mắn", "chọn ngẫu nhiên", "vòng quay"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

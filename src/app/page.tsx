import type { Metadata } from "next";
import LuckySpinClient from "@/components/LuckySpinClient";

export const metadata: Metadata = {
  title: "QuayMayMan - Vòng Quay May Mắn",
  description:
    "Trải nghiệm vòng quay may mắn (Lucky Spin) ngẫu nhiên, đẹp mắt với đồ họa 3D siêu mượt. Công cụ bốc thăm ngẫu nhiên kết nối API, tối ưu hoàn hảo cho các sự kiện trực tiếp.",
  keywords: [
    "vòng quay may mắn",
    "lucky spin",
    "bốc thăm trúng thưởng",
    "random picker",
    "vòng quay 3d",
    "sự kiện",
    "quay số",
  ],
  openGraph: {
    title: "QuayMayMan - Vòng Quay May Mắn",
    description:
      "Trải nghiệm vòng quay may mắn ngẫu nhiên, đẹp mắt với đồ họa 3D siêu mượt. Công cụ bốc thăm ngẫu nhiên số 1.",
    url: "https://quaymayman.online",
    siteName: "QuayMayMan",
    locale: "vi_VN",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  twitter: {
    card: "summary_large_image",
    title: "QuayMayMan - Vòng Quay May Mắn",
    description:
      "Trải nghiệm vòng quay may mắn ngẫu nhiên với đồ họa 3D siêu mượt!",
  },
};

export default function Page() {
  return (
    <main>
      {/* Cấu trúc JSON-LD (Schema.org) để tối ưu hiển thị SEO trên Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "QuayMayMan - Vòng Quay May Mắn",
            url: "https://quaymayman.online",
            description:
              "Ứng dụng quay vòng may mắn bốc thăm trúng thưởng đồ họa 3D đẹp mắt, hỗ trợ tuỳ chỉnh tham số linh hoạt và chuẩn bị tích hợp API backend dễ dàng.",
            applicationCategory: "UtilitiesApplication",
            operatingSystem: "All",
            inLanguage: "vi",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "VND",
            },
          }),
        }}
      />
      <LuckySpinClient />
    </main>
  );
}

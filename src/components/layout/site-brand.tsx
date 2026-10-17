import Link from "next/link";
import { Anchor } from "lucide-react";
import type { Locale } from "@/lib/i18n";
export function SiteBrand({ locale }: { locale: Locale }) {
  return (
    <Link
      href={`/${locale}`}
      className="site-brand"
      aria-label="Vietnam Port Intelligence"
    >
      <span className="site-brand-icon">
        <Anchor size={23} />
      </span>
      <span>
        Vietnam Port
        <span className="site-brand-tagline-desktop">
          {locale === "vi"
            ? "Dữ liệu cảng & thương mại"
            : "Port & trade intelligence"}
        </span>
      </span>
    </Link>
  );
}

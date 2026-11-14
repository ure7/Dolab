import type { Metadata, Viewport } from "next";
import { Geist, IBM_Plex_Sans_Arabic } from "next/font/google";
import { theme } from "@/config/dolab.config";
import { getDictionary, getDirection } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import { themeToCssVariables } from "@/lib/helpers/theme";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

// Geist has no Arabic letters, so Arabic text needs its own font.
const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: { default: "Dolab | دولاب", template: "%s · Dolab" },
  description: "Your wardrobe, outfits and shopping list — in one place.",
};

export const viewport: Viewport = {
  themeColor: theme.background,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const t = getDictionary(locale);

  return (
    <html
      lang={locale}
      dir={getDirection(locale)}
      style={themeToCssVariables()}
      className={`${geistSans.variable} ${plexArabic.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <I18nProvider locale={locale} t={t}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}

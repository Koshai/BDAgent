import "./globals.css";
import { Providers } from "@/components/providers";
import { brandPair, BRAND } from "@/lib/brand";

export const metadata = {
  title: brandPair(),
  description: BRAND.description,
  metadataBase: new URL(process.env.NEXTAUTH_URL || process.env.AUTH_URL || "http://localhost:3000"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

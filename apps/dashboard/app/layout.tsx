import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata = {
  title: "BDAgent",
  description: "AI shopping agent for ecommerce — English and Bengali",
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

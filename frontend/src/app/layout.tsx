import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Távika | Postulación automática",
  description: "Consigue horas docentes sin el estrés de buscar correos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} antialiased`}>
      <head>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-0NVDM1MR5W"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-0NVDM1MR5W');
          `}
        </Script>

        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
          strategy="lazyOnload"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.FontAwesomeConfig = { autoReplaceSvg: 'nest' };`
          }}
        />
      </head>
      <body className="bg-[var(--color-paper)] text-slate-800 min-h-screen overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}

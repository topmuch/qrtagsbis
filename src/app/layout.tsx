import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ServiceWorkerRegistration } from "@/components/pwa-registration";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "QRTags - Plateforme objets perdus & trouvés via QR",
    template: "%s | QRTags",
  },
  description: "Protégez vos effets personnels avec des étiquettes QR intelligentes. Sans application, sans batterie, sans GPS. Un seul scan pour la tranquillité d'esprit. Hôtels, bus, écoles, cliniques, loueurs, entreprises, événements.",
  keywords: ["QR", "tag", "étiquette", "objets perdus", "objets trouvés", "voyage", "hôtel", "bus", "école", "clinique", "protection", "luggage", "travel", "Afrique", "SaaS"],
  authors: [{ name: "QRTags Team" }],
  creator: "MMASOLUTION",
  publisher: "QRTags",
  metadataBase: new URL("https://qrtags.com"),

  // PWA Icons
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/icons/maskable-icon-512x512.png", color: "#ffffff" },
    ],
  },

  // Open Graph
  openGraph: {
    title: "QRTags - Plateforme objets perdus & trouvés via QR",
    description: "Des étiquettes QR intelligentes pour protéger vos effets personnels. Sans application. Sans batterie. Sans GPS. Pour hôtels, bus, écoles, cliniques et entreprises en Afrique.",
    url: "https://qrtags.com",
    siteName: "QRTags",
    type: "website",
    locale: "fr_FR",
    images: [
      {
        url: "/icons/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "QRTags Logo",
      },
    ],
  },

  // Twitter
  twitter: {
    card: "summary_large_image",
    title: "QRTags - Plateforme objets perdus & trouvés via QR",
    description: "Des étiquettes QR intelligentes pour protéger vos effets personnels.",
    images: ["/icons/icon-512x512.png"],
  },

  // PWA
  manifest: "/manifest.json",

  // App info
  applicationName: "QRTags",
  appleWebApp: {
    capable: true,
    title: "QRTags",
    statusBarStyle: "black-translucent",
    startupImage: [
      { url: "/icons/icon-512x512.png", media: "(device-width: 320px)" },
    ],
  },

  // Format detection
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },

  // Other
  robots: {
    index: true,
    follow: true,
  },

  // Alternates
  alternates: {
    canonical: "https://qrtags.com",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Theme script - runs before render to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (!theme) {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  document.documentElement.classList.add(theme);
                  document.documentElement.style.colorScheme = theme;
                } catch (e) {}
              })();
            `,
          }}
        />
        {/* PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="QRTags" />
        <meta name="application-name" content="QRTags" />
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* PWA manifest & apple-touch-icon */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${inter.variable} antialiased bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white`}
      >
        <ThemeProvider>
          <AuthProvider>
            <ServiceWorkerRegistration />
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

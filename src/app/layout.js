import "./globals.css";

export const metadata = {
  title: "FlowerSpot Events & Wedding Planners | Stage Backdrops & AV Setup Coimbatore",
  description: "Bespoke wedding mandaps, reception stages, Haldi backdrops, and concert-grade LED video wall productions based in Poomarket, Coimbatore.",
  keywords: "backdrop decoration, wedding stage coimbatore, poomarket flowers, reception mandap, LED wall rent coimbatore, event decors",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { GlobalProvider } from "./context/GlobalContext";
import ToastProvider from "./context/ToastProvider";
import { WebSocketProvider } from "./context/WebSocketContext";

export const metadata: Metadata = {
  title:
    "NFTTOOLS - Outbid Competitors, Flip Fast, and Find Profitable Collections for Maximum Profit",
  description:
    "Bidding bot for OpenSea, MagicEden, and Blur. Automate your bids on OpenSea, MagicEden, and Blur using NFTTOOLS.",
  icons: "/logo-256.png",
};

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const roboto_mono = Roboto_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto-mono",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      data-theme="dark"
      lang="en"
      className={`${inter.variable} ${roboto_mono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <GlobalProvider>
          <WebSocketProvider>
            {children}
            <ToastProvider />
          </WebSocketProvider>
        </GlobalProvider>
      </body>
    </html>
  );
}

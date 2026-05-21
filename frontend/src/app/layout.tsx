import type { Metadata } from "next"
import "./globals.css"

const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"

export const metadata: Metadata = {
  title: "Shopping Assistant — AI-Powered Product Search",
  description:
    "Describe what you want to buy and let a network of AI agents find the best products for you.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={GOOGLE_FONTS_URL} />
      </head>
      <body className="min-h-screen bg-[#0e0e10] text-zinc-100 antialiased">{children}</body>
    </html>
  )
}

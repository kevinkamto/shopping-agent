import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Shopping Assistant — AI-Powered Product Search",
  description:
    "Describe what you want to buy and let a network of AI agents find the best products for you.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0e0e10] text-zinc-100 antialiased">{children}</body>
    </html>
  )
}

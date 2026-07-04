import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Language Kit",
  description: "Personal AI language practice system"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <Link className="brand" href="/">
            Language Kit
          </Link>
          <nav className="nav">
            <Link href="/">Practice</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/exports">Exports</Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}

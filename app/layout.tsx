import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Book Viewer",
  description: "A markdown book viewer with math support",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <head>
        {/* Load KaTeX CSS and JS from CDN for math rendering */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.24/dist/katex.min.css"
          integrity="sha384-tTgKLjMYmJr94v8qu2PE5MUGSMbyN2xiH266JUB3gpm8vnnJywd1dWSOEfrFz+YI"
          crossOrigin="anonymous"
        />
        <script
          defer
          src="https://cdn.jsdelivr.net/npm/katex@0.16.24/dist/katex.min.js"
          integrity="sha384-MWNUH0WmtsYGhn2cbH6ELRCbf9LG3QDqCC+gqPB3IBNO35xjZK3Ejb6oONRpDbPg"
          crossOrigin="anonymous"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme') ||
                  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                document.documentElement.classList.toggle('dark', theme === 'dark');
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// TODAS AS IMPORTAÇÕES DO CLERK FORAM REMOVIDAS

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EternaPic MVP",
  description: "Crie fotos impossíveis com IA",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // O <ClerkProvider> FOI REMOVIDO
    <html lang="en">
      <body className={inter.className}>

        {/* O CABEÇALHO DE LOGIN FOI REMOVIDO */}

        <main>
          {children}
        </main>

      </body>
    </html>
  );
}
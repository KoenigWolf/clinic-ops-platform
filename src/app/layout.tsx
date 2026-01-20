import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { getSession } from "@/lib/auth";
import { fontVariables } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Karute - 電子カルテ・オンライン診療システム",
  description: "電子カルテとオンライン診療を統合したクラウド型医療SaaS",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // RSCでセッションを1回取得し、クライアントに渡す
  // これによりuseSession()は再フェッチせずにこのセッションを使用する
  const session = await getSession();

  return (
    <html lang="ja" className={fontVariables}>
      <body className="font-sans antialiased">
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}

import { Inter } from 'next/font/google'; // Make sure to import your font

const inter = Inter({ subsets: ['latin'] }); // Initialize the font

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
import '@fontsource-variable/inter';
import '@fontsource-variable/manrope';
import './globals.css';

export const metadata = {
  title: 'Nexora — Think beyond.',
  description: 'A beautifully intelligent AI workspace powered by NVIDIA. Create, learn, and solve with Nexora.',
  applicationName: 'Nexora',
  authors: [{ name: 'Arslan /editz900s' }],
  creator: 'Arslan /editz900s',
  icons: { icon: '/icon.svg' },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0c0c10',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}

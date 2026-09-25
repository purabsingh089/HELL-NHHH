import './globals.css';

export const metadata = {
  title: 'MineStress Dashboard',
  description: 'Minecraft server performance testing platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import './globals.css';

export const metadata = {
  title: 'RecruitMerge — A calmer candidate sourcing workflow',
  description: 'Capture LinkedIn candidates, prevent duplicates, and keep your recruiting pipeline clean and organized.'
};

export const viewport = { themeColor: '#f3f5f1' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}

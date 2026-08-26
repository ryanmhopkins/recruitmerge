import './globals.css';

export const metadata = {
  title: 'RecruitMerge — Recruiting spreadsheets without data entry',
  description: 'Save candidates while you source. RecruitMerge keeps your candidate spreadsheet clean and organized.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}

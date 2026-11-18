import "@fontsource-variable/inter";
import "./globals.css";
export const metadata = { title: "ClinicRelay", description: "After-hours enquiry capture for dental clinics" };
export default function Root({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body className="font-sans">{children}</body></html>);
}

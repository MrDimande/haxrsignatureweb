import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import SmoothScroll from "@/components/providers/SmoothScroll";
import WhatsAppFloat from "@/components/ui/WhatsAppFloat";

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SmoothScroll>
      <Nav />
      <main>{children}</main>
      <Footer />
      <WhatsAppFloat />
    </SmoothScroll>
  );
}

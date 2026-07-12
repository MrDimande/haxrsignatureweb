import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HAXR Concierge — Reencaminhe, envie ou carregue",
  description:
    "Teste o HAXR Concierge: encaminhe emails, envie por WhatsApp ou carregue PDF e Excel. A IA classifica; a equipa HAXR valida antes de actualizar o painel do evento.",
};

export default function HaxrConciergeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

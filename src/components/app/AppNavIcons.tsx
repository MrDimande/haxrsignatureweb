import type { ComponentType } from "react";
import {
  BarChart3,
  Briefcase,
  Calendar,
  CheckCircle,
  ClipboardList,
  Clock,
  CreditCard,
  FileSignature,
  FileText,
  Images,
  Layers,
  Mail,
  Palette,
  QrCode,
  Settings,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";

const ICONS: Record<string, ComponentType<{ className?: string; strokeWidth?: number }>> = {
  layers: Layers,
  calendar: Calendar,
  sparkles: Sparkles,
  clipboard: ClipboardList,
  clock: Clock,
  palette: Palette,
  file: FileText,
  users: Users,
  check: CheckCircle,
  mail: Mail,
  briefcase: Briefcase,
  qr: QrCode,
  images: Images,
  signature: FileSignature,
  wallet: Wallet,
  card: CreditCard,
  chart: BarChart3,
  settings: Settings,
};

export function resolveAppNavIcon(name: string) {
  return ICONS[name] ?? Layers;
}

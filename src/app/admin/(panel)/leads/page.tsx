import * as inquiriesRepo from "@/lib/contact/inquiries.repository";
import LeadsPageClient from "./LeadsPageClient";

export default async function LeadsPage() {
  const inquiries = await inquiriesRepo.listInquiries();
  return <LeadsPageClient initialInquiries={inquiries} />;
}

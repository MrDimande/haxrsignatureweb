import { redirect } from "next/navigation";

export default function CheckinRedirectPage() {
  redirect("/admin/events/checkin");
}

import { redirect } from "next/navigation";

/** The authenticated client-area entry point. */
export default function AppIndexPage() {
  redirect("/app/dashboard");
}

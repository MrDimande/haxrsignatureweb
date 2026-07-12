import { redirect } from "next/navigation";

export default function ForProsPage() {
  redirect("/contacto?intent=fornecedor");
}

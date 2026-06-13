import { formspreeConfig, projectTypeLabels } from "@/lib/site-config";

export interface ContactFormPayload {
  name: string;
  email: string;
  projectType: string;
  message: string;
}

export function buildFormspreeBody(
  data: ContactFormPayload,
  options?: { packageLabel?: string | null }
) {
  const tipo = projectTypeLabels[data.projectType] ?? data.projectType;
  const pacote = options?.packageLabel?.trim() || "Não especificado";

  const subjectParts = [
    `[${formspreeConfig.brandName}]`,
    "Novo contacto",
    tipo,
  ];
  if (options?.packageLabel) subjectParts.push(options.packageLabel);

  const receivedAt = new Date().toLocaleString("pt-MZ", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Africa/Maputo",
  });

  return {
    _subject: subjectParts.join(" · "),
    _replyto: data.email,
    _template: "table",
    Nome: data.name,
    Email: data.email,
    "Tipo de projecto": tipo,
    Pacote: pacote,
    Mensagem: data.message,
    Origem: `Website oficial · ${formspreeConfig.siteOrigin}`,
    "Recebido em": receivedAt,
    Marca: formspreeConfig.brandName,
  };
}

export async function submitToFormspree(
  data: ContactFormPayload,
  options?: { packageLabel?: string | null }
) {
  const res = await fetch(formspreeConfig.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(buildFormspreeBody(data, options)),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(
      (err as { error?: string })?.error ?? "Falha ao enviar formulário"
    );
  }

  return res.json();
}

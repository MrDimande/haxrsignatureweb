"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import EventPublicShell from "@/components/events/EventPublicShell";
import type { CheckinLookup } from "@/lib/events/types";

type GuestRsvpPublicViewProps = {
  eventId: string;
  token: string;
  initial: CheckinLookup;
};

type FormState = {
  name: string;
  phone: string;
  email: string;
  attendance: "confirm" | "decline" | "";
  plusOnes: number;
  dietaryNotes: string;
  guestNotes: string;
};

type FieldErrors = Partial<Record<keyof FormState | "form", string>>;

export default function GuestRsvpPublicView({
  eventId,
  token,
  initial,
}: GuestRsvpPublicViewProps) {
  const [lookup, setLookup] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState<FormState>(() => ({
    name: initial.guest?.name ?? "",
    phone: initial.guest?.phone ?? "",
    email: initial.guest?.email ?? "",
    attendance: "",
    plusOnes: initial.guest?.plusOnes ?? 0,
    dietaryNotes: initial.guest?.dietaryNotes ?? "",
    guestNotes: initial.guest?.guestNotes ?? "",
  }));

  const status = lookup.guest?.status;
  const isCheckedIn = lookup.alreadyCheckedIn || status === "checked_in";
  const isConfirmed =
    lookup.confirmedRsvp ||
    lookup.alreadyConfirmed ||
    status === "confirmed" ||
    status === "checked_in";
  const isDeclined =
    lookup.declinedRsvp || lookup.alreadyDeclined || status === "declined";

  const showForm = !isCheckedIn && !isConfirmed && !isDeclined;

  const inputClass =
    "w-full bg-transparent border-b border-grey/30 focus:border-gold/50 text-white font-sans text-sm py-3 outline-none placeholder:text-grey/40 transition-colors duration-500";

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      delete next.form;
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.attendance) {
      setFieldErrors({ attendance: "Seleccione a sua participação." });
      return;
    }

    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      const res = await fetch("/api/events/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          token,
          name: form.name,
          phone: form.phone,
          email: form.email,
          attendance: form.attendance,
          plusOnes: form.plusOnes,
          dietaryNotes: form.dietaryNotes,
          guestNotes: form.guestNotes,
        }),
      });
      const data = (await res.json()) as CheckinLookup & { message?: string };

      if (!res.ok || !data.ok) {
        if (data.message) {
          setError(data.message);
        } else {
          setError("Não foi possível enviar a resposta. Tente novamente.");
        }
        return;
      }

      setLookup(data);
    } catch {
      setError("Serviço temporariamente indisponível. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const successMessage = useMemo(() => {
    if (isDeclined) {
      return "A sua resposta foi registada. Lamentamos não contar com a sua presença.";
    }
    if (isConfirmed || isCheckedIn) {
      return "Aguardamos por si no dia do evento. Obrigado pela confirmação.";
    }
    return null;
  }, [isConfirmed, isCheckedIn, isDeclined]);

  if (!lookup.ok || !lookup.guest || !lookup.event) {
    return (
      <EventPublicShell title="Convite não encontrado">
        <div className="text-center py-4">
          <p className="font-serif text-xl text-white/85">Link inválido</p>
          <p className="text-sm text-grey/55 mt-3 leading-relaxed">
            Verifique o link recebido ou contacte os anfitriões.
          </p>
        </div>
      </EventPublicShell>
    );
  }

  return (
    <EventPublicShell
      title="Confirmar presença"
      subtitle="Partilhe connosco a sua resposta e ajude-nos a preparar uma celebração impecável."
      eventName={lookup.event.name}
      eventType={lookup.event.type}
      eventDate={lookup.event.date}
      eventLocation={lookup.event.location}
      footer="RSVP Digital · HAXR Signature"
    >
      {showForm ? (
        <form onSubmit={handleSubmit} className="space-y-7" noValidate>
          <div>
            <label htmlFor="rsvp-name" className="sr-only">
              Nome completo
            </label>
            <input
              id="rsvp-name"
              type="text"
              required
              autoComplete="name"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Nome completo"
              className={inputClass}
              aria-invalid={Boolean(fieldErrors.name)}
            />
            {fieldErrors.name ? (
              <p className="text-xs text-red-400/80 mt-2">{fieldErrors.name}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="rsvp-phone" className="sr-only">
                Telefone
              </label>
              <input
                id="rsvp-phone"
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="Telefone"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="rsvp-email" className="sr-only">
                Email
              </label>
              <input
                id="rsvp-email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="Email"
                className={inputClass}
              />
            </div>
          </div>

          <fieldset>
            <legend className="font-mono text-[8px] tracking-[0.35em] uppercase text-grey/50 mb-4">
              Participação
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(
                [
                  { id: "confirm", label: "Confirmo presença" },
                  { id: "decline", label: "Não poderei participar" },
                ] as const
              ).map((option) => (
                <label
                  key={option.id}
                  className={`flex items-center gap-3 border px-4 py-4 cursor-pointer transition-colors ${
                    form.attendance === option.id
                      ? "border-gold/40 bg-gold/5"
                      : "border-grey-dark/80 hover:border-grey/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="attendance"
                    value={option.id}
                    checked={form.attendance === option.id}
                    onChange={() => updateField("attendance", option.id)}
                    className="accent-gold"
                  />
                  <span className="text-sm text-white/85">{option.label}</span>
                </label>
              ))}
            </div>
            {fieldErrors.attendance ? (
              <p className="text-xs text-red-400/80 mt-2">{fieldErrors.attendance}</p>
            ) : null}
          </fieldset>

          {form.attendance === "confirm" ? (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div>
                <label
                  htmlFor="rsvp-plus-ones"
                  className="block font-mono text-[8px] tracking-[0.35em] uppercase text-grey/50 mb-2"
                >
                  Número de acompanhantes
                </label>
                <input
                  id="rsvp-plus-ones"
                  type="number"
                  min={0}
                  max={10}
                  value={form.plusOnes}
                  onChange={(e) =>
                    updateField("plusOnes", Math.max(0, Number(e.target.value)))
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label
                  htmlFor="rsvp-dietary"
                  className="block font-mono text-[8px] tracking-[0.35em] uppercase text-grey/50 mb-2"
                >
                  Restrições alimentares
                </label>
                <textarea
                  id="rsvp-dietary"
                  rows={2}
                  value={form.dietaryNotes}
                  onChange={(e) => updateField("dietaryNotes", e.target.value)}
                  placeholder="Vegetariano, sem glúten, alergias…"
                  className="w-full bg-transparent border border-grey-dark/80 focus:border-gold/40 text-white text-sm px-3 py-3 outline-none placeholder:text-grey/40 resize-none"
                />
              </div>
            </div>
          ) : null}

          <div>
            <label
              htmlFor="rsvp-message"
              className="block font-mono text-[8px] tracking-[0.35em] uppercase text-grey/50 mb-2"
            >
              Mensagem para os anfitriões (opcional)
            </label>
            <textarea
              id="rsvp-message"
              rows={3}
              value={form.guestNotes}
              onChange={(e) => updateField("guestNotes", e.target.value)}
              placeholder="Deixe uma mensagem especial…"
              className="w-full bg-transparent border border-grey-dark/80 focus:border-gold/40 text-white text-sm px-3 py-3 outline-none placeholder:text-grey/40 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full border border-gold-dim text-gold text-[11px] tracking-[0.3em] uppercase px-6 py-4 hover:border-gold hover:bg-gold/5 transition-all duration-500 disabled:opacity-50"
          >
            {loading ? "A enviar resposta…" : "Enviar resposta"}
          </button>

          {error ? (
            <p
              role="alert"
              className="text-sm text-red-400/70 text-center leading-relaxed"
            >
              {error}
            </p>
          ) : null}
        </form>
      ) : (
        <div className="text-center space-y-5 py-4" role="status" aria-live="polite">
          {isDeclined ? (
            <XCircle className="w-12 h-12 text-red-300/70 mx-auto" aria-hidden />
          ) : (
            <CheckCircle2
              className="w-12 h-12 text-emerald-400/80 mx-auto"
              aria-hidden
            />
          )}
          <p className="font-serif text-2xl font-light text-white/90">
            Olá, {lookup.guest.name}
          </p>
          <p className="font-serif text-lg text-white/75">
            {isDeclined
              ? "Resposta registada"
              : isCheckedIn
                ? "Já registado no evento"
                : "Presença confirmada"}
          </p>
          {successMessage ? (
            <p className="text-sm text-grey/60 leading-relaxed max-w-sm mx-auto">
              {successMessage}
            </p>
          ) : null}
        </div>
      )}
    </EventPublicShell>
  );
}

"use client";

import { useState } from "react";
import type { ConciergeDestination, ConciergePriority } from "@/lib/concierge/portal/types";
import { CONCIERGE_DESTINATION_LABELS, CONCIERGE_PRIORITY_LABELS } from "@/lib/concierge/portal/presentation";
import { Mail, Link2, FileUp, StickyNote } from "lucide-react";

export type IntakeTab = "upload" | "link" | "note" | "email";

type ConciergeIntakeHubProps = {
  activeTab: IntakeTab;
  onTabChange: (tab: IntakeTab) => void;
  inboundEmail: string;
  onUpload: (payload: {
    title: string;
    description: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    fileBase64?: string;
    destination?: ConciergeDestination;
  }) => void;
  onSaveLink: (payload: {
    url: string;
    title: string;
    notes: string;
    destination?: ConciergeDestination;
  }) => void;
  onSaveNote: (payload: {
    title: string;
    body: string;
    priority: ConciergePriority;
    destination?: ConciergeDestination;
  }) => void;
  isSubmitting: boolean;
};

const TABS: Array<{ id: IntakeTab; label: string; icon: typeof FileUp }> = [
  { id: "upload", label: "Carregar ficheiro", icon: FileUp },
  { id: "link", label: "Guardar link", icon: Link2 },
  { id: "note", label: "Registar nota", icon: StickyNote },
  { id: "email", label: "Encaminhamento por email", icon: Mail },
];

const DESTINATIONS = Object.entries(CONCIERGE_DESTINATION_LABELS) as Array<
  [ConciergeDestination, string]
>;

export default function ConciergeIntakeHub({
  activeTab,
  onTabChange,
  inboundEmail,
  onUpload,
  onSaveLink,
  onSaveNote,
  isSubmitting,
}: ConciergeIntakeHubProps) {
  return (
    <section className="rounded-3xl border border-brand-champagne/15 bg-white/[0.03] p-5 md:p-6">
      <h2 className="font-mono text-[9px] font-bold uppercase tracking-widest text-brand-gold">
        Intake Hub
      </h2>
      <div
        className="mt-4 flex flex-wrap gap-2"
        role="tablist"
        aria-label="Canais de entrada do Concierge"
      >
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            onClick={() => onTabChange(id)}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 font-mono text-[8px] font-bold uppercase tracking-widest transition ${
              activeTab === id
                ? "border-brand-gold bg-brand-gold/15 text-brand-gold"
                : "border-brand-champagne/15 text-zinc-400 hover:text-white"
            }`}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6" role="tabpanel">
        {activeTab === "upload" ? (
          <UploadPanel onSubmit={onUpload} isSubmitting={isSubmitting} />
        ) : null}
        {activeTab === "link" ? (
          <LinkPanel onSubmit={onSaveLink} isSubmitting={isSubmitting} />
        ) : null}
        {activeTab === "note" ? (
          <NotePanel onSubmit={onSaveNote} isSubmitting={isSubmitting} />
        ) : null}
        {activeTab === "email" ? <EmailPanel email={inboundEmail} /> : null}
      </div>
    </section>
  );
}

function UploadPanel({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: ConciergeIntakeHubProps["onUpload"];
  isSubmitting: boolean;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [destination, setDestination] = useState<ConciergeDestination | "">("");
  const [fileMeta, setFileMeta] = useState<{
    fileName: string;
    mimeType: string;
    sizeBytes: number;
  } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!fileMeta || !title.trim() || !selectedFile) return;
        const fileBase64 = await readFileAsBase64(selectedFile);
        onSubmit({
          title: title.trim(),
          description,
          ...fileMeta,
          fileBase64,
          destination: destination || undefined,
        });
        setTitle("");
        setDescription("");
        setDestination("");
        setFileMeta(null);
        setSelectedFile(null);
      }}
    >
      <label className="block space-y-1">
        <span className="font-mono text-[8px] uppercase tracking-widest text-zinc-500">Ficheiro</span>
        <input
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.txt"
          className="block w-full text-xs text-zinc-300 file:mr-3 file:rounded-full file:border-0 file:bg-brand-gold/20 file:px-3 file:py-1.5 file:font-mono file:text-[8px] file:uppercase file:text-brand-gold"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setSelectedFile(file);
            setFileMeta({
              fileName: file.name,
              mimeType: file.type || "application/octet-stream",
              sizeBytes: file.size,
            });
            if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
          }}
        />
      </label>
      <Field label="Título" value={title} onChange={setTitle} required />
      <TextArea label="Descrição" value={description} onChange={setDescription} />
      <DestinationSelect value={destination} onChange={setDestination} />
      <SubmitButton loading={isSubmitting} label="Enviar ficheiro" />
    </form>
  );
}

function LinkPanel({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: ConciergeIntakeHubProps["onSaveLink"];
  isSubmitting: boolean;
}) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [destination, setDestination] = useState<ConciergeDestination | "">("");

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!url.trim() || !title.trim()) return;
        onSubmit({ url: url.trim(), title: title.trim(), notes, destination: destination || undefined });
        setUrl("");
        setTitle("");
        setNotes("");
        setDestination("");
      }}
    >
      <Field label="URL" value={url} onChange={setUrl} required type="url" />
      <Field label="Título da página" value={title} onChange={setTitle} required />
      <TextArea label="Notas" value={notes} onChange={setNotes} />
      <DestinationSelect value={destination} onChange={setDestination} />
      <p className="font-sans text-[11px] text-zinc-500">
        Preparado para futura extensão HAXR Web Clipper.
      </p>
      <SubmitButton loading={isSubmitting} label="Guardar link" />
    </form>
  );
}

function NotePanel({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: ConciergeIntakeHubProps["onSaveNote"];
  isSubmitting: boolean;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<ConciergePriority>("media");
  const [destination, setDestination] = useState<ConciergeDestination | "">("");

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim() || !body.trim()) return;
        onSubmit({ title: title.trim(), body: body.trim(), priority, destination: destination || undefined });
        setTitle("");
        setBody("");
        setPriority("media");
        setDestination("");
      }}
    >
      <Field label="Título" value={title} onChange={setTitle} required />
      <TextArea label="Nota" value={body} onChange={setBody} required rows={4} />
      <label className="block space-y-1">
        <span className="font-mono text-[8px] uppercase tracking-widest text-zinc-500">Prioridade</span>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as ConciergePriority)}
          className="w-full rounded-xl border border-brand-champagne/15 bg-black/40 px-3 py-2 text-sm text-white"
        >
          {(Object.entries(CONCIERGE_PRIORITY_LABELS) as Array<[ConciergePriority, string]>).map(
            ([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            )
          )}
        </select>
      </label>
      <DestinationSelect value={destination} onChange={setDestination} />
      <SubmitButton loading={isSubmitting} label="Registar nota" />
    </form>
  );
}

function EmailPanel({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="space-y-4 rounded-2xl border border-dashed border-brand-gold/25 bg-brand-gold/5 p-5">
      <p className="font-sans text-sm text-zinc-300">
        Encaminhe emails de propostas, recibos, contratos ou listas para o endereço dedicado do HAXR
        Concierge.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <code className="rounded-lg bg-black/40 px-3 py-2 font-mono text-sm text-brand-gold">
          {email}
        </code>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(email);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          }}
          className="rounded-full border border-brand-gold/30 px-3 py-1.5 font-mono text-[8px] uppercase tracking-widest text-brand-gold"
        >
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <p className="font-sans text-xs text-zinc-500">
        Integração de email inbound será activada na próxima fase. Integração futura — separada do
        email marketing.
      </p>
      {/* TODO: Integrar email inbound separado do email marketing. */}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block space-y-1">
      <span className="font-mono text-[8px] uppercase tracking-widest text-zinc-500">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-brand-champagne/15 bg-black/40 px-3 py-2 text-sm text-white"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  required,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  rows?: number;
}) {
  return (
    <label className="block space-y-1">
      <span className="font-mono text-[8px] uppercase tracking-widest text-zinc-500">{label}</span>
      <textarea
        value={value}
        required={required}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-brand-champagne/15 bg-black/40 px-3 py-2 text-sm text-white"
      />
    </label>
  );
}

function DestinationSelect({
  value,
  onChange,
}: {
  value: ConciergeDestination | "";
  onChange: (v: ConciergeDestination | "") => void;
}) {
  return (
    <label className="block space-y-1">
      <span className="font-mono text-[8px] uppercase tracking-widest text-zinc-500">
        Destino sugerido (opcional)
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ConciergeDestination | "")}
        className="w-full rounded-xl border border-brand-champagne/15 bg-black/40 px-3 py-2 text-sm text-white"
      >
        <option value="">Classificação assistida</option>
        {DESTINATIONS.map(([val, label]) => (
          <option key={val} value={val}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="rounded-full bg-brand-gold px-5 py-2 font-mono text-[9px] font-bold uppercase tracking-widest text-brand-black disabled:opacity-50"
    >
      {loading ? "A processar…" : label}
    </button>
  );
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Falha ao ler ficheiro."));
        return;
      }
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error ?? new Error("Falha ao ler ficheiro."));
    reader.readAsDataURL(file);
  });
}

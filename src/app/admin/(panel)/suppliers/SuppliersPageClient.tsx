"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileSearch,
  History,
  Mail,
  MapPin,
  Search,
  ShieldCheck,
  Trash2,
  UserRoundCheck,
  XCircle,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import {
  removeSupplierUatAction,
  reviewSupplierApplicationAction,
  saveSupplierProfileAction,
} from "@/lib/admin/actions/suppliers.actions";
import {
  suggestSupplierSlug,
  type AdminSupplierProfile,
  type SupplierApplicationStatus,
  type SupplierBackofficeSnapshot,
  type SupplierProfileInput,
  type SupplierPublicationStatus,
} from "@/lib/admin/suppliers.types";
import {
  getSupplierCategoryLabel,
  normalizeSupplierCategory,
  SUPPLIER_CATEGORIES,
} from "@/lib/vendors/marketplace";

type Props = {
  initialSnapshot: SupplierBackofficeSnapshot;
  initialError?: string;
};

const applicationLabels: Record<SupplierApplicationStatus, string> = {
  pending: "Pendente",
  in_review: "Em revisão",
  approved: "Aprovada",
  rejected: "Rejeitada",
  withdrawn: "Retirada",
};

const applicationStyles: Record<SupplierApplicationStatus, string> = {
  pending: "border-amber-400/25 bg-amber-400/10 text-amber-200",
  in_review: "border-sky-400/25 bg-sky-400/10 text-sky-200",
  approved: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
  rejected: "border-red-400/25 bg-red-400/10 text-red-200",
  withdrawn: "border-white/10 bg-white/5 text-grey/70",
};

const publicationLabels: Record<SupplierPublicationStatus, string> = {
  draft: "Rascunho",
  pending_review: "Pronto para revisão",
  published: "Publicado",
  suspended: "Suspenso",
};

const moderationActionLabels: Record<string, string> = {
  review_started: "Revisão iniciada",
  application_approved: "Candidatura aprovada",
  application_rejected: "Candidatura rejeitada",
  profile_saved: "Perfil actualizado",
  profile_published: "Perfil publicado",
  profile_suspended: "Perfil suspenso",
  profile_moved_to_review: "Perfil enviado para revisão",
  profile_unpublished: "Perfil retirado do directório",
  uat_removed: "Registo UAT removido",
};

function formatDate(value: string): string {
  return new Date(value).toLocaleString("pt-MZ", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Maputo",
  });
}

function StatusPill({ status }: { status: SupplierApplicationStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.18em] ${applicationStyles[status]}`}
    >
      {applicationLabels[status]}
    </span>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-2 block font-mono text-[8px] uppercase tracking-[0.22em] text-grey/55">
      {children}
    </span>
  );
}

function ProfileEditor({
  profile,
  onSaved,
}: {
  profile: AdminSupplierProfile;
  onSaved: (message: string) => void;
}) {
  const [form, setForm] = useState({
    slug: profile.slug,
    businessName: profile.businessName,
    category: normalizeSupplierCategory(profile.category),
    city: profile.city,
    shortDescription: profile.shortDescription,
    about: profile.about,
    publicEmail: profile.publicEmail ?? "",
    publicPhone: profile.publicPhone ?? "",
    websiteUrl: profile.websiteUrl ?? "",
    instagramUrl: profile.instagramUrl ?? "",
    serviceLevel: profile.serviceLevel ?? "",
    servicesText: profile.services.join("\n"),
    publicationStatus: profile.publicationStatus,
    isVerified: profile.isVerified,
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [publicationConfirmed, setPublicationConfirmed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isNewPublication =
    form.publicationStatus === "published" &&
    profile.publicationStatus !== "published";

  function update<Key extends keyof typeof form>(
    key: Key,
    value: (typeof form)[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSave() {
    setError("");
    setMessage("");
    const input: SupplierProfileInput = {
      profileId: profile.id,
      slug: form.slug,
      businessName: form.businessName,
      category: form.category,
      city: form.city,
      shortDescription: form.shortDescription,
      about: form.about,
      publicEmail: form.publicEmail || null,
      publicPhone: form.publicPhone || null,
      websiteUrl: form.websiteUrl || null,
      instagramUrl: form.instagramUrl || null,
      serviceLevel: form.serviceLevel || null,
      services: form.servicesText
        .split(/[\n,]/)
        .map((value) => value.trim())
        .filter(Boolean),
      publicationStatus: form.publicationStatus,
      isVerified: form.isVerified,
    };

    startTransition(async () => {
      const result = await saveSupplierProfileAction(input);
      if (!result.success) {
        setError(result.error);
        return;
      }
      const confirmation =
        form.publicationStatus === "published"
          ? "Perfil guardado e publicado no directório."
          : "Perfil guardado com sucesso.";
      setMessage(confirmation);
      onSaved(confirmation);
    });
  }

  return (
    <section className="space-y-6 border-t border-white/[0.06] pt-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-[8px] uppercase tracking-[0.32em] text-admin-gold/80">
            Perfil público
          </p>
          <h3 className="mt-2 font-serif text-2xl font-light text-white/95">
            Conteúdo e publicação
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-grey/60">
            Guardar não publica automaticamente. O directório só mostra o perfil
            quando seleccionar explicitamente «Publicado».
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {profile.isTestRecord ? (
            <span className="rounded-full border border-violet-400/25 bg-violet-400/10 px-3 py-1 font-mono text-[8px] uppercase tracking-widest text-violet-200">
              UAT
            </span>
          ) : null}
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-[8px] uppercase tracking-widest text-grey/70">
            {publicationLabels[profile.publicationStatus]}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <label>
          <FieldLabel>Nome comercial</FieldLabel>
          <input value={form.businessName} onChange={(event) => update("businessName", event.target.value)} className="admin-input w-full" maxLength={120} />
        </label>
        <label>
          <FieldLabel>Slug do directório</FieldLabel>
          <input value={form.slug} onChange={(event) => update("slug", event.target.value.toLowerCase())} className="admin-input w-full font-mono" maxLength={120} />
        </label>
        <label>
          <FieldLabel>Categoria</FieldLabel>
          <select value={form.category} onChange={(event) => update("category", event.target.value as typeof form.category)} className="admin-input w-full">
            {SUPPLIER_CATEGORIES.map((category) => (
              <option key={category.id} value={category.id} className="bg-black">{category.label}</option>
            ))}
          </select>
        </label>
        <label>
          <FieldLabel>Cidade</FieldLabel>
          <input value={form.city} onChange={(event) => update("city", event.target.value)} className="admin-input w-full" maxLength={80} />
        </label>
        <label className="md:col-span-2">
          <FieldLabel>Descrição curta</FieldLabel>
          <input value={form.shortDescription} onChange={(event) => update("shortDescription", event.target.value)} className="admin-input w-full" maxLength={320} placeholder="Resumo claro para o cartão do fornecedor" />
        </label>
        <label className="md:col-span-2">
          <FieldLabel>Apresentação</FieldLabel>
          <textarea value={form.about} onChange={(event) => update("about", event.target.value)} className="admin-input min-h-36 w-full resize-y" maxLength={5000} placeholder="Experiência, abordagem e informação útil para os noivos" />
        </label>
        <label>
          <FieldLabel>Email público</FieldLabel>
          <input type="email" value={form.publicEmail} onChange={(event) => update("publicEmail", event.target.value)} className="admin-input w-full" maxLength={254} />
        </label>
        <label>
          <FieldLabel>Telefone público</FieldLabel>
          <input value={form.publicPhone} onChange={(event) => update("publicPhone", event.target.value)} className="admin-input w-full" maxLength={40} />
        </label>
        <label>
          <FieldLabel>Website</FieldLabel>
          <input type="url" value={form.websiteUrl} onChange={(event) => update("websiteUrl", event.target.value)} className="admin-input w-full" placeholder="https://" />
        </label>
        <label>
          <FieldLabel>Instagram</FieldLabel>
          <input type="url" value={form.instagramUrl} onChange={(event) => update("instagramUrl", event.target.value)} className="admin-input w-full" placeholder="https://instagram.com/..." />
        </label>
        <label>
          <FieldLabel>Nível de serviço</FieldLabel>
          <input value={form.serviceLevel} onChange={(event) => update("serviceLevel", event.target.value)} className="admin-input w-full" maxLength={120} placeholder="Premium, personalizado, por reserva…" />
        </label>
        <label>
          <FieldLabel>Serviços (um por linha)</FieldLabel>
          <textarea value={form.servicesText} onChange={(event) => update("servicesText", event.target.value)} className="admin-input min-h-24 w-full resize-y" placeholder={"Casamentos\nEventos corporativos"} />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-5 border-t border-white/[0.05] pt-6 sm:grid-cols-2">
        <label>
          <FieldLabel>Estado editorial</FieldLabel>
          <select value={form.publicationStatus} onChange={(event) => update("publicationStatus", event.target.value as SupplierPublicationStatus)} className="admin-input w-full">
            <option value="draft" className="bg-black">Rascunho privado</option>
            <option value="pending_review" className="bg-black">Pronto para revisão</option>
            <option value="published" className="bg-black">Publicado no directório</option>
            <option value="suspended" className="bg-black">Suspenso</option>
          </select>
        </label>
        <label className="flex items-center gap-3 self-end rounded-sm border border-white/[0.07] px-4 py-3.5">
          <input type="checkbox" checked={form.isVerified} onChange={(event) => update("isVerified", event.target.checked)} className="accent-[#C7A34A]" />
          <span className="text-sm text-white/75">Fornecedor verificado pela HAXR</span>
        </label>
      </div>

      {isNewPublication ? (
        <label className="flex cursor-pointer gap-3 border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-sm leading-relaxed text-amber-100/80">
          <input
            type="checkbox"
            checked={publicationConfirmed}
            onChange={(event) => setPublicationConfirmed(event.target.checked)}
            className="mt-1 accent-amber-400"
          />
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Confirmo que revi contactos, texto e links. Ao guardar, este perfil
            ficará imediatamente visível em /fornecedores.
          </span>
        </label>
      ) : null}
      {error ? <p role="alert" className="border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-200">{error}</p> : null}
      {message ? <p role="status" className="border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-200">{message}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={handleSave} disabled={isPending || (isNewPublication && !publicationConfirmed)} className="admin-btn-primary disabled:cursor-not-allowed disabled:opacity-50">
          <ShieldCheck className="h-4 w-4" /> {isPending ? "A guardar…" : "Guardar perfil"}
        </button>
        {profile.publicationStatus === "published" ? (
          <a href={`/fornecedores/${profile.slug}`} target="_blank" rel="noopener noreferrer" className="admin-btn-secondary inline-flex items-center gap-2">
            <ExternalLink className="h-4 w-4" /> Ver página pública
          </a>
        ) : null}
      </div>
    </section>
  );
}

export default function SuppliersPageClient({
  initialSnapshot,
  initialError = "",
}: Props) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [selectedId, setSelectedId] = useState(initialSnapshot.applications[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<SupplierApplicationStatus | "all">("all");
  const [reviewNotes, setReviewNotes] = useState("");
  const [slug, setSlug] = useState("");
  const [isTestRecord, setIsTestRecord] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [error, setError] = useState(initialError);
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setSnapshot(initialSnapshot);
    setError(initialError);
    setSelectedId((current) =>
      initialSnapshot.applications.some((item) => item.id === current)
        ? current
        : (initialSnapshot.applications[0]?.id ?? ""),
    );
  }, [initialSnapshot, initialError]);

  const selected = snapshot.applications.find((item) => item.id === selectedId);
  const selectedProfile = snapshot.profiles.find((item) => item.applicationId === selectedId);
  const selectedEvents = snapshot.recentEvents.filter(
    (item) =>
      item.applicationId === selectedId ||
      (selectedProfile ? item.supplierProfileId === selectedProfile.id : false),
  );

  useEffect(() => {
    if (!selected) return;
    setReviewNotes(selected.reviewNotes ?? "");
    setSlug(selectedProfile?.slug ?? suggestSupplierSlug(selected.supplierName));
    setIsTestRecord(selected.isTestRecord);
    setConfirmName("");
    setSuccess("");
    setError(initialError);
  }, [selectedId, selected, selectedProfile, initialError]);

  const filteredApplications = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("pt-PT");
    return snapshot.applications.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (!needle) return true;
      return [item.supplierName, item.responsibleName, item.email, item.city, item.category]
        .join(" ")
        .toLocaleLowerCase("pt-PT")
        .includes(needle);
    });
  }, [query, snapshot.applications, statusFilter]);

  const pendingCount = snapshot.applications.filter((item) => item.status === "pending").length;
  const reviewCount = snapshot.applications.filter((item) => item.status === "in_review").length;
  const publishedCount = snapshot.profiles.filter((item) => item.publicationStatus === "published").length;

  function refresh(message: string) {
    setSuccess(message);
    router.refresh();
  }

  function runReview(status: "in_review" | "approved" | "rejected") {
    if (!selected) return;
    setError("");
    setSuccess("");
    startTransition(async () => {
      const result = await reviewSupplierApplicationAction({
        applicationId: selected.id,
        status,
        reviewNotes: reviewNotes || null,
        slug: status === "approved" ? slug : null,
        isTestRecord,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      refresh(
        status === "approved"
          ? "Candidatura aprovada; foi criado um perfil privado em rascunho."
          : status === "rejected"
            ? "Candidatura rejeitada e registada na auditoria."
            : "Revisão iniciada.",
      );
    });
  }

  function removeUat() {
    if (!selected?.isTestRecord) return;
    setError("");
    setSuccess("");
    startTransition(async () => {
      const result = await removeSupplierUatAction({
        applicationId: selected.id,
        expectedSupplierName: confirmName,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSelectedId("");
      refresh("Registo UAT removido; a operação permanece na auditoria.");
    });
  }

  return (
    <AdminShell
      title="Fornecedores"
      subtitle="Revisão, publicação e recomendação de profissionais"
      actions={
        <a href="/fornecedores" target="_blank" rel="noopener noreferrer" className="admin-btn-secondary inline-flex items-center gap-2">
          <ExternalLink className="h-4 w-4" /> Ver directório
        </a>
      }
    >
      <div className="space-y-6">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Candidaturas", value: snapshot.applications.length, icon: Building2 },
            { label: "Pendentes", value: pendingCount, icon: Clock3 },
            { label: "Em revisão", value: reviewCount, icon: FileSearch },
            { label: "Publicados", value: publishedCount, icon: BadgeCheck },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="admin-card flex items-center justify-between p-5">
              <div>
                <p className="font-mono text-[8px] uppercase tracking-[0.24em] text-grey/45">{label}</p>
                <p className="mt-2 font-serif text-3xl font-light text-white/90">{value}</p>
              </div>
              <div className="rounded-full border border-admin-gold/15 bg-admin-gold/[0.05] p-3 text-admin-gold/75"><Icon className="h-4 w-4" /></div>
            </div>
          ))}
        </section>

        {initialError ? (
          <div role="alert" className="flex gap-3 border border-red-500/20 bg-red-500/[0.06] p-4 text-sm leading-relaxed text-red-100/80">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {initialError}
          </div>
        ) : null}

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.8fr)]">
          <aside className="admin-card h-fit overflow-hidden xl:sticky xl:top-0">
            <div className="space-y-3 border-b border-white/[0.05] p-4">
              <label className="relative block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grey/40" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} className="admin-input w-full pl-10" placeholder="Pesquisar fornecedor…" aria-label="Pesquisar candidaturas" />
              </label>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as SupplierApplicationStatus | "all")} className="admin-input w-full" aria-label="Filtrar por estado">
                <option value="all" className="bg-black">Todos os estados</option>
                {Object.entries(applicationLabels).map(([status, label]) => <option key={status} value={status} className="bg-black">{label}</option>)}
              </select>
            </div>
            <div className="max-h-[60vh] overflow-y-auto" data-lenis-prevent>
              {filteredApplications.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <Building2 className="mx-auto h-6 w-6 text-admin-gold/40" />
                  <p className="mt-4 text-sm text-grey/60">
                    {snapshot.applications.length === 0 ? "Ainda não existem candidaturas." : "Nenhuma candidatura corresponde ao filtro."}
                  </p>
                </div>
              ) : filteredApplications.map((item) => (
                <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={`block w-full border-b border-white/[0.04] px-5 py-4 text-left transition-colors last:border-0 ${item.id === selectedId ? "bg-admin-gold/[0.07]" : "hover:bg-white/[0.025]"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white/90">{item.supplierName}</p>
                      <p className="mt-1 truncate text-xs text-grey/50">{getSupplierCategoryLabel(normalizeSupplierCategory(item.category))} · {item.city}</p>
                    </div>
                    {item.isTestRecord ? <span className="font-mono text-[7px] uppercase tracking-widest text-violet-300">UAT</span> : null}
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <StatusPill status={item.status} />
                    <span className="font-mono text-[8px] text-grey/35">{formatDate(item.createdAt)}</span>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <div className="admin-card min-w-0 p-5 md:p-8">
            {!selected ? (
              <div className="flex min-h-96 flex-col items-center justify-center text-center">
                <UserRoundCheck className="h-8 w-8 text-admin-gold/45" />
                <h2 className="mt-5 font-serif text-2xl font-light text-white/85">Seleccione uma candidatura</h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-grey/55">Reveja a informação submetida antes de criar ou publicar qualquer perfil.</p>
              </div>
            ) : (
              <div className="space-y-7">
                <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <StatusPill status={selected.status} />
                      {selected.isTestRecord ? <span className="rounded-full border border-violet-400/25 bg-violet-400/10 px-2.5 py-1 font-mono text-[8px] uppercase tracking-widest text-violet-200">Registo UAT</span> : null}
                    </div>
                    <h2 className="mt-4 font-serif text-3xl font-light text-white/95">{selected.supplierName}</h2>
                    <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-grey/60"><MapPin className="h-4 w-4 text-admin-gold/60" />{selected.city} · {getSupplierCategoryLabel(normalizeSupplierCategory(selected.category))}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a href={`mailto:${selected.email}`} className="admin-btn-secondary inline-flex items-center gap-2"><Mail className="h-4 w-4" /> Email</a>
                    {selected.portfolioUrl ? <a href={selected.portfolioUrl} target="_blank" rel="noopener noreferrer" className="admin-btn-secondary inline-flex items-center gap-2"><ExternalLink className="h-4 w-4" /> Portfólio</a> : null}
                  </div>
                </header>

                <section className="grid grid-cols-1 gap-4 border-y border-white/[0.05] py-6 md:grid-cols-2">
                  {[["Responsável", selected.responsibleName], ["Email privado", selected.email], ["Telefone privado", selected.phone], ["Recebida", formatDate(selected.createdAt)]].map(([label, value]) => (
                    <div key={label}><p className="font-mono text-[8px] uppercase tracking-[0.22em] text-grey/40">{label}</p><p className="mt-1.5 break-words text-sm text-white/75">{value}</p></div>
                  ))}
                  <div className="md:col-span-2"><p className="font-mono text-[8px] uppercase tracking-[0.22em] text-grey/40">Mensagem</p><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-grey/70">{selected.message || "Sem mensagem adicional."}</p></div>
                </section>

                {selected.status === "pending" || selected.status === "in_review" ? (
                  <section className="space-y-5">
                    <div><p className="font-mono text-[8px] uppercase tracking-[0.32em] text-admin-gold/80">Decisão</p><h3 className="mt-2 font-serif text-2xl font-light text-white/90">Revisão controlada</h3><p className="mt-2 text-sm leading-relaxed text-grey/60">Aprovar cria apenas um perfil privado em rascunho. A publicação é posterior e explícita.</p></div>
                    <label><FieldLabel>Notas internas</FieldLabel><textarea value={reviewNotes} onChange={(event) => setReviewNotes(event.target.value)} className="admin-input min-h-28 w-full resize-y" maxLength={2000} placeholder="Validação, documentação, próximos passos…" /></label>
                    <label><FieldLabel>Slug proposto</FieldLabel><input value={slug} onChange={(event) => setSlug(event.target.value.toLowerCase())} className="admin-input w-full font-mono" maxLength={120} /></label>
                    <label className="flex items-start gap-3 rounded-sm border border-violet-400/15 bg-violet-400/[0.04] p-4">
                      <input type="checkbox" checked={isTestRecord} onChange={(event) => setIsTestRecord(event.target.checked)} className="mt-1 accent-violet-400" />
                      <span><span className="block text-sm text-violet-100/85">Candidatura criada exclusivamente para UAT</span><span className="mt-1 block text-xs leading-relaxed text-grey/55">Não marque candidaturas reais. Apenas registos UAT podem ser removidos.</span></span>
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {selected.status === "pending" ? <button type="button" onClick={() => runReview("in_review")} disabled={isPending} className="admin-btn-secondary disabled:opacity-50"><FileSearch className="h-4 w-4" /> Iniciar revisão</button> : null}
                      <button type="button" onClick={() => runReview("approved")} disabled={isPending} className="admin-btn-primary disabled:opacity-50"><CheckCircle2 className="h-4 w-4" /> Aprovar em rascunho</button>
                      <button type="button" onClick={() => runReview("rejected")} disabled={isPending} className="inline-flex items-center gap-2 border border-red-500/25 px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.18em] text-red-200 hover:bg-red-500/10 disabled:opacity-50"><XCircle className="h-4 w-4" /> Rejeitar</button>
                    </div>
                  </section>
                ) : null}

                {error ? <p role="alert" className="border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-200">{error}</p> : null}
                {success ? <p role="status" className="border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-200">{success}</p> : null}

                {selectedProfile ? (
                  <ProfileEditor key={`${selectedProfile.id}-${selectedProfile.updatedAt}`} profile={selectedProfile} onSaved={refresh} />
                ) : selected.status === "approved" ? (
                  <div className="border border-red-500/20 bg-red-500/[0.04] p-4 text-sm text-red-100/75">A candidatura está aprovada, mas não possui perfil associado. Não publique até reconciliar este estado.</div>
                ) : null}

                {selectedEvents.length > 0 ? (
                  <section className="space-y-4 border-t border-white/[0.06] pt-7">
                    <div className="flex items-center gap-3">
                      <History className="h-4 w-4 text-admin-gold/70" />
                      <div>
                        <p className="font-mono text-[8px] uppercase tracking-[0.25em] text-admin-gold/75">Auditoria</p>
                        <p className="mt-1 text-xs text-grey/50">Últimas operações registadas para este fornecedor.</p>
                      </div>
                    </div>
                    <ol className="divide-y divide-white/[0.04] border-y border-white/[0.05]">
                      {selectedEvents.slice(0, 6).map((event) => (
                        <li key={event.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm text-white/75">{moderationActionLabels[event.action] ?? event.action}</p>
                            <p className="mt-1 font-mono text-[8px] tracking-wide text-grey/35">{event.actorEmail}</p>
                          </div>
                          <div className="text-left sm:text-right">
                            {event.nextStatus ? <p className="font-mono text-[8px] uppercase tracking-wider text-admin-gold/60">{event.previousStatus ?? "—"} → {event.nextStatus}</p> : null}
                            <p className="mt-1 font-mono text-[8px] text-grey/35">{formatDate(event.createdAt)}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </section>
                ) : null}

                {selected.isTestRecord ? (
                  <section className="space-y-4 border-t border-red-500/15 pt-7">
                    <div className="flex items-start gap-3"><Trash2 className="mt-1 h-4 w-4 shrink-0 text-red-300" /><div><p className="font-mono text-[8px] uppercase tracking-[0.25em] text-red-300/80">Higiene UAT</p><p className="mt-2 text-sm leading-relaxed text-grey/60">A remoção é permitida apenas porque candidatura e perfil estão marcados como teste. Escreva o nome exacto para confirmar.</p></div></div>
                    <input value={confirmName} onChange={(event) => setConfirmName(event.target.value)} className="admin-input w-full" placeholder={selected.supplierName} aria-label="Confirmar nome do fornecedor UAT" />
                    <button type="button" onClick={removeUat} disabled={isPending || confirmName.trim() !== selected.supplierName.trim()} className="inline-flex items-center gap-2 border border-red-500/30 bg-red-500/[0.06] px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.18em] text-red-200 hover:bg-red-500/12 disabled:cursor-not-allowed disabled:opacity-35"><Trash2 className="h-4 w-4" /> Remover registo UAT</button>
                  </section>
                ) : null}
              </div>
            )}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

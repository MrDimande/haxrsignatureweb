"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Plus,
  Search,
  Edit3,
  CheckCircle2,
  ExternalLink,
  X,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
  Eye,
  Loader2,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  History,
  FileCheck,
  Clock,
} from "lucide-react";
import type {
  PortfolioProject,
  PortfolioCategory,
  PortfolioCategoryId,
  PortfolioGalleryImage,
  PortfolioCredit,
  ProjectType,
  EditorialReviewStatus,
  ClientConsentStatus,
  PortfolioAuditLogEntry,
} from "@/lib/portfolio/types";

type PortfolioAdminClientProps = {
  initialProjects: readonly PortfolioProject[];
  categories: readonly PortfolioCategory[];
};

export default function PortfolioAdminClient({
  initialProjects,
  categories,
}: PortfolioAdminClientProps) {
  const [projects, setProjects] = useState<PortfolioProject[]>([...initialProjects]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Histórico de Auditoria
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [auditLogs, setAuditLogs] = useState<PortfolioAuditLogEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Filtros
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.services.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    const matchesStatus = selectedStatus === "all" || p.status === selectedStatus;
    const matchesType = selectedType === "all" || p.projectType === selectedType;

    return matchesSearch && matchesCategory && matchesStatus && matchesType;
  });

  // Estatísticas
  const totalCount = projects.length;
  const publishedCount = projects.filter((p) => p.status === "published").length;
  const draftCount = projects.filter((p) => p.status === "draft").length;
  const realCount = projects.filter((p) => p.projectType === "real" || p.isReal).length;

  const showFeedback = (text: string, type: "success" | "error" = "success") => {
    setFeedbackMessage({ text, type });
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  const loadAuditHistory = async () => {
    setIsLoadingHistory(true);
    setShowHistoryModal(true);
    try {
      const res = await fetch("/api/admin/portfolio?history=true");
      const data = await res.json();
      if (data.success && Array.isArray(data.auditLog)) {
        setAuditLogs(data.auditLog);
      }
    } catch {
      showFeedback("Falha ao carregar histórico de auditoria.", "error");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    // Trava de publicação segura no cliente
    if (editingProject.status === "published") {
      if (
        editingProject.editorialReviewStatus !== "approved" ||
        editingProject.publicationAuthorized !== true ||
        editingProject.clientConsentStatus !== "AUTHORIZED"
      ) {
        showFeedback(
          "Não é possível publicar: o projecto requer Aprovação Editorial ('approved'), Consentimento Confirmado ('AUTHORIZED') e Autorização expressa de publicação. Ajuste as opções na secção 'Governança & Direitos'.",
          "error"
        );
        setIsSaving(false);
        return;
      }
    }

    try {
      const url = isCreating
        ? "/api/admin/portfolio"
        : `/api/admin/portfolio/${editingProject.id}`;
      const method = isCreating ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingProject),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erro ao guardar no servidor.");
      }

      const savedProject: PortfolioProject = data.project;

      if (isCreating) {
        setProjects((prev) => [savedProject, ...prev]);
        showFeedback(`Projecto "${savedProject.title}" criado e persistido com sucesso.`);
      } else {
        setProjects((prev) =>
          prev.map((p) => (p.id === savedProject.id ? savedProject : p))
        );
        showFeedback(`Projecto "${savedProject.title}" actualizado no servidor com sucesso.`);
      }

      setEditingProject(null);
      setIsCreating(false);
    } catch (error) {
      showFeedback(
        error instanceof Error ? error.message : "Falha na comunicação com o servidor.",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (
    project: PortfolioProject,
    newStatus: "published" | "draft" | "archived"
  ) => {
    // Validação de publicação segura na interface
    if (newStatus === "published") {
      if (
        project.editorialReviewStatus !== "approved" ||
        project.publicationAuthorized !== true ||
        project.clientConsentStatus !== "AUTHORIZED"
      ) {
        showFeedback(
          "Não é possível publicar: o projecto requer Aprovação Editorial ('approved'), Consentimento ('AUTHORIZED') e Autorização expressa. Edite o projecto para satisfazer as condições de governança.",
          "error"
        );
        return;
      }
    }

    try {
      const res = await fetch(`/api/admin/portfolio/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erro ao alterar estado.");
      }

      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, status: newStatus } : p))
      );
      showFeedback(`Estado de "${project.title}" alterado para ${newStatus}.`);
    } catch (error) {
      showFeedback(
        error instanceof Error ? error.message : "Falha ao alterar estado.",
        "error"
      );
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/portfolio/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erro ao eliminar projecto.");
      }

      setProjects((prev) => prev.filter((p) => p.id !== id));
      setDeleteConfirmId(null);
      showFeedback("Projecto eliminado com sucesso.");
    } catch (error) {
      showFeedback(
        error instanceof Error ? error.message : "Falha ao eliminar projecto.",
        "error"
      );
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "cover" | "gallery"
  ) => {
    const file = e.target.files?.[0];
    if (!file || !editingProject) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectSlug", editingProject.slug || "geral");

    try {
      const res = await fetch("/api/admin/portfolio/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Falha no envio da fotografia.");
      }

      if (target === "cover") {
        setEditingProject({ ...editingProject, coverImage: data.url });
        showFeedback("Fotografia de capa carregada com sucesso.");
      } else {
        const newImage: PortfolioGalleryImage = {
          src: data.url,
          alt: `${editingProject.title} fotografia`,
          caption: "",
          authorCredit: "",
          aspectRatio: "landscape",
          order: editingProject.gallery.length + 1,
        };
        setEditingProject({
          ...editingProject,
          gallery: [...editingProject.gallery, newImage],
        });
        showFeedback("Fotografia adicionada à galeria.");
      }
    } catch (error) {
      showFeedback(
        error instanceof Error ? error.message : "Erro ao carregar ficheiro.",
        "error"
      );
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const moveGalleryImage = (index: number, direction: "up" | "down") => {
    if (!editingProject) return;
    const gallery = [...editingProject.gallery];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= gallery.length) return;

    const temp = gallery[index];
    gallery[index] = gallery[targetIndex];
    gallery[targetIndex] = temp;

    setEditingProject({ ...editingProject, gallery });
  };

  const startCreate = () => {
    const timestamp = Date.now();
    const newProject: PortfolioProject = {
      id: `project-${timestamp}`,
      slug: `novo-projecto-${timestamp}`,
      title: "",
      subtitle: "",
      category: "casamentos-lobolos",
      categoryLabel: "Casamentos & Lobolos",
      location: "Maputo · Moçambique",
      year: new Date().getFullYear().toString(),
      guestCount: "",
      isReal: true,
      projectType: "real",
      status: "draft",
      editorialReviewStatus: "pending_review",
      publicationAuthorized: false,
      clientConsentStatus: "CONFIRMATION_PENDING",
      authorizationNotes: "Pendente de validação de termo de autorização documental dos anfitriões.",
      materialSource: "Arquivo HAXR Signature Atelier",
      displayOrder: projects.length + 1,
      isFeatured: false,
      coverImage: "/images/casamento-vania-fabiao-evelyn-eventos.webp",
      coverAspect: "landscape",
      services: ["Assessoria Completa", "Direcção Criativa"],
      summary: "",
      narrative: {
        vision: "",
        challenge: "",
        signature: "",
        result: "",
      },
      gallery: [],
      details: [],
      credits: [],
      publishedAt: new Date().toISOString().split("T")[0],
      seo: {
        title: "",
        description: "",
        keywords: [],
      },
    };

    setEditingProject(newProject);
    setIsCreating(true);
  };

  return (
    <div className="space-y-8">
      {/* Mensagem de Feedback */}
      {feedbackMessage ? (
        <div
          className={`p-4 rounded-xl border font-mono text-xs flex items-center justify-between animate-fadeIn ${
            feedbackMessage.type === "success"
              ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
              : "bg-red-950/40 border-red-500/40 text-red-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="hover:opacity-75"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : null}

      {/* Cartões de Indicadores (KPIs) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="admin-card p-5 border border-admin-gold/20 bg-brand-black-soft/70">
          <p className="font-mono text-[9px] tracking-widest text-grey-medium uppercase">
            Total na Colecção
          </p>
          <p className="font-serif text-3xl font-light text-brand-ivory mt-2">{totalCount}</p>
        </div>

        <div className="admin-card p-5 border border-emerald-500/20 bg-brand-black-soft/70">
          <p className="font-mono text-[9px] tracking-widest text-emerald-400 uppercase">
            Publicados
          </p>
          <p className="font-serif text-3xl font-light text-emerald-400 mt-2">{publishedCount}</p>
        </div>

        <div className="admin-card p-5 border border-amber-500/20 bg-brand-black-soft/70">
          <p className="font-mono text-[9px] tracking-widest text-amber-400 uppercase">
            Rascunhos
          </p>
          <p className="font-serif text-3xl font-light text-amber-400 mt-2">{draftCount}</p>
        </div>

        <div className="admin-card p-5 border border-admin-gold/20 bg-brand-black-soft/70">
          <p className="font-mono text-[9px] tracking-widest text-admin-gold uppercase">
            Eventos Reais
          </p>
          <p className="font-serif text-3xl font-light text-admin-gold mt-2">{realCount}</p>
        </div>
      </div>

      {/* Barra de Filtros e Acções */}
      <div className="admin-card p-5 bg-brand-black-soft/70 border border-admin-gold/20 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-grey-medium" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar por título, local ou serviço..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-brand-black border border-admin-gold/20 text-xs text-brand-ivory placeholder-grey-medium focus:border-admin-gold outline-none font-mono"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-lg bg-brand-black border border-admin-gold/20 text-xs text-brand-ivory font-mono outline-none"
          >
            <option value="all">Todas as Categorias</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 rounded-lg bg-brand-black border border-admin-gold/20 text-xs text-brand-ivory font-mono outline-none"
          >
            <option value="all">Todos os Tipos</option>
            <option value="real">Real</option>
            <option value="conceptual">Conceptual</option>
            <option value="demonstracao">Demonstração</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-lg bg-brand-black border border-admin-gold/20 text-xs text-brand-ivory font-mono outline-none"
          >
            <option value="all">Todos os Estados</option>
            <option value="published">Publicado</option>
            <option value="draft">Rascunho</option>
            <option value="archived">Arquivado</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadAuditHistory}
            className="px-3.5 py-2 rounded-lg border border-admin-gold/30 text-admin-gold hover:bg-admin-gold/10 font-mono text-xs flex items-center gap-1.5 transition-colors"
            title="Ver histórico de alterações"
          >
            <History className="w-4 h-4" />
            <span>Auditoria</span>
          </button>

          <button
            type="button"
            onClick={startCreate}
            className="admin-btn-primary flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Projecto</span>
          </button>
        </div>
      </div>

      {/* Tabela de Projectos */}
      <div className="admin-card overflow-hidden border border-admin-gold/20 bg-brand-black-soft/70">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-admin-gold/20 font-mono text-[9px] tracking-widest text-grey-medium uppercase bg-brand-black/40">
                <th className="py-4 px-5">Ordem</th>
                <th className="py-4 px-5">Projecto</th>
                <th className="py-4 px-5">Categoria</th>
                <th className="py-4 px-5">Local & Ano</th>
                <th className="py-4 px-5">Tipo & Governança</th>
                <th className="py-4 px-5">Estado</th>
                <th className="py-4 px-5 text-right">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-gold/10 font-sans text-xs text-brand-ivory/90">
              {filteredProjects.map((p) => (
                <tr key={p.id} className="hover:bg-brand-black/30 transition-colors">
                  {/* Ordem */}
                  <td className="py-4 px-5 font-mono text-[10px] text-grey-medium">
                    #{p.displayOrder || 0}
                  </td>

                  {/* Projecto com miniatura */}
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3.5">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-admin-gold/20 flex-shrink-0 bg-brand-black">
                        <Image
                          src={p.coverImage}
                          alt={p.title}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-serif text-sm font-medium text-brand-ivory">
                            {p.title}
                          </span>
                          {p.isFeatured ? (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-mono tracking-wider bg-admin-gold/20 text-admin-gold border border-admin-gold/30 uppercase">
                              Destaque
                            </span>
                          ) : null}
                        </div>
                        <p className="font-mono text-[10px] text-grey-medium truncate max-w-xs mt-0.5">
                          {p.subtitle}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Categoria */}
                  <td className="py-4 px-5 font-mono text-[10.5px] text-brand-champagne/90">
                    {p.categoryLabel}
                  </td>

                  {/* Local e Ano */}
                  <td className="py-4 px-5 font-mono text-[10.5px] text-grey-medium">
                    <div>{p.location}</div>
                    <div className="text-[9.5px] text-grey-medium/70">{p.year}</div>
                  </td>

                  {/* Tipo & Governança */}
                  <td className="py-4 px-5 space-y-1">
                    <div>
                      {p.projectType === "real" ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[9px] tracking-wider text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase">
                          <ShieldCheck className="w-3 h-3" /> Real
                        </span>
                      ) : p.projectType === "demonstracao" ? (
                        <span className="font-mono text-[9px] tracking-wider text-purple-400 bg-purple-950/40 border border-purple-500/30 px-2 py-0.5 rounded-full uppercase">
                          Demonstração
                        </span>
                      ) : (
                        <span className="font-mono text-[9px] tracking-wider text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded-full uppercase">
                          Conceptual
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-[8.5px] text-grey-medium flex items-center gap-1">
                      <FileCheck className="w-3 h-3 text-admin-gold/70" />
                      <span>{p.editorialReviewStatus || "approved"}</span>
                    </div>
                  </td>

                  {/* Estado com alteração rápida */}
                  <td className="py-4 px-5">
                    <select
                      value={p.status}
                      onChange={(e) =>
                        handleToggleStatus(
                          p,
                          e.target.value as "published" | "draft" | "archived"
                        )
                      }
                      className={`font-mono text-[9px] tracking-wider px-2 py-0.5 rounded-full uppercase border outline-none cursor-pointer bg-brand-black ${
                        p.status === "published"
                          ? "text-emerald-400 border-emerald-500/30"
                          : p.status === "draft"
                          ? "text-amber-400 border-amber-500/30"
                          : "text-grey-medium border-zinc-700"
                      }`}
                    >
                      <option value="published">Publicado</option>
                      <option value="draft">Rascunho</option>
                      <option value="archived">Arquivado</option>
                    </select>
                  </td>

                  {/* Acções */}
                  <td className="py-4 px-5 text-right">
                    <div className="inline-flex items-center gap-2">
                      <Link
                        href={`/portfolio/${p.slug}`}
                        target="_blank"
                        className="p-1.5 rounded-lg border border-admin-gold/20 hover:border-admin-gold text-grey-medium hover:text-admin-gold transition-colors"
                        title="Ver página no site"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingProject({ ...p });
                          setIsCreating(false);
                        }}
                        className="p-1.5 rounded-lg border border-admin-gold/20 hover:border-admin-gold text-grey-medium hover:text-admin-gold transition-colors"
                        title="Editar projecto"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {deleteConfirmId === p.id ? (
                        <div className="inline-flex items-center gap-1 bg-red-950/80 border border-red-500/40 p-1 rounded-lg">
                          <button
                            type="button"
                            onClick={() => handleDeleteProject(p.id)}
                            className="px-2 py-0.5 text-[9px] font-mono text-red-300 hover:text-white uppercase font-bold"
                          >
                            Confirmar
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="text-grey-medium hover:text-white px-1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(p.id)}
                          className="p-1.5 rounded-lg border border-red-500/20 hover:border-red-500/50 text-grey-medium hover:text-red-400 transition-colors"
                          title="Eliminar projecto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Histórico de Auditoria */}
      {showHistoryModal ? (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-brand-black-soft border border-admin-gold/30 rounded-2xl max-w-3xl w-full my-8 max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-admin-gold/20 flex items-center justify-between bg-brand-black">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-admin-gold" />
                <h3 className="font-serif text-lg text-brand-ivory">
                  Histórico de Auditoria & Alterações
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 rounded-lg text-grey-medium hover:text-brand-ivory transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-12 text-admin-gold font-mono text-xs gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>A carregar registos de auditoria...</span>
                </div>
              ) : auditLogs.length === 0 ? (
                <p className="text-center font-mono text-xs text-grey-medium py-8">
                  Nenhum registo de alteração encontrado na base de dados.
                </p>
              ) : (
                <div className="space-y-3 font-mono text-xs">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3.5 rounded-xl border border-admin-gold/15 bg-brand-black/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[8.5px] uppercase font-bold tracking-wider ${
                              log.action === "create"
                                ? "bg-emerald-950/80 text-emerald-400 border border-emerald-500/40"
                                : log.action === "publish"
                                ? "bg-blue-950/80 text-blue-400 border border-blue-500/40"
                                : log.action === "delete"
                                ? "bg-red-950/80 text-red-400 border border-red-500/40"
                                : "bg-admin-gold/15 text-admin-gold border border-admin-gold/30"
                            }`}
                          >
                            {log.action}
                          </span>
                          <span className="text-brand-ivory/90 font-medium">
                            Projecto: {log.projectId}
                          </span>
                        </div>
                        <p className="text-[10px] text-grey-medium">
                          Operador: <span className="text-brand-champagne">{log.actorEmail}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 text-[9.5px] text-grey-medium/70">
                        <Clock className="w-3 h-3 text-admin-gold/60" />
                        <span>{new Date(log.createdAt).toLocaleString("pt-MZ")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Modal de Edição / Criação de Projecto */}
      {editingProject ? (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-brand-black-soft border border-admin-gold/30 rounded-2xl max-w-4xl w-full my-8 max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Cabeçalho do Modal */}
            <div className="p-6 border-b border-admin-gold/20 flex items-center justify-between bg-brand-black">
              <div>
                <h3 className="font-serif text-xl text-brand-ivory">
                  {isCreating ? "Novo Projecto de Portfólio" : `Editar: ${editingProject.title}`}
                </h3>
                <p className="font-mono text-[10px] tracking-wider text-admin-gold uppercase mt-0.5">
                  The Signature Collection · Gestão Editorial Persistente
                </p>
              </div>

              <div className="flex items-center gap-2">
                {!isCreating && (
                  <Link
                    href={`/portfolio/${editingProject.slug}`}
                    target="_blank"
                    className="px-3 py-1.5 rounded-lg border border-admin-gold/30 text-admin-gold hover:bg-admin-gold/10 font-mono text-xs flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Pré-visualizar</span>
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="p-2 rounded-lg text-grey-medium hover:text-brand-ivory transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Formulário com Scroll Interno */}
            <form onSubmit={handleSaveProject} className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Título */}
                <div>
                  <label className="block font-mono text-[9px] tracking-wider uppercase text-grey-medium mb-1.5">
                    Nome do Projecto *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProject.title}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, title: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg bg-brand-black border border-admin-gold/20 text-xs text-brand-ivory font-mono focus:border-admin-gold outline-none"
                    placeholder="Ex: Vânia & Fabião"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block font-mono text-[9px] tracking-wider uppercase text-grey-medium mb-1.5">
                    Slug da URL (/portfolio/[slug]) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProject.slug}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, slug: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg bg-brand-black border border-admin-gold/20 text-xs text-brand-ivory font-mono focus:border-admin-gold outline-none"
                    placeholder="ex: casamento-vania-fabiao"
                  />
                </div>

                {/* Categoria */}
                <div>
                  <label className="block font-mono text-[9px] tracking-wider uppercase text-grey-medium mb-1.5">
                    Categoria *
                  </label>
                  <select
                    value={editingProject.category}
                    onChange={(e) => {
                      const catId = e.target.value as PortfolioCategoryId;
                      const catObj = categories.find((c) => c.id === catId);
                      setEditingProject({
                        ...editingProject,
                        category: catId,
                        categoryLabel: catObj ? catObj.label : "Celebração",
                      });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-brand-black border border-admin-gold/20 text-xs text-brand-ivory font-mono focus:border-admin-gold outline-none"
                  >
                    {categories.filter((c) => c.id !== "todos").map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Estado de Publicação */}
                <div>
                  <label className="block font-mono text-[9px] tracking-wider uppercase text-grey-medium mb-1.5">
                    Estado de Publicação *
                  </label>
                  <select
                    value={editingProject.status}
                    onChange={(e) =>
                      setEditingProject({
                        ...editingProject,
                        status: e.target.value as "published" | "draft" | "archived",
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg bg-brand-black border border-admin-gold/20 text-xs text-brand-ivory font-mono focus:border-admin-gold outline-none"
                  >
                    <option value="published">Publicado (Visível no site público)</option>
                    <option value="draft">Rascunho (Privado / Confidencial)</option>
                    <option value="archived">Arquivado</option>
                  </select>
                </div>

                {/* Tipo de Projecto & Ordem */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono text-[9px] tracking-wider uppercase text-grey-medium mb-1.5">
                      Tipo de Projecto *
                    </label>
                    <select
                      value={editingProject.projectType || "real"}
                      onChange={(e) =>
                        setEditingProject({
                          ...editingProject,
                          projectType: e.target.value as ProjectType,
                          isReal: e.target.value === "real",
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-lg bg-brand-black border border-admin-gold/20 text-xs text-brand-ivory font-mono focus:border-admin-gold outline-none"
                    >
                      <option value="real">Real (Celebração Realizada)</option>
                      <option value="conceptual">Estudo Conceptual</option>
                      <option value="demonstracao">Demonstração Digital</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-[9px] tracking-wider uppercase text-grey-medium mb-1.5">
                      Ordem de Apresentação
                    </label>
                    <input
                      type="number"
                      value={editingProject.displayOrder || 0}
                      onChange={(e) =>
                        setEditingProject({
                          ...editingProject,
                          displayOrder: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-lg bg-brand-black border border-admin-gold/20 text-xs text-brand-ivory font-mono focus:border-admin-gold outline-none"
                    />
                  </div>
                </div>

                {/* Localização */}
                <div>
                  <label className="block font-mono text-[9px] tracking-wider uppercase text-grey-medium mb-1.5">
                    Localização (divulgável)
                  </label>
                  <input
                    type="text"
                    value={editingProject.location}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, location: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg bg-brand-black border border-admin-gold/20 text-xs text-brand-ivory font-mono focus:border-admin-gold outline-none"
                    placeholder="Ex: Maputo · Moçambique"
                  />
                </div>

                {/* Ano e Convidados */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono text-[9px] tracking-wider uppercase text-grey-medium mb-1.5">
                      Ano
                    </label>
                    <input
                      type="text"
                      value={editingProject.year}
                      onChange={(e) =>
                        setEditingProject({ ...editingProject, year: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-lg bg-brand-black border border-admin-gold/20 text-xs text-brand-ivory font-mono focus:border-admin-gold outline-none"
                      placeholder="2025"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[9px] tracking-wider uppercase text-grey-medium mb-1.5">
                      Convidados (opcional)
                    </label>
                    <input
                      type="text"
                      value={editingProject.guestCount || ""}
                      onChange={(e) =>
                        setEditingProject({ ...editingProject, guestCount: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-lg bg-brand-black border border-admin-gold/20 text-xs text-brand-ivory font-mono focus:border-admin-gold outline-none"
                      placeholder="Ex: 250 convidados"
                    />
                  </div>
                </div>
              </div>

              {/* Subtítulo / Tagline */}
              <div>
                <label className="block font-mono text-[9px] tracking-wider uppercase text-grey-medium mb-1.5">
                  Subtítulo Editorial
                </label>
                <input
                  type="text"
                  value={editingProject.subtitle}
                  onChange={(e) =>
                    setEditingProject({ ...editingProject, subtitle: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-lg bg-brand-black border border-admin-gold/20 text-xs text-brand-ivory font-mono focus:border-admin-gold outline-none"
                  placeholder="Ex: Sobriedade estética, serenidade protocolar e acolhimento familiar."
                />
              </div>

              {/* Serviços Prestados */}
              <div>
                <label className="block font-mono text-[9px] tracking-wider uppercase text-grey-medium mb-1.5">
                  Serviços Efectivamente Prestados pela HAXR (separados por vírgula)
                </label>
                <input
                  type="text"
                  value={editingProject.services.join(", ")}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      services: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-lg bg-brand-black border border-admin-gold/20 text-xs text-brand-ivory font-mono focus:border-admin-gold outline-none"
                  placeholder="Ex: Assessoria Completa, Direcção Criativa, Web-Convite Legado, RSVP em Tempo Real"
                />
              </div>

              {/* Resumo do Evento */}
              <div>
                <label className="block font-mono text-[9px] tracking-wider uppercase text-grey-medium mb-1.5">
                  Resumo Editorial da Celebração
                </label>
                <textarea
                  rows={2}
                  value={editingProject.summary}
                  onChange={(e) =>
                    setEditingProject({ ...editingProject, summary: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-lg bg-brand-black border border-admin-gold/20 text-xs text-brand-ivory font-sans focus:border-admin-gold outline-none"
                  placeholder="Síntese da experiência para cartões e meta-descrições..."
                />
              </div>

              {/* Imagem de Capa com Upload Directo */}
              <div className="p-4 rounded-xl bg-brand-black border border-admin-gold/20 space-y-3">
                <label className="block font-mono text-[9px] tracking-wider uppercase text-admin-gold">
                  Fotografia de Capa Principal
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-admin-gold/30 bg-black flex-shrink-0">
                    <Image
                      src={editingProject.coverImage}
                      alt="Capa"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-2 w-full">
                    <input
                      type="text"
                      value={editingProject.coverImage}
                      onChange={(e) =>
                        setEditingProject({ ...editingProject, coverImage: e.target.value })
                      }
                      placeholder="/images/..."
                      className="w-full px-3.5 py-2 rounded-lg bg-brand-black-soft border border-admin-gold/20 text-xs text-brand-ivory font-mono focus:border-admin-gold outline-none"
                    />
                    <div className="flex items-center gap-2">
                      <label className="px-3 py-1.5 rounded-lg border border-admin-gold/30 text-admin-gold hover:bg-admin-gold/10 font-mono text-[10px] uppercase cursor-pointer inline-flex items-center gap-1.5">
                        {isUploading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>Carregar do Computador</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={isUploading}
                          onChange={(e) => handleFileUpload(e, "cover")}
                        />
                      </label>
                      <select
                        value={editingProject.coverAspect || "landscape"}
                        onChange={(e) =>
                          setEditingProject({
                            ...editingProject,
                            coverAspect: e.target.value as "portrait" | "landscape" | "square",
                          })
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-brand-black-soft border border-admin-gold/20 font-mono text-[10px] text-brand-ivory"
                      >
                        <option value="landscape">Proporção Paisagem (Horizontal)</option>
                        <option value="portrait">Proporção Retrato (Vertical)</option>
                        <option value="square">Proporção Quadrada</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gestão da Galeria de Fotografias (com reordenação e créditos de fotógrafo) */}
              <div className="p-4 rounded-xl bg-brand-black border border-admin-gold/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-mono text-[10px] tracking-wider uppercase text-admin-gold">
                      Galeria Editorial ({editingProject.gallery.length} fotografias)
                    </h4>
                    <p className="font-mono text-[9px] text-grey-medium">
                      Fotografias em alta resolução. Use as setas para reordenar a sequência de apresentação.
                    </p>
                  </div>
                  <label className="px-3 py-1.5 rounded-lg border border-admin-gold/30 text-admin-gold hover:bg-admin-gold/10 font-mono text-[10px] uppercase cursor-pointer inline-flex items-center gap-1.5">
                    {isUploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    <span>Adicionar Fotografia</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploading}
                      onChange={(e) => handleFileUpload(e, "gallery")}
                    />
                  </label>
                </div>

                {editingProject.gallery.length === 0 ? (
                  <p className="font-mono text-[10px] text-grey-medium/70 italic py-2">
                    Nenhuma fotografia na galeria. Carregue fotografias acima.
                  </p>
                ) : (
                  <div className="space-y-3 pt-2">
                    {editingProject.gallery.map((img, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border border-admin-gold/20 bg-brand-black-soft flex flex-col sm:flex-row items-center gap-3"
                      >
                        {/* Miniatura */}
                        <div className="relative w-20 h-20 rounded overflow-hidden border border-admin-gold/20 flex-shrink-0 bg-black">
                          <Image src={img.src} alt={img.alt || "Galeria"} fill className="object-cover" />
                        </div>

                        {/* Campos de Legenda, Alt e Crédito de Fotógrafo */}
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                          <div>
                            <label className="block text-[8px] font-mono uppercase text-grey-medium mb-0.5">
                              Legenda
                            </label>
                            <input
                              type="text"
                              value={img.caption || ""}
                              onChange={(e) => {
                                const newGal = [...editingProject.gallery];
                                newGal[idx] = { ...newGal[idx], caption: e.target.value };
                                setEditingProject({ ...editingProject, gallery: newGal });
                              }}
                              placeholder="Legenda visual..."
                              className="w-full text-[10px] font-mono bg-brand-black px-2 py-1 rounded text-brand-ivory border border-admin-gold/15 outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[8px] font-mono uppercase text-grey-medium mb-0.5">
                              Texto Alternativo (Alt)
                            </label>
                            <input
                              type="text"
                              value={img.alt || ""}
                              onChange={(e) => {
                                const newGal = [...editingProject.gallery];
                                newGal[idx] = { ...newGal[idx], alt: e.target.value };
                                setEditingProject({ ...editingProject, gallery: newGal });
                              }}
                              placeholder="Descrição de acessibilidade..."
                              className="w-full text-[10px] font-mono bg-brand-black px-2 py-1 rounded text-brand-ivory border border-admin-gold/15 outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[8px] font-mono uppercase text-grey-medium mb-0.5">
                              Fotógrafo / Autor
                            </label>
                            <input
                              type="text"
                              value={img.authorCredit || ""}
                              onChange={(e) => {
                                const newGal = [...editingProject.gallery];
                                newGal[idx] = { ...newGal[idx], authorCredit: e.target.value };
                                setEditingProject({ ...editingProject, gallery: newGal });
                              }}
                              placeholder="Crédito do fotógrafo..."
                              className="w-full text-[10px] font-mono bg-brand-black px-2 py-1 rounded text-brand-ivory border border-admin-gold/15 outline-none"
                            />
                          </div>
                        </div>

                        {/* Botões de Reordenação e Remoção */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveGalleryImage(idx, "up")}
                            className="p-1.5 rounded border border-admin-gold/20 text-grey-medium hover:text-admin-gold disabled:opacity-30"
                            title="Subir posição"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === editingProject.gallery.length - 1}
                            onClick={() => moveGalleryImage(idx, "down")}
                            className="p-1.5 rounded border border-admin-gold/20 text-grey-medium hover:text-admin-gold disabled:opacity-30"
                            title="Descer posição"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const newGal = editingProject.gallery.filter((_, i) => i !== idx);
                              setEditingProject({ ...editingProject, gallery: newGal });
                            }}
                            className="p-1.5 rounded border border-red-500/20 text-red-400 hover:text-red-300"
                            title="Remover fotografia"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Narrativa Editorial (Visão, Desafio, Assinatura, Resultado) */}
              <div className="space-y-4 pt-4 border-t border-admin-gold/15">
                <h4 className="font-mono text-[10px] tracking-wider uppercase text-admin-gold">
                  Narrativa Editorial (4 Dimensões de Alta-Costura)
                </h4>

                <div>
                  <label className="block font-mono text-[8.5px] tracking-wider uppercase text-grey-medium mb-1">
                    01. A Visão (Intenção do Cliente)
                  </label>
                  <textarea
                    rows={2}
                    value={editingProject.narrative.vision}
                    onChange={(e) =>
                      setEditingProject({
                        ...editingProject,
                        narrative: { ...editingProject.narrative, vision: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-lg bg-brand-black border border-admin-gold/20 text-xs text-brand-ivory font-sans focus:border-admin-gold outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[8.5px] tracking-wider uppercase text-grey-medium mb-1">
                    02. O Desafio (Complexidade Operacional/Criativa)
                  </label>
                  <textarea
                    rows={2}
                    value={editingProject.narrative.challenge}
                    onChange={(e) =>
                      setEditingProject({
                        ...editingProject,
                        narrative: { ...editingProject.narrative, challenge: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-lg bg-brand-black border border-admin-gold/20 text-xs text-brand-ivory font-sans focus:border-admin-gold outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[8.5px] tracking-wider uppercase text-grey-medium mb-1">
                    03. A Assinatura HAXR (Intervenção e Soluções)
                  </label>
                  <textarea
                    rows={2}
                    value={editingProject.narrative.signature}
                    onChange={(e) =>
                      setEditingProject({
                        ...editingProject,
                        narrative: { ...editingProject.narrative, signature: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-lg bg-brand-black border border-admin-gold/20 text-xs text-brand-ivory font-sans focus:border-admin-gold outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[8.5px] tracking-wider uppercase text-grey-medium mb-1">
                    04. O Resultado (Memória e Acolhimento)
                  </label>
                  <textarea
                    rows={2}
                    value={editingProject.narrative.result}
                    onChange={(e) =>
                      setEditingProject({
                        ...editingProject,
                        narrative: { ...editingProject.narrative, result: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-lg bg-brand-black border border-admin-gold/20 text-xs text-brand-ivory font-sans focus:border-admin-gold outline-none"
                  />
                </div>
              </div>

              {/* Créditos de Fornecedores */}
              <div className="pt-4 border-t border-admin-gold/15 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-mono text-[10px] tracking-wider uppercase text-admin-gold">
                    Créditos e Fornecedores Oficiais
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      const newCredit: PortfolioCredit = { role: "", name: "", link: "" };
                      setEditingProject({
                        ...editingProject,
                        credits: [...(editingProject.credits || []), newCredit],
                      });
                    }}
                    className="font-mono text-[9px] uppercase text-admin-gold hover:underline"
                  >
                    + Adicionar Fornecedor
                  </button>
                </div>

                {(editingProject.credits || []).map((credit, idx) => (
                  <div key={idx} className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={credit.role}
                      onChange={(e) => {
                        const newCredits = [...(editingProject.credits || [])];
                        newCredits[idx] = { ...newCredits[idx], role: e.target.value };
                        setEditingProject({ ...editingProject, credits: newCredits });
                      }}
                      placeholder="Função (Ex: Fotografia)"
                      className="px-2.5 py-1.5 rounded bg-brand-black border border-admin-gold/20 text-xs text-brand-ivory font-mono"
                    />
                    <input
                      type="text"
                      value={credit.name}
                      onChange={(e) => {
                        const newCredits = [...(editingProject.credits || [])];
                        newCredits[idx] = { ...newCredits[idx], name: e.target.value };
                        setEditingProject({ ...editingProject, credits: newCredits });
                      }}
                      placeholder="Nome do Fornecedor"
                      className="px-2.5 py-1.5 rounded bg-brand-black border border-admin-gold/20 text-xs text-brand-ivory font-mono"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={credit.link || ""}
                        onChange={(e) => {
                          const newCredits = [...(editingProject.credits || [])];
                          newCredits[idx] = { ...newCredits[idx], link: e.target.value };
                          setEditingProject({ ...editingProject, credits: newCredits });
                        }}
                        placeholder="Link / Instagram"
                        className="w-full px-2.5 py-1.5 rounded bg-brand-black border border-admin-gold/20 text-xs text-brand-ivory font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newCredits = (editingProject.credits || []).filter((_, i) => i !== idx);
                          setEditingProject({ ...editingProject, credits: newCredits });
                        }}
                        className="text-red-400 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Autenticidade, Autorizações & Governança */}
              <div className="p-4 rounded-xl bg-brand-black border border-admin-gold/20 space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-admin-gold" />
                  <h4 className="font-mono text-[10px] tracking-wider uppercase text-admin-gold">
                    Governança, Autenticidade & Consentimento do Cliente
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-[8.5px] tracking-wider uppercase text-grey-medium mb-1">
                      Estado de Revisão Editorial
                    </label>
                    <select
                      value={editingProject.editorialReviewStatus || "draft"}
                      onChange={(e) =>
                        setEditingProject({
                          ...editingProject,
                          editorialReviewStatus: e.target.value as EditorialReviewStatus,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-brand-black-soft border border-admin-gold/20 text-xs text-brand-ivory font-mono"
                    >
                      <option value="draft">Rascunho Editorial (Não publicado)</option>
                      <option value="pending_review">Pendente de Revisão / Verificação</option>
                      <option value="approved">Aprovado pelo Proprietário</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-[8.5px] tracking-wider uppercase text-grey-medium mb-1">
                      Consentimento das Famílias / Clientes
                    </label>
                    <select
                      value={editingProject.clientConsentStatus || "CONFIRMATION_PENDING"}
                      onChange={(e) =>
                        setEditingProject({
                          ...editingProject,
                          clientConsentStatus: e.target.value as ClientConsentStatus,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-brand-black-soft border border-admin-gold/20 text-xs text-brand-ivory font-mono"
                    >
                      <option value="AUTHORIZED">Autorizado para Difusão Pública</option>
                      <option value="CONFIRMATION_PENDING">Confirmação Pendente (Não divulgar nomes/rostos)</option>
                      <option value="INTERNAL_ONLY">Apenas Arquivo Interno do Atelier</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-[8.5px] tracking-wider uppercase text-grey-medium mb-1">
                      Origem dos Materiais / Fotografias
                    </label>
                    <input
                      type="text"
                      value={editingProject.materialSource || ""}
                      onChange={(e) =>
                        setEditingProject({
                          ...editingProject,
                          materialSource: e.target.value,
                        })
                      }
                      placeholder="Ex: Cedido pelos noivos / Fotógrafo oficial"
                      className="w-full px-3 py-2 rounded-lg bg-brand-black-soft border border-admin-gold/20 text-xs text-brand-ivory font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[8.5px] tracking-wider uppercase text-grey-medium mb-1">
                      Notas de Autorização
                    </label>
                    <input
                      type="text"
                      value={editingProject.authorizationNotes || ""}
                      onChange={(e) =>
                        setEditingProject({
                          ...editingProject,
                          authorizationNotes: e.target.value,
                        })
                      }
                      placeholder="Ex: Acordo verbal confirmado em 2024"
                      className="w-full px-3 py-2 rounded-lg bg-brand-black-soft border border-admin-gold/20 text-xs text-brand-ivory font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-admin-gold/15 space-y-2 font-mono text-xs text-brand-ivory">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProject.publicationAuthorized !== false}
                      onChange={(e) =>
                        setEditingProject({
                          ...editingProject,
                          publicationAuthorized: e.target.checked,
                        })
                      }
                      className="rounded border-admin-gold/30 bg-brand-black text-admin-gold focus:ring-0"
                    />
                    <span>Autorização de Publicação Validada (Se desmarcado, o projecto nunca será visível publicamente)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProject.isFeatured || false}
                      onChange={(e) =>
                        setEditingProject({ ...editingProject, isFeatured: e.target.checked })
                      }
                      className="rounded border-admin-gold/30 bg-brand-black text-admin-gold focus:ring-0"
                    />
                    <span>Destaque Editorial na Galeria Principal da Colecção</span>
                  </label>
                </div>
              </div>

              {/* SEO e Metadados */}
              <div className="pt-4 border-t border-admin-gold/15 space-y-3">
                <h4 className="font-mono text-[10px] tracking-wider uppercase text-admin-gold">
                  Optimização SEO (Motores de Busca & Redes Sociais)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono text-[8.5px] tracking-wider uppercase text-grey-medium mb-1">
                      Título SEO
                    </label>
                    <input
                      type="text"
                      value={editingProject.seo?.title || ""}
                      onChange={(e) =>
                        setEditingProject({
                          ...editingProject,
                          seo: { ...editingProject.seo, title: e.target.value },
                        })
                      }
                      placeholder={`${editingProject.title || "Projecto"} | HAXR Signature`}
                      className="w-full px-3 py-2 rounded-lg bg-brand-black border border-admin-gold/20 text-xs text-brand-ivory font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[8.5px] tracking-wider uppercase text-grey-medium mb-1">
                      Descrição SEO
                    </label>
                    <input
                      type="text"
                      value={editingProject.seo?.description || ""}
                      onChange={(e) =>
                        setEditingProject({
                          ...editingProject,
                          seo: { ...editingProject.seo, description: e.target.value },
                        })
                      }
                      placeholder="Descrição concisa para pesquisa Google e WhatsApp..."
                      className="w-full px-3 py-2 rounded-lg bg-brand-black border border-admin-gold/20 text-xs text-brand-ivory font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Botões do Rodapé do Modal */}
              <div className="pt-6 border-t border-admin-gold/20 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setEditingProject(null)}
                  className="px-5 py-2.5 rounded-lg border border-admin-gold/20 text-grey-medium hover:text-brand-ivory font-mono text-xs uppercase"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="admin-btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{isSaving ? "A Guardar..." : "Guardar Projecto"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

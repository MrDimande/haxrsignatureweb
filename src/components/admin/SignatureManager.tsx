"use client";

import { useRef, useState, useTransition } from "react";
import { PenLine, Star, Trash2, Upload } from "lucide-react";
import { AdminInput, AdminSelect } from "@/components/admin/AdminField";
import SignaturePad, { type SignaturePadHandle } from "@/components/admin/SignaturePad";
import {
  deleteSignatureAction,
  setDefaultSignatureAction,
  uploadSignatureAction,
} from "@/lib/admin/actions/signatures.actions";
import { readImageFileAsDataUrl } from "@/lib/admin/signatures";
import type { Business, BusinessId, BusinessSignature } from "@/lib/admin/types";

type SignatureSource = "upload" | "draw";

type SignatureManagerProps = {
  businesses: Business[];
  initialSignatures: BusinessSignature[];
};

export default function SignatureManager({
  businesses,
  initialSignatures,
}: SignatureManagerProps) {
  const [signatures, setSignatures] = useState(initialSignatures);
  const [businessId, setBusinessId] = useState<BusinessId>(
    businesses[0]?.id ?? "haxr-signature"
  );
  const [label, setLabel] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [source, setSource] = useState<SignatureSource>("draw");
  const [setAsDefault, setSetAsDefault] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const padRef = useRef<SignaturePadHandle>(null);

  const businessSignatures = signatures.filter((sig) => sig.businessId === businessId);

  async function handleFileChange(file: File | undefined) {
    if (!file) return;
    setError("");
    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      setPreviewUrl(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar imagem.");
      setPreviewUrl("");
    }
  }

  function resetForm() {
    setLabel("");
    setRoleTitle("");
    setPreviewUrl("");
    setSetAsDefault(false);
    padRef.current?.clear();
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function getSignatureImage(): string | null {
    if (source === "upload") return previewUrl || null;
    return padRef.current?.toDataUrl() ?? null;
  }

  function handleUpload() {
    setError("");
    if (!label.trim()) {
      setError("Indique o nome de quem assina.");
      return;
    }

    const imageDataUrl = getSignatureImage();
    if (!imageDataUrl) {
      setError(
        source === "upload"
          ? "Carregue uma imagem de assinatura."
          : "Desenhe a assinatura na área indicada."
      );
      return;
    }

    startTransition(async () => {
      const result = await uploadSignatureAction({
        businessId,
        label: label.trim(),
        roleTitle: roleTitle.trim(),
        imageDataUrl,
        setAsDefault,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setSignatures((prev) => {
        const withoutDefaults = setAsDefault
          ? prev.map((sig) =>
              sig.businessId === businessId ? { ...sig, isDefault: false } : sig
            )
          : prev;
        return [result.data, ...withoutDefaults];
      });
      resetForm();
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Remover esta assinatura?")) return;

    startTransition(async () => {
      const result = await deleteSignatureAction(id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSignatures((prev) => prev.filter((sig) => sig.id !== id));
    });
  }

  function handleSetDefault(id: string) {
    startTransition(async () => {
      const result = await setDefaultSignatureAction(id, businessId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSignatures((prev) =>
        prev.map((sig) =>
          sig.businessId === businessId
            ? { ...sig, isDefault: sig.id === id }
            : sig
        )
      );
    });
  }

  return (
    <section className="admin-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold">
            Assinaturas Personalizadas
          </h2>
          <p className="text-sm text-grey/60 mt-2 max-w-xl">
            Assine online com o rato ou dedo, ou carregue uma imagem PNG/JPG. As
            assinaturas serão usadas em facturas, proformas e recibos.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <AdminSelect
            label="Negócio"
            value={businessId}
            onChange={(e) => setBusinessId(e.target.value as BusinessId)}
          >
            {businesses.map((business) => (
              <option key={business.id} value={business.id}>
                {business.name}
              </option>
            ))}
          </AdminSelect>

          <AdminInput
            label="Nome de quem assina"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ex.: Rabeca António Come"
          />

          <AdminInput
            label="Cargo / função"
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
            placeholder="Ex.: Director Comercial"
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSource("draw")}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-sm border text-[10px] font-mono uppercase tracking-wider transition-colors ${
                source === "draw"
                  ? "border-admin-gold/60 text-admin-gold bg-admin-gold/10"
                  : "border-grey-dark/60 text-grey/60 hover:text-white"
              }`}
            >
              <PenLine className="w-3.5 h-3.5" />
              Assinar online
            </button>
            <button
              type="button"
              onClick={() => setSource("upload")}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-sm border text-[10px] font-mono uppercase tracking-wider transition-colors ${
                source === "upload"
                  ? "border-admin-gold/60 text-admin-gold bg-admin-gold/10"
                  : "border-grey-dark/60 text-grey/60 hover:text-white"
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Carregar ficheiro
            </button>
          </div>

          {source === "draw" ? (
            <div>
              <label className="font-mono text-[8px] tracking-[0.3em] uppercase text-grey/50">
                Desenhe a assinatura
              </label>
              <div className="mt-2">
                <SignaturePad ref={padRef} />
              </div>
              <p className="text-xs text-grey/50 mt-2">
                Funciona em computador (rato) e telemóvel (dedo).
              </p>
            </div>
          ) : (
            <div>
              <label className="font-mono text-[8px] tracking-[0.3em] uppercase text-grey/50">
                Imagem da assinatura
              </label>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="admin-btn-secondary text-[10px]"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Escolher ficheiro
                </button>
                <span className="text-xs text-grey/50">PNG, JPG ou WebP · máx. 500 KB</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0])}
              />
              {previewUrl ? (
                <div className="mt-4 p-4 border border-grey-dark/60 rounded-sm bg-black-soft inline-block">
                  <img
                    src={previewUrl}
                    alt="Pré-visualização da assinatura"
                    className="h-16 max-w-[220px] object-contain"
                  />
                </div>
              ) : null}
            </div>
          )}

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={setAsDefault}
              onChange={(e) => setSetAsDefault(e.target.checked)}
              className="accent-admin-gold"
            />
            <span className="font-sans text-sm text-grey">
              Definir como assinatura padrão deste negócio
            </span>
          </label>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <button
            type="button"
            onClick={handleUpload}
            disabled={isPending}
            className="admin-btn-primary"
          >
            Guardar Assinatura
          </button>
        </div>

        <div>
          <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-grey/50 mb-4">
            Assinaturas guardadas
          </p>
          {businessSignatures.length === 0 ? (
            <p className="text-sm text-grey/50">
              Ainda não há assinaturas para este negócio.
            </p>
          ) : (
            <div className="space-y-3">
              {businessSignatures.map((signature) => (
                <div
                  key={signature.id}
                  className="flex items-center gap-4 p-4 border border-grey-dark/60 rounded-sm bg-black-soft"
                >
                  <img
                    src={signature.imageUrl}
                    alt={signature.label}
                    className="h-12 w-24 object-contain shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{signature.label}</p>
                    {signature.roleTitle ? (
                      <p className="text-xs text-grey/50 truncate">
                        {signature.roleTitle}
                      </p>
                    ) : null}
                    {signature.isDefault ? (
                      <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-mono uppercase tracking-wider text-admin-gold/80">
                        <Star className="w-3 h-3 fill-current" />
                        Padrão
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!signature.isDefault ? (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(signature.id)}
                        disabled={isPending}
                        className="admin-btn-secondary text-[9px] px-2 py-1"
                        title="Definir como padrão"
                      >
                        <Star className="w-3 h-3" />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => handleDelete(signature.id)}
                      disabled={isPending}
                      className="text-grey/40 hover:text-red-400 p-2"
                      aria-label={`Remover assinatura de ${signature.label}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Save, Check, User } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";

const AVATAR_KEY = "haxr_admin_avatar";
const NAME_KEY = "haxr_admin_name";
const EMAIL_KEY = "haxr_admin_email";

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load persisted profile data on mount
  useEffect(() => {
    setName(localStorage.getItem(NAME_KEY) || "");
    setEmail(localStorage.getItem(EMAIL_KEY) || "");
    setAvatar(localStorage.getItem(AVATAR_KEY));
  }, []);

  // Handle file selection and convert to Base64
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setAvatar(base64);
    };
    reader.readAsDataURL(file);
  }

  // Persist all profile data to localStorage
  function handleSave() {
    setSaving(true);
    setSaved(false);

    // Small delay for perceived quality
    setTimeout(() => {
      if (avatar) localStorage.setItem(AVATAR_KEY, avatar);
      if (name.trim()) localStorage.setItem(NAME_KEY, name.trim());
      if (email.trim()) localStorage.setItem(EMAIL_KEY, email.trim());

      // Dispatch global event so the Header updates instantly
      window.dispatchEvent(new Event("haxr_profile_updated"));

      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 600);
  }

  return (
    <AdminShell title="Perfil" subtitle="Conta de administrador">
      <div className="max-w-2xl space-y-10">

        {/* Avatar Upload Section */}
        <section className="admin-card p-6 md:p-8 flex flex-col sm:flex-row items-center gap-8">
          {/* Avatar Circle with Upload Overlay */}
          <div className="relative shrink-0 group">
            <div
              className="w-28 h-28 rounded-full overflow-hidden border-2 border-admin-gold/30 shadow-[0_0_20px_rgba(184,138,42,0.1)] cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatar ? (
                <img
                  src={avatar}
                  alt="Fotografia de perfil"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#12100e] to-[#0c0a09] flex items-center justify-center">
                  <User className="w-10 h-10 text-grey/30" strokeWidth={1} />
                </div>
              )}
            </div>

            {/* Hover Overlay */}
            <div
              className="absolute inset-0 rounded-full bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="w-5 h-5 text-white mb-1" />
              <span className="text-[8px] font-mono text-white uppercase tracking-widest">
                Alterar
              </span>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="text-center sm:text-left space-y-2">
            <p className="font-serif text-xl font-light text-white">
              {name || "Administrador HAXR"}
            </p>
            <p className="text-xs text-grey-medium font-mono tracking-wider">
              {email || "admin@haxrsignature.com"}
            </p>
            <p className="text-[9px] text-grey/45 font-mono uppercase tracking-widest mt-2">
              Clique na fotografia para alterar
            </p>
          </div>
        </section>

        {/* Profile Form Section */}
        <section className="admin-card p-6 md:p-8 space-y-6">
          <div>
            <span className="font-mono text-[8px] tracking-[0.4em] uppercase text-admin-gold">
              Informações Pessoais
            </span>
            <h3 className="font-serif text-xl font-light text-white mt-1">
              Dados do Administrador
            </h3>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="font-mono text-[9px] tracking-[0.25em] uppercase text-grey-medium block">
                Nome completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Aldim Dimande"
                className="admin-input w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="font-mono text-[9px] tracking-[0.25em] uppercase text-grey-medium block">
                E-mail corporativo
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: aldim@haxrsignature.com"
                className="admin-input w-full"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-white/[0.03] flex items-center justify-between">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="admin-btn-primary inline-flex items-center gap-2 px-6 py-2.5 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>A gravar...</span>
                </>
              ) : saved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Gravado com sucesso</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Gravar alterações</span>
                </>
              )}
            </button>

            {saved && (
              <span className="text-[9px] font-mono text-emerald-400 tracking-wider uppercase">
                Perfil atualizado ✓
              </span>
            )}
          </div>
        </section>

        {/* Security Info */}
        <section className="admin-card p-6 md:p-8 space-y-4">
          <div>
            <span className="font-mono text-[8px] tracking-[0.4em] uppercase text-admin-gold">
              Segurança & Acesso
            </span>
            <h3 className="font-serif text-xl font-light text-white mt-1">
              Informações Técnicas
            </h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2.5 border-b border-white/[0.02]">
              <span className="text-[10px] font-mono text-grey-medium uppercase tracking-wider">Função</span>
              <span className="text-xs text-white">Administrador HAXR Signature</span>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-white/[0.02]">
              <span className="text-[10px] font-mono text-grey-medium uppercase tracking-wider">Acesso</span>
              <span className="text-xs text-grey/70">
                <code className="text-admin-gold/70">ADMIN_EMAIL</code> + <code className="text-admin-gold/70">ADMIN_PASSWORD</code>
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-white/[0.02]">
              <span className="text-[10px] font-mono text-grey-medium uppercase tracking-wider">Sessão</span>
              <span className="text-xs text-grey/70">Cookie httpOnly · 7 dias</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-[10px] font-mono text-grey-medium uppercase tracking-wider">Indexação</span>
              <span className="text-xs text-grey/70">Área não indexada por motores de busca</span>
            </div>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { safeAdminRedirectPath } from "@/lib/admin/redirect-path";
import { AdminInput } from "@/components/admin/AdminField";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      setError("Credenciais inválidas. Tente novamente.");
      setLoading(false);
      return;
    }

    const from = safeAdminRedirectPath(searchParams?.get("from"));
    router.push(from);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-sm">
      <AdminInput
        label="Email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <AdminInput
        label="Password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error ? (
        <p className="text-red-400 text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={loading} className="admin-btn-primary w-full">
        {loading ? "A entrar..." : "Entrar"}
      </button>
    </form>
  );
}

"use client";

import { createContext, useContext } from "react";
import type { AdminIdentity } from "@/lib/admin/admin-user";

const AdminIdentityContext = createContext<AdminIdentity | null>(null);

export function AdminIdentityProvider({
  identity,
  children,
}: Readonly<{
  identity: AdminIdentity | null;
  children: React.ReactNode;
}>) {
  return (
    <AdminIdentityContext.Provider value={identity}>
      {children}
    </AdminIdentityContext.Provider>
  );
}

export function useAdminIdentity(): AdminIdentity | null {
  return useContext(AdminIdentityContext);
}

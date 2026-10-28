import React from "react";
import AdminShell from "@/components/admin/AdminShell";
import PortfolioAdminClient from "./PortfolioAdminClient";
import {
  listPortfolioProjects,
  getPortfolioCategories,
} from "@/lib/portfolio/service";

export default async function AdminPortfolioPage() {
  const [projects, categories] = await Promise.all([
    listPortfolioProjects({ includeDrafts: true }),
    getPortfolioCategories(),
  ]);

  return (
    <AdminShell
      title="The Signature Collection"
      subtitle="Gestão editorial de projectos, galerias e narrativas de alta-costura cerimonial"
    >
      <PortfolioAdminClient
        initialProjects={projects}
        categories={categories}
      />
    </AdminShell>
  );
}

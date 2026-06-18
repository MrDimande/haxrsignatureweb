/**
 * Valida alinhamento da spec do portal com marketing e módulos definidos.
 */
import { areaClienteFuture } from "../src/lib/marketing/pages.ts";
import { portalModules, portalMvpModuleIds } from "../src/lib/portal/modules.ts";
import { portalAuthSpec, portalVisibleDocumentStatuses } from "../src/lib/portal/auth-spec.ts";

const marketingToModule = {
  "Cronograma partilhado em tempo real": "timeline",
  "Documentos e contratos num só lugar": "documents",
  "Visibilidade financeira do projecto": "finance",
  "Aprovações com clareza e registo": "approvals",
  "Acompanhamento de convidados": "guests",
};

let failed = 0;

for (const item of areaClienteFuture) {
  const moduleId = marketingToModule[item];
  if (!moduleId) {
    failed++;
    console.log(`FAIL  roadmap sem módulo: "${item}"`);
    continue;
  }
  const mod = portalModules.find((m) => m.id === moduleId);
  if (!mod) {
    failed++;
    console.log(`FAIL  módulo ${moduleId} não definido`);
  } else {
    console.log(`OK    "${item}" → ${mod.id} (${mod.phase})`);
  }
}

if (portalMvpModuleIds.length < 4) {
  failed++;
  console.log("FAIL  MVP deve ter pelo menos 4 módulos");
} else {
  console.log(`OK    MVP: ${portalMvpModuleIds.join(", ")}`);
}

if (portalAuthSpec.cookieName && portalVisibleDocumentStatuses.length >= 2) {
  console.log(`OK    auth cookie: ${portalAuthSpec.cookieName}`);
} else {
  failed++;
  console.log("FAIL  auth-spec incompleto");
}

const paths = new Set(portalModules.map((m) => m.path));
if (paths.size !== portalModules.length) {
  failed++;
  console.log("FAIL  paths duplicados em portalModules");
} else {
  console.log(`OK    ${portalModules.length} módulos com paths únicos`);
}

if (failed) {
  console.log(`\n${failed} problema(s)`);
  process.exit(1);
}

console.log("\nSpec do portal alinhada com roadmap comercial.");

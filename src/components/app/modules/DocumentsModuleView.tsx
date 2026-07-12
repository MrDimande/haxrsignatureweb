"use client";

import type { DocumentModuleData } from "@/lib/event-modules/types";
import { DOCUMENT_STATUS_STYLES } from "@/lib/event-modules/presentation";
import {
  EventContextBar,
  ModuleEmptyState,
  ModuleHeader,
  ModulePanel,
  ModuleShell,
  ModuleStatGrid,
} from "@/components/app/modules/ModuleShell";

export default function DocumentsModuleView({ data }: { data: DocumentModuleData }) {
  const { summary, documents } = data;
  const hasDocuments = documents.length > 0;

  return (
    <ModuleShell>
      <ModuleHeader
        label="Documentos"
        title="Centro de Documentos"
        description="Consulte propostas, contratos, recibos, comprovativos e artefactos operacionais do evento."
        secondaryAction={{ label: "Abrir Concierge", href: "/app/concierge" }}
      />

      <EventContextBar context={data.context} />

      <ModuleStatGrid
        stats={[
          { label: "Total documentos", value: summary.total },
          { label: "Propostas", value: summary.proposals },
          { label: "Contratos", value: summary.contracts },
          { label: "Recibos", value: summary.receipts },
          { label: "Por validar", value: summary.pendingValidation },
        ]}
      />

      {!hasDocuments ? (
        <ModuleEmptyState
          title="Ainda não há documentos neste evento"
          description="Quando a equipa HAXR ou o Concierge associar propostas, contratos, comprovativos ou uploads operacionais, eles aparecerão aqui com estado e destino sugerido."
        />
      ) : (
        <ModulePanel title="Biblioteca de Ficheiros">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 font-mono text-[9px] uppercase text-zinc-500">
                  <th className="pb-3 pr-3">Nome</th>
                  <th className="pb-3 pr-3">Tipo</th>
                  <th className="pb-3 pr-3">Associado a</th>
                  <th className="pb-3 pr-3">Estado</th>
                  <th className="pb-3 pr-3">Carregado por</th>
                  <th className="pb-3 pr-3">Data</th>
                  <th className="pb-3 pr-3">Destino sugerido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td className="py-3 pr-3 font-medium text-white">{doc.name}</td>
                    <td className="py-3 pr-3 capitalize">{doc.type.replace("_", " ")}</td>
                    <td className="py-3 pr-3">{doc.associatedWith}</td>
                    <td className="py-3 pr-3">
                      <span
                        className={`rounded-full border px-2 py-0.5 font-mono text-[8px] uppercase ${DOCUMENT_STATUS_STYLES[doc.status]}`}
                      >
                        {doc.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 pr-3">{doc.uploadedBy}</td>
                    <td className="py-3 pr-3">{doc.uploadedLabel}</td>
                    <td className="py-3 pr-3 text-brand-gold">{doc.suggestedDestination}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ModulePanel>
      )}
    </ModuleShell>
  );
}

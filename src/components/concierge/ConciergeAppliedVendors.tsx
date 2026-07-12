import type { EventVendor } from "@/lib/concierge/types";

type ConciergeAppliedVendorsProps = {
  vendors: EventVendor[];
};

export default function ConciergeAppliedVendors({
  vendors,
}: ConciergeAppliedVendorsProps) {
  if (!vendors.length) {
    return (
      <p className="p-6 text-sm text-stone-500 border border-stone-800">
        Nenhum fornecedor aplicado via Concierge. Aprove uma proposta na fila
        para ver dados aqui.
      </p>
    );
  }

  return (
    <div className="border border-stone-800 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone-800 text-left text-xs uppercase tracking-wider text-stone-500">
            <th className="p-3 font-medium">Fornecedor</th>
            <th className="p-3 font-medium">Categoria</th>
            <th className="p-3 font-medium">Valor</th>
            <th className="p-3 font-medium">Prazo</th>
            <th className="p-3 font-medium">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-800">
          {vendors.map((vendor) => (
            <tr key={vendor.id} className="text-stone-300">
              <td className="p-3">
                <p className="font-medium text-stone-100">{vendor.name}</p>
                {(vendor.contactEmail || vendor.contactPhone) && (
                  <p className="text-xs text-stone-500 mt-0.5">
                    {[vendor.contactEmail, vendor.contactPhone]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </td>
              <td className="p-3">{vendor.serviceCategory || "—"}</td>
              <td className="p-3">
                {vendor.proposedAmount != null
                  ? `${vendor.proposedAmount.toLocaleString("pt-MZ")} ${vendor.currency}`
                  : "—"}
              </td>
              <td className="p-3">
                {vendor.deadline
                  ? new Date(vendor.deadline).toLocaleDateString("pt-MZ")
                  : "—"}
              </td>
              <td className="p-3 capitalize">{vendor.status.replace(/_/g, " ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

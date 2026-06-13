import Link from "next/link";
import type { ReactNode } from "react";

export type Column<T> = {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  rowHref?: (row: T) => string;
  /** Se definido, apenas estas colunas são clicáveis como link de linha. */
  linkedColumnKeys?: string[];
  keyExtractor: (row: T) => string;
};

export default function DataTable<T>({
  columns,
  data,
  emptyMessage = "Nenhum registo encontrado.",
  onRowClick,
  rowHref,
  linkedColumnKeys,
  keyExtractor,
}: DataTableProps<T>) {
  if (!data.length) {
    return (
      <div className="admin-card p-10 text-center">
        <p className="font-sans text-sm text-grey/60">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="admin-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-grey-dark/80 bg-black-soft">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left font-mono text-[8px] tracking-[0.3em] uppercase text-grey/50 ${col.className ?? ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => {
              const href = rowHref?.(row);
              const fullRowLink = Boolean(href && !linkedColumnKeys);

              const isColumnLinked = (colKey: string) =>
                Boolean(
                  href &&
                    (!linkedColumnKeys || linkedColumnKeys.includes(colKey))
                );

              return (
                <tr
                  key={keyExtractor(row)}
                  onClick={
                    !href && onRowClick ? () => onRowClick(row) : undefined
                  }
                  className={`border-b border-grey-dark/40 last:border-0 ${
                    fullRowLink || onRowClick
                      ? "cursor-pointer hover:bg-white/[0.02] transition-colors"
                      : ""
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-4 font-sans text-sm text-white/80 ${col.className ?? ""}`}
                    >
                      {isColumnLinked(col.key) ? (
                        <Link
                          href={href!}
                          className="block hover:text-admin-gold transition-colors"
                        >
                          {col.render(row)}
                        </Link>
                      ) : (
                        col.render(row)
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import { Printer } from "lucide-react";
import { GUEST_LABEL_LABELS } from "@/lib/events/constants";
import type { GuestTableGroup } from "@/lib/events/export/report";

type TableMapPrintViewProps = {
  eventName: string;
  eventDate: string | null;
  tableGroups: GuestTableGroup[];
};

function formatDate(date: string | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("pt-MZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Maputo",
  });
}

export default function TableMapPrintView({
  eventName,
  eventDate,
  tableGroups,
}: TableMapPrintViewProps) {
  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 print:hidden">
        <button type="button" onClick={handlePrint} className="admin-btn-primary">
          <Printer className="w-4 h-4" />
          Imprimir mapa de mesas
        </button>
        <p className="text-sm text-grey/55 self-center">
          Versão A4 optimizada para colocar em cada mesa ou na recepção.
        </p>
      </div>

      <div id="table-map-print" className="print-root space-y-0">
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-root,
            .print-root * {
              visibility: visible;
            }
            .print-root {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .table-print-page {
              page-break-after: always;
              break-after: page;
              min-height: 100vh;
              padding: 24mm 18mm;
              background: white !important;
              color: #111 !important;
            }
            .table-print-page:last-child {
              page-break-after: auto;
            }
          }
        `}</style>

        {tableGroups.map((group) => (
          <section
            key={group.tableName}
            className="table-print-page admin-card p-8 md:p-10 print:border-0 print:shadow-none print:bg-white"
          >
            <div className="text-center mb-10 print:mb-8">
              <p className="font-mono text-[10px] tracking-[0.5em] uppercase text-admin-gold print:text-[#9a7b1a]">
                HAXR Signature
              </p>
              <h2 className="font-serif text-3xl font-light text-white/95 print:text-black mt-4">
                {eventName}
              </h2>
              {eventDate ? (
                <p className="text-sm text-grey/60 print:text-gray-600 mt-2">
                  {formatDate(eventDate)}
                </p>
              ) : null}
              <p className="font-serif text-4xl font-light text-admin-gold print:text-[#9a7b1a] mt-8">
                Mesa {group.tableName}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:gap-3">
              {group.seats.map((seat) => (
                <div
                  key={`${group.tableName}-${seat.seatNumber}`}
                  className="border border-grey-dark/60 print:border-gray-300 rounded-sm p-4 print:p-3"
                >
                  <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-grey/50 print:text-gray-500">
                    Lugar {seat.seatNumber}
                    {seat.label ? ` · ${seat.label}` : ""}
                  </p>
                  <p className="font-serif text-xl text-white/90 print:text-black mt-2">
                    {seat.guest?.name ?? "—"}
                  </p>
                  {seat.guest && seat.guest.label !== "none" ? (
                    <p className="text-xs text-grey/55 print:text-gray-600 mt-1">
                      {GUEST_LABEL_LABELS[seat.guest.label]}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ))}

        {!tableGroups.length ? (
          <p className="text-sm text-grey/60 text-center py-10">
            Configure mesas no separador Lugares para imprimir o mapa.
          </p>
        ) : null}
      </div>
    </div>
  );
}

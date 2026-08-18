"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlignHorizontalSpaceAround,
  AlignVerticalSpaceAround,
  Box,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  Download,
  Eye,
  Lock,
  Minus,
  Printer,
  Redo2,
  RotateCw,
  Save,
  Undo2,
  Unlock,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import FloorPlanPrintSheet from "@/components/events/floor-plan/FloorPlanPrintSheet";
import FloorPlanSvg from "@/components/events/floor-plan/FloorPlanSvg";
import { TEMPLATE_LABELS } from "@/lib/events/floor-plan/presentation";
import { saveEventFloorPlanAction } from "@/lib/events/floor-plan/actions";
import {
  buildFloorPlanTables,
  createHistory,
  createTableItem,
  overlappingItemIds,
  pushHistory,
  reconcileFloorPlanTables,
  redoHistory,
  undoHistory,
  updateItemGeometry,
} from "@/lib/events/floor-plan/model";
import type {
  EventFloorPlan,
  FloorPlanElementKind,
  FloorPlanGenericItem,
  FloorPlanHistory,
  FloorPlanItem,
  FloorPlanSnapshot,
  FloorPlanTableShape,
} from "@/lib/events/floor-plan/types";
import type { EventSeat, ManagedEvent } from "@/lib/events/types";

type FloorPlanEditorProps = {
  event: ManagedEvent;
  seats: EventSeat[];
  initialPlan: EventFloorPlan;
  schemaAvailable: boolean;
};

const ELEMENTS: { kind: FloorPlanElementKind; label: string; width: number; height: number }[] = [
  { kind: "entrance", label: "Entrada", width: 2, height: 0.7 },
  { kind: "exit", label: "Saída", width: 2, height: 0.7 },
  { kind: "stage", label: "Palco", width: 5, height: 2.5 },
  { kind: "dance-floor", label: "Pista de dança", width: 5, height: 4 },
  { kind: "buffet", label: "Buffet", width: 4, height: 1.2 },
  { kind: "bar", label: "Bar", width: 3, height: 1.2 },
  { kind: "dj", label: "DJ", width: 2, height: 1.2 },
  { kind: "cake", label: "Mesa do bolo", width: 1.5, height: 1.5 },
  { kind: "photo", label: "Fotografia", width: 2.5, height: 2 },
  { kind: "wc", label: "WC", width: 1.5, height: 1.5 },
  { kind: "wall", label: "Parede", width: 5, height: 0.3 },
  { kind: "column", label: "Coluna", width: 0.8, height: 0.8 },
  { kind: "reserved", label: "Zona reservada", width: 4, height: 3 },
  { kind: "text", label: "Texto personalizado", width: 3, height: 1 },
];

function snapshotFromPlan(plan: EventFloorPlan): FloorPlanSnapshot {
  return {
    room: { ...plan.room },
    items: plan.items.map((item) => ({ ...item })),
    printPreferences: { ...plan.printPreferences },
  };
}

function createElement(kind: FloorPlanElementKind): FloorPlanGenericItem {
  const definition = ELEMENTS.find((item) => item.kind === kind) ?? ELEMENTS[0];
  const uniqueId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;
  return {
    id: `element:${uniqueId}`,
    kind: "element",
    elementKind: kind,
    label: definition.label,
    x: 1,
    y: 1,
    width: definition.width,
    height: definition.height,
    rotation: 0,
    locked: false,
  };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function FloorPlanEditor({
  event,
  seats,
  initialPlan,
  schemaAvailable,
}: FloorPlanEditorProps) {
  const tables = useMemo(() => buildFloorPlanTables(seats), [seats]);
  const reconciled = useMemo(
    () => reconcileFloorPlanTables(initialPlan.items, tables),
    [initialPlan.items, tables]
  );
  const initialSnapshot = useMemo(
    () =>
      snapshotFromPlan({
        ...initialPlan,
        items: reconciled.items,
      }),
    [initialPlan, reconciled.items]
  );
  const [history, setHistory] = useState<FloorPlanHistory>(() =>
    createHistory(initialSnapshot)
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showNames, setShowNames] = useState(
    initialPlan.printPreferences.showGuestNames
  );
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [persistedVersion, setPersistedVersion] = useState(initialPlan.version);
  const dragRef = useRef<{
    itemId: string;
    pointerX: number;
    pointerY: number;
    base: FloorPlanSnapshot;
    moved: boolean;
    movingIds: Set<string>;
  } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const exportCanvasRef = useRef<HTMLDivElement>(null);
  const suppressCanvasClickRef = useRef(false);

  const present = history.present;
  const selected = present.items.find((item) => selectedIds.has(item.id)) ?? null;
  const overlaps = useMemo(
    () => overlappingItemIds(present.items),
    [present.items]
  );
  const currentReconciliation = useMemo(
    () => reconcileFloorPlanTables(present.items, tables),
    [present.items, tables]
  );

  useEffect(() => {
    setHistory((current) => {
      const reconciliation = reconcileFloorPlanTables(current.present.items, tables);
      if (!reconciliation.removed.length) return current;
      return pushHistory(current, {
        ...current.present,
        items: reconciliation.items,
      });
    });
  }, [tables]);

  function commit(next: FloorPlanSnapshot) {
    setHistory((current) => pushHistory(current, next));
  }

  function patchItems(mapper: (item: FloorPlanItem) => FloorPlanItem) {
    commit({ ...present, items: present.items.map(mapper) });
  }

  function addTable(tableKey: string) {
    const table = tables.find((item) => item.tableKey === tableKey);
    if (!table) return;
    const offset = present.items.length * present.room.gridSize;
    commit({
      ...present,
      items: [
        ...present.items,
        createTableItem(
          table,
          Math.min(1 + offset, Math.max(1, present.room.width - 3)),
          Math.min(1 + offset, Math.max(1, present.room.length - 3))
        ),
      ],
    });
  }

  function addElement(kind: FloorPlanElementKind) {
    const item = createElement(kind);
    commit({ ...present, items: [...present.items, item] });
    setSelectedIds(new Set([item.id]));
  }

  function handlePointerDown(
    pointerEvent: React.PointerEvent<SVGGElement>,
    item: FloorPlanItem
  ) {
    if (item.locked) return;
    pointerEvent.stopPropagation();
    canvasRef.current?.setPointerCapture(pointerEvent.pointerId);

    const movingIds = selectedIds.has(item.id)
      ? new Set(selectedIds)
      : new Set([item.id]);

    if (!selectedIds.has(item.id) && !pointerEvent.shiftKey) {
      setSelectedIds(new Set([item.id]));
    }

    dragRef.current = {
      itemId: item.id,
      pointerX: pointerEvent.clientX,
      pointerY: pointerEvent.clientY,
      base: present,
      moved: false,
      movingIds,
    };
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const bounds = canvasRef.current?.getBoundingClientRect();
    if (!drag || !bounds) return;
    const dx =
      ((event.clientX - drag.pointerX) / bounds.width) * drag.base.room.width / zoom;
    const dy =
      ((event.clientY - drag.pointerY) / bounds.height) * drag.base.room.length / zoom;
    if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
      drag.moved = true;
    }
    const items = drag.base.items.map((item) =>
      drag.movingIds.has(item.id)
        ? updateItemGeometry(
            item,
            {
              x: Math.max(
                0,
                Math.min(drag.base.room.width - item.width, item.x + dx)
              ),
              y: Math.max(
                0,
                Math.min(drag.base.room.length - item.height, item.y + dy)
              ),
            },
            drag.base.room.gridSize
          )
        : item
    );
    setHistory((current) => ({
      ...current,
      present: { ...drag.base, items },
    }));
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    if (canvasRef.current?.hasPointerCapture(event.pointerId)) {
      canvasRef.current.releasePointerCapture(event.pointerId);
    }
    if (drag.moved) {
      suppressCanvasClickRef.current = true;
      setHistory((current) => ({
        past: [...current.past.slice(-49), drag.base],
        present: current.present,
        future: [],
      }));
    } else {
      setHistory((current) => ({
        ...current,
        present: drag.base,
      }));
    }
    dragRef.current = null;
  }

  function handleCanvasClick() {
    if (suppressCanvasClickRef.current) {
      suppressCanvasClickRef.current = false;
      return;
    }
    setSelectedIds(new Set());
  }

  function updateSelected(patch: Parameters<typeof updateItemGeometry>[1]) {
    patchItems((item) =>
      selectedIds.has(item.id)
        ? updateItemGeometry(item, patch, present.room.gridSize)
        : item
    );
  }

  function updateSelectedData(patch: Partial<FloorPlanItem>) {
    patchItems((item) =>
      selectedIds.has(item.id) ? ({ ...item, ...patch } as FloorPlanItem) : item
    );
  }

  function removeSelected() {
    const removable = present.items.filter(
      (item) => selectedIds.has(item.id) && item.kind === "element"
    );
    if (!removable.length) {
      setStatus("Mesas reais só podem ser removidas pelo fluxo oficial de Lugares.");
      return;
    }
    const removableIds = new Set(removable.map((item) => item.id));
    commit({
      ...present,
      items: present.items.filter((item) => !removableIds.has(item.id)),
    });
    setSelectedIds(new Set());
  }

  function duplicateSelected() {
    const source = selected?.kind === "element" ? selected : null;
    if (!source) {
      setStatus("A duplicação aplica-se apenas a elementos genéricos.");
      return;
    }
    const copy = createElement(source.elementKind);
    const duplicated = {
      ...source,
      id: copy.id,
      x: source.x + present.room.gridSize,
      y: source.y + present.room.gridSize,
    };
    commit({ ...present, items: [...present.items, duplicated] });
    setSelectedIds(new Set([duplicated.id]));
  }

  function alignSelected(axis: "horizontal" | "vertical") {
    const selection = present.items.filter((item) => selectedIds.has(item.id));
    if (selection.length < 2) return;
    const anchor = selection[0];
    patchItems((item) => {
      if (!selectedIds.has(item.id) || item.locked) return item;
      return updateItemGeometry(
        item,
        axis === "horizontal" ? { y: anchor.y } : { x: anchor.x },
        present.room.gridSize
      );
    });
  }

  async function save() {
    setSaving(true);
    setStatus(null);
    const result = await saveEventFloorPlanAction({
      eventId: initialPlan.eventId,
      room: present.room,
      items: present.items,
      printPreferences: { ...present.printPreferences, showGuestNames: showNames },
      version: persistedVersion + 1,
      updatedAt: initialPlan.updatedAt,
    });
    setSaving(false);
    if (result.success) {
      setPersistedVersion((value) => value + 1);
    }
    setStatus(
      result.success
        ? "Planta guardada."
        : result.error.includes("event_floor_plans")
          ? "Migration 044 necessária antes de guardar."
          : result.error
    );
  }

  function exportSvg() {
    const svg = exportCanvasRef.current?.querySelector("[data-floor-plan-svg]");
    if (!svg) return;
    const source = new XMLSerializer().serializeToString(svg);
    downloadBlob(
      new Blob([source], { type: "image/svg+xml;charset=utf-8" }),
      `${event.name}-planta.svg`
    );
  }

  function exportPng() {
    const svg = exportCanvasRef.current?.querySelector("[data-floor-plan-svg]");
    if (!svg) return;
    const source = new XMLSerializer().serializeToString(svg);
    const image = new Image();
    const url = URL.createObjectURL(
      new Blob([source], { type: "image/svg+xml;charset=utf-8" })
    );
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 2400;
      canvas.height = Math.round((present.room.length / present.room.width) * 2400);
      const context = canvas.getContext("2d");
      if (!context) return;
      context.fillStyle = "#fff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) downloadBlob(blob, `${event.name}-planta.png`);
      }, "image/png");
      URL.revokeObjectURL(url);
    };
    image.src = url;
  }

  const propertyInput =
    "w-full rounded border border-grey-dark bg-black-soft px-3 py-2 text-sm text-white";
  const occupiedSeats = tables.reduce((sum, table) => sum + table.occupied, 0);
  const occupancyPct =
    seats.length > 0 ? Math.round((occupiedSeats / seats.length) * 100) : 0;
  const printPlan: EventFloorPlan = {
    ...initialPlan,
    room: present.room,
    items: present.items,
    printPreferences: { ...present.printPreferences, showGuestNames: showNames },
  };

  return (
    <div className="space-y-4">
      {!schemaAvailable ? (
        <div className="rounded border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          Editor disponível em modo local. A migration proposta
          <strong> 044_event_floor_plans.sql</strong> deve ser revista e aplicada
          posteriormente para activar Guardar.
        </div>
      ) : null}

      <div className="admin-card flex flex-wrap items-center gap-2 p-3 print:hidden">
        <button type="button" onClick={save} disabled={saving || !schemaAvailable} className="admin-btn-primary">
          <Save className="h-4 w-4" /> {saving ? "A guardar…" : "Guardar"}
        </button>
        <button type="button" onClick={() => setPreview((value) => !value)} className="admin-btn-secondary">
          <Eye className="h-4 w-4" /> Preview
        </button>
        <button type="button" onClick={() => window.print()} className="admin-btn-secondary">
          <Printer className="h-4 w-4" /> PDF / Imprimir
        </button>
        <button type="button" onClick={exportSvg} className="admin-btn-secondary">
          <Download className="h-4 w-4" /> SVG
        </button>
        <button type="button" onClick={exportPng} className="admin-btn-secondary">
          <Download className="h-4 w-4" /> PNG
        </button>
        <span className="mx-1 h-6 w-px bg-grey-dark" />
        <button type="button" onClick={() => setHistory(undoHistory)} disabled={!history.past.length} className="admin-btn-secondary" aria-label="Desfazer">
          <Undo2 className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => setHistory(redoHistory)} disabled={!history.future.length} className="admin-btn-secondary" aria-label="Refazer">
          <Redo2 className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => setZoom((value) => Math.max(0.4, value - 0.1))} className="admin-btn-secondary" aria-label="Reduzir zoom">
          <ZoomOut className="h-4 w-4" />
        </button>
        <span className="text-xs text-grey/70">{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => setZoom((value) => Math.min(2.5, value + 0.1))} className="admin-btn-secondary" aria-label="Aumentar zoom">
          <ZoomIn className="h-4 w-4" />
        </button>
        <button type="button" disabled className="admin-btn-secondary ml-auto opacity-50" title="Preparado para React Three Fiber">
          <Box className="h-4 w-4" /> Visualização 3D — Em breve
        </button>
      </div>

      {status ? <p className="text-sm text-admin-gold">{status}</p> : null}
      {currentReconciliation.removed.length ? (
        <p className="rounded border border-red-400/25 bg-red-400/10 px-4 py-2 text-sm text-red-200">
          {currentReconciliation.removed.length} mesa(s) removida(s) do Find Your Seat
          foram retiradas visualmente da planta sem afectar os restantes elementos.
        </p>
      ) : null}

      <div className="grid min-h-[720px] grid-cols-1 gap-4 xl:grid-cols-[260px_minmax(0,1fr)_280px]">
        <p className="admin-card p-4 text-sm text-grey/70 md:hidden">
          Em telemóvel, a planta abre em modo de consulta. Use zoom, preview e
          impressão; a edição completa está disponível em tablet ou desktop.
        </p>
        <aside className="admin-card hidden space-y-5 p-4 print:hidden md:block">
          <section>
            <h3 className="mb-3 font-mono text-[9px] uppercase tracking-[0.3em] text-admin-gold">
              Mesas por posicionar
            </h3>
            <div className="space-y-2">
              {currentReconciliation.unpositioned.map((table) => (
                <button
                  key={table.tableKey}
                  type="button"
                  onClick={() => addTable(table.tableKey)}
                  className="flex w-full items-center justify-between rounded border border-grey-dark/80 px-3 py-2 text-left text-sm text-white hover:border-admin-gold/40"
                >
                  <span>{table.tableName}</span>
                  <span className="text-xs text-grey/60">{table.occupied}/{table.capacity}</span>
                </button>
              ))}
              {!currentReconciliation.unpositioned.length ? (
                <p className="text-xs text-grey/55">Todas as mesas estão posicionadas.</p>
              ) : null}
            </div>
          </section>
          <section>
            <h3 className="mb-3 font-mono text-[9px] uppercase tracking-[0.3em] text-admin-gold">
              Elementos do salão
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {ELEMENTS.map((element) => (
                <button
                  key={element.kind}
                  type="button"
                  onClick={() => addElement(element.kind)}
                  className="rounded border border-grey-dark/80 px-2 py-2 text-xs text-grey hover:border-admin-gold/40 hover:text-white"
                >
                  {element.label}
                </button>
              ))}
            </div>
          </section>
        </aside>

        <main className="admin-card relative min-h-[560px] overflow-hidden bg-[#0f0d0a] p-3">
          <div className="pointer-events-none absolute inset-x-4 top-4 z-10 flex flex-wrap items-start justify-between gap-3 print:hidden">
            <div className="rounded-lg border border-[#D4B87A]/25 bg-black/75 px-3 py-2 backdrop-blur-sm">
              <p className="font-mono text-[8px] uppercase tracking-[0.35em] text-[#D4B87A]">
                {TEMPLATE_LABELS[present.printPreferences.template]}
              </p>
              <p className="mt-1 text-xs text-white/90">
                {present.room.width} × {present.room.length} m · grelha {present.room.gridSize} m
              </p>
            </div>
            <div className="flex gap-2">
              {[
                { label: "Mesas", value: String(tables.length) },
                { label: "Ocupação", value: `${occupancyPct}%` },
                { label: "Elementos", value: String(present.items.length) },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg border border-white/10 bg-black/70 px-3 py-2 text-center backdrop-blur-sm"
                >
                  <p className="font-mono text-[7px] uppercase tracking-[0.3em] text-[#9A7B3C]">
                    {stat.label}
                  </p>
                  <p className="mt-0.5 font-serif text-lg text-white">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute left-5 top-24 z-10 flex gap-2 print:hidden">
            <button type="button" onClick={() => setPan({ x: pan.x - 30, y: pan.y })} className="rounded bg-black/70 p-2 text-white" aria-label="Mover esquerda"><ChevronLeft className="h-4 w-4" /></button>
            <button type="button" onClick={() => setPan({ x: pan.x + 30, y: pan.y })} className="rounded bg-black/70 p-2 text-white" aria-label="Mover direita"><ChevronRight className="h-4 w-4" /></button>
            <button type="button" onClick={() => setPan({ x: pan.x, y: pan.y - 30 })} className="rounded bg-black/70 p-2 text-white" aria-label="Mover para cima"><ChevronUp className="h-4 w-4" /></button>
            <button type="button" onClick={() => setPan({ x: pan.x, y: pan.y + 30 })} className="rounded bg-black/70 p-2 text-white" aria-label="Mover para baixo"><ChevronDown className="h-4 w-4" /></button>
          </div>
          <div
            ref={canvasRef}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onClick={handleCanvasClick}
            className="h-full min-h-[650px] origin-center overflow-hidden rounded-lg border border-[#D4B87A]/20 bg-[#FBF8F3] shadow-[0_32px_80px_rgba(0,0,0,0.45)]"
          >
            <div
              ref={exportCanvasRef}
              className="h-full min-h-[650px] p-2 transition-transform md:p-4"
              style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
            >
              <FloorPlanSvg
                room={present.room}
                items={present.items}
                tables={tables}
                template={present.printPreferences.template}
                showGuestNames={showNames}
                selectedIds={selectedIds}
                overlappingIds={overlaps}
                interactive
                onPointerDown={handlePointerDown}
                onSelect={(itemId, additive) =>
                  setSelectedIds((current) => {
                    if (!additive) return new Set([itemId]);
                    const next = new Set(current);
                    if (next.has(itemId)) next.delete(itemId);
                    else next.add(itemId);
                    return next;
                  })
                }
              />
            </div>
          </div>
        </main>

        <aside className="admin-card hidden space-y-5 p-4 print:hidden md:block">
          <section>
            <h3 className="mb-3 font-mono text-[9px] uppercase tracking-[0.3em] text-admin-gold">
              Espaço
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-grey/65">Largura (m)
                <input type="number" min={4} max={200} value={present.room.width} onChange={(e) => commit({ ...present, room: { ...present.room, width: Number(e.target.value) } })} className={propertyInput} />
              </label>
              <label className="text-xs text-grey/65">Comprimento (m)
                <input type="number" min={4} max={200} value={present.room.length} onChange={(e) => commit({ ...present, room: { ...present.room, length: Number(e.target.value) } })} className={propertyInput} />
              </label>
              <label className="col-span-2 text-xs text-grey/65">Grelha (m)
                <input type="number" min={0.1} max={5} step={0.1} value={present.room.gridSize} onChange={(e) => commit({ ...present, room: { ...present.room, gridSize: Number(e.target.value) } })} className={propertyInput} />
              </label>
            </div>
          </section>

          {selected ? (
            <section className="space-y-3">
              <h3 className="font-mono text-[9px] uppercase tracking-[0.3em] text-admin-gold">
                Propriedades
              </h3>
              <p className="text-sm text-white">
                {selected.kind === "table" ? selected.sourceTableName : selected.label}
              </p>
              {selected.kind === "table" ? (
                <label className="block text-xs text-grey/65">Tipo visual
                  <select value={selected.shape} onChange={(e) => updateSelectedData({ shape: e.target.value as FloorPlanTableShape } as Partial<FloorPlanItem>)} className={propertyInput}>
                    <option value="round">Redonda</option>
                    <option value="rectangle">Rectangular</option>
                    <option value="square">Quadrada</option>
                    <option value="imperial">Imperial</option>
                    <option value="sweetheart">Mesa dos noivos</option>
                  </select>
                </label>
              ) : (
                <label className="block text-xs text-grey/65">Texto
                  <input value={selected.label} onChange={(e) => updateSelectedData({ label: e.target.value } as Partial<FloorPlanItem>)} className={propertyInput} />
                </label>
              )}
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-grey/65">Largura
                  <input type="number" min={0.1} step={0.1} value={selected.width} onChange={(e) => updateSelected({ width: Number(e.target.value) })} className={propertyInput} />
                </label>
                <label className="text-xs text-grey/65">Altura
                  <input type="number" min={0.1} step={0.1} value={selected.height} onChange={(e) => updateSelected({ height: Number(e.target.value) })} className={propertyInput} />
                </label>
                <label className="col-span-2 text-xs text-grey/65">Rotação
                  <input type="range" min={0} max={359} value={selected.rotation} onChange={(e) => updateSelected({ rotation: Number(e.target.value) })} className="w-full" />
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => updateSelected({ rotation: selected.rotation + 15 })} className="admin-btn-secondary" aria-label="Rodar 15 graus"><RotateCw className="h-4 w-4" /></button>
                <button type="button" onClick={() => updateSelected({ locked: !selected.locked })} className="admin-btn-secondary">{selected.locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}</button>
                <button type="button" onClick={duplicateSelected} className="admin-btn-secondary"><Copy className="h-4 w-4" /></button>
                <button type="button" onClick={() => alignSelected("horizontal")} className="admin-btn-secondary" aria-label="Alinhar horizontalmente"><AlignHorizontalSpaceAround className="h-4 w-4" /></button>
                <button type="button" onClick={() => alignSelected("vertical")} className="admin-btn-secondary" aria-label="Alinhar verticalmente"><AlignVerticalSpaceAround className="h-4 w-4" /></button>
                <button type="button" onClick={removeSelected} className="admin-btn-secondary text-red-300"><Minus className="h-4 w-4" /></button>
              </div>
              {selected.kind === "table" ? (
                <p className="text-xs text-grey/55">
                  Esta mesa está ligada a {tables.find((table) => table.tableKey === selected.tableKey)?.seats.length ?? 0} lugares reais. Não pode ser eliminada pelo canvas.
                </p>
              ) : null}
            </section>
          ) : (
            <p className="text-sm text-grey/55">Seleccione um elemento. Use Shift para selecção múltipla.</p>
          )}

          <section className="space-y-3">
            <h3 className="font-mono text-[9px] uppercase tracking-[0.3em] text-admin-gold">Impressão</h3>
            <select value={present.printPreferences.template} onChange={(e) => commit({ ...present, printPreferences: { ...present.printPreferences, template: e.target.value as EventFloorPlan["printPreferences"]["template"] } })} className={propertyInput}>
              <option value="technical">{TEMPLATE_LABELS.technical}</option>
              <option value="client">{TEMPLATE_LABELS.client}</option>
              <option value="staff">{TEMPLATE_LABELS.staff}</option>
              <option value="seating-chart">{TEMPLATE_LABELS["seating-chart"]}</option>
            </select>
            <div className="grid grid-cols-2 gap-2">
              <select value={present.printPreferences.format} onChange={(e) => commit({ ...present, printPreferences: { ...present.printPreferences, format: e.target.value as "A4" | "A3" } })} className={propertyInput}>
                <option>A4</option><option>A3</option>
              </select>
              <select value={present.printPreferences.orientation} onChange={(e) => commit({ ...present, printPreferences: { ...present.printPreferences, orientation: e.target.value as "portrait" | "landscape" } })} className={propertyInput}>
                <option value="portrait">Portrait</option><option value="landscape">Landscape</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-xs text-grey">
              <input type="checkbox" checked={showNames} onChange={(e) => setShowNames(e.target.checked)} />
              Mostrar nomes dos convidados
            </label>
          </section>
        </aside>
      </div>

      <div className={preview ? "block" : "hidden print:block"}>
        <FloorPlanPrintSheet
          event={event}
          plan={printPlan}
          tables={tables}
          seatCount={seats.length}
          showGuestNames={showNames}
        />
      </div>
    </div>
  );
}

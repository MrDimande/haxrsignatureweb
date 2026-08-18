"use client";

import React, { useId } from "react";
import {
  ELEMENT_ZONE_COLORS,
  FLOOR_PLAN_GOLD,
  formatOccupancy,
  themeForTemplate,
} from "@/lib/events/floor-plan/presentation";
import { seatPositionForTable } from "@/lib/events/floor-plan/model";
import type {
  FloorPlanElementKind,
  FloorPlanItem,
  FloorPlanPrintTemplate,
  FloorPlanTableSource,
} from "@/lib/events/floor-plan/types";

type FloorPlanSvgProps = {
  room: { width: number; length: number; gridSize: number };
  items: FloorPlanItem[];
  tables: FloorPlanTableSource[];
  template?: FloorPlanPrintTemplate;
  showGuestNames?: boolean;
  selectedIds?: Set<string>;
  overlappingIds?: Set<string>;
  highlightedTableKey?: string | null;
  interactive?: boolean;
  onPointerDown?: (event: React.PointerEvent<SVGGElement>, item: FloorPlanItem) => void;
  onSelect?: (itemId: string, additive: boolean) => void;
};

const EMPTY_IDS = new Set<string>();

const ELEMENT_LABELS: Record<FloorPlanElementKind, string> = {
  entrance: "Entrada",
  exit: "Saída",
  stage: "Palco",
  "dance-floor": "Pista de dança",
  buffet: "Buffet",
  bar: "Bar",
  dj: "DJ",
  cake: "Mesa do bolo",
  photo: "Fotografia",
  wc: "WC",
  wall: "Parede",
  column: "Coluna",
  reserved: "Zona reservada",
  text: "Texto",
};

function TableShape({
  item,
  stroke,
  fill,
  selected,
}: {
  item: FloorPlanItem;
  stroke: string;
  fill: string;
  selected: boolean;
}) {
  if (item.kind !== "table") return null;
  const sw = selected ? 0.1 : 0.06;
  const w = item.width;
  const h = item.height;
  const cx = w / 2;
  const cy = h / 2;

  if (item.shape === "round") {
    return (
      <ellipse cx={cx} cy={cy} rx={w / 2} ry={h / 2} fill={fill} stroke={stroke} strokeWidth={sw} />
    );
  }

  if (item.shape === "sweetheart") {
    const r = Math.min(w, h) * 0.38;
    return (
      <path
        d={`M ${cx} ${cy + r * 0.35}
           C ${cx - w * 0.42} ${cy - r * 0.1}, ${cx - w * 0.42} ${cy - r * 0.95}, ${cx} ${cy - r * 0.55}
           C ${cx + w * 0.42} ${cy - r * 0.95}, ${cx + w * 0.42} ${cy - r * 0.1}, ${cx} ${cy + r * 0.35} Z`}
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
      />
    );
  }

  if (item.shape === "imperial") {
    const r = Math.min(h / 2, 0.45);
    return (
      <rect x={0} y={0} width={w} height={h} rx={r} fill={fill} stroke={stroke} strokeWidth={sw} />
    );
  }

  return (
    <rect
      width={w}
      height={h}
      rx={item.shape === "square" ? 0.12 : 0.1}
      fill={fill}
      stroke={stroke}
      strokeWidth={sw}
    />
  );
}

function TableSeats({
  table,
  item,
  showGuestNames,
  theme,
}: {
  table?: FloorPlanTableSource;
  item: FloorPlanItem;
  showGuestNames: boolean;
  theme: ReturnType<typeof themeForTemplate>;
}) {
  if (!table || item.kind !== "table") return null;
  return (
    <>
      {table.seats.map((seat, index) => {
        const position = seatPositionForTable(item, index, table.capacity);
        const occupied = Boolean(seat.guestId);
        return (
          <g key={seat.id}>
            <circle
              cx={position.x}
              cy={position.y}
              r={0.18}
              fill={occupied ? theme.seatOccupied : theme.seatEmpty}
              stroke={theme.seatStroke}
              strokeWidth={0.04}
            />
            <text
              x={position.x}
              y={position.y + 0.055}
              textAnchor="middle"
              fontSize={0.13}
              fill={occupied ? "#FFFCF8" : theme.tableLabel}
              fontFamily="ui-sans-serif, system-ui, sans-serif"
            >
              {seat.seatNumber}
            </text>
            {showGuestNames && seat.guestName ? (
              <text
                x={position.labelX}
                y={position.labelY + 0.05}
                textAnchor="middle"
                fontSize={0.15}
                fill={theme.tableLabel}
                fontFamily={theme.serifLabels ? "Georgia, serif" : "ui-sans-serif, sans-serif"}
                stroke={theme.roomFill}
                strokeWidth={0.07}
                paintOrder="stroke"
              >
                {seat.guestName.slice(0, 18)}
              </text>
            ) : null}
          </g>
        );
      })}
    </>
  );
}

function ElementShape({
  item,
  stroke,
  fill,
  selected,
  template,
}: {
  item: FloorPlanItem;
  stroke: string;
  fill: string;
  selected: boolean;
  template: FloorPlanPrintTemplate;
}) {
  if (item.kind !== "element") return null;
  const sw = selected ? 0.1 : 0.06;
  const zoneFill =
    template === "staff" ? (ELEMENT_ZONE_COLORS[item.elementKind] ?? fill) : fill;

  if (item.elementKind === "wall") {
    return (
      <rect
        width={item.width}
        height={item.height}
        fill="#3D362C"
        stroke={stroke}
        strokeWidth={sw}
        rx={0.02}
      />
    );
  }

  if (item.elementKind === "column") {
    return (
      <circle
        cx={item.width / 2}
        cy={item.height / 2}
        r={Math.min(item.width, item.height) / 2}
        fill="#D9D2C6"
        stroke={stroke}
        strokeWidth={sw}
      />
    );
  }

  if (item.elementKind === "dance-floor") {
    return (
      <>
        <rect
          width={item.width}
          height={item.height}
          rx={0.08}
          fill={zoneFill}
          stroke={stroke}
          strokeWidth={sw}
        />
        <path
          d={`M0 ${item.height * 0.33} H${item.width} M0 ${item.height * 0.66} H${item.width}`}
          stroke="#C4B59A"
          strokeWidth={0.02}
          opacity={0.5}
        />
      </>
    );
  }

  if (item.elementKind === "stage") {
    return (
      <>
        <rect
          width={item.width}
          height={item.height}
          rx={0.06}
          fill={zoneFill}
          stroke={stroke}
          strokeWidth={sw}
        />
        <line
          x1={0}
          y1={item.height}
          x2={item.width}
          y2={item.height}
          stroke={FLOOR_PLAN_GOLD}
          strokeWidth={0.06}
        />
      </>
    );
  }

  return (
    <rect
      width={item.width}
      height={item.height}
      rx={0.08}
      fill={zoneFill}
      stroke={stroke}
      strokeWidth={sw}
      strokeDasharray={item.elementKind === "reserved" ? "0.22 0.14" : undefined}
    />
  );
}

function PlanDecor({
  room,
  theme,
}: {
  room: { width: number; length: number; gridSize: number };
  theme: ReturnType<typeof themeForTemplate>;
}) {
  const pad = 0.35;
  const innerW = room.width - pad * 2;
  const innerH = room.length - pad * 2;

  return (
    <>
      <rect
        x={pad}
        y={pad}
        width={innerW}
        height={innerH}
        fill="none"
        stroke={theme.roomStroke}
        strokeWidth={0.08}
      />
      <rect
        x={pad + 0.06}
        y={pad + 0.06}
        width={innerW - 0.12}
        height={innerH - 0.12}
        fill="none"
        stroke={theme.roomStroke}
        strokeWidth={0.03}
        opacity={0.45}
      />

      {theme.showDimensions ? (
        <>
          <text
            x={room.width / 2}
            y={0.22}
            textAnchor="middle"
            fontSize={0.2}
            fill={theme.tableMeta}
            fontFamily="ui-monospace, monospace"
          >
            {room.width} m
          </text>
          <text
            x={0.22}
            y={room.length / 2}
            textAnchor="middle"
            fontSize={0.2}
            fill={theme.tableMeta}
            fontFamily="ui-monospace, monospace"
            transform={`rotate(-90 0.22 ${room.length / 2})`}
          >
            {room.length} m
          </text>
        </>
      ) : null}

      {theme.showScale ? (
        <g transform={`translate(${room.width - 2.8} ${room.length - 0.55})`}>
          <line x1={0} y1={0} x2={1} y2={0} stroke={theme.tableMeta} strokeWidth={0.04} />
          <line x1={0} y1={-0.08} x2={0} y2={0.08} stroke={theme.tableMeta} strokeWidth={0.03} />
          <line x1={1} y1={-0.08} x2={1} y2={0.08} stroke={theme.tableMeta} strokeWidth={0.03} />
          <text x={0.5} y={0.22} textAnchor="middle" fontSize={0.14} fill={theme.tableMeta}>
            1 m
          </text>
        </g>
      ) : null}

      {theme.showNorth ? (
        <g transform={`translate(${room.width - 0.75} 0.55)`}>
          <polygon points="0,-0.22 0.12,0.12 -0.12,0.12" fill={FLOOR_PLAN_GOLD} opacity={0.9} />
          <text x={0} y={0.32} textAnchor="middle" fontSize={0.14} fill={theme.tableMeta}>
            N
          </text>
        </g>
      ) : null}
    </>
  );
}

export default function FloorPlanSvg({
  room,
  items,
  tables,
  template = "technical",
  showGuestNames = false,
  selectedIds = EMPTY_IDS,
  overlappingIds = EMPTY_IDS,
  highlightedTableKey = null,
  interactive = false,
  onPointerDown,
  onSelect,
}: FloorPlanSvgProps) {
  const uid = useId().replace(/:/g, "");
  const theme = themeForTemplate(template);
  const tableByKey = new Map(tables.map((table) => [table.tableKey, table]));
  const gridId = `floor-grid-${uid}-${room.gridSize}`.replace(".", "-");
  const showNames = showGuestNames || template === "seating-chart";

  return (
    <svg
      data-floor-plan-svg
      viewBox={`0 0 ${room.width} ${room.length}`}
      role="img"
      aria-label={
        highlightedTableKey
          ? "Planta visual do evento com a sua mesa destacada"
          : "Planta visual do evento"
      }
      className="h-full w-full touch-none select-none bg-transparent"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <pattern
          id={gridId}
          width={room.gridSize}
          height={room.gridSize}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${room.gridSize} 0 L 0 0 0 ${room.gridSize}`}
            fill="none"
            stroke={theme.gridStroke}
            strokeWidth={0.012}
            opacity={theme.gridOpacity}
          />
        </pattern>
        <filter id={`shadow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0.04" stdDeviation="0.06" floodColor="#1C1814" floodOpacity="0.12" />
        </filter>
      </defs>

      <rect width={room.width} height={room.length} fill={theme.roomFill} />
      {theme.showGrid ? (
        <rect width={room.width} height={room.length} fill={`url(#${gridId})`} />
      ) : null}

      <PlanDecor room={room} theme={theme} />

      {items.map((item) => {
        const table = item.kind === "table" ? tableByKey.get(item.tableKey) : undefined;
        const highlighted =
          item.kind === "table" && item.tableKey === highlightedTableKey;
        const selected = selectedIds.has(item.id) || highlighted;
        const overlap = overlappingIds.has(item.id);
        const stroke = overlap ? "#C0392B" : selected ? FLOOR_PLAN_GOLD : theme.tableStroke;
        const labelFont = theme.serifLabels
          ? "Georgia, 'Times New Roman', serif"
          : "ui-sans-serif, system-ui, sans-serif";
        const occupancyLabel = table
          ? template === "seating-chart"
            ? `${table.occupied}/${table.capacity}`
            : formatOccupancy(table.occupied, table.capacity)
          : "";

        return (
          <g
            key={item.id}
            transform={`translate(${item.x} ${item.y}) rotate(${item.rotation} ${item.width / 2} ${item.height / 2})`}
            className={interactive && !item.locked ? "cursor-move" : undefined}
            filter={item.kind === "table" && template === "client" ? `url(#shadow-${uid})` : undefined}
            onPointerDown={(event) => onPointerDown?.(event, item)}
            onClick={(event) => {
              event.stopPropagation();
              onSelect?.(item.id, event.shiftKey);
            }}
          >
            {item.kind === "table" ? (
              <>
                {highlighted ? (
                  <rect
                    x={-0.38}
                    y={-0.38}
                    width={item.width + 0.76}
                    height={item.height + 0.76}
                    rx={0.28}
                    fill={FLOOR_PLAN_GOLD}
                    fillOpacity={0.12}
                    stroke={FLOOR_PLAN_GOLD}
                    strokeWidth={0.1}
                    strokeDasharray="0.22 0.12"
                    className="animate-pulse"
                  />
                ) : null}
                <TableShape
                  item={item}
                  stroke={stroke}
                  fill={theme.tableFill}
                  selected={selected}
                />
                <text
                  x={item.width / 2}
                  y={item.height / 2 - (showNames ? 0.02 : 0.06)}
                  textAnchor="middle"
                  fontSize={template === "seating-chart" ? 0.22 : 0.26}
                  fontWeight={600}
                  fill={theme.tableLabel}
                  fontFamily={labelFont}
                >
                  {item.sourceTableName}
                </text>
                {table && template !== "seating-chart" ? (
                  <text
                    x={item.width / 2}
                    y={item.height / 2 + 0.22}
                    textAnchor="middle"
                    fontSize={0.17}
                    fill={theme.tableMeta}
                    fontFamily="ui-monospace, monospace"
                  >
                    {occupancyLabel}
                  </text>
                ) : table ? (
                  <text
                    x={item.width / 2}
                    y={item.height / 2 + 0.2}
                    textAnchor="middle"
                    fontSize={0.14}
                    fill={theme.tableMeta}
                    fontFamily="ui-monospace, monospace"
                    opacity={0.75}
                  >
                    {occupancyLabel}
                  </text>
                ) : null}
                <TableSeats
                  table={table}
                  item={item}
                  showGuestNames={showNames}
                  theme={theme}
                />
              </>
            ) : (
              <>
                <ElementShape
                  item={item}
                  stroke={stroke}
                  fill={theme.elementFill}
                  selected={selected}
                  template={template}
                />
                <text
                  x={item.width / 2}
                  y={item.height / 2 + 0.08}
                  textAnchor="middle"
                  fontSize={0.22}
                  fill={theme.elementLabel}
                  fontFamily={labelFont}
                >
                  {item.label || ELEMENT_LABELS[item.elementKind]}
                </text>
              </>
            )}
            {item.locked ? (
              <text x={0.1} y={0.24} fontSize={0.16} fill={FLOOR_PLAN_GOLD} fontWeight={700}>
                L
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

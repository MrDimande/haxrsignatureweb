/**
 * HAXR SIGNATURE · DEMONSTRATIVE DATASET FOR PUBLIC GUEST SHOWCASE
 *
 * NOTA EDITORIAL:
 * Dados 100% fictícios e ilustrativos para a montra pública de /gestao-convidados.
 * Não contém dados reais nem nomes privados de clientes.
 */

export interface DemoGuest {
  id: string;
  name: string;
  phone: string;
  table: string;
  seat: string;
  sector: string;
  diet: string;
  status: "Confirmado" | "Pendente" | "Ausente";
  checkedIn: boolean;
  checkedInTime: string | null;
  companion: string;
}

export interface DemoTable {
  id: string;
  name: string;
  capacity: number;
  occupied: number;
  sector: string;
}

export const DEMO_TABLES: DemoTable[] = [
  { id: "T1", name: "Mesa 01 · Família Directa", capacity: 10, occupied: 10, sector: "Ala Principal" },
  { id: "T2", name: "Mesa 02 · Mesa de Honra", capacity: 8, occupied: 8, sector: "Palco Central" },
  { id: "T3", name: "Mesa 03 · Padrinhos & Damas", capacity: 12, occupied: 12, sector: "Ala Central" },
  { id: "T4", name: "Mesa 04 · Núcleo Maputo", capacity: 10, occupied: 9, sector: "Ala Jardim" },
  { id: "T5", name: "Mesa 05 · Convidados Especiais", capacity: 10, occupied: 8, sector: "Ala Jardim" },
  { id: "T6", name: "Mesa 06 · Juventude", capacity: 10, occupied: 10, sector: "Ala Esquerda" },
];

export const DEMO_GUESTS: DemoGuest[] = [
  {
    id: "GX-01",
    name: "Amélia Cossa",
    phone: "+258 84 100 2030",
    table: "Mesa 02 · Mesa de Honra",
    seat: "Lugar 01",
    sector: "Palco Central",
    diet: "Sem glúten",
    status: "Confirmado",
    checkedIn: true,
    checkedInTime: "14:10",
    companion: "Dr. Bernardo Langa",
  },
  {
    id: "GX-02",
    name: "Dr. Bernardo Langa",
    phone: "+258 82 200 3040",
    table: "Mesa 02 · Mesa de Honra",
    seat: "Lugar 02",
    sector: "Palco Central",
    diet: "Sem restrições",
    status: "Confirmado",
    checkedIn: true,
    checkedInTime: "14:10",
    companion: "Amélia Cossa",
  },
  {
    id: "GX-03",
    name: "Tânia Mucavele",
    phone: "+258 84 300 4050",
    table: "Mesa 03 · Padrinhos & Damas",
    seat: "Lugar 01",
    sector: "Ala Central",
    diet: "Vegetariana",
    status: "Confirmado",
    checkedIn: true,
    checkedInTime: "14:18",
    companion: "Eng. Rui Matsinhe",
  },
  {
    id: "GX-04",
    name: "Eng. Rui Matsinhe",
    phone: "+258 87 400 5060",
    table: "Mesa 03 · Padrinhos & Damas",
    seat: "Lugar 02",
    sector: "Ala Central",
    diet: "Sem glúten",
    status: "Confirmado",
    checkedIn: false,
    checkedInTime: null,
    companion: "Tânia Mucavele",
  },
  {
    id: "GX-05",
    name: "Dra. Inês Chissano",
    phone: "+258 84 500 6070",
    table: "Mesa 01 · Família Directa",
    seat: "Lugar 04",
    sector: "Ala Principal",
    diet: "Sem marisco",
    status: "Confirmado",
    checkedIn: false,
    checkedInTime: null,
    companion: "+1 Acompanhante",
  },
  {
    id: "GX-06",
    name: "Geraldo Manjate",
    phone: "+258 82 600 7080",
    table: "Mesa 04 · Núcleo Maputo",
    seat: "Lugar 06",
    sector: "Ala Jardim",
    diet: "Sem restrições",
    status: "Pendente",
    checkedIn: false,
    checkedInTime: null,
    companion: "Sem acompanhante",
  },
];

export const DEMO_OPERATIONS_KPIS = [
  { label: "LISTA CONSOLIDADA", value: "200", sub: "Convidados convidados" },
  { label: "CONFIRMAÇÃO NOMINAL", value: "90%", sub: "180 presenças confirmadas" },
  { label: "MESAS ATRIBUÍDAS", value: "16 / 16", sub: "100% de ocupação equilibrada" },
  { label: "ALERTAS GASTRONÓMICOS", value: "14", sub: "Mapeados para o catering" },
] as const;

/**
 * Função utilitária para pesquisa rápida demonstrativa por nome,
 * normalizando diacríticos/acentos e maiúsculas.
 */
export function searchDemoGuest(query: string): DemoGuest | undefined {
  const normalizedQuery = query
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (!normalizedQuery) return undefined;

  return DEMO_GUESTS.find((guest) => {
    const normalizedName = guest.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return normalizedName.includes(normalizedQuery);
  });
}

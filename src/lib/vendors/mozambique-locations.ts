/**
 * Localizações de Moçambique — Províncias, Cidades, Distritos e Distritos Municipais
 *
 * Estrutura hierárquica completa para filtros de fornecedores no directório HAXR.
 */

export type LocationGroup = {
  province: string;
  locations: string[];
};

export const MOZAMBIQUE_LOCATIONS: LocationGroup[] = [
  {
    province: "Cidade de Maputo",
    locations: [
      "Maputo Centro",
      "Distrito Municipal KaFumo",
      "Distrito Municipal KaMubukwana",
      "Distrito Municipal KaLhamankulu",
      "Distrito Municipal KaMavota",
      "Distrito Municipal KaTembe",
      "Distrito Municipal KaNhaca",
      "Distrito Municipal KaMaxaquene",
    ],
  },
  {
    province: "Maputo Província",
    locations: [
      "Matola",
      "Boane",
      "Marracuene",
      "Manhiça",
      "Magude",
      "Moamba",
      "Namaacha",
      "Matutuíne",
    ],
  },
  {
    province: "Gaza",
    locations: [
      "Xai-Xai",
      "Chókwè",
      "Chibuto",
      "Bilene",
      "Manjacaze",
      "Guijá",
      "Mabalane",
      "Massangena",
      "Massingir",
      "Chicualacuala",
      "Limpopo",
      "Mandlakazi",
    ],
  },
  {
    province: "Inhambane",
    locations: [
      "Inhambane",
      "Maxixe",
      "Vilankulo",
      "Tofo",
      "Ponta do Ouro",
      "Jangamo",
      "Morrumbene",
      "Massinga",
      "Homoine",
      "Zavala",
      "Inharrime",
      "Govuro",
      "Funhalouro",
      "Mabote",
      "Panda",
    ],
  },
  {
    province: "Sofala",
    locations: [
      "Beira",
      "Dondo",
      "Búzi",
      "Chibabava",
      "Gorongosa",
      "Machanga",
      "Maríngué",
      "Muanza",
      "Nhamatanda",
      "Cheringoma",
    ],
  },
  {
    province: "Manica",
    locations: [
      "Chimoio",
      "Gondola",
      "Manica",
      "Sussundenga",
      "Báruè",
      "Mossurize",
      "Machaze",
      "Macossa",
      "Guro",
      "Tambara",
    ],
  },
  {
    province: "Tete",
    locations: [
      "Tete",
      "Moatize",
      "Changara",
      "Cahora-Bassa",
      "Angónia",
      "Tsangano",
      "Macanga",
      "Chiuta",
      "Chifunde",
      "Zumbo",
      "Marávia",
      "Dôa",
      "Mutarara",
    ],
  },
  {
    province: "Zambézia",
    locations: [
      "Quelimane",
      "Mocuba",
      "Gurué",
      "Alto Molócuè",
      "Milange",
      "Namacurra",
      "Nicoadala",
      "Maganja da Costa",
      "Pebane",
      "Mopeia",
      "Morrumbala",
      "Inhassunge",
      "Chinde",
      "Gilé",
      "Ile",
      "Lugela",
      "Namarroi",
    ],
  },
  {
    province: "Nampula",
    locations: [
      "Nampula",
      "Nacala",
      "Ilha de Moçambique",
      "Angoche",
      "Monapo",
      "Meconta",
      "Rapale",
      "Ribaué",
      "Malema",
      "Murrupula",
      "Mecubúri",
      "Eráti",
      "Moma",
      "Mogincual",
      "Mossuril",
      "Lalaua",
      "Memba",
      "Nacarôa",
    ],
  },
  {
    province: "Niassa",
    locations: [
      "Lichinga",
      "Cuamba",
      "Mandimba",
      "Maúa",
      "Metangula",
      "Sanga",
      "Muembe",
      "Majune",
      "Ngauma",
      "Lago",
      "Nipepe",
      "Marrupa",
      "Mecula",
      "Mavago",
      "Mecanhelas",
    ],
  },
  {
    province: "Cabo Delgado",
    locations: [
      "Pemba",
      "Montepuez",
      "Mocímboa da Praia",
      "Chiúre",
      "Mueda",
      "Balama",
      "Namuno",
      "Ancuabe",
      "Macomia",
      "Quissanga",
      "Ibo",
      "Meluco",
      "Muidumbe",
      "Nangade",
      "Palma",
      "Metuge",
    ],
  },
];

/** Lista plana de todas as localizações para busca rápida. */
export const ALL_LOCATIONS_FLAT: string[] = MOZAMBIQUE_LOCATIONS.flatMap(
  (group) => group.locations,
);

/** Pesquisa localizações por texto livre (accent-insensitive). */
export function searchLocations(query: string): LocationGroup[] {
  if (!query.trim()) return MOZAMBIQUE_LOCATIONS;

  const normalized = query
    .trim()
    .toLocaleLowerCase("pt-PT")
    .normalize("NFD")
    .replace(/\p{M}/gu, "");

  return MOZAMBIQUE_LOCATIONS.map((group) => {
    const provinceMatch = group.province
      .toLocaleLowerCase("pt-PT")
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .includes(normalized);

    if (provinceMatch) return group;

    const filtered = group.locations.filter((loc) =>
      loc
        .toLocaleLowerCase("pt-PT")
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .includes(normalized),
    );

    return filtered.length > 0
      ? { province: group.province, locations: filtered }
      : null;
  }).filter(Boolean) as LocationGroup[];
}

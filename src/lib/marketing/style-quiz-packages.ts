export type StyleQuizStyleKey = "minimalist" | "editorial" | "opulent" | "romantic";

export type RecommendedPackage = {
  slug: string;
  name: string;
  tagline: string;
  href: string;
  contactHref: string;
};

export const styleQuizPackageMap: Record<StyleQuizStyleKey, RecommendedPackage> = {
  minimalist: {
    slug: "prologo",
    name: "Prólogo",
    tagline: "Elegância essencial — introdução poética e presença digital irrepreensível.",
    href: "/convites-identidade-visual#pacotes",
    contactHref: "/contacto?tipo=casamento&pacote=prologo",
  },
  editorial: {
    slug: "elo",
    name: "Elo",
    tagline: "Narrativa editorial, identidade forte e acolhimento colaborativo de convidados.",
    href: "/convites-identidade-visual#pacotes",
    contactHref: "/contacto?tipo=casamento&pacote=elo",
  },
  opulent: {
    slug: "legado",
    name: "Legado",
    tagline: "Alta-costura digital — ecossistema unificado antes, durante e perpetuado após o grande dia.",
    href: "/convites-identidade-visual#pacotes",
    contactHref: "/contacto?tipo=casamento&pacote=legado",
  },
  romantic: {
    slug: "elo",
    name: "Elo",
    tagline: "Romance poético com Web-Convite HAXR, curadoria visual e memórias partilhadas.",
    href: "/convites-identidade-visual#pacotes",
    contactHref: "/contacto?tipo=casamento&pacote=elo",
  },
};

export function packageForStyleKey(key: string): RecommendedPackage {
  if (key in styleQuizPackageMap) {
    return styleQuizPackageMap[key as StyleQuizStyleKey];
  }
  return styleQuizPackageMap.editorial;
}

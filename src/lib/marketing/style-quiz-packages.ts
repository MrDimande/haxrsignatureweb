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
    slug: "essencial",
    name: "Essencial",
    tagline: "Elegância essencial — convite digital e RSVP com clareza.",
    href: "/convites-identidade-visual#pacotes",
    contactHref: "/contacto?tipo=casamento&pacote=essencial",
  },
  editorial: {
    slug: "signature",
    name: "Signature",
    tagline: "Narrativa editorial, identidade forte e experiência imersiva.",
    href: "/convites-identidade-visual#pacotes",
    contactHref: "/contacto?tipo=casamento&pacote=signature",
  },
  opulent: {
    slug: "royal",
    name: "Royal",
    tagline: "Operação completa — QR, lugares, galeria e suporte até ao dia.",
    href: "/convites-identidade-visual#pacotes",
    contactHref: "/contacto?tipo=casamento&pacote=royal",
  },
  romantic: {
    slug: "signature",
    name: "Signature",
    tagline: "Romance poético com convite digital e curadoria HAXR.",
    href: "/convites-identidade-visual#pacotes",
    contactHref: "/contacto?tipo=casamento&pacote=signature",
  },
};

export function packageForStyleKey(key: string): RecommendedPackage {
  if (key in styleQuizPackageMap) {
    return styleQuizPackageMap[key as StyleQuizStyleKey];
  }
  return styleQuizPackageMap.editorial;
}

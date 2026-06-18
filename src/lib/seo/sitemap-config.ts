import { marketingPagesSeo, type MarketingPageKey } from "@/lib/marketing/seo";
import { demoCatalog } from "@/lib/demos/catalog";

export type SitemapEntryConfig = {
  path: string;
  changeFrequency: "weekly" | "monthly" | "yearly";
  priority: number;
  /** Prioridade relativa para ordenação no XML */
  tier: "home" | "service" | "conversion" | "content" | "demo";
};

const PAGE_OVERRIDES: Partial<
  Record<MarketingPageKey, Pick<SitemapEntryConfig, "priority" | "changeFrequency" | "tier">>
> = {
  home: { priority: 1, changeFrequency: "weekly", tier: "home" },
  assessoria: { priority: 0.95, changeFrequency: "weekly", tier: "service" },
  convites: { priority: 0.95, changeFrequency: "weekly", tier: "service" },
  convidados: { priority: 0.95, changeFrequency: "weekly", tier: "service" },
  plataforma: { priority: 0.9, changeFrequency: "monthly", tier: "service" },
  contacto: { priority: 0.92, changeFrequency: "monthly", tier: "conversion" },
  portfolio: { priority: 0.88, changeFrequency: "monthly", tier: "content" },
  sobre: { priority: 0.75, changeFrequency: "yearly", tier: "content" },
  insights: { priority: 0.7, changeFrequency: "weekly", tier: "content" },
  areaCliente: { priority: 0.55, changeFrequency: "monthly", tier: "content" },
};

const DEFAULT_PAGE_CONFIG: Pick<SitemapEntryConfig, "priority" | "changeFrequency" | "tier"> =
  {
    priority: 0.8,
    changeFrequency: "monthly",
    tier: "content",
  };

/** Entradas do sitemap institucional — prioridades alinhadas a intenção de pesquisa. */
export function buildMarketingSitemapEntries(): SitemapEntryConfig[] {
  return (Object.keys(marketingPagesSeo) as MarketingPageKey[]).map((key) => {
    const page = marketingPagesSeo[key];
    const override = PAGE_OVERRIDES[key] ?? DEFAULT_PAGE_CONFIG;
    return {
      path: page.path,
      ...override,
    };
  });
}

/** Experiências / demos públicas — prova social para convites digitais e casamentos. */
export function buildDemoSitemapEntries(): SitemapEntryConfig[] {
  return demoCatalog.map((demo, index) => ({
    path: demo.publicPath,
    changeFrequency: "monthly" as const,
    priority: index === 0 ? 0.85 : 0.78,
    tier: "demo" as const,
  }));
}
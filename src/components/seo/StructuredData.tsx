import {
  buildHomeStructuredData,
  buildInsightArticleStructuredData,
  buildPageStructuredData,
  buildDemoStructuredData,
} from "@/lib/seo/jsonld";
import type { MarketingPageKey } from "@/lib/marketing/seo";

type StructuredDataProps = {
  page?: MarketingPageKey;
  demoSlug?: string;
  articleSlug?: string;
};

export default function StructuredData({
  page = "home",
  demoSlug,
  articleSlug,
}: StructuredDataProps) {
  const schemas = demoSlug
    ? buildDemoStructuredData(demoSlug)
    : articleSlug
      ? buildInsightArticleStructuredData(articleSlug)
      : page === "home"
        ? buildHomeStructuredData()
        : buildPageStructuredData(page);

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={`jsonld-${demoSlug ?? page}-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}

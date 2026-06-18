import {
  buildHomeStructuredData,
  buildPageStructuredData,
  buildDemoStructuredData,
} from "@/lib/seo/jsonld";
import type { MarketingPageKey } from "@/lib/marketing/seo";

type StructuredDataProps = {
  page?: MarketingPageKey;
  demoSlug?: string;
};

export default function StructuredData({
  page = "home",
  demoSlug,
}: StructuredDataProps) {
  const schemas = demoSlug
    ? buildDemoStructuredData(demoSlug)
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

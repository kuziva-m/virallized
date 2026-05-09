import { Helmet } from "react-helmet-async";

const SITE_NAME = "Virallized";
const SITE_URL = "https://www.virallized.com";
const DEFAULT_TITLE =
  "Grow Instagram Followers with Virallized Organic Instagram Growth Services";
const DEFAULT_DESCRIPTION =
  "Grow your Instagram with Virallized organic Instagram growth services. Get real, targeted followers through safe, organic Instagram promotion without bots or fake followers.";
const DEFAULT_IMAGE = `${SITE_URL}/images/og/virallized-og.jpg`;
const DEFAULT_IMAGE_ALT =
  "Virallized organic Instagram growth services for real targeted followers";

type JsonLd =
  | Record<string, unknown>
  | Array<Record<string, unknown>>
  | null
  | undefined;

type SEOProps = {
  title?: string;
  description?: string;
  canonical?: string;
  path?: string;

  noIndex?: boolean;
  noFollow?: boolean;
  robots?: string;

  ogType?: "website" | "article" | "profile" | "product";
  image?: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageType?: string;

  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];

  twitterCard?: "summary" | "summary_large_image";
  locale?: string;

  structuredData?: JsonLd;
};

const makeAbsoluteUrl = (value?: string) => {
  if (!value) return SITE_URL;

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  if (value.startsWith("/")) {
    return `${SITE_URL}${value}`;
  }

  return `${SITE_URL}/${value}`;
};

const makeCanonicalUrl = (canonical?: string, path?: string) => {
  const value = canonical || path || "/";
  return makeAbsoluteUrl(value);
};

const makeRobotsContent = ({
  noIndex,
  noFollow,
  robots,
}: {
  noIndex?: boolean;
  noFollow?: boolean;
  robots?: string;
}) => {
  if (robots) return robots;

  const indexRule = noIndex ? "noindex" : "index";
  const followRule = noFollow ? "nofollow" : "follow";

  return `${indexRule}, ${followRule}, max-image-preview:large, max-snippet:-1, max-video-preview:-1`;
};

const normalizeStructuredData = (structuredData: JsonLd) => {
  if (!structuredData) return [];

  return Array.isArray(structuredData) ? structuredData : [structuredData];
};

export default function SEO({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  canonical,
  path = "/",

  noIndex = false,
  noFollow = false,
  robots,

  ogType = "website",
  image = DEFAULT_IMAGE,
  imageAlt = DEFAULT_IMAGE_ALT,
  imageWidth = 1200,
  imageHeight = 630,
  imageType = "image/jpeg",

  publishedTime,
  modifiedTime,
  author,
  section,
  tags = [],

  twitterCard = "summary_large_image",
  locale = "en_US",

  structuredData,
}: SEOProps) {
  const canonicalUrl = makeCanonicalUrl(canonical, path);
  const imageUrl = makeAbsoluteUrl(image);
  const robotsContent = makeRobotsContent({ noIndex, noFollow, robots });
  const structuredDataItems = normalizeStructuredData(structuredData);

  return (
    <Helmet>
      {/* Primary SEO */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Robots */}
      <meta name="robots" content={robotsContent} />
      <meta name="googlebot" content={robotsContent} />

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content={locale} />
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:secure_url" content={imageUrl} />
      <meta property="og:image:alt" content={imageAlt} />
      <meta property="og:image:width" content={String(imageWidth)} />
      <meta property="og:image:height" content={String(imageHeight)} />
      <meta property="og:image:type" content={imageType} />

      {/* Article-specific Open Graph */}
      {ogType === "article" && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {ogType === "article" && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {ogType === "article" && author && (
        <meta property="article:author" content={author} />
      )}
      {ogType === "article" && section && (
        <meta property="article:section" content={section} />
      )}
      {ogType === "article" &&
        tags.map((tag) => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}

      {/* Twitter / X */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:image:alt" content={imageAlt} />

      {/* JSON-LD Structured Data */}
      {structuredDataItems.map((item, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}
    </Helmet>
  );
}

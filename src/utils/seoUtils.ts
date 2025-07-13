export interface SEOConfig {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "product";
  keywords?: string[];
}

export const DEFAULT_SEO: SEOConfig = {
  title: "Rebooked Solutions - Buy & Sell Textbooks",
  description:
    "Find affordable textbooks for university and school. Buy and sell used textbooks with confidence on South Africa's trusted marketplace.",
  image: "https://rebookedsolutions.co.za/og-image.jpg",
  url: "https://rebookedsolutions.co.za",
  type: "website",
  keywords: [
    "textbooks",
    "university",
    "school",
    "buy",
    "sell",
    "south africa",
    "education",
  ],
};

export const generatePageSEO = (config: Partial<SEOConfig>): SEOConfig => {
  return {
    ...DEFAULT_SEO,
    ...config,
    title: config.title
      ? `${config.title} | Rebooked Solutions`
      : DEFAULT_SEO.title,
  };
};

export const generateBookSEO = (book: {
  title: string;
  author: string;
  price: number;
  description?: string;
  imageUrl?: string;
}): SEOConfig => {
  return generatePageSEO({
    title: `${book.title} by ${book.author}`,
    description: `Buy "${book.title}" by ${book.author} for R${book.price.toLocaleString()}. ${book.description ? book.description.substring(0, 100) + "..." : "Available on Rebooked Solutions."}`,
    image: book.imageUrl,
    type: "product",
    keywords: ["textbook", book.title, book.author, "university", "school"],
  });
};

export const generateStructuredData = (
  config: SEOConfig & { price?: number; author?: string },
) => {
  const baseStructuredData = {
    "@context": "https://schema.org",
    "@type": config.type === "product" ? "Product" : "WebSite",
    name: config.title,
    description: config.description,
    url: config.url,
    image: config.image,
  };

  if (config.type === "product" && config.price && config.author) {
    return {
      ...baseStructuredData,
      "@type": "Product",
      author: {
        "@type": "Person",
        name: config.author,
      },
      offers: {
        "@type": "Offer",
        price: config.price,
        priceCurrency: "ZAR",
        availability: "https://schema.org/InStock",
      },
    };
  }

  return baseStructuredData;
};

export const updateMetaTags = (config: SEOConfig) => {
  // Update document title
  document.title = config.title;

  // Update or create meta tags
  const updateMetaTag = (name: string, content: string, property = false) => {
    const selector = property
      ? `meta[property="${name}"]`
      : `meta[name="${name}"]`;
    let meta = document.querySelector(selector) as HTMLMetaElement;

    if (!meta) {
      meta = document.createElement("meta");
      if (property) {
        meta.setAttribute("property", name);
      } else {
        meta.setAttribute("name", name);
      }
      document.head.appendChild(meta);
    }

    meta.setAttribute("content", content);
  };

  // Standard meta tags
  updateMetaTag("description", config.description);
  if (config.keywords) {
    updateMetaTag("keywords", config.keywords.join(", "));
  }

  // Open Graph tags
  updateMetaTag("og:title", config.title, true);
  updateMetaTag("og:description", config.description, true);
  updateMetaTag("og:type", config.type || "website", true);
  if (config.url) updateMetaTag("og:url", config.url, true);
  if (config.image) updateMetaTag("og:image", config.image, true);

  // Twitter Card tags
  updateMetaTag("twitter:card", "summary_large_image");
  updateMetaTag("twitter:title", config.title);
  updateMetaTag("twitter:description", config.description);
  if (config.image) updateMetaTag("twitter:image", config.image);

  // Update canonical URL
  let canonical = document.querySelector(
    'link[rel="canonical"]',
  ) as HTMLLinkElement;
  if (config.url) {
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", config.url);
  }
};

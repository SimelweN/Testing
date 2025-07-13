/**
 * Image optimization utilities for better performance
 */

interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: "webp" | "avif" | "auto";
}

/**
 * Generate optimized image URL with modern format support
 */
export const getOptimizedImageUrl = (
  originalUrl: string,
  options: ImageOptimizationOptions = {},
): string => {
  // If it's already an optimized URL or a data URL, return as is
  if (originalUrl.includes("w_") || originalUrl.startsWith("data:")) {
    return originalUrl;
  }

  // For Unsplash URLs, add optimization parameters
  if (originalUrl.includes("unsplash.com")) {
    const {
      width = 400,
      height = 300,
      quality = 80,
      format = "auto",
    } = options;
    const baseUrl = originalUrl.split("?")[0];
    return `${baseUrl}?w=${width}&h=${height}&fit=crop&auto=format&q=${quality}&fm=${format}`;
  }

  // For Supabase storage URLs, add cache headers
  if (originalUrl.includes("supabase")) {
    return originalUrl;
  }

  return originalUrl;
};

/**
 * Generate responsive image sources for different screen sizes
 */
export const generateResponsiveImageSources = (
  originalUrl: string,
  breakpoints: { [key: string]: ImageOptimizationOptions } = {},
) => {
  const defaultBreakpoints = {
    mobile: { width: 300, height: 225 },
    tablet: { width: 500, height: 375 },
    desktop: { width: 800, height: 600 },
    ...breakpoints,
  };

  return Object.entries(defaultBreakpoints).map(([name, options]) => ({
    name,
    url: getOptimizedImageUrl(originalUrl, options),
    ...options,
  }));
};

/**
 * Check if browser supports WebP format
 */
export const supportsWebP = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src =
      "data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA";
  });
};

/**
 * Create a placeholder for lazy loading
 */
export const createImagePlaceholder = (
  width: number,
  height: number,
): string => {
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="system-ui, sans-serif" font-size="14">
        Loading...
      </text>
    </svg>
  `)}`;
};

/**
 * Preload critical images
 */
export const preloadImage = (
  url: string,
  options: ImageOptimizationOptions = {},
): void => {
  const optimizedUrl = getOptimizedImageUrl(url, options);
  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "image";
  link.href = optimizedUrl;
  link.setAttribute("fetchpriority", "high");
  document.head.appendChild(link);
};

/**
 * Lazy load images with Intersection Observer
 */
export const createLazyImageObserver = (
  callback?: (entry: IntersectionObserverEntry) => void,
) => {
  if ("IntersectionObserver" in window) {
    return new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute("data-src");
            }
            callback?.(entry);
          }
        });
      },
      {
        // Start loading when image is 50px away from viewport
        rootMargin: "50px 0px",
        threshold: 0.01,
      },
    );
  }
  return null;
};
